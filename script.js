if (!window.THREE) { const fallback = document.createElement('script'); fallback.src = 'vendor/three.min.js'; fallback.onerror = () => { document.body.innerHTML = '<p style="color:#fff;font-family:sans-serif;padding:24px">No se pudo cargar Three.js. Conecta a internet o agrega la librería en vendor/three.min.js.</p>'; }; document.head.appendChild(fallback); }

(() => {
  if (!window.THREE) {
    document.body.innerHTML = '<p style="color:#fff;font-family:sans-serif;padding:24px">No se encontró Three.js. Revisa que exista vendor/three.min.js.</p>';
    return;
  }

  // =====================================================================
  //  CONSTANTES
  // =====================================================================
  const PLAYER_SPEED = 5.35;
  const JUMP_V = 8.05;
  const GRAVITY = 26;
  const STUN_TIME = 10;
  const ROUND_TIME = 10 * 60;      // 10 minutos
  const LEVEL_BONUS = 60;          // segundos extra al terminar cada nivel
  const MAX_LEVEL = 10;
  const STEP = 0.42;
  const QUIZ_POINTS = [7, 7, 6];   // 3 preguntas = 20 pts
  const RESPAWN_ENEMY = 20;        // segundos para que vuelva un enemigo expulsado
  const STORE_KEY = 'clasificacion_animales_v2';

  const INFO = {
    vaca: { v: true, name: 'Vaca' },
    conejo: { v: true, name: 'Conejo' },
    tortuga: { v: true, name: 'Tortuga' },
    cerdo: { v: true, name: 'Cerdo' },
    rana: { v: true, name: 'Rana' },
    zorro: { v: true, name: 'Zorro' },
    pinguino: { v: true, name: 'Pingüino' },
    loro: { v: true, name: 'Loro' },
    pato: { v: true, name: 'Pato' },
    panda: { v: true, name: 'Panda' },
    serpiente: { v: true, name: 'Serpiente' },
    mariposa: { v: false, name: 'Mariposa', hover: 1.15 },
    caracol: { v: false, name: 'Caracol' },
    arana: { v: false, name: 'Araña' },
    abeja: { v: false, name: 'Abeja', hover: 0.9 },
    cangrejo: { v: false, name: 'Cangrejo' },
    gusano: { v: false, name: 'Gusano' },
    pulpo: { v: false, name: 'Pulpo' },
    medusa: { v: false, name: 'Medusa', hover: 1.0 },
    estrella: { v: false, name: 'Estrella de mar' },
    mariquita: { v: false, name: 'Mariquita' },
    libelula: { v: false, name: 'Libélula', hover: 1.35 },
    escorpion: { v: false, name: 'Escorpión' }
  };

  const EMOJI = {
    vaca: '🐮', conejo: '🐰', tortuga: '🐢', cerdo: '🐷', rana: '🐸', zorro: '🦊', pinguino: '🐧',
    loro: '🦜', pato: '🦆', panda: '🐼', serpiente: '🐍', mariposa: '🦋', caracol: '🐌', arana: '🕷️',
    abeja: '🐝', cangrejo: '🦀', gusano: '🐛', pulpo: '🐙', medusa: '🪼', estrella: '⭐',
    mariquita: '🐞', libelula: '✨', escorpion: '🦂'
  };

  const POOL_V = ['vaca', 'conejo', 'tortuga', 'cerdo', 'rana', 'zorro', 'pinguino', 'loro', 'pato', 'panda', 'serpiente'];
  const POOL_I = ['mariposa', 'caracol', 'arana', 'abeja', 'cangrejo', 'gusano', 'pulpo', 'medusa', 'estrella', 'mariquita', 'libelula', 'escorpion'];
  const LEVEL_COUNTS = [4, 6, 7, 8, 9, 10, 10, 11, 12, 12];

  const THEMES = [
    {
      name: 'Bosque',
      grass: [0x43c84a, 0x2faa3c, 0x57d85a, 0x36b244, 0x6ee06a, 0x24963a],
      dirt: [0xe23b32, 0xd3543a, 0xef5340, 0xc0392b],
      leaf: [0x1c7a34, 0x23913f, 0x176a2c, 0x2fa34a],
      glow: 0x66ffcc, sun: 0xcfe9ff, fog: 0x08191c,
      sky: ['#04101c', '#0b2a35', '#1d5a52'], tree: '#0c3a2e', tree2: '#145a43', moon: '#d8fff1'
    },
    {
      name: 'Otoño',
      grass: [0x9bbf3a, 0x86a832, 0xb5c443, 0x7fa030, 0xc9b43e, 0x6e9a2e],
      dirt: [0x8a5a32, 0x7a4c2a, 0x9a6838, 0x6e4426],
      leaf: [0xe8742a, 0xd9531e, 0xf0a030, 0xc0392b],
      glow: 0xffaa55, sun: 0xffd2a0, fog: 0x1a1208,
      sky: ['#150a10', '#3a1c1a', '#8a4a26'], tree: '#3a1a12', tree2: '#6a3416', moon: '#ffe2b8'
    },
    {
      name: 'Cristal',
      grass: [0x2fc7b5, 0x23a8a0, 0x45dcc6, 0x2b95b5, 0x5ae0e0, 0x1f8aa0],
      dirt: [0x3b3b7a, 0x2f2f66, 0x4a4a8e, 0x262655],
      leaf: [0x7a5cff, 0x9d7bff, 0x49d0e0, 0xc084fc],
      glow: 0xb48cff, sun: 0xcdb8ff, fog: 0x0e0a24,
      sky: ['#05031a', '#1a1050', '#3d2a86'], tree: '#1c1250', tree2: '#35247a', moon: '#e6dcff'
    }
  ];
  function themeIndex(level) { return level < 3 ? 0 : level < 6 ? 1 : 2; }
  function themeFor(level) { return THEMES[themeIndex(level)]; }
  function enemyCountFor(level) { return level < 3 ? 1 : level < 6 ? 2 : 3; }
  function enemySpeedFor(level) { return Math.min(4.3, 3.1 + level * 0.14); }

  function mulberry32(a) {
    return function () {
      a |= 0; a = a + 0x6D2B79F5 | 0;
      let t = Math.imul(a ^ a >>> 15, 1 | a);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function lerpAngle(a, b, t) {
    const d = Math.atan2(Math.sin(b - a), Math.cos(b - a));
    return a + d * t;
  }

  function levelAnimals(i) {
    if (i === 0) return ['vaca', 'conejo', 'mariposa', 'caracol'];
    if (i === 1) return ['tortuga', 'cerdo', 'rana', 'arana', 'abeja', 'cangrejo'];
    const rnd = mulberry32(7000 + i * 31);
    const n = LEVEL_COUNTS[i];
    const shuffle = (arr) => {
      const a = arr.slice();
      for (let j = a.length - 1; j > 0; j--) {
        const r = Math.floor(rnd() * (j + 1));
        const t = a[j]; a[j] = a[r]; a[r] = t;
      }
      return a;
    };
    const nv = Math.ceil(n / 2);
    return shuffle(shuffle(POOL_V).slice(0, nv).concat(shuffle(POOL_I).slice(0, n - nv)));
  }

  // =====================================================================
  //  RENDERIZADOR Y ESCENA (fondo transparente: detrás va el bosque desenfocado)
  // =====================================================================
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.setSize(innerWidth, innerHeight);
  renderer.setClearColor(0x000000, 0);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  if (THREE.SRGBColorSpace) renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.domElement.id = 'game';
  renderer.domElement.style.touchAction = 'none';
  document.body.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(THEMES[0].fog, 34, 105);
  const camera = new THREE.PerspectiveCamera(40, innerWidth / innerHeight, 0.1, 160);
  camera.position.set(0, 12, 14);

  const ambient = new THREE.AmbientLight(0xbfd8ff, 0.34);
  scene.add(ambient);
  const hemi = new THREE.HemisphereLight(0xdff4ff, 0x3a2418, 0.42);
  scene.add(hemi);
  const sun = new THREE.DirectionalLight(0xcfe9ff, 0.62);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  const sc = sun.shadow.camera;
  sc.left = -26; sc.right = 26; sc.top = 26; sc.bottom = -26; sc.near = 0.5; sc.far = 80;
  sc.updateProjectionMatrix();
  sun.shadow.bias = -0.0012;
  sun.shadow.normalBias = 0.03;
  scene.add(sun);
  scene.add(sun.target);
  const SUN_OFFSET = new THREE.Vector3(12, 22, 9);
  const glowLight = new THREE.PointLight(0x66ffcc, 1.8, 46, 2);
  scene.add(glowLight);

  const world = new THREE.Group();
  scene.add(world);

  // =====================================================================
  //  TEXTURAS PROCEDURALES DE PIXEL-ART
  // =====================================================================
  function canvasTex(draw, w, h) {
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    const g = c.getContext('2d');
    g.imageSmoothingEnabled = false;
    draw(g, w, h);
    const t = new THREE.CanvasTexture(c);
    t.magFilter = THREE.NearestFilter;
    t.minFilter = THREE.NearestMipmapLinearFilter;
    t.anisotropy = 4;
    if (THREE.SRGBColorSpace) t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }

  function hash2(a, b) {
    let t = (a * 374761393 + b * 668265263) | 0;
    t = (t ^ (t >>> 13)) * 1274126177 | 0;
    return ((t ^ (t >>> 16)) >>> 0) / 4294967296;
  }

  // Cada tipo de superficie tiene su propio patrón de píxeles
  function makeTex(kind, hex, size) {
    return canvasTex((g, w, h) => {
      const r0 = (hex >> 16) & 255, g0 = (hex >> 8) & 255, b0 = hex & 255;
      const img = g.createImageData(w, h);
      const rnd = mulberry32((hex * 31 + kind.length * 7919 + size) | 0);
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const n = rnd();
          let f = 1;
          switch (kind) {
            case 'grass':
              f = 0.9 + (n - 0.5) * 0.2;
              if (n > 0.92) f = 1.16;
              if ((x * 7 + y * 13) % 11 === 0) f *= 0.86;
              if (hash2(x >> 1, y >> 1) > 0.82) f *= 1.08;
              break;
            case 'dirt':
              f = 0.95 + (n - 0.5) * 0.16;
              if (y % 6 === 5) f *= 0.8;
              if (n < 0.05) f *= 0.68;
              if (hash2(x >> 1, y >> 2) > 0.9) f *= 1.14;
              break;
            case 'sand':
              f = 0.96 + (n - 0.5) * 0.1;
              if (y % 8 === 0 || (x + (((y >> 3) & 1) * 4)) % 8 === 0) f *= 0.78;
              break;
            case 'bark':
              f = 0.92 + (n - 0.5) * 0.12;
              if (x % 4 === 0) f *= 0.8;
              if (hash2(x, y >> 2) > 0.85) f *= 1.12;
              break;
            case 'leaf': {
              const cl = hash2(x >> 2, y >> 2);
              f = 0.8 + cl * 0.38 + (n - 0.5) * 0.1;
              break;
            }
            case 'shell':
              f = 1 + (n - 0.5) * 0.08;
              if (x % 8 === 0 || y % 8 === 0) f = 0.62;
              else if ((x % 8) < 3 && (y % 8) < 3) f = 1.14;
              break;
            case 'scale':
              f = 1 + (n - 0.5) * 0.07;
              if ((x + y * 2) % 6 === 0) f *= 0.78;
              if ((x + y * 2) % 6 === 1) f *= 1.1;
              break;
            case 'feather':
              f = 1 + (n - 0.5) * 0.08;
              if (y % 3 === 0) f *= 0.86;
              break;
            case 'chitin':
              f = 1 + (n - 0.5) * 0.05;
              if (y % 5 === 0) f *= 0.74;
              if (x % 8 < 2) f *= 1.14;
              break;
            case 'camo': {
              const v = hash2(x >> 1, y >> 1);
              f = v < 0.3 ? 0.6 : (v > 0.78 ? 1.22 : 1.0);
              f *= 1 + (n - 0.5) * 0.08;
              break;
            }
            case 'stone':
              f = 0.9 + hash2(x >> 2, y >> 2) * 0.25 + (n - 0.5) * 0.08;
              break;
            case 'cloth':
              f = ((x + y) % 2 === 0 ? 1 : 0.94) + (n - 0.5) * 0.05;
              break;
            default: // fur
              f = 1 + (n - 0.5) * 0.18;
          }
          const i = (y * w + x) * 4;
          img.data[i] = clamp(r0 * f, 0, 255);
          img.data[i + 1] = clamp(g0 * f, 0, 255);
          img.data[i + 2] = clamp(b0 * f, 0, 255);
          img.data[i + 3] = 255;
        }
      }
      g.putImageData(img, 0, 0);
    }, size, size);
  }

  const texMatCache = new Map();
  function tm(hex, kind, size) {
    kind = kind || 'fur';
    const key = hex + ':' + kind;
    if (texMatCache.has(key)) return texMatCache.get(key);
    const m = new THREE.MeshLambertMaterial({ map: makeTex(kind, hex, size || 16) });
    texMatCache.set(key, m);
    return m;
  }

  const matCache = new Map();
  function mat(color, opts) {
    if (!opts) return tm(color, 'fur');
    const key = color + JSON.stringify(opts);
    if (matCache.has(key)) return matCache.get(key);
    const m = new THREE.MeshLambertMaterial(Object.assign({ color }, opts));
    matCache.set(key, m);
    return m;
  }

  const basicCache = new Map();
  function basicMat(hex) {
    if (!basicCache.has(hex)) basicCache.set(hex, new THREE.MeshBasicMaterial({ color: hex }));
    return basicCache.get(hex);
  }

  function cube(parent, sx, sy, sz, color, x, y, z) {
    const material = color && color.isMaterial ? color : mat(color);
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(sx, sy, sz), material);
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
  }

  // Texturas neutras que se tiñen con colores por vértice (terreno)
  const TEX_GRASS = makeTex('grass', 0xf2f2f2, 16);
  const TEX_DIRT = makeTex('dirt', 0xf2f2f2, 16);
  const TEX_SAND = makeTex('sand', 0xf2f2f2, 16);
  [TEX_DIRT, TEX_SAND].forEach((t) => { t.wrapS = THREE.RepeatWrapping; t.wrapT = THREE.RepeatWrapping; });
  const MAT_TOP = new THREE.MeshLambertMaterial({ map: TEX_GRASS, vertexColors: true });
  const MAT_SIDE = new THREE.MeshLambertMaterial({ map: TEX_DIRT, vertexColors: true });
  const MAT_SAND = new THREE.MeshLambertMaterial({ map: TEX_SAND, vertexColors: true });

  // =====================================================================
  //  MEZCLADORES DE GEOMETRÍA (miles de cubos = unas pocas llamadas de dibujo)
  // =====================================================================
  class Batch {
    constructor() { this.groups = new Map(); }
    box(sx, sy, sz, x, y, z, material, rotY) {
      let gr = this.groups.get(material);
      if (!gr) { gr = { pos: [], nor: [], uv: [], idx: [], n: 0 }; this.groups.set(material, gr); }
      const geo = new THREE.BoxGeometry(sx, sy, sz);
      if (rotY) geo.rotateY(rotY);
      geo.translate(x, y, z);
      const p = geo.attributes.position.array;
      const nn = geo.attributes.normal.array;
      const u = geo.attributes.uv.array;
      const ix = geo.index.array;
      for (let i = 0; i < p.length; i++) { gr.pos.push(p[i]); gr.nor.push(nn[i]); }
      for (let i = 0; i < u.length; i++) gr.uv.push(u[i]);
      for (let i = 0; i < ix.length; i++) gr.idx.push(ix[i] + gr.n);
      gr.n += p.length / 3;
      geo.dispose();
    }
    build(parent) {
      this.groups.forEach((gr, material) => {
        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.Float32BufferAttribute(gr.pos, 3));
        geo.setAttribute('normal', new THREE.Float32BufferAttribute(gr.nor, 3));
        geo.setAttribute('uv', new THREE.Float32BufferAttribute(gr.uv, 2));
        geo.setIndex(new THREE.BufferAttribute(new Uint32Array(gr.idx), 1));
        const mesh = new THREE.Mesh(geo, material);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        parent.add(mesh);
      });
    }
  }

  const _col = new THREE.Color();
  function newMesher() { return { pos: [], nor: [], uv: [], col: [], idx: [], n: 0 }; }
  function quad(m, a, b, c, d, nx, ny, nz, vh, hex) {
    _col.setHex(hex);
    const uvs = [[0, 0], [1, 0], [1, vh], [0, vh]];
    [a, b, c, d].forEach((p, i) => {
      m.pos.push(p[0], p[1], p[2]);
      m.nor.push(nx, ny, nz);
      m.uv.push(uvs[i][0], uvs[i][1]);
      m.col.push(_col.r, _col.g, _col.b);
    });
    m.idx.push(m.n, m.n + 1, m.n + 2, m.n, m.n + 2, m.n + 3);
    m.n += 4;
  }
  function meshTop(m, x0, z0, x1, z1, y, hex) {
    quad(m, [x0, y, z1], [x1, y, z1], [x1, y, z0], [x0, y, z0], 0, 1, 0, 1, hex);
  }
  function meshSide(m, dir, x0, z0, x1, z1, y0, y1, hex) {
    const vh = y1 - y0;
    if (dir === 'px') quad(m, [x1, y0, z1], [x1, y0, z0], [x1, y1, z0], [x1, y1, z1], 1, 0, 0, vh, hex);
    else if (dir === 'nx') quad(m, [x0, y0, z0], [x0, y0, z1], [x0, y1, z1], [x0, y1, z0], -1, 0, 0, vh, hex);
    else if (dir === 'pz') quad(m, [x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1], 0, 0, 1, vh, hex);
    else quad(m, [x1, y0, z0], [x0, y0, z0], [x0, y1, z0], [x1, y1, z0], 0, 0, -1, vh, hex);
  }
  function buildMesher(m, material, parent) {
    if (!m.n) return;
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(m.pos, 3));
    geo.setAttribute('normal', new THREE.Float32BufferAttribute(m.nor, 3));
    geo.setAttribute('uv', new THREE.Float32BufferAttribute(m.uv, 2));
    geo.setAttribute('color', new THREE.Float32BufferAttribute(m.col, 3));
    geo.setIndex(new THREE.BufferAttribute(new Uint32Array(m.idx), 1));
    const mesh = new THREE.Mesh(geo, material);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    parent.add(mesh);
  }

  const _tmpV = new THREE.Vector3();
  const unitBox = new THREE.BoxGeometry(1, 1, 1);
  const bulletGeo = new THREE.BoxGeometry(0.18, 0.18, 0.18);

  function makeGlowTexture() {
    const c = document.createElement('canvas');
    c.width = c.height = 128;
    const g = c.getContext('2d');
    const grad = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    grad.addColorStop(0, 'rgba(255,255,255,1)');
    grad.addColorStop(0.25, 'rgba(255,255,255,0.55)');
    grad.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = grad;
    g.fillRect(0, 0, 128, 128);
    const t = new THREE.CanvasTexture(c);
    if (THREE.SRGBColorSpace) t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }
  const glowTex = makeGlowTexture();
  const bulletMat = new THREE.MeshBasicMaterial({ color: 0xfff2a8 });
  const bulletGlowMat = new THREE.SpriteMaterial({ map: glowTex, color: 0xffd23f, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending });
  const glowSpriteMats = new Map();
  function glowSprite(hex, size, opacity) {
    const key = hex + ':' + (opacity || 1);
    if (!glowSpriteMats.has(key)) {
      glowSpriteMats.set(key, new THREE.SpriteMaterial({ map: glowTex, color: hex, transparent: true, opacity: opacity || 1, depthWrite: false, blending: THREE.AdditiveBlending, fog: false }));
    }
    const s = new THREE.Sprite(glowSpriteMats.get(key));
    s.scale.set(size, size, 1);
    return s;
  }

  // =====================================================================
  //  LETREROS DE NEÓN (sin fondo; los sprites siempre miran hacia el jugador)
  // =====================================================================
  function makeNeonSign(text, hex) {
    const W = 1024, H = 256;
    const cv = document.createElement('canvas');
    cv.width = W; cv.height = H;
    const g = cv.getContext('2d');
    const css = '#' + hex.toString(16).padStart(6, '0');
    const family = '"Fredoka", "Trebuchet MS", "Segoe UI", sans-serif';
    function draw() {
      g.clearRect(0, 0, W, H);
      let size = 128;
      g.font = '700 ' + size + 'px ' + family;
      const maxW = W - 170;
      const w = g.measureText(text).width;
      if (w > maxW) {
        size = Math.floor(size * maxW / w);
        g.font = '700 ' + size + 'px ' + family;
      }
      g.textAlign = 'center';
      g.textBaseline = 'middle';
      g.lineJoin = 'round';
      const cx = W / 2;
      const cy = H / 2 - 14;
      [[64, 24, 0.30], [34, 17, 0.55], [14, 11, 0.95]].forEach(([blur, lw, a]) => {
        g.shadowColor = css; g.shadowBlur = blur;
        g.strokeStyle = css; g.lineWidth = lw; g.globalAlpha = a;
        g.strokeText(text, cx, cy);
      });
      g.shadowBlur = 0; g.globalAlpha = 1;
      g.fillStyle = '#fdfdff';
      g.fillText(text, cx, cy);
      const ly = cy + size * 0.68;
      g.shadowColor = css; g.shadowBlur = 26; g.fillStyle = css; g.globalAlpha = 0.9;
      g.fillRect(W / 2 - 190, ly - 5, 380, 10);
      g.shadowBlur = 0; g.globalAlpha = 1; g.fillStyle = '#fdfdff';
      g.fillRect(W / 2 - 186, ly - 1.5, 372, 3);
    }
    draw();
    const map = new THREE.CanvasTexture(cv);
    if (THREE.SRGBColorSpace) map.colorSpace = THREE.SRGBColorSpace;
    map.anisotropy = 4;
    const material = new THREE.SpriteMaterial({ map, transparent: true, depthWrite: false, fog: false, toneMapped: false });
    material.userData.unique = true;
    const sp = new THREE.Sprite(material);
    sp.scale.set(3.1, 0.775, 1);
    sp.userData.uniqueMap = map;
    sp.userData.redraw = () => { draw(); map.needsUpdate = true; };
    return sp;
  }

  function makeStarSprite() {
    const map = canvasTex((g, w, h) => {
      g.clearRect(0, 0, w, h);
      g.fillStyle = '#ffe14a';
      g.beginPath();
      for (let i = 0; i < 10; i++) {
        const rad = i % 2 === 0 ? 28 : 12;
        const a = -Math.PI / 2 + i * Math.PI / 5;
        const px = w / 2 + Math.cos(a) * rad;
        const py = h / 2 + Math.sin(a) * rad;
        if (i === 0) g.moveTo(px, py); else g.lineTo(px, py);
      }
      g.closePath();
      g.fill();
    }, 64, 64);
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map, transparent: true }));
    s.scale.set(0.38, 0.38, 1);
    s.userData.uniqueMap = map;
    return s;
  }

  // =====================================================================
  //  ANIMALES (todos miran hacia +Z; las alas, tentáculos y serpientes se animan)
  // =====================================================================
  const S = [-1, 1];
  const BLACK = 0x161616;

  function finishAnimal(g, kind) {
    g.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(g);
    const dy = -box.min.y;
    for (const ch of [...g.children]) ch.position.y += dy;
    const info = INFO[kind];
    g.userData.kind = kind;
    g.userData.vertebrate = info.v;
    g.userData.name = info.name;
    g.userData.hover = info.hover || 0;
    return g;
  }

  function eyesAt(g, x, y, z, s) {
    S.forEach((k) => {
      cube(g, s, s * 1.1, 0.04, 0x141414, k * x, y, z);
      cube(g, s * 0.38, s * 0.38, 0.045, 0xffffff, k * x + s * 0.16, y + s * 0.2, z + 0.006);
    });
  }

  function legs4(g, xs, zs, w, h, col, hoof) {
    xs.forEach((x) => zs.forEach((z) => {
      cube(g, w, h - 0.06, w, col, x, 0.06 + (h - 0.06) / 2, z);
      if (hoof != null) cube(g, w * 1.1, 0.06, w * 1.15, hoof, x, 0.03, z + w * 0.05);
    }));
  }

  function addAnim(g, a) {
    if (!g.userData.anim) g.userData.anim = [];
    g.userData.anim.push(a);
  }

  const wingMatCache = new Map();
  function wingMats(pal, mirror) {
    const key = pal.join('') + mirror;
    if (wingMatCache.has(key)) return wingMatCache.get(key);
    const draw = (c1, c2, c3, big) => canvasTex((g, w, h) => {
      if (mirror) { g.translate(w, 0); g.scale(-1, 1); }
      g.fillStyle = c1; g.fillRect(0, 0, w, h);
      g.fillStyle = c2; g.fillRect(0, 0, Math.floor(w * 0.34), h);
      g.fillStyle = c3;
      [[9, 7], [20, 10], [13, 20], [24, 23], [6, 24]].forEach(([x, y]) => g.fillRect(x, y, big ? 4 : 3, big ? 4 : 3));
      g.fillStyle = 'rgba(25,10,35,0.85)';
      g.fillRect(0, 0, w, 2); g.fillRect(0, h - 2, w, 2); g.fillRect(w - 2, 0, 2, h);
      g.fillStyle = 'rgba(25,10,35,0.45)';
      for (let i = 0; i < 4; i++) g.fillRect(5 + i * 7, 0, 1, h);
    }, 32, 32);
    const mk = (t) => new THREE.MeshLambertMaterial({ map: t, emissive: 0x15101c });
    const res = { up: mk(draw(pal[0], pal[1], pal[2], true)), low: mk(draw(pal[1], pal[0], pal[2], false)) };
    wingMatCache.set(key, res);
    return res;
  }

  // ---------------- Vertebrados ----------------
  function makeCow() {
    const g = new THREE.Group();
    const W = 0xf4f4f4, K = 0x1b1b1b, P = 0xf3a3b0;
    legs4(g, [-0.2, 0.2], [0.3, -0.3], 0.15, 0.34, W, K);
    cube(g, 0.54, 0.46, 0.94, W, 0, 0.58, 0);
    cube(g, 0.56, 0.24, 0.3, K, 0, 0.66, 0.12);
    cube(g, 0.3, 0.1, 0.24, K, 0.04, 0.82, -0.2);
    cube(g, 0.56, 0.2, 0.22, K, 0, 0.52, -0.3);
    cube(g, 0.2, 0.1, 0.22, P, 0, 0.33, -0.28);
    cube(g, 0.38, 0.34, 0.34, W, 0, 0.8, 0.62);
    cube(g, 0.28, 0.2, 0.16, P, 0, 0.72, 0.84);
    S.forEach((k) => {
      cube(g, 0.05, 0.07, 0.04, 0xc45b73, k * 0.07, 0.72, 0.93);
      cube(g, 0.08, 0.14, 0.1, W, k * 0.24, 0.86, 0.56);
      cube(g, 0.05, 0.1, 0.07, P, k * 0.27, 0.86, 0.56);
      cube(g, 0.07, 0.14, 0.07, 0xefe6cf, k * 0.14, 1.04, 0.56);
    });
    eyesAt(g, 0.1, 0.84, 0.8, 0.07);
    cube(g, 0.06, 0.4, 0.06, W, 0, 0.64, -0.5);
    cube(g, 0.09, 0.12, 0.09, K, 0, 0.4, -0.5);
    return finishAnimal(g, 'vaca');
  }

  function makeRabbit() {
    const g = new THREE.Group();
    const W = 0xf6f6f6, P = 0xf7b7c4, T = 0xdcdcdc;
    cube(g, 0.4, 0.34, 0.56, W, 0, 0.34, -0.02);
    cube(g, 0.3, 0.26, 0.2, T, 0, 0.28, -0.3);
    cube(g, 0.16, 0.16, 0.16, W, 0, 0.34, -0.42);
    S.forEach((k) => {
      cube(g, 0.12, 0.2, 0.26, W, k * 0.16, 0.17, -0.18);
      cube(g, 0.1, 0.18, 0.1, W, k * 0.12, 0.1, 0.22);
      cube(g, 0.1, 0.46, 0.07, W, k * 0.09, 0.92, 0.4);
      cube(g, 0.05, 0.38, 0.04, P, k * 0.09, 0.92, 0.44);
    });
    cube(g, 0.32, 0.28, 0.3, W, 0, 0.56, 0.34);
    cube(g, 0.14, 0.1, 0.1, W, 0, 0.5, 0.52);
    cube(g, 0.06, 0.05, 0.04, P, 0, 0.54, 0.58);
    eyesAt(g, 0.09, 0.6, 0.5, 0.06);
    return finishAnimal(g, 'conejo');
  }

  function makeTurtle() {
    const g = new THREE.Group();
    const SK = 0x8bd44a, SK2 = 0x6fbf3a;
    cube(g, 0.6, 0.12, 0.72, 0xf3e2a0, 0, 0.16, 0);
    cube(g, 0.66, 0.24, 0.8, tm(0x3f8f3a, 'shell'), 0, 0.34, 0);
    cube(g, 0.46, 0.14, 0.56, tm(0x4aa044, 'shell'), 0, 0.52, 0);
    cube(g, 0.24, 0.1, 0.32, tm(0x57b24f, 'shell'), 0, 0.62, 0);
    cube(g, 0.2, 0.18, 0.24, SK, 0, 0.3, 0.5);
    cube(g, 0.26, 0.24, 0.26, SK, 0, 0.34, 0.66);
    eyesAt(g, 0.08, 0.38, 0.79, 0.05);
    S.forEach((k) => {
      cube(g, 0.16, 0.14, 0.2, SK2, k * 0.34, 0.1, 0.28);
      cube(g, 0.16, 0.14, 0.2, SK2, k * 0.34, 0.1, -0.28);
    });
    cube(g, 0.1, 0.08, 0.14, SK2, 0, 0.14, -0.46);
    return finishAnimal(g, 'tortuga');
  }

  function makePig() {
    const g = new THREE.Group();
    const PK = 0xf4a8b0;
    legs4(g, [-0.2, 0.2], [0.24, -0.24], 0.15, 0.26, PK, 0xe07a84);
    cube(g, 0.54, 0.46, 0.82, PK, 0, 0.5, 0);
    cube(g, 0.4, 0.36, 0.34, PK, 0, 0.58, 0.5);
    cube(g, 0.24, 0.18, 0.14, 0xe56b6b, 0, 0.5, 0.72);
    S.forEach((k) => {
      cube(g, 0.05, 0.07, 0.04, 0xa1434d, k * 0.06, 0.5, 0.8);
      cube(g, 0.13, 0.1, 0.14, 0xf0b2ad, k * 0.18, 0.8, 0.46);
    });
    eyesAt(g, 0.12, 0.62, 0.68, 0.06);
    cube(g, 0.07, 0.07, 0.1, PK, 0, 0.64, -0.46);
    cube(g, 0.07, 0.09, 0.07, PK, 0, 0.72, -0.5);
    return finishAnimal(g, 'cerdo');
  }

  function makeFrog() {
    const g = new THREE.Group();
    const G = 0x67c23a, G2 = 0x4e9a2c, LG = 0x7ed14a;
    cube(g, 0.46, 0.26, 0.5, tm(G, 'scale'), 0, 0.24, -0.04);
    cube(g, 0.38, 0.2, 0.3, tm(LG, 'scale'), 0, 0.3, 0.26);
    cube(g, 0.3, 0.03, 0.04, 0x2d5a1a, 0, 0.26, 0.42);
    cube(g, 0.1, 0.03, 0.1, 0x3d7a22, 0.1, 0.375, -0.1);
    cube(g, 0.1, 0.03, 0.1, 0x3d7a22, -0.12, 0.375, -0.2);
    S.forEach((k) => {
      cube(g, 0.14, 0.14, 0.14, 0xf6f6f6, k * 0.12, 0.46, 0.3);
      cube(g, 0.07, 0.08, 0.05, BLACK, k * 0.12, 0.47, 0.38);
      cube(g, 0.2, 0.1, 0.36, G2, k * 0.26, 0.1, -0.12);
      cube(g, 0.1, 0.07, 0.16, G2, k * 0.2, 0.06, 0.3);
      cube(g, 0.1, 0.04, 0.12, LG, k * 0.26, 0.03, -0.34);
    });
    return finishAnimal(g, 'rana');
  }

  function makeFox() {
    const g = new THREE.Group();
    const O = 0xe8751a, Wt = 0xfaf3e6, D = 0x3a2a22;
    legs4(g, [-0.12, 0.12], [0.22, -0.2], 0.1, 0.3, D, 0x2a1c16);
    cube(g, 0.34, 0.32, 0.72, O, 0, 0.46, 0);
    cube(g, 0.26, 0.18, 0.12, Wt, 0, 0.4, 0.34);
    cube(g, 0.3, 0.28, 0.3, O, 0, 0.66, 0.46);
    cube(g, 0.18, 0.14, 0.2, Wt, 0, 0.6, 0.64);
    cube(g, 0.07, 0.06, 0.05, BLACK, 0, 0.64, 0.75);
    S.forEach((k) => {
      cube(g, 0.1, 0.2, 0.06, O, k * 0.1, 0.88, 0.42);
      cube(g, 0.05, 0.12, 0.04, D, k * 0.1, 0.88, 0.45);
    });
    eyesAt(g, 0.09, 0.7, 0.62, 0.05);
    cube(g, 0.2, 0.2, 0.34, O, 0, 0.52, -0.5);
    cube(g, 0.22, 0.22, 0.16, Wt, 0, 0.52, -0.74);
    return finishAnimal(g, 'zorro');
  }

  function makePenguin() {
    const g = new THREE.Group();
    const D = 0x1d2433, OR = 0xff9d1c;
    cube(g, 0.46, 0.62, 0.36, tm(D, 'feather'), 0, 0.5, 0);
    cube(g, 0.32, 0.46, 0.06, 0xffffff, 0, 0.48, 0.19);
    cube(g, 0.36, 0.3, 0.34, tm(D, 'feather'), 0, 0.96, 0.02);
    cube(g, 0.26, 0.06, 0.06, 0xffd23f, 0, 0.8, 0.17);
    cube(g, 0.14, 0.06, 0.14, OR, 0, 0.92, 0.26);
    eyesAt(g, 0.09, 0.99, 0.19, 0.06);
    S.forEach((k) => {
      const f = cube(g, 0.06, 0.38, 0.2, D, k * 0.27, 0.5, 0);
      f.rotation.z = k * 0.25;
      cube(g, 0.16, 0.05, 0.24, OR, k * 0.1, 0.03, 0.08);
    });
    return finishAnimal(g, 'pinguino');
  }

  function makeParrot() {
    const g = new THREE.Group();
    const R = 0xe53935, B = 0x1e6bd6, Y = 0xffd23f;
    cube(g, 0.32, 0.46, 0.3, tm(R, 'feather'), 0, 0.52, 0);
    cube(g, 0.3, 0.28, 0.28, tm(R, 'feather'), 0, 0.88, 0.04);
    cube(g, 0.26, 0.16, 0.05, 0xf4f4f4, 0, 0.86, 0.19);
    cube(g, 0.12, 0.18, 0.14, 0xf2ead0, 0, 0.82, 0.26);
    cube(g, 0.08, 0.1, 0.1, 0x2a2a2a, 0, 0.74, 0.28);
    eyesAt(g, 0.09, 0.9, 0.21, 0.06);
    S.forEach((k) => {
      cube(g, 0.07, 0.4, 0.24, tm(B, 'feather'), k * 0.2, 0.52, -0.02);
      cube(g, 0.075, 0.12, 0.24, Y, k * 0.2, 0.58, -0.02);
      cube(g, 0.05, 0.26, 0.05, 0x777777, k * 0.08, 0.14, 0.02);
      cube(g, 0.12, 0.04, 0.12, 0x777777, k * 0.08, 0.02, 0.06);
    });
    const tail = cube(g, 0.14, 0.5, 0.1, tm(B, 'feather'), 0, 0.2, -0.24);
    tail.rotation.x = 0.3;
    cube(g, 0.1, 0.3, 0.08, R, 0, 0.14, -0.3);
    return finishAnimal(g, 'loro');
  }

  function makeDuck() {
    const g = new THREE.Group();
    const Y = 0xffd83a, OR = 0xff9a1c;
    cube(g, 0.46, 0.3, 0.62, tm(Y, 'feather'), 0, 0.34, -0.04);
    const tail = cube(g, 0.22, 0.18, 0.14, Y, 0, 0.46, -0.4);
    tail.rotation.x = -0.3;
    cube(g, 0.28, 0.28, 0.28, tm(Y, 'feather'), 0, 0.66, 0.3);
    cube(g, 0.22, 0.07, 0.18, OR, 0, 0.6, 0.48);
    eyesAt(g, 0.09, 0.7, 0.435, 0.05);
    S.forEach((k) => {
      cube(g, 0.06, 0.2, 0.34, 0xf0c020, k * 0.25, 0.38, -0.06);
      cube(g, 0.05, 0.18, 0.05, OR, k * 0.1, 0.1, 0.02);
      cube(g, 0.14, 0.04, 0.18, OR, k * 0.1, 0.02, 0.1);
    });
    return finishAnimal(g, 'pato');
  }

  function makePanda() {
    const g = new THREE.Group();
    const Wt = 0xf5f5f5, K = 0x1c1c1c;
    legs4(g, [-0.2, 0.2], [0.2, -0.2], 0.17, 0.3, K, null);
    cube(g, 0.52, 0.46, 0.62, Wt, 0, 0.52, 0);
    cube(g, 0.54, 0.34, 0.2, K, 0, 0.56, 0.22);
    cube(g, 0.4, 0.36, 0.36, Wt, 0, 0.9, 0.4);
    cube(g, 0.2, 0.14, 0.12, 0xe6e6e6, 0, 0.82, 0.62);
    cube(g, 0.08, 0.06, 0.04, K, 0, 0.86, 0.69);
    S.forEach((k) => {
      cube(g, 0.13, 0.13, 0.1, K, k * 0.17, 1.14, 0.36);
      cube(g, 0.11, 0.14, 0.04, K, k * 0.1, 0.92, 0.59);
      cube(g, 0.04, 0.04, 0.045, 0xffffff, k * 0.1, 0.93, 0.61);
    });
    cube(g, 0.12, 0.12, 0.1, Wt, 0, 0.52, -0.34);
    return finishAnimal(g, 'panda');
  }

  function makeSnake() {
    const g = new THREE.Group();
    const segs = [];
    const base = [];
    for (let i = 0; i < 9; i++) {
      const s = 0.17 - i * 0.012;
      const x = Math.sin(i * 0.9) * 0.08;
      const m = cube(g, s, s * 0.85, 0.15, tm(i % 2 ? 0x8bd44a : 0x2f9a44, 'scale'), x, 0.1 + s * 0.4, 0.34 - i * 0.14);
      segs.push(m); base.push(x);
    }
    cube(g, 0.22, 0.14, 0.24, tm(0x1f7a35, 'scale'), 0, 0.15, 0.55);
    S.forEach((k) => cube(g, 0.05, 0.05, 0.05, 0xffe14a, k * 0.1, 0.22, 0.6));
    cube(g, 0.02, 0.02, 0.1, 0xe53935, 0, 0.14, 0.7);
    addAnim(g, { type: 'slither', segs, base, speed: 5, amp: 0.07 });
    return finishAnimal(g, 'serpiente');
  }

  // ---------------- Invertebrados ----------------
  function makeButterfly() {
    const g = new THREE.Group();
    const pals = [['#ff7ab8', '#9b2f8a', '#fff0a8'], ['#4fc3ff', '#2d4bd6', '#e8fbff'], ['#ffb02e', '#c4421a', '#fff6b0']];
    const pal = pals[(Math.random() * pals.length) | 0];
    cube(g, 0.07, 0.07, 0.34, tm(0x2a2236, 'chitin'), 0, 0.5, 0);
    cube(g, 0.1, 0.1, 0.1, tm(0x1a1424, 'chitin'), 0, 0.5, 0.22);
    S.forEach((k) => {
      cube(g, 0.02, 0.16, 0.02, 0x222222, k * 0.04, 0.62, 0.28);
      cube(g, 0.04, 0.04, 0.04, 0xffd23f, k * 0.04, 0.71, 0.28);
      const mats = wingMats(pal, k < 0);
      const wing = new THREE.Group();
      wing.position.set(k * 0.04, 0.5, 0.04);
      g.add(wing);
      cube(wing, 0.4, 0.03, 0.34, mats.up, k * 0.2, 0, 0.02);
      cube(wing, 0.28, 0.03, 0.26, mats.low, k * 0.15, 0, -0.24);
      addAnim(g, { type: 'wing', obj: wing, side: k, speed: 17, phase: 0 });
    });
    return finishAnimal(g, 'mariposa');
  }

  function makeBee() {
    const g = new THREE.Group();
    const dark = 0x1a1a1a, yel = 0xf0c400;
    cube(g, 0.2, 0.2, 0.2, tm(dark, 'chitin'), 0, 0.5, 0.3);
    [[0.1, yel], [-0.06, dark], [-0.2, yel], [-0.34, dark]].forEach(([z, c]) => cube(g, 0.22, 0.22, 0.15, tm(c, 'chitin'), 0, 0.5, z));
    cube(g, 0.05, 0.05, 0.1, dark, 0, 0.5, -0.46);
    const wmat = mat(0xeaf6ff, { transparent: true, opacity: 0.7 });
    S.forEach((k) => {
      cube(g, 0.04, 0.08, 0.06, 0xf5f5f5, k * 0.08, 0.54, 0.4);
      cube(g, 0.02, 0.14, 0.02, dark, k * 0.05, 0.66, 0.38);
      [0.12, 0, -0.12].forEach((z) => cube(g, 0.04, 0.12, 0.04, dark, k * 0.08, 0.36, z));
      const wing = new THREE.Group();
      wing.position.set(k * 0.06, 0.64, 0.06);
      g.add(wing);
      cube(wing, 0.3, 0.02, 0.16, wmat, k * 0.15, 0, 0);
      addAnim(g, { type: 'wing', obj: wing, side: k, speed: 32, phase: 0 });
    });
    return finishAnimal(g, 'abeja');
  }

  function makeSnail() {
    const g = new THREE.Group();
    const BODY = 0xe6c48a;
    cube(g, 0.28, 0.14, 0.6, BODY, 0, 0.1, -0.04);
    cube(g, 0.2, 0.26, 0.2, BODY, 0, 0.22, 0.3);
    S.forEach((k) => {
      cube(g, 0.04, 0.22, 0.04, BODY, k * 0.06, 0.46, 0.34);
      cube(g, 0.06, 0.06, 0.06, BLACK, k * 0.06, 0.6, 0.34);
    });
    cube(g, 0.34, 0.34, 0.34, tm(0x8a5a32, 'shell'), 0, 0.38, -0.12);
    cube(g, 0.36, 0.22, 0.22, tm(0xc48a52, 'shell'), 0, 0.38, -0.12);
    cube(g, 0.24, 0.1, 0.24, tm(0x6e4428, 'shell'), 0, 0.6, -0.12);
    return finishAnimal(g, 'caracol');
  }

  function makeSpider() {
    const g = new THREE.Group();
    const red = 0xff3355;
    cube(g, 0.34, 0.26, 0.36, tm(0x2a2a2a, 'chitin'), 0, 0.3, -0.12);
    cube(g, 0.26, 0.2, 0.24, tm(0x3a3a3a, 'chitin'), 0, 0.28, 0.16);
    cube(g, 0.1, 0.02, 0.1, red, 0, 0.436, -0.12);
    S.forEach((k) => {
      cube(g, 0.05, 0.05, 0.04, red, k * 0.06, 0.32, 0.29);
      cube(g, 0.04, 0.04, 0.04, red, k * 0.1, 0.27, 0.29);
      for (let i = 0; i < 4; i++) {
        const leg = new THREE.Group();
        leg.position.set(0, 0.3, 0.05);
        leg.rotation.y = k * (i - 1.5) * 0.38;
        g.add(leg);
        const up = cube(leg, 0.24, 0.05, 0.05, 0x1a1a1a, k * 0.2, 0.06, 0);
        up.rotation.z = k * 0.6;
        const low = cube(leg, 0.05, 0.3, 0.05, 0x1a1a1a, k * 0.36, -0.04, 0);
        low.rotation.z = k * -0.2;
      }
    });
    return finishAnimal(g, 'arana');
  }

  function makeCrab() {
    const g = new THREE.Group();
    const R = 0xe24b3c, R2 = 0xc4372e, R3 = 0xff6a52;
    cube(g, 0.64, 0.22, 0.46, tm(R, 'shell'), 0, 0.24, 0);
    cube(g, 0.46, 0.1, 0.34, tm(R3, 'shell'), 0, 0.37, 0);
    S.forEach((k) => {
      cube(g, 0.05, 0.16, 0.05, 0x222222, k * 0.1, 0.5, 0.18);
      cube(g, 0.08, 0.08, 0.08, 0xffffff, k * 0.1, 0.62, 0.18);
      cube(g, 0.045, 0.045, 0.04, BLACK, k * 0.1, 0.62, 0.225);
      cube(g, 0.1, 0.1, 0.22, R2, k * 0.36, 0.3, 0.2);
      cube(g, 0.2, 0.16, 0.2, tm(R3, 'shell'), k * 0.42, 0.34, 0.4);
      cube(g, 0.07, 0.07, 0.16, R2, k * 0.48, 0.38, 0.54);
      cube(g, 0.07, 0.07, 0.16, R2, k * 0.36, 0.38, 0.54);
      for (let i = 0; i < 3; i++) {
        cube(g, 0.2, 0.06, 0.06, R2, k * 0.42, 0.2, -0.16 + i * 0.12);
        cube(g, 0.05, 0.16, 0.05, R2, k * 0.52, 0.1, -0.16 + i * 0.12);
      }
    });
    return finishAnimal(g, 'cangrejo');
  }

  function makeWorm() {
    const g = new THREE.Group();
    const cols = [0xf2a3b5, 0xe8899f, 0xf6c0cc, 0xd96b86, 0xf2a3b5, 0xe8899f];
    const segs = [];
    const base = [];
    for (let i = 0; i < 6; i++) {
      const s = 0.2 - i * 0.012;
      const x = Math.sin(i * 1.1) * 0.05;
      const m = cube(g, s, s * 0.85, 0.2, tm(cols[i], 'scale'), x, 0.1, 0.36 - i * 0.18);
      segs.push(m); base.push(x);
    }
    cube(g, 0.22, 0.17, 0.08, 0xc9657f, 0, 0.1, 0.18);
    S.forEach((k) => cube(g, 0.05, 0.05, 0.04, BLACK, k * 0.06, 0.15, 0.47));
    addAnim(g, { type: 'slither', segs, base, speed: 6, amp: 0.05 });
    return finishAnimal(g, 'gusano');
  }

  function makeOctopus() {
    const g = new THREE.Group();
    const PU = 0xb44fd8;
    cube(g, 0.52, 0.42, 0.52, tm(PU, 'scale'), 0, 0.62, 0);
    cube(g, 0.38, 0.16, 0.38, tm(0xc86ae8, 'scale'), 0, 0.9, -0.02);
    cube(g, 0.08, 0.03, 0.08, 0xf0a0ff, 0.1, 1.0, 0);
    cube(g, 0.08, 0.03, 0.08, 0xf0a0ff, -0.08, 0.99, -0.1);
    S.forEach((k) => {
      cube(g, 0.12, 0.15, 0.04, 0xffffff, k * 0.14, 0.64, 0.27);
      cube(g, 0.06, 0.1, 0.045, BLACK, k * 0.14, 0.64, 0.285);
    });
    for (let i = 0; i < 8; i++) {
      const a = i * Math.PI / 4;
      const dx = Math.sin(a), dz = Math.cos(a);
      const t = new THREE.Group();
      t.position.set(dx * 0.2, 0.44, dz * 0.2);
      g.add(t);
      cube(t, 0.12, 0.2, 0.12, tm(PU, 'scale'), dx * 0.03, -0.1, dz * 0.03);
      cube(t, 0.1, 0.16, 0.1, tm(0x9a3fc0, 'scale'), dx * 0.1, -0.26, dz * 0.1);
      cube(t, 0.08, 0.1, 0.08, tm(0xf0a0ff, 'scale'), dx * 0.17, -0.38, dz * 0.17);
      addAnim(g, { type: 'sway', obj: t, speed: 3, amp: 0.16, phase: i });
    }
    return finishAnimal(g, 'pulpo');
  }

  function makeJellyfish() {
    const g = new THREE.Group();
    const bellMat = mat(0x8fe8ff, { transparent: true, opacity: 0.72, emissive: 0x2a8fb0 });
    const bell = new THREE.Group();
    g.add(bell);
    cube(bell, 0.5, 0.1, 0.5, bellMat, 0, 0.5, 0);
    cube(bell, 0.42, 0.14, 0.42, bellMat, 0, 0.62, 0);
    cube(bell, 0.28, 0.12, 0.28, bellMat, 0, 0.74, 0);
    cube(bell, 0.18, 0.16, 0.18, basicMat(0xff9ee8), 0, 0.62, 0);
    const tmat = mat(0xff8ad8, { transparent: true, opacity: 0.8, emissive: 0x8a2a70 });
    for (let i = 0; i < 6; i++) {
      const a = i * Math.PI / 3;
      const t = new THREE.Group();
      t.position.set(Math.sin(a) * 0.16, 0.46, Math.cos(a) * 0.16);
      g.add(t);
      cube(t, 0.045, 0.3 + (i % 2) * 0.16, 0.045, tmat, 0, -0.16 - (i % 2) * 0.08, 0);
      addAnim(g, { type: 'sway', obj: t, speed: 2.4, amp: 0.2, phase: i * 1.3 });
    }
    addAnim(g, { type: 'pulse', obj: bell, speed: 3.2 });
    return finishAnimal(g, 'medusa');
  }

  function makeStarfish() {
    const g = new THREE.Group();
    const SA = 0xff7a45;
    cube(g, 0.26, 0.1, 0.26, tm(SA, 'scale'), 0, 0.07, 0);
    cube(g, 0.08, 0.03, 0.08, 0xffe0b0, 0, 0.13, 0);
    for (let i = 0; i < 5; i++) {
      const a = i * Math.PI * 2 / 5;
      const dx = Math.sin(a), dz = Math.cos(a);
      const arm = cube(g, 0.15, 0.08, 0.3, tm(SA, 'scale'), dx * 0.2, 0.06, dz * 0.2);
      arm.rotation.y = a;
      const tip = cube(g, 0.09, 0.07, 0.16, tm(0xe85a28, 'scale'), dx * 0.38, 0.05, dz * 0.38);
      tip.rotation.y = a;
      cube(g, 0.05, 0.03, 0.05, 0xffd0a0, dx * 0.2, 0.11, dz * 0.2);
    }
    return finishAnimal(g, 'estrella');
  }

  function makeLadybug() {
    const g = new THREE.Group();
    cube(g, 0.46, 0.18, 0.5, tm(0xe53935, 'shell'), 0, 0.18, -0.02);
    cube(g, 0.36, 0.1, 0.4, tm(0xe53935, 'shell'), 0, 0.3, -0.02);
    cube(g, 0.025, 0.02, 0.46, BLACK, 0, 0.356, -0.02);
    [[0.1, -0.12], [-0.1, -0.12], [0.1, 0.06], [-0.1, 0.06]].forEach(([x, z]) => cube(g, 0.08, 0.02, 0.08, BLACK, x, 0.36, z));
    cube(g, 0.26, 0.14, 0.14, BLACK, 0, 0.16, 0.3);
    S.forEach((k) => {
      cube(g, 0.02, 0.07, 0.07, BLACK, k * 0.235, 0.2, -0.1);
      cube(g, 0.06, 0.05, 0.03, 0xffffff, k * 0.07, 0.2, 0.375);
      cube(g, 0.02, 0.1, 0.02, BLACK, k * 0.06, 0.26, 0.4);
      [-0.15, 0, 0.15].forEach((z) => cube(g, 0.1, 0.05, 0.04, BLACK, k * 0.26, 0.05, z));
    });
    return finishAnimal(g, 'mariquita');
  }

  function makeDragonfly() {
    const g = new THREE.Group();
    const TL = 0x1ea7c9;
    cube(g, 0.14, 0.14, 0.2, tm(0x2a9d5c, 'chitin'), 0, 0.5, 0.1);
    cube(g, 0.14, 0.14, 0.14, tm(TL, 'chitin'), 0, 0.5, 0.28);
    for (let i = 0; i < 6; i++) cube(g, 0.075 - i * 0.004, 0.075 - i * 0.004, 0.13, tm(i % 2 ? TL : 0x0b4f66, 'chitin'), 0, 0.5, -0.06 - i * 0.12);
    const wmat = mat(0xcfefff, { transparent: true, opacity: 0.6 });
    S.forEach((k) => {
      cube(g, 0.1, 0.12, 0.1, 0x38e07a, k * 0.09, 0.52, 0.3);
      [[0.14, 0], [0.0, 1.6]].forEach(([z, ph]) => {
        const wing = new THREE.Group();
        wing.position.set(k * 0.06, 0.58, z + 0.02);
        g.add(wing);
        cube(wing, 0.5, 0.015, 0.13, wmat, k * 0.25, 0, 0);
        addAnim(g, { type: 'wing', obj: wing, side: k, speed: 26, phase: ph });
      });
    });
    return finishAnimal(g, 'libelula');
  }

  function makeScorpion() {
    const g = new THREE.Group();
    const SC = 0x9b6a2f, SC2 = 0x7a4f1f;
    cube(g, 0.34, 0.14, 0.44, tm(SC, 'chitin'), 0, 0.14, 0);
    cube(g, 0.24, 0.12, 0.2, tm(SC2, 'chitin'), 0, 0.15, 0.26);
    [[0.18, -0.28], [0.28, -0.4], [0.42, -0.44], [0.56, -0.38], [0.66, -0.26]].forEach(([y, z], i) => cube(g, 0.1 - i * 0.008, 0.1, 0.1, tm(SC, 'chitin'), 0, y, z));
    cube(g, 0.06, 0.1, 0.06, 0xd93a2b, 0, 0.68, -0.14);
    S.forEach((k) => {
      cube(g, 0.04, 0.04, 0.04, BLACK, k * 0.05, 0.22, 0.36);
      cube(g, 0.08, 0.08, 0.22, SC2, k * 0.18, 0.14, 0.42);
      cube(g, 0.16, 0.1, 0.2, tm(SC, 'chitin'), k * 0.24, 0.14, 0.58);
      cube(g, 0.05, 0.06, 0.14, SC2, k * 0.2, 0.14, 0.7);
      cube(g, 0.05, 0.06, 0.14, SC2, k * 0.3, 0.14, 0.7);
      for (let i = 0; i < 4; i++) cube(g, 0.2, 0.04, 0.04, SC2, k * 0.24, 0.08, -0.12 + i * 0.12);
    });
    return finishAnimal(g, 'escorpion');
  }

  const BUILDERS = {
    vaca: makeCow, conejo: makeRabbit, tortuga: makeTurtle, cerdo: makePig, rana: makeFrog,
    zorro: makeFox, pinguino: makePenguin, loro: makeParrot, pato: makeDuck, panda: makePanda, serpiente: makeSnake,
    mariposa: makeButterfly, caracol: makeSnail, arana: makeSpider, abeja: makeBee, cangrejo: makeCrab, gusano: makeWorm,
    pulpo: makeOctopus, medusa: makeJellyfish, estrella: makeStarfish, mariquita: makeLadybug, libelula: makeDragonfly,
    escorpion: makeScorpion
  };

  function animateAnimal(mesh, t) {
    const A = mesh.userData.anim;
    if (!A) return;
    for (let i = 0; i < A.length; i++) {
      const a = A[i];
      if (a.type === 'wing') {
        a.obj.rotation.z = a.side * (0.2 + Math.sin(t * a.speed + a.phase) * 0.75);
      } else if (a.type === 'sway') {
        a.obj.rotation.z = Math.sin(t * a.speed + a.phase) * a.amp;
        a.obj.rotation.x = Math.cos(t * a.speed * 0.9 + a.phase) * a.amp;
      } else if (a.type === 'slither') {
        for (let j = 0; j < a.segs.length; j++) a.segs[j].position.x = a.base[j] + Math.sin(t * a.speed - j * 0.8) * a.amp;
      } else if (a.type === 'pulse') {
        const s = Math.sin(t * a.speed);
        a.obj.scale.set(1 + 0.07 * s, 1 - 0.12 * s, 1 + 0.07 * s);
      }
    }
  }

  // =====================================================================
  //  PERSONAJE Y ENEMIGO
  // =====================================================================
  function limb(parent, x, y, z) {
    const p = new THREE.Group();
    p.position.set(x, y, z);
    parent.add(p);
    return p;
  }

  function makeHeroFace() {
    const map = canvasTex((g) => {
      g.fillStyle = '#ffb13a'; g.fillRect(0, 0, 64, 64);
      g.fillStyle = '#ffc766'; g.fillRect(0, 0, 64, 6);
      g.fillStyle = '#e8942a'; g.fillRect(0, 58, 64, 6);
      g.fillStyle = '#8a4a14'; g.fillRect(12, 14, 14, 4); g.fillRect(38, 14, 14, 4);
      g.fillStyle = '#fff'; g.fillRect(13, 20, 12, 14); g.fillRect(39, 20, 12, 14);
      g.fillStyle = '#1b1b1b'; g.fillRect(17, 24, 8, 10); g.fillRect(43, 24, 8, 10);
      g.fillStyle = '#fff'; g.fillRect(21, 25, 3, 3); g.fillRect(47, 25, 3, 3);
      g.fillStyle = '#ff8d7a'; g.fillRect(6, 38, 8, 5); g.fillRect(50, 38, 8, 5);
      g.fillStyle = '#7a2e14'; g.fillRect(22, 46, 20, 4); g.fillRect(18, 43, 4, 4); g.fillRect(42, 43, 4, 4);
      g.fillStyle = '#fff'; g.fillRect(26, 46, 12, 3);
    }, 64, 64);
    return new THREE.MeshBasicMaterial({ map });
  }

  function makeHero() {
    const g = new THREE.Group();
    const skin = tm(0xffb13a, 'fur');
    const shirt = tm(0x2ec4c9, 'cloth');
    const pants = tm(0x1e5fa8, 'cloth');
    const boot = tm(0x4a2e1a, 'fur');
    const legL = limb(g, -0.1, 0.34, 0);
    const legR = limb(g, 0.1, 0.34, 0);
    [legL, legR].forEach((l) => {
      cube(l, 0.16, 0.26, 0.16, pants, 0, -0.13, 0);
      cube(l, 0.18, 0.1, 0.25, boot, 0, -0.29, 0.03);
    });
    cube(g, 0.46, 0.42, 0.3, shirt, 0, 0.55, 0);
    cube(g, 0.48, 0.05, 0.32, 0xffffff, 0, 0.6, 0);
    cube(g, 0.48, 0.06, 0.32, 0x3a2a1a, 0, 0.37, 0);
    cube(g, 0.08, 0.06, 0.02, 0xffd23f, 0, 0.37, 0.165);
    const armL = limb(g, -0.3, 0.72, 0);
    const armR = limb(g, 0.3, 0.72, 0);
    [armL, armR].forEach((a) => {
      cube(a, 0.12, 0.34, 0.12, shirt, 0, -0.17, 0);
      cube(a, 0.13, 0.1, 0.13, skin, 0, -0.38, 0);
    });
    cube(g, 0.46, 0.1, 0.34, 0xe04058, 0, 0.78, 0);
    cube(g, 0.1, 0.24, 0.06, 0xe04058, 0.12, 0.66, -0.2);
    cube(g, 0.3, 0.34, 0.14, tm(0x8d3b2a, 'cloth'), 0, 0.58, -0.22);
    cube(g, 0.06, 0.3, 0.02, 0x5a2418, 0.12, 0.62, 0.16);
    cube(g, 0.06, 0.3, 0.02, 0x5a2418, -0.12, 0.62, 0.16);
    const headMats = [skin, skin, tm(0xffc766, 'fur'), skin, makeHeroFace(), skin];
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.4, 0.4), headMats);
    head.position.set(0, 0.98, 0);
    head.castShadow = true;
    g.add(head);
    S.forEach((k) => cube(g, 0.05, 0.12, 0.1, skin, k * 0.225, 0.98, 0));
    cube(g, 0.06, 0.14, 0.06, 0x4caf50, 0, 1.23, 0);
    cube(g, 0.14, 0.04, 0.08, 0x6fd45a, 0.06, 1.28, 0);
    const gun = new THREE.Group();
    cube(gun, 0.08, 0.1, 0.28, 0x4a4a4a, 0, 0.05, 0.16);
    cube(gun, 0.08, 0.14, 0.08, 0x2c2c2c, 0, -0.06, 0.02);
    cube(gun, 0.1, 0.1, 0.08, 0x222222, 0, 0.05, 0.3);
    cube(gun, 0.05, 0.05, 0.03, basicMat(0xffb040), 0, 0.05, 0.35);
    gun.position.set(0.32, 0.42, 0.18);
    g.add(gun);
    g.userData.limbs = { legL, legR, armL, armR };
    return g;
  }

  // Enemigo verde y cuadrado de cara triste (estilo creeper)
  const creeperFaceMat = new THREE.MeshLambertMaterial({
    map: canvasTex((g) => {
      const rnd = mulberry32(99);
      for (let y = 0; y < 8; y++) {
        for (let x = 0; x < 8; x++) {
          const v = rnd();
          g.fillStyle = v < 0.3 ? '#3a9a3c' : (v > 0.8 ? '#62d462' : '#4fbf4f');
          g.fillRect(x, y, 1, 1);
        }
      }
      g.fillStyle = '#0d0d0d';
      [[1, 2], [2, 2], [1, 3], [2, 3], [5, 2], [6, 2], [5, 3], [6, 3], [3, 4], [4, 4], [2, 5], [3, 5], [4, 5], [5, 5],
        [2, 6], [3, 6], [4, 6], [5, 6], [2, 7], [5, 7]].forEach(([x, y]) => g.fillRect(x, y, 1, 1));
    }, 8, 8)
  });

  function makeCreeper() {
    const g = new THREE.Group();
    const skin = tm(0x4fbf4f, 'camo');
    const skinD = tm(0x3a9a3c, 'camo');
    const fl = limb(g, -0.13, 0.3, 0.14);
    const fr = limb(g, 0.13, 0.3, 0.14);
    const bl = limb(g, -0.13, 0.3, -0.14);
    const br = limb(g, 0.13, 0.3, -0.14);
    [fl, fr, bl, br].forEach((l) => cube(l, 0.2, 0.3, 0.2, skinD, 0, -0.15, 0));
    cube(g, 0.4, 0.6, 0.26, skin, 0, 0.6, 0);
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.42, 0.42), [skin, skin, skin, skin, creeperFaceMat, skin]);
    head.position.set(0, 1.11, 0.02);
    head.castShadow = true;
    head.receiveShadow = true;
    g.add(head);
    const stars = new THREE.Group();
    for (let i = 0; i < 3; i++) {
      const s = makeStarSprite();
      const a = (i / 3) * Math.PI * 2;
      s.position.set(Math.cos(a) * 0.28, 0, Math.sin(a) * 0.18);
      stars.add(s);
    }
    stars.position.y = 1.62;
    stars.visible = false;
    g.add(stars);
    g.userData.stars = stars;
    g.userData.limbs = { legL: fl, legR: fr, armL: bl, armR: br, quad: true };
    g.userData.body = g;
    return g;
  }

  // =====================================================================
  //  AUDIO: música procedural + sonidos de bosque + efectos
  // =====================================================================
  const audio = { ctx: null, master: null, sfxBus: null, music: null, amb: null, enabled: true, nextTime: 0, step: 0, danger: 0, noiseBuf: null, melIdx: 3, mood: 1 };
  try { audio.enabled = localStorage.getItem(STORE_KEY + ':sound') !== '0'; } catch (err) { /* sin almacenamiento */ }

  const BPM = 100;
  const STEP_T = 60 / BPM / 4;
  const CHORDS = [
    { root: 36, tones: [60, 64, 67, 72] },
    { root: 33, tones: [57, 60, 64, 69] },
    { root: 29, tones: [53, 57, 60, 65] },
    { root: 31, tones: [55, 59, 62, 67] }
  ];
  const PENT = [60, 62, 64, 67, 69, 72, 74, 76];
  function mtof(n) { return 440 * Math.pow(2, (n - 69) / 12); }

  function ensureAudio() {
    if (audio.ctx) {
      if (audio.ctx.state === 'suspended') audio.ctx.resume();
      return audio.ctx;
    }
    try {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return null;
      const ctx = new Ctx();
      audio.ctx = ctx;
      audio.master = ctx.createGain();
      audio.master.gain.value = audio.enabled ? 0.9 : 0;
      audio.master.connect(ctx.destination);
      audio.sfxBus = ctx.createGain();
      audio.sfxBus.connect(audio.master);
      audio.music = ctx.createGain();
      audio.music.gain.value = 0.5;
      audio.music.connect(audio.master);
      const delay = ctx.createDelay(1);
      delay.delayTime.value = 0.3;
      const fb = ctx.createGain();
      fb.gain.value = 0.3;
      const lp = ctx.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.value = 2000;
      audio.music.connect(delay);
      delay.connect(lp);
      lp.connect(fb);
      fb.connect(delay);
      lp.connect(audio.master);
      audio.amb = ctx.createGain();
      audio.amb.connect(audio.master);
      const len = ctx.sampleRate * 2;
      const buf = ctx.createBuffer(1, len, ctx.sampleRate);
      const d = buf.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
      audio.noiseBuf = buf;
      audio.nextTime = ctx.currentTime + 0.2;
      setInterval(scheduleMusic, 50);
      startAmbience();
      return ctx;
    } catch (err) {
      return null;
    }
  }

  function tone(type, freq, t, dur, vol, dest, opts) {
    const ctx = audio.ctx;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    if (opts && opts.slideTo) o.frequency.exponentialRampToValueAtTime(opts.slideTo, t + dur);
    const a = (opts && opts.attack) || 0.008;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(Math.max(0.0002, vol), t + a);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g);
    let out = g;
    if (opts && opts.lp) {
      const f = ctx.createBiquadFilter();
      f.type = 'lowpass';
      f.frequency.value = opts.lp;
      g.connect(f);
      out = f;
    }
    if (opts && opts.pan !== undefined && ctx.createStereoPanner) {
      const p = ctx.createStereoPanner();
      p.pan.value = opts.pan;
      out.connect(p);
      out = p;
    }
    out.connect(dest);
    o.start(t);
    o.stop(t + dur + 0.05);
  }

  function noiseHit(t, dur, vol, hp, dest) {
    const ctx = audio.ctx;
    const src = ctx.createBufferSource();
    src.buffer = audio.noiseBuf;
    const f = ctx.createBiquadFilter();
    f.type = 'highpass';
    f.frequency.value = hp;
    const g = ctx.createGain();
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(f);
    f.connect(g);
    g.connect(dest);
    src.start(t, Math.random() * 1.5);
    src.stop(t + dur + 0.02);
  }

  function playStep(step, t) {
    const bar = Math.floor(step / 16);
    const s = step % 16;
    const chord = CHORDS[bar % 4];
    const high = (Math.floor(bar / 4) % 2) === 1;
    const d = audio.danger;
    // bajo
    if (s === 0 || s === 8 || (s === 6 && bar % 2 === 1)) {
      tone('triangle', mtof(chord.root), t, STEP_T * 6, 0.2, audio.music, { lp: 700 });
    }
    // arpegio
    if (s % 2 === 0) {
      const seq = [0, 1, 2, 3, 2, 1, 2, 3];
      const n = chord.tones[seq[(s / 2) % 8]] + (high ? 12 : 0);
      tone('triangle', mtof(n), t, STEP_T * 2.2, 0.055 + d * 0.025, audio.music, { lp: 2400 });
    }
    // melodía (caminata aleatoria por la pentatónica)
    const prob = (s % 4 === 0) ? 0.8 : (s % 2 === 0 ? 0.42 : 0.1);
    if (Math.random() < prob) {
      audio.melIdx = clamp(audio.melIdx + [-1, 0, 1, 2, -2][(Math.random() * 5) | 0], 0, PENT.length - 1);
      const note = PENT[audio.melIdx] + (high ? 0 : 0);
      tone('sine', mtof(note), t, STEP_T * (s % 4 === 0 ? 3.2 : 1.8), 0.07, audio.music, { attack: 0.02 });
      tone('triangle', mtof(note + 12), t, STEP_T * 1.2, 0.012, audio.music);
    }
    // colchón
    if (s === 0) {
      chord.tones.slice(0, 3).forEach((n, i) => {
        tone('sawtooth', mtof(n - 12) * (1 + i * 0.002), t, STEP_T * 15, 0.02, audio.music, { attack: 0.5, lp: 650 });
      });
    }
    // percusión suave (más presente cuando hay peligro)
    if (s === 0 || s === 8 || (d > 0.4 && (s === 6 || s === 14))) {
      tone('sine', 120, t, 0.14, 0.17 + d * 0.06, audio.music, { slideTo: 42 });
    }
    if (s === 4 || s === 12 || (d > 0.35 && s % 2 === 0)) {
      noiseHit(t, 0.05, 0.03 + d * 0.025, 7000, audio.music);
    }
  }

  function scheduleMusic() {
    const ctx = audio.ctx;
    if (!ctx || ctx.state !== 'running' || !audio.enabled) {
      if (ctx) audio.nextTime = Math.max(audio.nextTime, ctx.currentTime + 0.1);
      return;
    }
    if (audio.nextTime < ctx.currentTime - 0.4) audio.nextTime = ctx.currentTime + 0.1;
    while (audio.nextTime < ctx.currentTime + 0.3) {
      playStep(audio.step, audio.nextTime);
      audio.nextTime += STEP_T;
      audio.step++;
    }
  }

  function setMusicMood(m) {
    if (!audio.ctx || m === audio.mood) return;
    audio.mood = m;
    audio.music.gain.setTargetAtTime(m, audio.ctx.currentTime, 0.4);
  }

  // ---- Ambiente de bosque ----
  function startAmbience() {
    const ctx = audio.ctx;
    const src = ctx.createBufferSource();
    src.buffer = audio.noiseBuf;
    src.loop = true;
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = 420;
    bp.Q.value = 0.6;
    const g = ctx.createGain();
    g.gain.value = 0.05;
    const lfo = ctx.createOscillator();
    lfo.frequency.value = 0.08;
    const lg = ctx.createGain();
    lg.gain.value = 0.03;
    lfo.connect(lg);
    lg.connect(g.gain);
    const lfo2 = ctx.createOscillator();
    lfo2.frequency.value = 0.05;
    const l2 = ctx.createGain();
    l2.gain.value = 180;
    lfo2.connect(l2);
    l2.connect(bp.frequency);
    src.connect(bp);
    bp.connect(g);
    g.connect(audio.amb);
    src.start();
    lfo.start();
    lfo2.start();
    const loop = (fn, minMs, maxMs) => {
      const run = () => {
        if (audio.enabled && audio.ctx.state === 'running' && !document.hidden) fn();
        setTimeout(run, minMs + Math.random() * (maxMs - minMs));
      };
      setTimeout(run, minMs * Math.random() + 400);
    };
    loop(cricket, 700, 2200);
    loop(owl, 16000, 38000);
    loop(frogCroak, 6000, 15000);
    loop(birdSong, 5000, 13000);
  }

  function cricket() {
    const ctx = audio.ctx;
    const t0 = ctx.currentTime + 0.02;
    const f = 4000 + Math.random() * 700;
    const pan = Math.random() * 1.6 - 0.8;
    for (let i = 0; i < 4; i++) tone('sine', f, t0 + i * 0.075, 0.05, 0.011, audio.amb, { pan });
  }
  function owl() {
    const ctx = audio.ctx;
    const t0 = ctx.currentTime + 0.05;
    const pan = Math.random() * 1.2 - 0.6;
    tone('sine', 430, t0, 0.5, 0.06, audio.amb, { slideTo: 360, attack: 0.08, lp: 900, pan });
    tone('sine', 400, t0 + 0.7, 0.9, 0.06, audio.amb, { slideTo: 320, attack: 0.1, lp: 900, pan });
  }
  function frogCroak() {
    const ctx = audio.ctx;
    const t0 = ctx.currentTime + 0.05;
    const pan = Math.random() * 1.6 - 0.8;
    tone('square', 160, t0, 0.09, 0.02, audio.amb, { slideTo: 105, lp: 600, pan });
    tone('square', 150, t0 + 0.13, 0.11, 0.02, audio.amb, { slideTo: 95, lp: 600, pan });
  }
  function birdSong() {
    const ctx = audio.ctx;
    const t0 = ctx.currentTime + 0.05;
    const pan = Math.random() * 1.6 - 0.8;
    const n = 2 + ((Math.random() * 3) | 0);
    for (let i = 0; i < n; i++) {
      const f = 2300 + Math.random() * 900;
      tone('sine', f, t0 + i * 0.16, 0.12, 0.02, audio.amb, { slideTo: f * 1.35, pan });
    }
  }

  // ---- Efectos ----
  function beep(freq, dur, type, vol) {
    const ctx = ensureAudio();
    if (!ctx || !audio.enabled || ctx.state !== 'running') return;
    tone(type || 'square', freq, ctx.currentTime, dur, vol || 0.04, audio.sfxBus);
  }
  function sfxSeq(notes, step, type, vol) {
    const ctx = ensureAudio();
    if (!ctx || !audio.enabled || ctx.state !== 'running') return;
    notes.forEach((n, i) => tone(type || 'triangle', mtof(n), ctx.currentTime + i * step, step * 2.2, vol || 0.07, audio.sfxBus));
  }
  const sfx = {
    correct() { sfxSeq([72, 76, 79], 0.07, 'triangle', 0.08); },
    wrong() { beep(180, 0.2, 'sawtooth', 0.05); },
    fanfare() { sfxSeq([67, 72, 76, 79, 84], 0.1, 'triangle', 0.08); },
    hurt() { beep(90, 0.22, 'square', 0.06); },
    zap() {
      const ctx = ensureAudio();
      if (!ctx || !audio.enabled || ctx.state !== 'running') return;
      tone('sawtooth', 900, ctx.currentTime, 0.25, 0.05, audio.sfxBus, { slideTo: 200 });
    },
    whoosh() {
      const ctx = ensureAudio();
      if (!ctx || !audio.enabled || ctx.state !== 'running') return;
      noiseHit(ctx.currentTime, 0.35, 0.12, 900, audio.sfxBus);
      tone('sine', 300, ctx.currentTime, 0.3, 0.04, audio.sfxBus, { slideTo: 700 });
    },
    fall() {
      const ctx = ensureAudio();
      if (!ctx || !audio.enabled || ctx.state !== 'running') return;
      tone('triangle', 700, ctx.currentTime, 0.9, 0.06, audio.sfxBus, { slideTo: 60 });
    },
    step() {
      const ctx = ensureAudio();
      if (!ctx || !audio.enabled || ctx.state !== 'running') return;
      noiseHit(ctx.currentTime, 0.04, 0.025, 1800, audio.sfxBus);
    }
  };

  function toggleSound() {
    audio.enabled = !audio.enabled;
    try { localStorage.setItem(STORE_KEY + ':sound', audio.enabled ? '1' : '0'); } catch (err) { /* sin almacenamiento */ }
    const ctx = ensureAudio();
    if (ctx) audio.master.gain.setTargetAtTime(audio.enabled ? 0.9 : 0, ctx.currentTime, 0.05);
    return audio.enabled;
  }

  // =====================================================================
  //  BANCO DE PREGUNTAS: vertebrados e invertebrados
  //  q = pregunta, o = opciones, a = índice de la correcta, e = explicación
  // =====================================================================
  const QUESTIONS = [
    { q: '¿Qué tienen en común todos los animales vertebrados?', o: ['Tienen columna vertebral', 'Tienen alas', 'Viven en el agua', 'Ponen huevos'], a: 0, e: 'Los vertebrados tienen un esqueleto interno con columna vertebral.' },
    { q: '¿Cuál de estos animales es invertebrado?', o: ['Rana', 'Pulpo', 'Tortuga', 'Conejo'], a: 1, e: 'El pulpo no tiene columna vertebral: es un molusco.' },
    { q: '¿Qué grupo de vertebrados tiene el cuerpo cubierto de plumas?', o: ['Reptiles', 'Anfibios', 'Aves', 'Peces'], a: 2, e: 'Las aves son los únicos animales con plumas.' },
    { q: '¿Cuántas patas tiene un insecto?', o: ['Cuatro', 'Seis', 'Ocho', 'Diez'], a: 1, e: 'Los insectos tienen seis patas.' },
    { q: '¿Cuántas patas tiene una araña?', o: ['Seis', 'Cuatro', 'Ocho', 'Doce'], a: 2, e: 'Las arañas son arácnidos y tienen ocho patas.' },
    { q: '¿A qué grupo pertenece la mariposa?', o: ['Vertebrados', 'Invertebrados', 'Mamíferos', 'Reptiles'], a: 1, e: 'La mariposa es un insecto, un invertebrado.' },
    { q: '¿Cuál de estos animales NO es vertebrado?', o: ['Cangrejo', 'Pato', 'Zorro', 'Serpiente'], a: 0, e: 'El cangrejo es un crustáceo, un invertebrado.' },
    { q: '¿Qué tipo de animal es la tortuga?', o: ['Anfibio', 'Mamífero', 'Reptil', 'Ave'], a: 2, e: 'La tortuga es un reptil: tiene la piel con escamas y caparazón.' },
    { q: '¿Cómo respiran los peces?', o: ['Con pulmones', 'Con branquias', 'Por la piel y la boca', 'No respiran'], a: 1, e: 'Los peces toman el oxígeno del agua con las branquias.' },
    { q: 'Los caracoles pertenecen al grupo de los…', o: ['Insectos', 'Moluscos', 'Reptiles', 'Crustáceos'], a: 1, e: 'Los caracoles son moluscos, igual que los pulpos.' },
    { q: '¿Qué es un animal invertebrado?', o: ['Un animal sin columna vertebral', 'Un animal sin patas', 'Un animal que no come', 'Un animal sin ojos'], a: 0, e: 'Invertebrado significa que no tiene columna vertebral.' },
    { q: '¿Cuál es el único mamífero capaz de volar de verdad?', o: ['La ardilla voladora', 'El murciélago', 'El colibrí', 'El pingüino'], a: 1, e: 'El murciélago es el único mamífero que vuela con alas.' },
    { q: '¿Cuál de estos animales es un molusco?', o: ['Libélula', 'Escorpión', 'Pulpo', 'Abeja'], a: 2, e: 'El pulpo es un molusco con ocho brazos.' },
    { q: 'La medusa pertenece a los invertebrados llamados…', o: ['Cnidarios', 'Insectos', 'Anélidos', 'Arácnidos'], a: 0, e: 'Las medusas son cnidarios y tienen células urticantes.' },
    { q: 'La estrella de mar es un invertebrado del grupo de los…', o: ['Moluscos', 'Equinodermos', 'Crustáceos', 'Insectos'], a: 1, e: 'Las estrellas de mar son equinodermos.' },
    { q: '¿Qué significa que un cangrejo tiene exoesqueleto?', o: ['Tiene huesos por dentro', 'Tiene una armadura dura por fuera', 'No tiene esqueleto', 'Tiene el esqueleto blando'], a: 1, e: 'El exoesqueleto es un esqueleto externo que protege el cuerpo.' },
    { q: '¿Qué animales amamantan a sus crías?', o: ['Los reptiles', 'Las aves', 'Los mamíferos', 'Los peces'], a: 2, e: 'Los mamíferos alimentan a sus crías con leche materna.' },
    { q: '¿Cuál es el grupo de animales con más especies del mundo?', o: ['Los mamíferos', 'Las aves', 'Los peces', 'Los insectos'], a: 3, e: 'Los insectos, que son invertebrados, tienen más especies que cualquier otro grupo.' },
    { q: '¿Cuántas patas tiene un cangrejo?', o: ['Seis', 'Ocho', 'Diez', 'Cuatro'], a: 2, e: 'El cangrejo tiene diez patas, incluidas las pinzas.' },
    { q: 'Los reptiles tienen la piel cubierta de…', o: ['Plumas', 'Pelo', 'Escamas', 'Mucosidad'], a: 2, e: 'Los reptiles, como la serpiente, tienen escamas.' },
    { q: '¿Cuál de estos animales es un anfibio?', o: ['Rana', 'Serpiente', 'Pato', 'Zorro'], a: 0, e: 'La rana es un anfibio: vive en el agua y en la tierra.' },
    { q: 'Una abeja es un…', o: ['Reptil', 'Arácnido', 'Insecto', 'Molusco'], a: 2, e: 'La abeja es un insecto con seis patas y alas.' },
    { q: '¿En qué tres partes se divide el cuerpo de un insecto?', o: ['Cabeza, tórax y abdomen', 'Cabeza, cola y patas', 'Cabeza y cuerpo', 'Tórax, alas y cola'], a: 0, e: 'El cuerpo de un insecto tiene cabeza, tórax y abdomen.' },
    { q: 'La lombriz de tierra pertenece al grupo de los…', o: ['Moluscos', 'Anélidos', 'Insectos', 'Equinodermos'], a: 1, e: 'Las lombrices son anélidos: gusanos con el cuerpo en anillos.' },
    { q: '¿Qué animal vertebrado nace como renacuajo?', o: ['La rana', 'El pez', 'El pato', 'La serpiente'], a: 0, e: 'La rana cambia de renacuajo a adulto: se llama metamorfosis.' },
    { q: 'Los mamíferos tienen el cuerpo cubierto de…', o: ['Plumas', 'Escamas', 'Pelo', 'Caparazón'], a: 2, e: 'Casi todos los mamíferos tienen pelo.' },
    { q: '¿Cuál de estos animales es un reptil?', o: ['Panda', 'Loro', 'Serpiente', 'Rana'], a: 2, e: 'La serpiente es un reptil.' },
    { q: '¿Cuál de estos animales NO tiene columna vertebral?', o: ['Mariposa', 'Loro', 'Panda', 'Pingüino'], a: 0, e: 'La mariposa es un insecto, un invertebrado.' },
    { q: 'El pingüino es un…', o: ['Mamífero', 'Pez', 'Ave', 'Reptil'], a: 2, e: 'El pingüino es un ave que no vuela, pero nada muy bien.' },
    { q: '¿Cuántos brazos tiene un pulpo?', o: ['Seis', 'Ocho', 'Diez', 'Cuatro'], a: 1, e: 'El pulpo tiene ocho brazos.' },
    { q: '¿Cuál de estos animales es un pez?', o: ['Delfín', 'Ballena', 'Pez payaso', 'Pulpo'], a: 2, e: 'El pez payaso es un pez. El delfín y la ballena son mamíferos.' },
    { q: '¿Cuántas alas tiene una libélula?', o: ['Dos', 'Cuatro', 'Seis', 'Ocho'], a: 1, e: 'La libélula tiene cuatro alas transparentes.' },
    { q: '¿Para qué usan las aletas los peces?', o: ['Para nadar y mantener el equilibrio', 'Para volar', 'Para respirar', 'Para comer'], a: 0, e: 'Las aletas ayudan a los peces a moverse y a mantener el equilibrio.' },
    { q: '¿Cuál de estos animales es un invertebrado marino con forma de estrella?', o: ['Medusa', 'Estrella de mar', 'Pulpo', 'Cangrejo'], a: 1, e: 'La estrella de mar es un equinodermo con brazos en forma de estrella.' },
    { q: 'La mariquita es un…', o: ['Insecto', 'Arácnido', 'Molusco', 'Reptil'], a: 0, e: 'La mariquita es un escarabajo pequeño: un insecto.' },
    { q: 'Los animales que mantienen su temperatura corporal constante son…', o: ['Los reptiles y los peces', 'Las aves y los mamíferos', 'Los insectos y las arañas', 'Los anfibios y los moluscos'], a: 1, e: 'Las aves y los mamíferos son de sangre caliente.' },
    { q: 'El escorpión es un…', o: ['Insecto', 'Arácnido', 'Crustáceo', 'Reptil'], a: 1, e: 'El escorpión es un arácnido, como la araña.' },
    { q: 'A los animales que nacen de un huevo se les llama…', o: ['Vivíparos', 'Ovíparos', 'Herbívoros', 'Carnívoros'], a: 1, e: 'Los ovíparos nacen de huevos, como las aves y los reptiles.' },
    { q: '¿A qué grupo pertenecen el zorro y el panda?', o: ['Reptiles', 'Aves', 'Mamíferos', 'Anfibios'], a: 2, e: 'El zorro y el panda son mamíferos.' },
    { q: 'El loro es un…', o: ['Mamífero', 'Ave', 'Reptil', 'Insecto'], a: 1, e: 'El loro es un ave: tiene plumas y pico.' },
    { q: 'La tortuga marina vive en el mar, pero ¿cómo respira?', o: ['Con branquias', 'Con pulmones', 'Por la piel', 'No respira'], a: 1, e: 'Las tortugas son reptiles: respiran aire con pulmones y salen a la superficie.' },
    { q: '¿En cuántos grandes grupos se dividen los vertebrados?', o: ['Dos', 'Tres', 'Cinco', 'Siete'], a: 2, e: 'Peces, anfibios, reptiles, aves y mamíferos: cinco grupos.' },
    { q: '¿Cuál de estos animales es un crustáceo?', o: ['Cangrejo', 'Caracol', 'Araña', 'Gusano'], a: 0, e: 'El cangrejo es un crustáceo con exoesqueleto y pinzas.' },
    { q: '¿Qué animal tiene el cuerpo blando y lleva una concha en la espalda?', o: ['La araña', 'El caracol', 'La abeja', 'El escorpión'], a: 1, e: 'El caracol es un molusco con concha.' },
    { q: 'Una serpiente se mueve…', o: ['Con cuatro patas', 'Reptando, sin patas', 'Volando', 'Saltando'], a: 1, e: 'Las serpientes son reptiles sin patas que reptan.' },
    { q: '¿Qué ave pone huevos y nada, pero NO puede volar?', o: ['El loro', 'El pato', 'El pingüino', 'El colibrí'], a: 2, e: 'El pingüino es un ave nadadora que no vuela.' }
  ];

  // =====================================================================
  //  ESTADO DEL JUEGO
  // =====================================================================
  const playerMesh = makeHero();
  scene.add(playerMesh);

  const keys = {};
  const buttons = { left: false, right: false, up: false, down: false, jump: false, grab: false, shoot: false, seize: false, rotL: false, rotR: false };
  let prevGrab = false;
  let prevSeize = false;
  const latch = { grab: false, seize: false };   // toques rápidos que no se deben perder
  let toastUntil = 0;

  const player = { pos: new THREE.Vector3(), vel: new THREE.Vector3(), facing: 0, radius: 0.28, height: 1.15, grounded: false, knockT: 0, iframe: 0, stepT: 0 };

  let solids = [];
  let solidGrid = new Map();
  let cells = new Map();
  let baskets = [];
  let animals = [];
  let enemies = [];
  let bullets = [];
  let particles = [];
  let signs = [];
  let held = null;
  let heldEnemy = null;
  let level = 0;
  let score = 0;
  let lives = 3;
  let timeLeft = ROUND_TIME;
  let state = 'menu';
  let introT = 0;
  let goalTotal = 0;
  let shootCd = 0;
  let shake = 0;
  let curTheme = -1;
  let runCommitted = false;
  const spawn = new THREE.Vector3();
  const camLook = new THREE.Vector3();
  const camPos = new THREE.Vector3().copy(camera.position);
  let enemySpawns = [];

  const toastEl = document.getElementById('toast');
  function toast(msg) {
    toastEl.textContent = msg;
    toastEl.classList.remove('show');
    void toastEl.offsetWidth;
    toastEl.classList.add('show');
    toastUntil = performance.now() + 2800;
  }

  // =====================================================================
  //  SÓLIDOS Y FÍSICAS (con rejilla espacial: rápido incluso en mapas grandes)
  // =====================================================================
  function gridKey(ix, iz) { return (ix + 512) * 1024 + (iz + 512); }
  function addSolid(s) {
    solids.push(s);
    const ix = Math.round((s.minX + s.maxX) / 2);
    const iz = Math.round((s.minZ + s.maxZ) / 2);
    const k = gridKey(ix, iz);
    let arr = solidGrid.get(k);
    if (!arr) { arr = []; solidGrid.set(k, arr); }
    arr.push(s);
  }
  const _near = [];
  function nearSolids(x, z) {
    _near.length = 0;
    const ix = Math.round(x);
    const iz = Math.round(z);
    for (let dx = -1; dx <= 1; dx++) {
      for (let dz = -1; dz <= 1; dz++) {
        const arr = solidGrid.get(gridKey(ix + dx, iz + dz));
        if (arr) for (let i = 0; i < arr.length; i++) _near.push(arr[i]);
      }
    }
    return _near;
  }

  function circleRect(x, z, radius, s) {
    const cx = clamp(x, s.minX, s.maxX);
    const cz = clamp(z, s.minZ, s.maxZ);
    const dx = x - cx;
    const dz = z - cz;
    return dx * dx + dz * dz < radius * radius;
  }

  function groundAt(x, z, radius, feetY) {
    let best = -100;
    const list = nearSolids(x, z);
    for (let i = 0; i < list.length; i++) {
      const s = list[i];
      if (s.maxY > feetY + STEP) continue;
      if (!circleRect(x, z, radius, s)) continue;
      if (s.maxY > best) best = s.maxY;
    }
    return best;
  }

  function pushOut(ent) {
    for (let n = 0; n < 3; n++) {
      const list = nearSolids(ent.pos.x, ent.pos.z);
      for (let i = 0; i < list.length; i++) {
        const s = list[i];
        const feet = ent.pos.y;
        const head = ent.pos.y + ent.height;
        if (feet >= s.maxY - 0.04) continue;
        if (head <= s.minY + 0.04) continue;
        const cx = clamp(ent.pos.x, s.minX, s.maxX);
        const cz = clamp(ent.pos.z, s.minZ, s.maxZ);
        const dx = ent.pos.x - cx;
        const dz = ent.pos.z - cz;
        const d2 = dx * dx + dz * dz;
        if (d2 >= ent.radius * ent.radius) continue;
        if (d2 > 1e-8) {
          const d = Math.sqrt(d2);
          const pen = ent.radius - d;
          ent.pos.x += (dx / d) * pen;
          ent.pos.z += (dz / d) * pen;
        } else {
          const left = ent.pos.x - s.minX;
          const right = s.maxX - ent.pos.x;
          const back = ent.pos.z - s.minZ;
          const front = s.maxZ - ent.pos.z;
          const m = Math.min(left, right, back, front);
          if (m === left) ent.pos.x = s.minX - ent.radius;
          else if (m === right) ent.pos.x = s.maxX + ent.radius;
          else if (m === back) ent.pos.z = s.minZ - ent.radius;
          else ent.pos.z = s.maxZ + ent.radius;
        }
      }
    }
  }

  function moveBody(ent, dt) {
    ent.vel.y -= GRAVITY * dt;
    ent.pos.x += ent.vel.x * dt;
    ent.pos.z += ent.vel.z * dt;
    pushOut(ent);
    ent.pos.y += ent.vel.y * dt;
    const g = groundAt(ent.pos.x, ent.pos.z, ent.radius, ent.pos.y);
    if (ent.vel.y <= 0 && ent.pos.y <= g) {
      ent.pos.y = g;
      ent.vel.y = 0;
      ent.grounded = true;
    } else {
      ent.grounded = false;
    }
  }

  // El jugador y los enemigos no se pueden atravesar entre sí
  function resolveBodies() {
    const list = [player];
    for (const e of enemies) {
      if (e.state === 'out' || e.state === 'held') continue;
      if (e.state === 'thrown' && e.thrownT < 0.35) continue;
      list.push(e);
    }
    for (let pass = 0; pass < 3; pass++) {
      for (let i = 0; i < list.length; i++) {
        for (let j = i + 1; j < list.length; j++) {
          const a = list[i];
          const b = list[j];
          if (a.pos.y >= b.pos.y + b.height || b.pos.y >= a.pos.y + a.height) continue;
          let dx = b.pos.x - a.pos.x;
          let dz = b.pos.z - a.pos.z;
          let d = Math.hypot(dx, dz);
          const min = a.radius + b.radius;
          if (d >= min) continue;
          if (d < 1e-5) { dx = 1; dz = 0; d = 1; }
          const push = (min - d) / 2;
          const nx = dx / d;
          const nz = dz / d;
          a.pos.x -= nx * push;
          a.pos.z -= nz * push;
          b.pos.x += nx * push;
          b.pos.z += nz * push;
        }
      }
      list.forEach(pushOut);
    }
  }

  // =====================================================================
  //  MUNDO
  // =====================================================================
  function disposeWorld() {
    world.traverse((o) => {
      if (o.geometry) o.geometry.dispose();
      const list = [].concat(o.material || []);
      list.forEach((m) => {
        if (m && m.userData && m.userData.unique) {
          if (m.map) m.map.dispose();
          m.dispose();
        }
      });
      if (o.userData && o.userData.uniqueMap) o.userData.uniqueMap.dispose();
    });
    world.clear();
    animals.forEach(disposeAnimal);
    animals = [];
    enemies.forEach((e) => {
      if (e.mesh.parent) e.mesh.parent.remove(e.mesh);
      e.mesh.traverse((o) => {
        if (o.geometry) o.geometry.dispose();
        if (o.userData && o.userData.uniqueMap) o.userData.uniqueMap.dispose();
      });
    });
    enemies = [];
    bullets.forEach((b) => scene.remove(b.mesh));
    bullets = [];
    particles.forEach((p) => scene.remove(p.mesh));
    particles = [];
    signs = [];
    held = null;
    heldEnemy = null;
    solids = [];
    solidGrid = new Map();
    baskets = [];
    cells = new Map();
  }

  function disposeAnimal(a) {
    if (!a || !a.mesh) return;
    if (a.mesh.parent) a.mesh.parent.remove(a.mesh);
    a.mesh.traverse((o) => {
      if (o.geometry) o.geometry.dispose();
      if (o.userData && o.userData.uniqueMap) o.userData.uniqueMap.dispose();
    });
  }

  function addSandBox(mTop, mSand, x, z, y0, y1, size, hex) {
    const h = size / 2;
    const x0 = x - h, x1 = x + h, z0 = z - h, z1 = z + h;
    meshTop(mSand, x0, z0, x1, z1, y1, hex);
    ['px', 'nx', 'pz', 'nz'].forEach((d) => meshSide(mSand, d, x0, z0, x1, z1, y0, y1, hex));
    addSolid({ minX: x0, maxX: x1, minY: y0, maxY: y1, minZ: z0, maxZ: z1 });
  }

  function buildMap(levelIndex) {
    const th = themeFor(levelIndex);
    const rand = mulberry32(42 + levelIndex * 97);
    const radius = 15 + levelIndex * 1.15;
    const X = Math.ceil(radius * 1.25) + 2;
    const Z = Math.ceil(radius * 0.78 * 1.25) + 2;
    cells = new Map();

    for (let x = -X; x <= X; x++) {
      for (let z = -Z; z <= Z; z++) {
        const nx = x / radius;
        const nz = z / (radius * 0.78);
        let v = nx * nx + nz * nz;
        v += 0.14 * Math.sin(x * 0.8 + levelIndex) + 0.1 * Math.cos(z * 0.95) + 0.06 * Math.sin(x * 0.3 + z * 0.4 + levelIndex);
        if (Math.abs(z) < 1.4 && Math.abs(x) < radius + 1.9) v *= 0.84;
        if (v < 1) cells.set(x + ',' + z, { x, z, h: 2, kind: 'grass' });
      }
    }

    cells.forEach((c) => {
      if (c.kind !== 'grass') return;
      let border = false;
      [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([dx, dz]) => {
        if (!cells.has((c.x + dx) + ',' + (c.z + dz))) border = true;
      });
      c.border = border;
      if (border && rand() < 0.22) c.h = 3;
      const far = Math.abs(c.x) + Math.abs(c.z) > 3;
      const r = rand();
      if (!border && r < 0.09 && far) c.yellow = true;
      else if (r < 0.18 && far) c.deco = rand() < 0.5 ? 'tree' : 'pine';
      else if (r < 0.23) c.deco = 'mush';
      else if (r < 0.32) c.deco = 'flower';
      else if (r < 0.35) c.deco = 'rock';
      else if (border && r < 0.39) c.deco = 'lantern';
      c.tuft = rand() < 0.45;
    });

    const candidates = [...cells.values()].filter((c) => c.kind === 'grass' && c.z > -1 && c.z < 4 && c.h === 2);
    candidates.sort((a, b) => a.x - b.x);
    const left = candidates[1] || candidates[0];
    const right = candidates[candidates.length - 2] || candidates[candidates.length - 1];
    [left, right].forEach((c) => { if (c) { c.yellow = false; c.deco = null; c.tuft = false; c.h = 2; } });
    if (left) left.kind = 'padL';
    if (right) right.kind = 'padR';

    let front = null;
    cells.forEach((c) => {
      if (c.kind !== 'grass' || Math.abs(c.x) > 1) return;
      if (!front || c.z > front.z) front = c;
    });
    const sx = front ? front.x : 0;
    const sz = front ? front.z + 1 : 6;
    cells.set(sx + ',' + sz, { x: sx, z: sz, h: 2, kind: 'blue' });
    spawn.set(sx, 2, sz);

    // ---------- terreno: 3 mallas en total ----------
    const mTop = newMesher();
    const mSide = newMesher();
    const mSand = newMesher();
    cells.forEach((c) => {
      let top = th.grass[Math.abs(c.x * 3 + c.z * 5) % th.grass.length];
      const side = th.dirt[Math.abs(c.x * 2 + c.z) % th.dirt.length];
      if (c.kind === 'blue') top = 0x3ad0d8;
      if (c.kind === 'padL') top = 0x2f6fe0;
      if (c.kind === 'padR') top = 0xf07820;
      const x0 = c.x - 0.5, x1 = c.x + 0.5, z0 = c.z - 0.5, z1 = c.z + 0.5;
      meshTop(mTop, x0, z0, x1, z1, c.h, top);
      [['px', 1, 0], ['nx', -1, 0], ['pz', 0, 1], ['nz', 0, -1]].forEach(([dir, dx, dz]) => {
        const n = cells.get((c.x + dx) + ',' + (c.z + dz));
        const hN = n ? n.h : 0;
        if (c.h > hN) meshSide(mSide, dir, x0, z0, x1, z1, hN, c.h, side);
      });
      addSolid({ minX: x0, maxX: x1, minY: 0, maxY: c.h, minZ: z0, maxZ: z1 });
      if (c.yellow) addSandBox(mTop, mSand, c.x, c.z, c.h, c.h + 0.92, 0.92, 0xf0d34a);
    });

    // bloques flotantes alrededor de la isla
    const OX = X + 8, OZ = Z + 8, GH = OZ * 2 + 1;
    const occ = new Uint8Array((OX * 2 + 1) * GH);
    cells.forEach((c) => { occ[(c.x + OX) * GH + (c.z + OZ)] = 1; });
    const isCell = (x, z) => x >= -OX && x <= OX && z >= -OZ && z <= OZ && occ[(x + OX) * GH + (z + OZ)] === 1;
    for (let x = -(X + 5); x <= X + 5; x++) {
      for (let z = -(Z + 5); z <= Z + 5; z++) {
        if (isCell(x, z)) continue;
        if (rand() > 0.17 + levelIndex * 0.012) continue;
        let near = 99;
        for (let dx = -6; dx <= 6; dx++) {
          for (let dz = -6; dz <= 6; dz++) {
            if (isCell(x + dx, z + dz)) { const d = Math.hypot(dx, dz); if (d < near) near = d; }
          }
        }
        if (near < 2 || near > 5.5) continue;
        const roll = rand();
        const top = roll < 0.5 ? 2 : (roll < 0.78 ? 3.05 : 4.2);
        if (rand() < 0.4) {
          addSandBox(mTop, mSand, x, z, top - 1, top, 1, 0xf0d34a);
        } else {
          const gcol = th.grass[Math.abs(x * 3 + z * 5) % th.grass.length];
          const dcol = th.dirt[Math.abs(x * 2 + z) % th.dirt.length];
          meshTop(mTop, x - 0.5, z - 0.5, x + 0.5, z + 0.5, top, gcol);
          ['px', 'nx', 'pz', 'nz'].forEach((d) => meshSide(mSide, d, x - 0.5, z - 0.5, x + 0.5, z + 0.5, top - 1, top, dcol));
          addSolid({ minX: x - 0.5, maxX: x + 0.5, minY: top - 1, maxY: top, minZ: z - 0.5, maxZ: z + 0.5 });
        }
      }
    }
    buildMesher(mTop, MAT_TOP, world);
    buildMesher(mSide, MAT_SIDE, world);
    buildMesher(mSand, MAT_SAND, world);

    // ---------- decoración (todo mezclado por material) ----------
    const deco = new Batch();
    const bark = tm(0x7a4e2a, 'bark');
    const leafMats = th.leaf.map((h) => tm(h, 'leaf'));
    const stone = tm(0x8a8f98, 'stone');
    const stoneD = tm(0x6c7078, 'stone');
    const blades = [tm(0x2f9a3c, 'fur'), tm(0x43b84f, 'fur')];
    const stem = tm(0x2f8a3a, 'fur');
    const mushStem = tm(0xf2ead6, 'fur');
    const glowM = basicMat(th.glow);
    const lampM = basicMat(0xffc070);
    const flowerCols = [0xff6fa8, 0xffd23f, 0xffffff, 0xb48cff, 0xff8a3d];
    let mushCount = 0;
    cells.forEach((c) => {
      const ox = (rand() - 0.5) * 0.4;
      const oz = (rand() - 0.5) * 0.4;
      const x = c.x + ox;
      const z = c.z + oz;
      const y = c.h;
      if (c.tuft) {
        for (let i = 0; i < 3; i++) {
          deco.box(0.05, 0.16 + rand() * 0.14, 0.05, c.x + (rand() - 0.5) * 0.8, y + 0.1, c.z + (rand() - 0.5) * 0.8, blades[i % 2], rand() * 3);
        }
      }
      if (!c.deco) return;
      const lm = leafMats[(rand() * leafMats.length) | 0];
      const s = 0.85 + rand() * 0.4;
      if (c.deco === 'tree') {
        deco.box(0.26 * s, 0.55 * s, 0.26 * s, x, y + 0.275 * s, z, bark);
        deco.box(1.0 * s, 0.5 * s, 1.0 * s, x, y + 0.8 * s, z, lm, rand() * 1.5);
        deco.box(0.76 * s, 0.42 * s, 0.76 * s, x, y + 1.2 * s, z, lm, rand() * 1.5);
        deco.box(0.5 * s, 0.34 * s, 0.5 * s, x, y + 1.52 * s, z, lm, rand() * 1.5);
      } else if (c.deco === 'pine') {
        deco.box(0.2 * s, 0.4 * s, 0.2 * s, x, y + 0.2 * s, z, bark);
        [[0.95, 0.55], [0.74, 0.85], [0.54, 1.15], [0.32, 1.45]].forEach(([w, yy]) => deco.box(w * s, 0.3 * s, w * s, x, y + yy * s, z, lm, rand() * 1.5));
      } else if (c.deco === 'mush') {
        deco.box(0.1, 0.18, 0.1, x, y + 0.09, z, mushStem);
        deco.box(0.3, 0.1, 0.3, x, y + 0.23, z, glowM);
        deco.box(0.06, 0.04, 0.06, x + 0.06, y + 0.29, z, basicMat(0xffffff));
        if (mushCount < 40) {
          mushCount++;
          const sp = glowSprite(th.glow, 1.3, 0.8);
          sp.position.set(x, y + 0.3, z);
          world.add(sp);
        }
      } else if (c.deco === 'flower') {
        const fc = tm(flowerCols[(rand() * flowerCols.length) | 0], 'fur');
        deco.box(0.04, 0.26, 0.04, x, y + 0.13, z, stem);
        deco.box(0.16, 0.1, 0.16, x, y + 0.3, z, fc);
        deco.box(0.07, 0.05, 0.07, x, y + 0.36, z, basicMat(0xffe14a));
      } else if (c.deco === 'rock') {
        deco.box(0.42, 0.22, 0.34, x, y + 0.11, z, stone, rand() * 3);
        deco.box(0.24, 0.16, 0.22, x + 0.2, y + 0.08, z + 0.1, stoneD, rand() * 3);
      } else if (c.deco === 'lantern') {
        deco.box(0.1, 0.9, 0.1, x, y + 0.45, z, bark);
        deco.box(0.22, 0.22, 0.22, x, y + 0.98, z, lampM);
        deco.box(0.3, 0.05, 0.3, x, y + 1.12, z, bark);
        const sp = glowSprite(0xffc070, 2.2, 0.9);
        sp.position.set(x, y + 0.98, z);
        world.add(sp);
      }
    });
    deco.build(world);

    // ---------- corrales compactos con letrero de neón ----------
    function placeBasket(cell, vertebrate) {
      if (!cell) return;
      const color = vertebrate ? 0x2f6fe0 : 0xf07820;
      const neon = vertebrate ? 0x5aa9ff : 0xffa23c;
      const y = cell.h;
      const S2 = 1.5;
      const wall = S2 / 2 - 0.05;
      const pen = new THREE.Group();
      const tube = basicMat(neon);
      cube(pen, S2, 0.1, S2, tm(0x151b27, 'stone'), 0, 0.05, 0);
      const padMat = new THREE.MeshBasicMaterial({ color: neon, transparent: true, opacity: 0.3, depthWrite: false, blending: THREE.AdditiveBlending });
      padMat.userData.unique = true;
      const pad = new THREE.Mesh(new THREE.PlaneGeometry(S2 - 0.3, S2 - 0.3), padMat);
      pad.rotation.x = -Math.PI / 2;
      pad.position.y = 0.105;
      pen.add(pad);
      cube(pen, S2, 0.28, 0.1, color, 0, 0.24, -wall);
      cube(pen, S2, 0.28, 0.1, color, 0, 0.24, wall);
      cube(pen, 0.1, 0.28, S2 - 0.2, color, -wall, 0.24, 0);
      cube(pen, 0.1, 0.28, S2 - 0.2, color, wall, 0.24, 0);
      cube(pen, S2, 0.05, 0.06, tube, 0, 0.41, -wall);
      cube(pen, S2, 0.05, 0.06, tube, 0, 0.41, wall);
      cube(pen, 0.06, 0.05, S2 - 0.2, tube, -wall, 0.41, 0);
      cube(pen, 0.06, 0.05, S2 - 0.2, tube, wall, 0.41, 0);
      [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([sx2, sz2]) => {
        cube(pen, 0.14, 0.52, 0.14, tm(0x232c3d, 'stone'), sx2 * wall, 0.36, sz2 * wall);
        cube(pen, 0.17, 0.1, 0.17, tube, sx2 * wall, 0.66, sz2 * wall);
      });
      const sign = makeNeonSign(vertebrate ? 'VERTEBRADOS' : 'INVERTEBRADOS', neon);
      sign.position.set(0, 1.4, 0);
      pen.add(sign);
      signs.push({ sprite: sign, material: sign.material, baseY: 1.4, phase: Math.random() * 10 });
      const light = new THREE.PointLight(neon, 1.0, 5.5, 2);
      light.position.set(0, 0.9, 0);
      pen.add(light);
      pen.position.set(cell.x, y, cell.z);
      world.add(pen);
      baskets.push({ x: cell.x, z: cell.z, y, vertebrate, pad, light, pulse: 0 });
    }
    placeBasket(left, true);
    placeBasket(right, false);

    // ---------- puntos de aparición de los enemigos (lejos del jugador y entre sí) ----------
    const cand = [...cells.values()].filter((c) => c.kind === 'grass' && !c.yellow && c.h === 2);
    enemySpawns = [];
    const n = enemyCountFor(levelIndex);
    for (let k = 0; k < n; k++) {
      let best = null;
      let bd = -1;
      for (let t = 0; t < 140; t++) {
        const c = cand[(rand() * cand.length) | 0];
        if (!c) continue;
        let d = Math.hypot(c.x - spawn.x, c.z - spawn.z);
        enemySpawns.forEach((e) => { d = Math.min(d, Math.hypot(c.x - e.x, c.z - e.z) * 1.3); });
        if (d > bd) { bd = d; best = c; }
      }
      const b = best || { x: 0, z: -4, h: 2 };
      enemySpawns.push(new THREE.Vector3(b.x, b.h, b.z));
    }
  }

  function randomCell(farFrom) {
    const list = [...cells.values()].filter((c) => c.kind === 'grass' && c.deco !== 'tree' && c.deco !== 'pine' && c.deco !== 'rock' && c.deco !== 'lantern');
    for (let i = 0; i < 20; i++) {
      const c = list[(Math.random() * list.length) | 0];
      if (!c) break;
      if (farFrom && Math.hypot(c.x - farFrom.x, c.z - farFrom.z) < 3) continue;
      const top = c.yellow ? c.h + 0.92 : c.h;
      return new THREE.Vector3(c.x, top, c.z);
    }
    const c = list[0] || { x: 0, z: 0, h: 2 };
    return new THREE.Vector3(c.x, c.h, c.z);
  }

  const SPEED_MUL = { caracol: 0.35, gusano: 0.45, estrella: 0.3, tortuga: 0.5, medusa: 0.6, mariposa: 1.2, libelula: 1.5, abeja: 1.3 };
  function spawnAnimals(list) {
    goalTotal = list.length;
    list.forEach((kind) => {
      const mesh = BUILDERS[kind]();
      const spot = randomCell(spawn);
      const a = {
        mesh,
        pos: spot.clone(),
        angle: Math.random() * Math.PI * 2,
        timer: Math.random() * 2,
        speed: (0.45 + Math.random() * 0.35) * (SPEED_MUL[kind] || 1)
      };
      mesh.position.copy(a.pos);
      mesh.rotation.y = a.angle;
      scene.add(mesh);
      animals.push(a);
    });
  }

  // =====================================================================
  //  EFECTOS: partículas y disparos
  // =====================================================================
  function burst(pos, color, count) {
    const m = basicMat(color);
    const n = count || 14;
    for (let i = 0; i < n; i++) {
      const mesh = new THREE.Mesh(unitBox, m);
      const sz = 0.09 + Math.random() * 0.09;
      mesh.scale.setScalar(sz);
      mesh.position.copy(pos);
      scene.add(mesh);
      particles.push({
        mesh,
        sz,
        v: new THREE.Vector3((Math.random() - 0.5) * 4, 2 + Math.random() * 2.6, (Math.random() - 0.5) * 4),
        life: 0.7,
        max: 0.7
      });
    }
  }

  function updateParticles(dt) {
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.life -= dt;
      p.v.y -= GRAVITY * 0.35 * dt;
      p.mesh.position.addScaledVector(p.v, dt);
      p.mesh.rotation.x += dt * 6;
      p.mesh.rotation.y += dt * 5;
      p.mesh.scale.setScalar(p.sz * Math.max(0.05, p.life / p.max));
      if (p.life <= 0) {
        scene.remove(p.mesh);
        particles.splice(i, 1);
      }
    }
  }

  function fire() {
    shootCd = 0.48;
    _tmpV.set(Math.sin(player.facing), 0, Math.cos(player.facing));
    const mesh = new THREE.Mesh(bulletGeo, bulletMat);
    const glow = new THREE.Sprite(bulletGlowMat);
    glow.scale.set(1.2, 1.2, 1);
    mesh.add(glow);
    const origin = new THREE.Vector3(0.32, 0.55, 0.55);
    playerMesh.localToWorld(origin);
    mesh.position.copy(origin);
    scene.add(mesh);
    bullets.push({ mesh, pos: origin.clone(), vel: _tmpV.clone().multiplyScalar(16), life: 1.15 });
    beep(760, 0.05, 'square', 0.03);
  }

  function updateBullets(dt) {
    for (let i = bullets.length - 1; i >= 0; i--) {
      const b = bullets[i];
      b.life -= dt;
      b.pos.addScaledVector(b.vel, dt);
      b.mesh.position.copy(b.pos);
      let hit = false;
      for (const e of enemies) {
        if (e.state === 'out' || e.state === 'held' || e.stun > 0) continue;
        _tmpV.set(e.pos.x, e.pos.y + 0.65, e.pos.z);
        if (b.pos.distanceTo(_tmpV) < 0.8) {
          e.stun = STUN_TIME;
          e.vel.set(0, e.vel.y, 0);
          e.mesh.userData.stars.visible = true;
          e.hinted = false;
          burst(_tmpV.clone(), 0xffe14a);
          sfx.zap();
          toast('Enemigo aturdido 10 segundos. Acércate y pulsa Q para sujetarlo.');
          hit = true;
          break;
        }
      }
      if (hit || b.life <= 0) {
        scene.remove(b.mesh);
        bullets.splice(i, 1);
      }
    }
  }

  // =====================================================================
  //  JUGADOR
  // =====================================================================
  function inputMove() {
    let x = 0;
    let z = 0;
    if (buttons.left || keys.arrowleft || keys.a) x -= 1;
    if (buttons.right || keys.arrowright || keys.d) x += 1;
    if (buttons.up || keys.arrowup || keys.w) z -= 1;
    if (buttons.down || keys.arrowdown || keys.s) z += 1;
    const len = Math.hypot(x, z);
    if (len > 0) { x /= len; z /= len; }
    return { x, z };
  }

  function stepPlayer(dt) {
    player.iframe = Math.max(0, player.iframe - dt);
    player.knockT = Math.max(0, player.knockT - dt);
    shootCd = Math.max(0, shootCd - dt);
    const rotL = buttons.rotL || keys.z;
    const rotR = buttons.rotR || keys.x;
    if (rotL) player.facing += 2.8 * dt;
    if (rotR) player.facing -= 2.8 * dt;
    const rotating = rotL || rotR;
    const mv = inputMove();
    const speed = PLAYER_SPEED * (heldEnemy ? 0.82 : 1);
    if (player.knockT > 0) {
      player.vel.x *= Math.pow(0.04, dt);
      player.vel.z *= Math.pow(0.04, dt);
    } else {
      player.vel.x = mv.x * speed;
      player.vel.z = mv.z * speed;
      if (!rotating && (mv.x || mv.z)) {
        player.facing = lerpAngle(player.facing, Math.atan2(mv.x, mv.z), 1 - Math.exp(-10 * dt));
      }
    }
    const jumpHeld = buttons.jump || keys[' '];
    if (jumpHeld && player.grounded && player.knockT <= 0) {
      player.vel.y = JUMP_V;
      player.grounded = false;
      beep(420, 0.08, 'square', 0.03);
    }
    const wasGrounded = player.grounded;
    const vyBefore = player.vel.y;
    moveBody(player, dt);
    if (!wasGrounded && player.grounded && vyBefore < -5) {
      _tmpV.set(player.pos.x, player.pos.y + 0.05, player.pos.z);
      burst(_tmpV, 0xd8e4d0, 6);
    }
    if (player.pos.y < -6) {
      player.pos.copy(spawn);
      player.vel.set(0, 0, 0);
      if (heldEnemy) releaseEnemy(heldEnemy);
      toast('Caíste al vacío. Vuelves al inicio.');
    }
    if (player.grounded && Math.hypot(player.vel.x, player.vel.z) > 1) {
      player.stepT -= dt;
      if (player.stepT <= 0) { sfx.step(); player.stepT = 0.3; }
    }

    const grab = buttons.grab || keys.e || keys.f;
    if ((grab && !prevGrab) || latch.grab) tryGrabOrDrop();
    prevGrab = grab;
    latch.grab = false;

    const seize = buttons.seize || keys.q;
    if ((seize && !prevSeize) || latch.seize) trySeize();
    prevSeize = seize;
    latch.seize = false;

    const shoot = buttons.shoot || keys.r;
    if (shoot && shootCd <= 0) fire();
  }

  function poseBody(mesh, speed01, grounded, dt) {
    const L = mesh.userData.limbs;
    if (!L) return;
    const u = mesh.userData;
    const target = grounded ? clamp(speed01, 0, 1) : 0;
    u.walk = (u.walk || 0) + (target - (u.walk || 0)) * (1 - Math.exp(-14 * dt));
    u.phase = (u.phase || 0) + dt * (6 + 6 * u.walk);
    const sw = Math.sin(u.phase) * 0.85 * u.walk;
    if (L.quad) {
      L.legL.rotation.x = sw;
      L.legR.rotation.x = -sw;
      L.armL.rotation.x = -sw;
      L.armR.rotation.x = sw;
      return;
    }
    const air = grounded ? 0 : 1;
    L.legL.rotation.x = sw - air * 0.25;
    L.legR.rotation.x = -sw + air * 0.25;
    L.armL.rotation.x = -sw * 0.9 - air * 0.9;
    L.armR.rotation.x = sw * 0.9 - air * 0.9;
  }

  // =====================================================================
  //  ANIMALES: agarrar, soltar y clasificar
  // =====================================================================
  function nearestAnimal() {
    let best = null;
    let bestD = 1.45;
    for (const a of animals) {
      if (a === held) continue;
      const d = Math.hypot(a.pos.x - player.pos.x, a.pos.z - player.pos.z);
      const dy = Math.abs(a.pos.y - player.pos.y);
      if (d < bestD && dy < 1.4) { bestD = d; best = a; }
    }
    return best;
  }

  function basketAt(pos) {
    let best = null;
    baskets.forEach((b) => {
      const d = Math.hypot(pos.x - b.x, pos.z - b.z);
      if (d < 1.15 && Math.abs(pos.y - b.y) < 1.3 && (!best || d < best.d)) best = Object.assign({ d, ref: b }, b);
    });
    return best;
  }

  function releaseHeld(spot) {
    const a = held;
    scene.attach(a.mesh);
    a.pos.copy(spot);
    a.mesh.position.copy(spot);
    a.mesh.rotation.set(0, a.angle, 0);
    held = null;
  }

  function tryGrabOrDrop() {
    if (held) {
      const b = basketAt(player.pos);
      if (b) {
        const correct = b.vertebrate === held.mesh.userData.vertebrate;
        const name = held.mesh.userData.name;
        const where = held.mesh.userData.vertebrate ? 'izquierda, con los vertebrados' : 'derecha, con los invertebrados';
        if (correct) {
          score += 10;
          if (b.ref) b.ref.pulse = 1;
          sfx.correct();
          burst(held.mesh.getWorldPosition(new THREE.Vector3()), b.vertebrate ? 0x6ea8ff : 0xffb067);
          const done = held;
          held = null;
          animals = animals.filter((x) => x !== done);
          disposeAnimal(done);
          toast(name + ' en el corral correcto. +10 pts');
          if (animals.length === 0) onLevelComplete();
        } else {
          score -= 10;
          shake = Math.max(shake, 0.14);
          sfx.wrong();
          releaseHeld(randomCell(player.pos));
          toast(name + ' no va en ese corral. Va a la ' + where + '. −10 pts');
        }
      } else {
        const x = player.pos.x + Math.sin(player.facing) * 0.85;
        const z = player.pos.z + Math.cos(player.facing) * 0.85;
        const y = groundAt(x, z, 0.2, player.pos.y + 0.5);
        if (y < -20) releaseHeld(player.pos.clone());
        else releaseHeld(new THREE.Vector3(x, y, z));
        toast('Soltaste el animal.');
      }
    } else {
      const a = nearestAnimal();
      if (!a) { toast('No hay un animal cerca.'); return; }
      playerMesh.attach(a.mesh);
      a.mesh.position.set(0.46, 0.7, 0.4);
      a.mesh.rotation.set(0, -0.5, 0);
      held = a;
      beep(520, 0.07, 'square', 0.04);
      toast('Llevas: ' + a.mesh.userData.name + (a.mesh.userData.vertebrate ? ' (vertebrado → izquierda)' : ' (invertebrado → derecha)'));
    }
  }

  function updateAnimals(dt) {
    const t = performance.now() / 1000;
    for (const a of animals) {
      animateAnimal(a.mesh, t);
      if (a === held) continue;
      a.timer -= dt;
      if (a.timer <= 0) {
        a.angle = Math.random() * Math.PI * 2;
        a.timer = 1.4 + Math.random() * 2.4;
      }
      const nx = a.pos.x + Math.sin(a.angle) * a.speed * dt;
      const nz = a.pos.z + Math.cos(a.angle) * a.speed * dt;
      const g0 = groundAt(a.pos.x, a.pos.z, 0.18, a.pos.y + 0.2);
      const g1 = groundAt(nx, nz, 0.18, a.pos.y + 0.3);
      if (g1 > -20 && g1 <= g0 + 0.2) {
        a.pos.x = nx;
        a.pos.z = nz;
        a.pos.y = g1;
      } else {
        a.angle += Math.PI / 2;
        a.timer = 0.3;
      }
      a.mesh.rotation.y = lerpAngle(a.mesh.rotation.y, a.angle, 1 - Math.exp(-6 * dt));
      const kind = a.mesh.userData.kind;
      const hover = a.mesh.userData.hover;
      let yy;
      if (hover) {
        yy = a.pos.y + hover + Math.sin(t * 3 + a.pos.x * 1.3) * 0.12;
      } else {
        const hopAmp = kind === 'conejo' ? 0.12 : (SPEED_MUL[kind] && SPEED_MUL[kind] < 0.6 ? 0 : 0.045);
        yy = a.pos.y + Math.abs(Math.sin(t * (kind === 'conejo' ? 8 : 4) + a.pos.x)) * hopAmp;
      }
      a.mesh.position.set(a.pos.x, yy, a.pos.z);
    }
  }

  // =====================================================================
  //  ENEMIGOS (estilo creeper): persiguen, roban, se aturden y se pueden lanzar al vacío
  // =====================================================================
  function newEnemy(spawnPos) {
    const mesh = makeCreeper();
    scene.add(mesh);
    mesh.position.copy(spawnPos);
    return {
      mesh,
      pos: spawnPos.clone(),
      vel: new THREE.Vector3(),
      facing: Math.random() * Math.PI * 2,
      radius: 0.32,
      height: 1.35,
      grounded: false,
      stun: 0,
      attackCd: 0,
      jumpCd: 0,
      spawn: spawnPos.clone(),
      state: 'active',      // active | held | thrown | out
      thrownT: 0,
      wasThrown: false,
      respawnT: 0,
      hinted: false
    };
  }

  function steerEnemy(e) {
    const dx = player.pos.x - e.pos.x;
    const dz = player.pos.z - e.pos.z;
    const len = Math.hypot(dx, dz) || 1;
    const fx = dx / len;
    const fz = dz / len;
    const angles = [0, 0.7, -0.7, 1.2, -1.2];
    for (const ang of angles) {
      const s = Math.sin(ang);
      const c = Math.cos(ang);
      const rx = fx * c - fz * s;
      const rz = fx * s + fz * c;
      const nx = e.pos.x + rx * 0.75;
      const nz = e.pos.z + rz * 0.75;
      const g = groundAt(nx, nz, e.radius * 0.7, e.pos.y + 0.2);
      if (g > e.pos.y - 0.7 && g < e.pos.y + 1.35) {
        return { x: rx, z: rz, jump: g > e.pos.y + 0.48 };
      }
    }
    return { x: fx, z: fz, jump: false };
  }

  function eliminateEnemy(e) {
    e.state = 'out';
    e.mesh.visible = false;
    e.stun = 0;
    e.wasThrown = false;
    e.mesh.userData.stars.visible = false;
    e.respawnT = RESPAWN_ENEMY;
    sfx.fall();
    toast('¡Enemigo lanzado al vacío! Volverá en ' + RESPAWN_ENEMY + ' segundos.');
  }

  function respawnEnemy(e) {
    let best = e.spawn;
    let bd = -1;
    enemySpawns.forEach((p) => {
      const d = Math.hypot(p.x - player.pos.x, p.z - player.pos.z);
      if (d > bd) { bd = d; best = p; }
    });
    e.pos.copy(best);
    e.vel.set(0, 0, 0);
    e.state = 'active';
    e.stun = 0;
    e.attackCd = 1;
    e.mesh.visible = true;
    toast('Un enemigo volvió al mapa.');
  }

  function releaseEnemy(e, msg) {
    if (heldEnemy === e) heldEnemy = null;
    e.state = 'active';
    e.pos.set(player.pos.x + Math.sin(player.facing) * 0.9, player.pos.y + 0.05, player.pos.z + Math.cos(player.facing) * 0.9);
    e.vel.set(0, 0, 0);
    e.mesh.scale.setScalar(1);
    e.attackCd = 1.2;
    if (msg) toast(msg);
  }

  function trySeize() {
    if (state !== 'play' && state !== 'intro') return;
    if (heldEnemy) { throwEnemy(); return; }
    let best = null;
    let bd = 1.8;
    for (const e of enemies) {
      if (e.state !== 'active' && e.state !== 'thrown') continue;
      if (e.stun <= 0) continue;
      const d = Math.hypot(e.pos.x - player.pos.x, e.pos.z - player.pos.z);
      const dy = Math.abs(e.pos.y - player.pos.y);
      if (d < bd && dy < 1.4) { bd = d; best = e; }
    }
    if (!best) {
      toast(enemies.some((e) => e.stun > 0) ? 'Acércate más al enemigo aturdido.' : 'Primero aturde al enemigo con el disparo (R).');
      return;
    }
    heldEnemy = best;
    best.state = 'held';
    best.vel.set(0, 0, 0);
    sfx.zap();
    toast('Sujetas al enemigo. Pulsa Q otra vez para lanzarlo hacia el vacío.');
  }

  function throwEnemy() {
    const e = heldEnemy;
    heldEnemy = null;
    const dx = Math.sin(player.facing);
    const dz = Math.cos(player.facing);
    e.state = 'thrown';
    e.thrownT = 0;
    e.wasThrown = true;
    e.pos.set(player.pos.x + dx * 0.7, player.pos.y + 1.0, player.pos.z + dz * 0.7);
    e.vel.set(dx * 9.5, 5.5, dz * 9.5);
    e.grounded = false;
    e.mesh.scale.setScalar(1);
    sfx.whoosh();
  }

  function stepEnemy(e, dt) {
    if (e.state === 'out') {
      e.respawnT -= dt;
      if (e.respawnT <= 0) respawnEnemy(e);
      return;
    }
    e.attackCd = Math.max(0, e.attackCd - dt);
    e.jumpCd = Math.max(0, e.jumpCd - dt);
    if (e.stun > 0) {
      e.stun -= dt;
      if (e.stun <= 0) {
        e.stun = 0;
        e.mesh.userData.stars.visible = false;
        if (e.state === 'held') releaseEnemy(e, '¡El enemigo se soltó!');
        else toast('Un enemigo se despertó.');
      }
    }
    if (e.state === 'held') {
      e.pos.copy(player.pos);
      e.vel.set(0, 0, 0);
      return;
    }
    if (e.state === 'thrown') {
      e.thrownT += dt;
      moveBody(e, dt);
      if (e.pos.y < -7) { eliminateEnemy(e); return; }
      if (e.grounded && e.thrownT > 0.15) {
        e.state = 'active';
        e.wasThrown = false;
        e.vel.set(0, 0, 0);
      }
      return;
    }
    // activo
    if (e.stun > 0) {
      e.vel.x = 0;
      e.vel.z = 0;
      e.facing += dt * 5.5;
      if (!e.hinted && Math.hypot(e.pos.x - player.pos.x, e.pos.z - player.pos.z) < 5) {
        e.hinted = true;
        toast('Acércate y pulsa Q para sujetarlo.');
      }
    } else {
      e.hinted = false;
      const dir = steerEnemy(e);
      const sp = enemySpeedFor(level);
      e.vel.x = dir.x * sp;
      e.vel.z = dir.z * sp;
      e.facing = lerpAngle(e.facing, Math.atan2(dir.x, dir.z), 1 - Math.exp(-8 * dt));
      if (dir.jump && e.grounded && e.jumpCd <= 0) {
        e.vel.y = JUMP_V * 0.95;
        e.jumpCd = 0.55;
      }
    }
    moveBody(e, dt);
    if (e.pos.y < -7) {
      if (e.wasThrown) { eliminateEnemy(e); return; }
      e.pos.copy(e.spawn);
      e.vel.set(0, 0, 0);
    }

    if (state !== 'play' || e.stun > 0) return;
    const d = Math.hypot(e.pos.x - player.pos.x, e.pos.z - player.pos.z);
    const dy = Math.abs(e.pos.y - player.pos.y);
    if (d < 0.98 && dy < 1.2 && e.attackCd <= 0 && player.iframe <= 0) {
      if (held) {
        score -= 5;
        onHit(false);
        const name = held.mesh.userData.name;
        releaseHeld(randomCell(player.pos));
        e.attackCd = 1.35;
        sfx.hurt();
        toast('El enemigo robó a ' + name + '. −5 pts');
      } else {
        lives -= 1;
        onHit(true);
        player.iframe = 1.7;
        player.knockT = 0.28;
        const kx = player.pos.x - e.pos.x;
        const kz = player.pos.z - e.pos.z;
        const kl = Math.hypot(kx, kz) || 1;
        player.vel.x = (kx / kl) * 7;
        player.vel.z = (kz / kl) * 7;
        player.vel.y = 4.5;
        e.attackCd = 1.25;
        sfx.hurt();
        if (lives <= 0) {
          lives = 0;
          endGame(false, 'El enemigo te derrotó. Te quedaste sin vidas.');
        } else {
          toast('¡Te golpeó! Te quedan ' + lives + (lives === 1 ? ' vida.' : ' vidas.'));
        }
      }
    }
  }

  // Sincroniza los modelos con la física (después de resolver choques)
  function syncMeshes(dt) {
    const now = performance.now();
    const t = now / 1000;
    const moving = Math.hypot(player.vel.x, player.vel.z) > 0.2;
    const bob = moving && player.grounded ? Math.sin(now / 90) * 0.04 : 0;
    playerMesh.position.set(player.pos.x, player.pos.y + bob, player.pos.z);
    playerMesh.rotation.y = player.facing;
    playerMesh.visible = player.iframe > 0 ? Math.floor(now / 80) % 2 === 0 : true;
    poseBody(playerMesh, Math.hypot(player.vel.x, player.vel.z) / PLAYER_SPEED, player.grounded, dt);

    for (const e of enemies) {
      const m = e.mesh;
      if (e.state === 'out') continue;
      const stars = m.userData.stars;
      if (e.stun > 0) {
        stars.visible = true;
        stars.rotation.y += dt * 4;
        stars.children.forEach((s, i) => { s.position.y = Math.sin(now / 180 + i) * 0.08; });
      }
      if (e.state === 'held') {
        m.position.set(player.pos.x, player.pos.y + 1.32 + Math.sin(t * 14) * 0.03, player.pos.z);
        m.rotation.y = player.facing;
        m.rotation.z = Math.sin(t * 16) * 0.14;
        m.scale.setScalar(0.72);
        poseBody(m, 0, true, dt);
        continue;
      }
      m.rotation.z = 0;
      m.position.set(e.pos.x, e.pos.y, e.pos.z);
      m.rotation.y = e.facing;
      const near = Math.hypot(e.pos.x - player.pos.x, e.pos.z - player.pos.z) < 2.2 && e.stun <= 0 && state === 'play';
      const pulse = near ? 1 + 0.06 * Math.sin(t * 30) : 1;
      m.scale.set(pulse, 1, pulse);
      poseBody(m, e.stun > 0 || e.state === 'thrown' ? 0 : Math.hypot(e.vel.x, e.vel.z) / enemySpeedFor(level), e.grounded, dt);
    }
    if (heldEnemy) heldEnemy.pos.copy(player.pos);
  }

  // =====================================================================
  //  PREGUNTAS (3 por nivel = 20 pts)
  // =====================================================================
  const quizEl = document.getElementById('quiz');
  const qEls = {
    level: document.getElementById('q-level'),
    pts: document.getElementById('q-pts'),
    dots: Array.from(document.querySelectorAll('#q-dots i')),
    text: document.getElementById('q-text'),
    options: document.getElementById('q-options'),
    fb: document.getElementById('q-fb'),
    next: document.getElementById('q-next')
  };
  const usedQ = new Set();
  let quiz = null;

  function shuffled(arr) {
    const a = arr.slice();
    for (let j = a.length - 1; j > 0; j--) {
      const r = Math.floor(Math.random() * (j + 1));
      const t = a[j]; a[j] = a[r]; a[r] = t;
    }
    return a;
  }

  function startQuiz() {
    let pool = QUESTIONS.map((_, i) => i).filter((i) => !usedQ.has(i));
    if (pool.length < 3) { usedQ.clear(); pool = QUESTIONS.map((_, i) => i); }
    const picks = [];
    while (picks.length < 3) {
      const i = pool.splice((Math.random() * pool.length) | 0, 1)[0];
      picks.push(i);
      usedQ.add(i);
    }
    quiz = { items: picks.map((i) => QUESTIONS[i]), idx: 0, gained: 0, answered: false, opts: [] };
    state = 'quiz';
    qEls.level.textContent = '¡Nivel ' + (level + 1) + ' completado!';
    qEls.dots.forEach((d) => { d.className = ''; });
    quizEl.hidden = false;
    setMusicMood(0.35);
    renderQuestion();
  }

  function renderQuestion() {
    const it = quiz.items[quiz.idx];
    quiz.answered = false;
    quiz.opts = shuffled(it.o.map((t, i) => ({ t, ok: i === it.a })));
    qEls.text.textContent = it.q;
    qEls.pts.textContent = 'Pregunta ' + (quiz.idx + 1) + ' de 3 · vale ' + QUIZ_POINTS[quiz.idx] + ' pts';
    qEls.dots.forEach((d, i) => d.classList.toggle('cur', i === quiz.idx));
    qEls.options.innerHTML = '';
    quiz.opts.forEach((o, i) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'q-opt';
      const k = document.createElement('kbd');
      k.textContent = String(i + 1);
      const sp = document.createElement('span');
      sp.textContent = o.t;
      b.appendChild(k);
      b.appendChild(sp);
      b.addEventListener('click', () => answerQuiz(i));
      qEls.options.appendChild(b);
    });
    qEls.fb.textContent = '';
    qEls.fb.className = 'q-fb';
    qEls.next.hidden = true;
  }

  function answerQuiz(i) {
    if (!quiz || quiz.answered || !quiz.opts[i]) return;
    quiz.answered = true;
    const it = quiz.items[quiz.idx];
    const ok = quiz.opts[i].ok;
    Array.from(qEls.options.children).forEach((b, j) => {
      b.disabled = true;
      if (quiz.opts[j].ok) b.classList.add('good');
      else if (j === i) b.classList.add('bad');
    });
    qEls.dots[quiz.idx].classList.remove('cur');
    qEls.dots[quiz.idx].classList.add(ok ? 'good' : 'bad');
    if (ok) {
      const p = QUIZ_POINTS[quiz.idx];
      score += p;
      quiz.gained += p;
      sfx.correct();
      qEls.fb.textContent = '¡Correcto! +' + p + ' pts. ' + it.e;
      qEls.fb.className = 'q-fb good';
    } else {
      sfx.wrong();
      qEls.fb.textContent = 'Esa no era. ' + it.e;
      qEls.fb.className = 'q-fb bad';
    }
    qEls.next.textContent = quiz.idx < 2 ? 'Siguiente' : 'Continuar';
    qEls.next.hidden = false;
  }

  function nextQuiz() {
    if (!quiz || !quiz.answered) return;
    if (quiz.idx < 2) { quiz.idx++; renderQuestion(); return; }
    const gained = quiz.gained;
    quiz = null;
    quizEl.hidden = true;
    setMusicMood(1);
    if (level >= MAX_LEVEL - 1) {
      endGame(true, '¡Completaste los 10 niveles! Preguntas del último nivel: +' + gained + ' de 20 pts.');
    } else {
      startLevel(level + 1, 'intro');
      toast('Preguntas: +' + gained + ' de 20 pts. Nivel ' + (level + 1) + ': ' + (enemies.length === 1 ? '1 enemigo' : enemies.length + ' enemigos') + '.');
    }
  }

  // =====================================================================
  //  RÉCORDS (se guardan en el navegador)
  // =====================================================================
  const records = { best: 0, list: [] };
  function loadRecords() {
    try {
      const raw = localStorage.getItem(STORE_KEY);
      if (raw) {
        const o = JSON.parse(raw);
        records.best = o.best | 0;
        records.list = Array.isArray(o.list) ? o.list.slice(0, 5) : [];
      }
    } catch (err) { /* sin almacenamiento */ }
  }
  function saveRecords() {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(records)); } catch (err) { /* sin almacenamiento */ }
  }
  function commitRun() {
    if (runCommitted) return false;
    runCommitted = true;
    const isNew = score > records.best;
    if (isNew) records.best = score;
    if (score > 0) {
      records.list.push({ score, level: level + 1, date: Date.now() });
      records.list.sort((a, b) => b.score - a.score);
      records.list = records.list.slice(0, 5);
    }
    saveRecords();
    return isNew;
  }
  loadRecords();

  // =====================================================================
  //  FLUJO DEL JUEGO
  // =====================================================================
  function startLevel(index, nextState) {
    disposeWorld();
    level = index;
    const ti = themeIndex(index);
    if (ti !== curTheme) { curTheme = ti; applyTheme(THEMES[ti]); }
    buildMap(index);
    spawnAnimals(levelAnimals(index));
    player.pos.copy(spawn);
    player.vel.set(0, 0, 0);
    player.facing = 0;
    player.knockT = 0;
    player.iframe = 0;
    enemies = enemySpawns.map((p) => newEnemy(p));
    playerMesh.position.copy(player.pos);
    state = nextState;
    introT = 2.2;
    held = null;
    heldEnemy = null;
  }

  function begin() {
    ensureAudio();
    score = 0;
    lives = 3;
    timeLeft = ROUND_TIME;
    runCommitted = false;
    resetHudCache();
    hideOverlay();
    startLevel(0, 'intro');
    toast('Nivel 1. El enemigo sale en un momento.');
  }

  let levelupT = 0;
  function onLevelComplete() {
    timeLeft += LEVEL_BONUS;
    state = 'levelup';
    levelupT = 1.5;
    sfx.fanfare();
    burst(_tmpV.set(player.pos.x, player.pos.y + 1.4, player.pos.z), 0xffe14a, 24);
    if (heldEnemy) releaseEnemy(heldEnemy);
    toast('¡Nivel completado! +' + LEVEL_BONUS + ' segundos de tiempo.');
  }

  function endGame(win, msg) {
    state = win ? 'win' : 'dead';
    const isNew = commitRun();
    const title = win ? '¡Ganaste!' : 'Fin de la partida';
    showOverlay(title, msg + ' Puntos: ' + score + (isNew ? '. ¡Nuevo récord!' : '.'), 'Reintentar', false);
    setMusicMood(0.5);
  }

  // =====================================================================
  //  LUCIÉRNAGAS (se calculan en la GPU: brillo que late y trayectorias suaves)
  // =====================================================================
  const fireflySystem = (() => {
    const COUNT = 140;
    const pos = new Float32Array(COUNT * 3);
    const seed = new Float32Array(COUNT * 4);
    for (let i = 0; i < COUNT; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 44;
      pos[i * 3 + 1] = 0.8 + Math.random() * 7.5;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 34;
      seed[i * 4] = Math.random();
      seed[i * 4 + 1] = 0.35 + Math.random() * 0.75;
      seed[i * 4 + 2] = 0.32 + Math.random() * 0.55;
      seed[i * 4 + 3] = Math.random();
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('aSeed', new THREE.BufferAttribute(seed, 4));
    const material = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uScale: { value: 600 },
        uCenter: { value: new THREE.Vector2() }
      },
      vertexShader: `
        uniform float uTime;
        uniform float uScale;
        uniform vec2 uCenter;
        attribute vec4 aSeed;
        varying float vAlpha;
        varying vec3 vColor;
        const vec2 HALF = vec2(22.0, 17.0);
        void main() {
          vec2 rel = mod(position.xz - uCenter + HALF, HALF * 2.0) - HALF;
          float edge = (1.0 - smoothstep(0.65, 1.0, abs(rel.x) / HALF.x)) *
                       (1.0 - smoothstep(0.65, 1.0, abs(rel.y) / HALF.y));
          float t = uTime * aSeed.y;
          vec3 p = vec3(uCenter.x + rel.x, position.y, uCenter.y + rel.y);
          p.x += sin(t * 0.8 + aSeed.x * 40.0) * 1.7 + sin(t * 2.1 + aSeed.w * 9.0) * 0.35;
          p.z += cos(t * 0.65 + aSeed.x * 23.0) * 1.7 + cos(t * 1.9 + aSeed.w * 7.0) * 0.35;
          p.y += sin(t * 0.9 + aSeed.x * 17.0) * 0.9 + sin(t * 2.7 + aSeed.w * 5.0) * 0.2;
          float pulse = 0.5 + 0.5 * sin(uTime * (1.1 + aSeed.y * 1.3) + aSeed.x * 60.0);
          pulse = pulse * pulse * pulse;
          vAlpha = (0.12 + 0.88 * pulse) * edge;
          vColor = mix(vec3(0.7, 1.0, 0.32), vec3(0.3, 1.0, 0.85), aSeed.w);
          vec4 mv = modelViewMatrix * vec4(p, 1.0);
          gl_PointSize = clamp(aSeed.z * (0.55 + 0.9 * pulse) * uScale / max(0.1, -mv.z), 0.0, 96.0);
          gl_Position = projectionMatrix * mv;
        }
      `,
      fragmentShader: `
        varying float vAlpha;
        varying vec3 vColor;
        void main() {
          vec2 c = gl_PointCoord - 0.5;
          float d = length(c) * 2.0;
          if (d > 1.0) discard;
          float core = pow(max(0.0, 1.0 - d * 2.2), 2.0);
          float halo = pow(1.0 - d, 2.4);
          float a = (core * 1.3 + halo * 0.5) * vAlpha;
          gl_FragColor = vec4(vColor * (0.7 + core * 0.6), a);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });
    const points = new THREE.Points(geo, material);
    points.frustumCulled = false;
    scene.add(points);
    return { points, material };
  })();

  function updateFireflies(now) {
    const u = fireflySystem.material.uniforms;
    u.uTime.value = now * 0.001;
    u.uCenter.value.set(player.pos.x, player.pos.z);
  }

  function updateBaskets(dt, now) {
    const t = now * 0.001;
    for (const b of baskets) {
      b.pulse = Math.max(0, b.pulse - dt * 1.6);
      let base = 0.26 + Math.sin(t * 2.2 + b.x) * 0.07;
      if (held && held.mesh.userData.vertebrate === b.vertebrate) base += 0.14 + 0.1 * Math.sin(t * 6);
      b.pad.material.opacity = base + b.pulse * 0.55;
      b.light.intensity = 1.0 + b.pulse * 3.2;
    }
  }

  function updateSigns(now) {
    const t = now * 0.001;
    for (const sg of signs) {
      const k = t + sg.phase;
      sg.sprite.position.y = sg.baseY + Math.sin(k * 1.6) * 0.05;
      const flick = Math.sin(k * 23) * Math.sin(k * 5.7) > 0.93 ? 0.5 : 1;
      sg.material.opacity += (flick - sg.material.opacity) * 0.5;
    }
  }

  // =====================================================================
  //  BOSQUE DESENFOCADO DE FONDO (3 capas con parallax; se ve el mapa y el fondo a la vez)
  // =====================================================================
  const bgCanvas = ['bg0', 'bg1', 'bg2'].map((id) => document.getElementById(id));
  let forestTheme = THEMES[0];

  function drawPine(g, x, base, h, w, color) {
    g.fillStyle = color;
    g.fillRect(x - w * 0.05, base - h * 0.16, w * 0.1, h * 0.16);
    for (let i = 0; i < 4; i++) {
      const top = base - h + i * h * 0.19;
      const hw = w * (0.22 + i * 0.12);
      g.beginPath();
      g.moveTo(x, top);
      g.lineTo(x + hw, top + h * 0.36);
      g.lineTo(x - hw, top + h * 0.36);
      g.closePath();
      g.fill();
    }
  }
  function drawOak(g, x, base, h, w, color) {
    g.fillStyle = color;
    g.fillRect(x - w * 0.06, base - h * 0.5, w * 0.12, h * 0.5);
    [[0, -0.72, 0.32], [-0.22, -0.58, 0.24], [0.22, -0.58, 0.24], [0, -0.9, 0.22]].forEach(([dx, dy, r]) => {
      g.beginPath();
      g.arc(x + dx * w, base + dy * h, r * w, 0, Math.PI * 2);
      g.fill();
    });
  }
  function drawTrees(g, rnd, W, base, hMin, hMax, color, alpha, count, xFrom, xTo) {
    g.globalAlpha = alpha;
    for (let i = 0; i < count; i++) {
      const x = xFrom + rnd() * (xTo - xFrom);
      const h = hMin + rnd() * (hMax - hMin);
      const w = h * (0.5 + rnd() * 0.25);
      if (rnd() < 0.6) drawPine(g, x, base + rnd() * 12, h, w, color);
      else drawOak(g, x, base + rnd() * 12, h, w, color);
    }
    g.globalAlpha = 1;
  }

  function drawForest(th) {
    forestTheme = th;
    const W = Math.max(320, Math.ceil(innerWidth * 1.16 * 0.55));
    const H = Math.max(240, Math.ceil(innerHeight * 1.16 * 0.55));
    const rnd = mulberry32(2024 + THEMES.indexOf(th) * 13);
    const cx = bgCanvas.map((c) => { c.width = W; c.height = H; return c.getContext('2d'); });
    // capa 0: cielo, luna y árboles lejanos
    const g0 = cx[0];
    const sky = g0.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, th.sky[0]);
    sky.addColorStop(0.55, th.sky[1]);
    sky.addColorStop(1, th.sky[2]);
    g0.fillStyle = sky;
    g0.fillRect(0, 0, W, H);
    g0.fillStyle = 'rgba(255,255,255,0.75)';
    for (let i = 0; i < 90; i++) g0.fillRect(rnd() * W, rnd() * H * 0.5, 1.6, 1.6);
    const mx = W * 0.78;
    const my = H * 0.2;
    const mg = g0.createRadialGradient(mx, my, 0, mx, my, H * 0.3);
    mg.addColorStop(0, 'rgba(255,255,255,0.55)');
    mg.addColorStop(0.2, 'rgba(255,255,255,0.18)');
    mg.addColorStop(1, 'rgba(255,255,255,0)');
    g0.fillStyle = mg;
    g0.fillRect(0, 0, W, H);
    g0.fillStyle = th.moon;
    g0.beginPath();
    g0.arc(mx, my, H * 0.04, 0, Math.PI * 2);
    g0.fill();
    drawTrees(g0, rnd, W, H * 0.84, H * 0.2, H * 0.34, th.tree2, 0.55, Math.ceil(W / 24), -20, W + 20);
    g0.fillStyle = th.tree2;
    g0.globalAlpha = 0.6;
    g0.fillRect(0, H * 0.84, W, H * 0.2);
    g0.globalAlpha = 1;
    // capa 1: árboles medianos y neblina
    const g1 = cx[1];
    drawTrees(g1, rnd, W, H * 0.96, H * 0.34, H * 0.55, th.tree2, 0.9, Math.ceil(W / 52), -20, W + 20);
    const mist = g1.createLinearGradient(0, H * 0.62, 0, H);
    mist.addColorStop(0, 'rgba(255,255,255,0)');
    mist.addColorStop(1, 'rgba(180,255,230,0.14)');
    g1.fillStyle = mist;
    g1.fillRect(0, H * 0.62, W, H * 0.4);
    // capa 2: árboles grandes a los lados, luces desenfocadas y viñeta
    const g2 = cx[2];
    drawTrees(g2, rnd, W, H * 1.06, H * 0.6, H * 0.95, th.tree, 1, 5, -10, W * 0.2);
    drawTrees(g2, rnd, W, H * 1.06, H * 0.6, H * 0.95, th.tree, 1, 5, W * 0.8, W + 10);
    const glowCss = '#' + th.glow.toString(16).padStart(6, '0');
    for (let i = 0; i < 42; i++) {
      const r = 5 + rnd() * 22;
      g2.globalAlpha = 0.07 + rnd() * 0.16;
      g2.fillStyle = rnd() < 0.78 ? glowCss : '#ffd88a';
      g2.beginPath();
      g2.arc(rnd() * W, H * (0.25 + rnd() * 0.7), r, 0, Math.PI * 2);
      g2.fill();
    }
    g2.globalAlpha = 1;
    const vg = g2.createRadialGradient(W / 2, H / 2, H * 0.35, W / 2, H / 2, H * 0.95);
    vg.addColorStop(0, 'rgba(0,0,0,0)');
    vg.addColorStop(1, 'rgba(0,0,0,0.55)');
    g2.fillStyle = vg;
    g2.fillRect(0, 0, W, H);
  }

  const bgK = [0.4, 0.9, 1.7];
  const bgPos = bgCanvas.map(() => ({ x: 1e9, y: 1e9 }));
  const bgSmooth = { x: 0, z: 0 };
  function updateBackdrop(dt) {
    const k = 1 - Math.exp(-3 * dt);
    bgSmooth.x += (player.pos.x - bgSmooth.x) * k;
    bgSmooth.z += (player.pos.z - bgSmooth.z) * k;
    for (let i = 0; i < bgCanvas.length; i++) {
      const x = -bgSmooth.x * bgK[i];
      const y = bgSmooth.z * bgK[i] * 0.35;
      if (Math.abs(x - bgPos[i].x) > 0.3 || Math.abs(y - bgPos[i].y) > 0.3) {
        bgPos[i].x = x;
        bgPos[i].y = y;
        bgCanvas[i].style.transform = 'translate3d(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px,0)';
      }
    }
  }

  function applyTheme(th) {
    sun.color.setHex(th.sun);
    glowLight.color.setHex(th.glow);
    scene.fog.color.setHex(th.fog);
    drawForest(th);
  }

  // =====================================================================
  //  PANTALLAS (inicio / fin) y HUD
  // =====================================================================
  const $ = (id) => document.getElementById(id);
  const overlay = $('overlay');
  const ovTitle = $('ov-title');
  const ovText = $('ov-text');
  const ovBtn = $('ov-btn');
  const ovRules = $('ov-rules');
  const ovRecords = $('ov-records');

  function renderRecords() {
    ovRecords.innerHTML = '';
    if (!records.list.length) { ovRecords.hidden = true; return; }
    ovRecords.hidden = false;
    const h = document.createElement('div');
    h.className = 'rec-title';
    h.textContent = '🏆 Mejores registros';
    ovRecords.appendChild(h);
    const ol = document.createElement('ol');
    records.list.forEach((r) => {
      const li = document.createElement('li');
      const d = new Date(r.date);
      const date = isNaN(d.getTime()) ? '' : d.toLocaleDateString('es');
      li.innerHTML = '<b></b><span></span>';
      li.firstChild.textContent = r.score + ' pts';
      li.lastChild.textContent = 'Nivel ' + r.level + (date ? ' · ' + date : '');
      ol.appendChild(li);
    });
    ovRecords.appendChild(ol);
  }

  function showOverlay(title, text, buttonLabel, showRules) {
    overlay.hidden = false;
    ovTitle.textContent = title;
    ovText.textContent = text;
    ovRules.hidden = !showRules;
    renderRecords();
    if (buttonLabel) { ovBtn.hidden = false; ovBtn.textContent = buttonLabel; }
    else ovBtn.hidden = true;
  }
  function hideOverlay() { overlay.hidden = true; }

  const RING_LEN = 2 * Math.PI * 30;
  const hudEls = {
    fx: $('fx'),
    life: $('hud-lives'),
    hearts: Array.from(document.querySelectorAll('#hud-lives .heart')),
    lifeFill: $('lifebar-fill'),
    time: $('hud-time'),
    timeText: $('time-text'),
    timeRing: $('time-ring'),
    scoreCard: $('hud-score-card'),
    scoreNum: $('score-num'),
    pops: $('pops'),
    level: $('hud-level'),
    goalText: $('hud-goal'),
    goalFill: $('goal-fill'),
    held: $('hud-held'),
    heldEmoji: $('held-emoji'),
    heldName: $('held-name'),
    enemy: $('hud-enemy'),
    enemyText: $('enemy-text'),
    record: $('hud-record'),
    recordText: $('record-text'),
    sound: $('btn-sound')
  };
  hudEls.timeRing.style.strokeDasharray = RING_LEN.toFixed(2);
  const hudCache = {};

  function resetHudCache() {
    hudCache.lives = -1;
    hudCache.lastScore = 0;
    hudCache.shown = 0;
    hudCache.shownInt = null;
    hudCache.sec = -1;
    hudCache.ringOff = -1;
    hudCache.level = -1;
    hudCache.placed = -1;
    hudCache.total = -1;
    hudCache.held = '#';
    hudCache.enemy = '';
    hudCache.record = '';
    hudEls.scoreNum.textContent = '0';
  }
  resetHudCache();

  function restartAnim(el, cls) {
    el.classList.remove(cls);
    void el.offsetWidth;
    el.classList.add(cls);
  }

  function popScore(d) {
    const sp = document.createElement('span');
    sp.className = 'pop ' + (d > 0 ? 'plus' : 'minus');
    sp.textContent = (d > 0 ? '+' : '−') + Math.abs(d);
    sp.addEventListener('animationend', () => sp.remove());
    hudEls.pops.appendChild(sp);
  }

  function onHit(strong) {
    shake = Math.max(shake, strong ? 0.5 : 0.22);
    restartAnim(hudEls.fx, 'hit');
  }

  function fmtTime(t) {
    const sec = Math.max(0, Math.ceil(t));
    const m = Math.floor(sec / 60);
    const r = sec % 60;
    return String(m).padStart(2, '0') + ':' + String(r).padStart(2, '0');
  }

  function updateHud(dt) {
    if (hudCache.lives !== lives) {
      if (hudCache.lives > lives) restartAnim(hudEls.life, 'hurt');
      hudEls.hearts.forEach((h, i) => h.classList.toggle('lost', i >= lives));
      hudEls.lifeFill.style.transform = 'scaleX(' + (Math.max(0, lives) / 3).toFixed(3) + ')';
      hudEls.life.dataset.lives = Math.max(0, lives);
      document.body.dataset.lives = Math.max(0, lives);
      hudCache.lives = lives;
    }

    if (hudCache.lastScore !== score) {
      const d = score - hudCache.lastScore;
      if (Math.abs(d) <= 10) {
        popScore(d);
        restartAnim(hudEls.scoreCard, d > 0 ? 'gain' : 'loss');
      }
      hudCache.lastScore = score;
    }
    const diff = score - hudCache.shown;
    if (Math.abs(diff) > 0.01) {
      hudCache.shown += diff * (1 - Math.exp(-9 * dt));
      if (Math.abs(score - hudCache.shown) < 0.5) hudCache.shown = score;
      const shownInt = Math.round(hudCache.shown);
      if (shownInt !== hudCache.shownInt) {
        hudCache.shownInt = shownInt;
        hudEls.scoreNum.textContent = shownInt;
      }
    }

    const sec = Math.max(0, Math.ceil(timeLeft));
    if (sec !== hudCache.sec) {
      hudCache.sec = sec;
      hudEls.timeText.textContent = fmtTime(timeLeft);
      hudEls.time.classList.toggle('warn', sec <= 60 && sec > 20);
      hudEls.time.classList.toggle('crit', sec <= 20);
    }
    const off = RING_LEN * (1 - clamp(timeLeft / ROUND_TIME, 0, 1));
    if (Math.abs(off - hudCache.ringOff) > 0.05) {
      hudCache.ringOff = off;
      hudEls.timeRing.style.strokeDashoffset = off.toFixed(2);
    }

    if (hudCache.level !== level) {
      hudCache.level = level;
      hudEls.level.textContent = 'Nivel ' + (level + 1) + '/' + MAX_LEVEL + ' · ' + themeFor(level).name;
    }
    const placed = goalTotal - animals.length;
    if (hudCache.placed !== placed || hudCache.total !== goalTotal) {
      hudCache.placed = placed;
      hudCache.total = goalTotal;
      hudEls.goalText.textContent = 'Animales ' + placed + '/' + goalTotal;
      hudEls.goalFill.style.transform = 'scaleX(' + (goalTotal ? clamp(placed / goalTotal, 0, 1) : 0).toFixed(3) + ')';
    }

    const heldKey = held ? held.mesh.userData.kind : '';
    if (heldKey !== hudCache.held) {
      hudCache.held = heldKey;
      hudEls.held.classList.toggle('has', !!held);
      hudEls.heldEmoji.textContent = held ? (EMOJI[heldKey] || '🐾') : '✋';
      hudEls.heldName.textContent = held ? held.mesh.userData.name : 'Manos vacías';
    }

    let es = 'wait';
    const alive = enemies.filter((e) => e.state !== 'out').length;
    let et = 'Enemigos: ' + alive + ' (esperando)';
    let maxStun = 0;
    enemies.forEach((e) => { if (e.state !== 'out' && e.stun > maxStun) maxStun = e.stun; });
    if (heldEnemy) { es = 'stun'; et = 'Sujetas al enemigo · Q lo lanza'; }
    else if (maxStun > 0) { es = 'stun'; et = 'Aturdido ' + Math.ceil(maxStun) + 's · Q sujeta'; }
    else if (state === 'play') { es = 'chase'; et = 'Enemigos: ' + alive; }
    if (et !== hudCache.enemy) {
      hudCache.enemy = et;
      hudEls.enemyText.textContent = et;
      hudEls.enemy.dataset.state = es;
    }

    const shownRec = Math.max(records.best, score);
    const recKey = shownRec + (score > records.best && score > 0 ? 'n' : '');
    if (recKey !== hudCache.record) {
      hudCache.record = recKey;
      hudEls.recordText.textContent = 'Récord ' + shownRec;
      hudEls.record.classList.toggle('new', score > records.best && score > 0);
    }

    if (toastUntil && performance.now() > toastUntil) {
      toastEl.classList.remove('show');
      toastUntil = 0;
    }
  }

  // =====================================================================
  //  CÁMARA, SOMBRAS Y RESOLUCIÓN ADAPTABLE
  // =====================================================================
  const _desired = new THREE.Vector3();
  function updateCamera(dt) {
    const dist = 12 + level * 0.85;
    _desired.set(
      player.pos.x + player.vel.x * 0.12,
      player.pos.y + dist * 0.82,
      player.pos.z + dist + player.vel.z * 0.12
    );
    camPos.lerp(_desired, 1 - Math.exp(-4 * dt));
    camera.position.copy(camPos);
    if (shake > 0.001) {
      camera.position.x += (Math.random() - 0.5) * shake;
      camera.position.y += (Math.random() - 0.5) * shake;
      shake *= Math.exp(-9 * dt);
    }
    camLook.set(player.pos.x, player.pos.y + 0.6, player.pos.z);
    camera.lookAt(camLook);

    // la sombra y la luz siguen al jugador (así funciona en mapas grandes)
    const texel = 52 / 2048;
    const tx = Math.round(player.pos.x / texel) * texel;
    const tz = Math.round(player.pos.z / texel) * texel;
    sun.target.position.set(tx, 0, tz);
    sun.position.set(tx + SUN_OFFSET.x, SUN_OFFSET.y, tz + SUN_OFFSET.z);
    sun.target.updateMatrixWorld();
    glowLight.position.set(player.pos.x, 8, player.pos.z + 6);
  }

  const perf = {
    ratio: Math.min(window.devicePixelRatio || 1, 2),
    max: Math.min(window.devicePixelRatio || 1, 2),
    acc: 0,
    frames: 0,
    noRaiseUntil: 0
  };
  function applyRenderSize() {
    renderer.setPixelRatio(perf.ratio);
    renderer.setSize(innerWidth, innerHeight);
    fireflySystem.material.uniforms.uScale.value =
      renderer.domElement.height / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov * 0.5)));
  }
  function trackPerf(raw, now) {
    if (raw > 0.25) return;
    perf.acc += raw;
    perf.frames++;
    if (perf.acc < 1.2) return;
    const fps = perf.frames / perf.acc;
    let r = perf.ratio;
    if (fps < 46 && r > 1) {
      r = Math.max(1, r - 0.25);
      perf.noRaiseUntil = now + 10000;
    } else if (fps > 58 && r < perf.max && now > perf.noRaiseUntil) {
      r = Math.min(perf.max, r + 0.25);
    }
    if (r !== perf.ratio) { perf.ratio = r; applyRenderSize(); }
    perf.acc = 0;
    perf.frames = 0;
  }

  // =====================================================================
  //  BUCLE PRINCIPAL
  // =====================================================================
  function nearestEnemyDistance() {
    let d = 99;
    for (const e of enemies) {
      if (e.state === 'out' || e.state === 'held' || e.stun > 0) continue;
      d = Math.min(d, Math.hypot(e.pos.x - player.pos.x, e.pos.z - player.pos.z));
    }
    return d;
  }

  let last = performance.now();
  function frame(now) {
    const raw = (now - last) / 1000;
    last = now;
    const dt = Math.min(0.033, raw);
    trackPerf(raw, now);
    if (state === 'intro') {
      introT -= dt;
      stepPlayer(dt);
      updateAnimals(dt);
      updateBullets(dt);
      resolveBodies();
      if (introT <= 0) {
        state = 'play';
        toast('¡' + (enemies.length === 1 ? 'El enemigo empezó' : 'Los enemigos empezaron') + ' a perseguirte!');
      }
    } else if (state === 'play') {
      timeLeft -= dt;
      if (timeLeft <= 0) {
        timeLeft = 0;
        endGame(false, 'Se acabó el tiempo.');
      } else {
        stepPlayer(dt);
        updateAnimals(dt);
        for (const e of enemies) stepEnemy(e, dt);
        updateBullets(dt);
        resolveBodies();
      }
    } else if (state === 'levelup') {
      levelupT -= dt;
      updateAnimals(dt);
      if (levelupT <= 0) startQuiz();
    } else if (state === 'menu') {
      updateAnimals(dt);
    }
    if (state === 'play' || state === 'intro') {
      audio.danger += (clamp(1 - nearestEnemyDistance() / 9, 0, 1) - audio.danger) * (1 - Math.exp(-2 * dt));
    } else {
      audio.danger *= Math.exp(-2 * dt);
    }
    syncMeshes(dt);
    updateParticles(dt);
    updateFireflies(now);
    updateBaskets(dt, now);
    updateSigns(now);
    updateCamera(dt);
    updateBackdrop(dt);
    updateHud(dt);
    renderer.render(scene, camera);
    requestAnimationFrame(frame);
  }
  document.addEventListener('visibilitychange', () => { last = performance.now(); });

  // =====================================================================
  //  CONTROLES
  // =====================================================================
  function bindHold(id, name) {
    const el = $(id);
    const setState = (active) => {
      buttons[name] = active;
      el.classList.toggle('active', active);
    };
    const down = (e) => {
      e.preventDefault();
      if (typeof e.pointerId !== 'undefined') {
        try { el.setPointerCapture(e.pointerId); } catch (err) { /* sin captura */ }
      }
      setState(true);
      if (name === 'grab') latch.grab = true;
      if (name === 'seize') latch.seize = true;
    };
    const up = (e) => {
      if (e && typeof e.pointerId !== 'undefined') {
        try { el.releasePointerCapture(e.pointerId); } catch (err) { /* sin captura */ }
      }
      setState(false);
    };
    el.addEventListener('pointerdown', down);
    el.addEventListener('pointerup', up);
    el.addEventListener('pointerleave', () => setState(false));
    el.addEventListener('pointercancel', up);
    el.addEventListener('lostpointercapture', () => setState(false));
    el.addEventListener('contextmenu', (e) => e.preventDefault());
  }
  bindHold('btn-left', 'left');
  bindHold('btn-right', 'right');
  bindHold('btn-up', 'up');
  bindHold('btn-down', 'down');
  bindHold('btn-jump', 'jump');
  bindHold('btn-grab', 'grab');
  bindHold('btn-shoot', 'shoot');
  bindHold('btn-seize', 'seize');
  bindHold('btn-rotl', 'rotL');
  bindHold('btn-rotr', 'rotR');

  function clearInputState() {
    Object.keys(keys).forEach((k) => { keys[k] = false; });
    Object.keys(buttons).forEach((k) => { buttons[k] = false; });
    document.querySelectorAll('button').forEach((b) => b.classList.remove('active'));
  }

  const REPEAT_BLOCK = [' ', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'w', 'a', 's', 'd', 'q', 'e', 'f', 'r', 'z', 'x'];
  window.addEventListener('keydown', (e) => {
    const key = e.key.toLowerCase();
    if (state === 'quiz') {
      if (key >= '1' && key <= '9') { answerQuiz(Number(key) - 1); e.preventDefault(); }
      else if (key === 'enter' || key === ' ') { nextQuiz(); e.preventDefault(); }
      return;
    }
    if (!overlay.hidden && key === 'enter' && (state === 'menu' || state === 'dead' || state === 'win')) {
      begin();
      e.preventDefault();
      return;
    }
    if (key === 'm' && !e.repeat) { hudEls.sound.click(); return; }
    if (e.repeat && REPEAT_BLOCK.includes(key)) return;
    if (!e.repeat) {
      if (key === 'e' || key === 'f') latch.grab = true;
      if (key === 'q') latch.seize = true;
    }
    keys[key] = true;
    if ([' ', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(key)) e.preventDefault();
  });
  window.addEventListener('keyup', (e) => { keys[e.key.toLowerCase()] = false; });
  window.addEventListener('blur', clearInputState);

  let resizeTimer = 0;
  window.addEventListener('resize', () => {
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
    applyRenderSize();
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => drawForest(forestTheme), 250);
  });

  ovBtn.addEventListener('click', () => {
    ovBtn.blur();
    if (state === 'menu' || state === 'dead' || state === 'win') begin();
  });
  qEls.next.addEventListener('click', nextQuiz);

  function refreshSoundButton() {
    hudEls.sound.textContent = audio.enabled ? '🔊' : '🔇';
    hudEls.sound.setAttribute('aria-pressed', audio.enabled ? 'true' : 'false');
  }
  hudEls.sound.addEventListener('click', () => { toggleSound(); refreshSoundButton(); });
  hudEls.sound.addEventListener('pointerdown', (e) => e.stopPropagation());
  refreshSoundButton();
  ['pointerdown', 'keydown'].forEach((ev) => window.addEventListener(ev, ensureAudio, { passive: true }));
  window.addEventListener('pagehide', () => {
    if (score > records.best) { records.best = score; saveRecords(); }
  });

  // =====================================================================
  //  ARRANQUE
  // =====================================================================
  applyRenderSize();
  showOverlay('Clasificación de animales', 'Lleva cada animal al corral correcto, esquiva a los enemigos y responde las preguntas de cada nivel.', 'Empezar', true);
  startLevel(0, 'menu');
  requestAnimationFrame(frame);
  if (document.fonts && document.fonts.load) {
    document.fonts.load('700 100px "Fredoka"').then(() => {
      signs.forEach((sg) => sg.sprite.userData.redraw && sg.sprite.userData.redraw());
    }).catch(() => { });
  }

  window.__game = {
    snapshot() {
      return {
        state, score, lives, timeLeft, level,
        animals: animals.length,
        held: held ? held.mesh.userData.name : null,
        heldEnemy: !!heldEnemy,
        player: player.pos.clone(),
        enemies: enemies.map((e) => ({ x: e.pos.x, y: e.pos.y, z: e.pos.z, stun: e.stun, state: e.state })),
        baskets: baskets.map((b) => ({ x: b.x, z: b.z, vertebrate: b.vertebrate })),
        best: records.best
      };
    },
    // utilidades de prueba
    _skipLevel() { animals.slice().forEach(disposeAnimal); animals = []; onLevelComplete(); },
    _t: {
      player, startLevel, endGame, begin,
      enemies: () => enemies,
      animals: () => animals,
      solids: () => solids.length,
      setScore(n) { score = n; },
      setLives(n) { lives = n; },
      held: () => held,
      grab: () => tryGrabOrDrop(),
      seize: () => trySeize(),
      stunAll() { enemies.forEach((e) => { e.stun = STUN_TIME; }); },
      cells: () => cells.size,
      state: () => state
    }
  };
})();
