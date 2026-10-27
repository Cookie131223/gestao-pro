// Cena 3D realista do prédio em obra (three.js puro, sem React — o Predio3D.web.tsx só monta e desmonta).
// Realismo: reflexos de um "estúdio" montado na hora (sem baixar HDR), concreto com textura, pele de vidro
// refletindo o céu, guindaste de treliça em aço pintado, cabos de verdade, terreno de brita com sombra suave
// e um contêiner de canteiro. Andares concluídos: laje + pilares + fachada de vidro (janelas acesas no tema escuro).
// Andar em execução: pilares subindo e laje sendo concretada (concreto fresco, mais escuro e úmido).
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

export type OpcoesPredio = { andares: number; tema: 'claro' | 'escuro'; vitrine: boolean; progresso: () => number };

// ===== AJUSTES =====
const ALTURA_ANDAR = 0.42;
const LARGURA = 2.4, PROFUNDIDADE = 1.7;
const VELOCIDADE_GIRO = 0.12;   // giro automático da câmera (rad/s)
const ENQUADRAMENTO = 0.74;     // >1 afasta a câmera, <1 aproxima

export function temWebGL() {
  try { const c = document.createElement('canvas'); return !!(c.getContext('webgl2') || c.getContext('webgl')); } catch { return false; }
}

// ---------- texturas geradas na hora ----------
function texturaRuido(tam: number, base: [number, number, number], variacao: number, manchas: number, seed = 1) {
  const c = document.createElement('canvas'); c.width = c.height = tam;
  const g = c.getContext('2d')!;
  const img = g.createImageData(tam, tam);
  let s = seed * 9301 + 49297;
  const rnd = () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
  for (let i = 0; i < tam * tam; i++) {
    const n = (rnd() - 0.5) * variacao;
    img.data[i * 4] = base[0] + n; img.data[i * 4 + 1] = base[1] + n; img.data[i * 4 + 2] = base[2] + n; img.data[i * 4 + 3] = 255;
  }
  g.putImageData(img, 0, 0);
  // manchas suaves (umidade, desgaste)
  for (let i = 0; i < manchas; i++) {
    const x = rnd() * tam, y = rnd() * tam, r = 6 + rnd() * tam * 0.18;
    const gr = g.createRadialGradient(x, y, 0, x, y, r);
    const escura = rnd() > 0.5;
    gr.addColorStop(0, escura ? 'rgba(0,0,0,0.10)' : 'rgba(255,255,255,0.08)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2);
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  return t;
}
function texturaRadial(tam: number) {
  const c = document.createElement('canvas'); c.width = c.height = tam;
  const g = c.getContext('2d')!;
  const gr = g.createRadialGradient(tam / 2, tam / 2, 0, tam / 2, tam / 2, tam / 2);
  gr.addColorStop(0, '#fff'); gr.addColorStop(0.62, '#fff'); gr.addColorStop(1, '#000');
  g.fillStyle = gr; g.fillRect(0, 0, tam, tam);
  return new THREE.CanvasTexture(c);
}

// ---------- ambiente para reflexos (céu de fim de tarde no tema escuro, dia nublado no claro) ----------
function ambiente(renderer: THREE.WebGLRenderer, escuro: boolean) {
  const sala = new THREE.Scene();
  sala.add(new THREE.Mesh(new THREE.BoxGeometry(20, 20, 20), new THREE.MeshBasicMaterial({ color: escuro ? 0x1a1f28 : 0x8a8f96, side: THREE.BackSide })));
  const painel = (w: number, h: number, cor: number, int: number, pos: [number, number, number]) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: new THREE.Color(cor).multiplyScalar(int), side: THREE.DoubleSide }));
    m.position.set(...pos); m.lookAt(0, 0, 0); sala.add(m);
  };
  painel(18, 6, escuro ? 0x7d9cc4 : 0xdfe9f5, escuro ? 1.8 : 2.4, [0, 9.5, 0]);     // céu
  painel(6, 3, 0xffd9a0, escuro ? 3.5 : 5, [7, 4, 5]);                               // sol baixo
  painel(14, 3, escuro ? 0xff9a4a : 0xfff1dc, escuro ? 1.6 : 1.4, [0, 1, -9.5]);    // horizonte
  painel(4, 8, 0xcfe0ff, escuro ? 0.6 : 1.4, [-9, 2, 2]);                            // preenchimento frio
  painel(14, 14, escuro ? 0x2a2622 : 0x9a9184, 0.8, [0, -9.5, 0]);                   // chão
  const pm = new THREE.PMREMGenerator(renderer);
  const env = pm.fromScene(sala, 0.04).texture;
  pm.dispose(); sala.traverse(o => { const m = o as THREE.Mesh; m.geometry?.dispose(); (m.material as THREE.Material | undefined)?.dispose(); });
  return env;
}

// cilindro entre dois pontos (barras de treliça, cabos)
const EIXO_Y = new THREE.Vector3(0, 1, 0);
function barra(a: THREE.Vector3, b: THREE.Vector3, r: number, lados = 6) {
  const len = a.distanceTo(b);
  const g = new THREE.CylinderGeometry(r, r, len, lados, 1, false);
  const q = new THREE.Quaternion().setFromUnitVectors(EIXO_Y, b.clone().sub(a).normalize());
  g.applyMatrix4(new THREE.Matrix4().compose(a.clone().add(b).multiplyScalar(0.5), q, new THREE.Vector3(1, 1, 1)));
  return g;
}

export function criarCenaPredio(el: HTMLElement, op: OpcoesPredio) {
  const { andares, vitrine } = op;
  const escuro = op.tema === 'escuro';
  const reduzir = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const celular = window.matchMedia('(pointer: coarse)').matches;

  const renderer = new THREE.WebGLRenderer({ antialias: !celular, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, celular ? 1.5 : 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = escuro ? 1.0 : 1.05;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.setClearColor(0x000000, 0);
  const canvas = renderer.domElement;
  Object.assign(canvas.style, { position: 'absolute', inset: '0', width: '100%', height: '100%', display: 'block', cursor: 'grab', touchAction: 'pan-y' });
  canvas.setAttribute('aria-hidden', 'true');
  el.appendChild(canvas);

  const cena = new THREE.Scene();
  cena.environment = ambiente(renderer, escuro);
  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);
  const alturaTotal = andares * ALTURA_ANDAR;
  const descartaveis: { dispose: () => void }[] = [];
  const guarda = <T extends { dispose: () => void }>(x: T) => { descartaveis.push(x); return x; };

  // ---------- luz ----------
  cena.add(new THREE.HemisphereLight(escuro ? 0x8fa6c4 : 0xffffff, escuro ? 0x2a241e : 0xb9ae9c, escuro ? 0.55 : 0.8));
  const sol = new THREE.DirectionalLight(escuro ? 0xffdcb8 : 0xfff1dc, escuro ? 2.6 : 2.8);
  sol.position.set(6, 8, 5);
  sol.castShadow = true;
  sol.shadow.mapSize.set(celular ? 1024 : 2048, celular ? 1024 : 2048);
  Object.assign(sol.shadow.camera, { left: -5, right: 5, top: 7, bottom: -3, near: 1, far: 30 });
  sol.shadow.bias = -0.0005; sol.shadow.normalBias = 0.02; sol.shadow.radius = 3;
  cena.add(sol);

  // ---------- materiais ----------
  const texConcreto = guarda(texturaRuido(256, [176, 172, 164], 26, 40, 3)); texConcreto.repeat.set(2, 2);
  const texBrita = guarda(texturaRuido(256, escuro ? [84, 82, 78] : [150, 142, 128], 50, 70, 7)); texBrita.repeat.set(6, 6);
  const mat = {
    terreno: guarda(new THREE.MeshStandardMaterial({ map: texBrita, roughness: 1, transparent: true, alphaMap: guarda(texturaRadial(256)) })),
    concreto: guarda(new THREE.MeshStandardMaterial({ color: 0xf2f0ec, map: texConcreto, roughness: 0.88, metalness: 0 })),
    concretoFresco: guarda(new THREE.MeshStandardMaterial({ color: 0x8a857c, map: texConcreto, roughness: 0.45, metalness: 0 })),
    vidro: guarda(new THREE.MeshPhysicalMaterial({ color: escuro ? 0x2c4c66 : 0x4d7690, metalness: 0.55, roughness: 0.07, clearcoat: 1, clearcoatRoughness: 0.05, envMapIntensity: 2.6 })),
    janelaAcesa: guarda(new THREE.MeshStandardMaterial({ color: 0x6b4a20, emissive: 0xffa53a, emissiveIntensity: escuro ? 1.1 : 0.4, roughness: 0.35 })),
    caixilho: guarda(new THREE.MeshStandardMaterial({ color: 0x9aa1a8, metalness: 0.9, roughness: 0.32 })),
    miolo: guarda(new THREE.MeshStandardMaterial({ color: 0x1b1d20, roughness: 0.9 })),
    amarelo: guarda(new THREE.MeshPhysicalMaterial({ color: 0xf5b800, metalness: 0.35, roughness: 0.38, clearcoat: 0.7, clearcoatRoughness: 0.25 })),
    grafite: guarda(new THREE.MeshPhysicalMaterial({ color: 0x2a2e34, metalness: 0.4, roughness: 0.45, clearcoat: 0.4 })),
    aco: guarda(new THREE.MeshStandardMaterial({ color: 0xb8bcc2, metalness: 1, roughness: 0.3 })),
    cabo: guarda(new THREE.MeshStandardMaterial({ color: 0x24272b, metalness: 0.8, roughness: 0.4 })),
    andaime: guarda(new THREE.MeshStandardMaterial({ color: 0xc9cdd2, metalness: 0.9, roughness: 0.35 })),
    madeira: guarda(new THREE.MeshStandardMaterial({ color: 0x9c7a52, roughness: 0.85 })),
    bloco: guarda(new THREE.MeshStandardMaterial({ color: 0xb6a99a, map: texConcreto, roughness: 0.95 })),
    conteiner: guarda(new THREE.MeshPhysicalMaterial({ color: 0x2f6f8f, metalness: 0.5, roughness: 0.42, clearcoat: 0.3 })),
  };
  const caixaGeo = guarda(new THREE.BoxGeometry(1, 1, 1));
  const bloco = (m: THREE.Material, sombra = true) => { const b = new THREE.Mesh(caixaGeo, m); b.castShadow = sombra; b.receiveShadow = true; return b; };
  const malha = (g: THREE.BufferGeometry, m: THREE.Material, sombra = true) => { guarda(g); const x = new THREE.Mesh(g, m); x.castShadow = sombra; x.receiveShadow = true; return x; };

  // ---------- terreno de brita com borda que some (sem "disco") ----------
  const terreno = new THREE.Mesh(guarda(new THREE.CircleGeometry(5.2, 96)), mat.terreno);
  terreno.rotation.x = -Math.PI / 2; terreno.receiveShadow = true; cena.add(terreno);

  // tapume listrado (barreira de obra)
  const fx = LARGURA / 2 + 0.75, fz = PROFUNDIDADE / 2 + 0.75;
  {
    const am: THREE.BufferGeometry[] = [], gr: THREE.BufferGeometry[] = [];
    const lado = (x: number, z: number, comp: number, girar: boolean) => {
      const n = Math.round(comp / 0.25);
      for (let i = 0; i < n; i++) {
        const t = -comp / 2 + 0.125 + i * 0.25;
        const g = new THREE.BoxGeometry(0.25, 0.09, 0.035);
        if (girar) g.rotateY(Math.PI / 2);
        g.translate(girar ? x : x + t, 0.13, girar ? z + t : z);
        (i % 2 ? gr : am).push(g);
      }
      // pés de aço
      for (let i = 0; i <= n; i += 2) { const t = -comp / 2 + i * 0.25; const p = new THREE.BoxGeometry(0.03, 0.17, 0.03); p.translate(girar ? x : x + t, 0.085, girar ? z + t : z); gr.push(p); }
    };
    lado(0, fz, fx * 2, false); lado(0, -fz, fx * 2, false); lado(fx, 0, fz * 2, true); lado(-fx, 0, fz * 2, true);
    cena.add(malha(mergeGeometries(am), mat.amarelo, false), malha(mergeGeometries(gr), mat.grafite, false));
    am.concat(gr).forEach(g => g.dispose());
  }

  // contêiner do canteiro (chapa ondulada) + paletes de blocos
  {
    const c = new THREE.Group(); c.position.set(fx - 0.15, 0, fz + 0.55); c.rotation.y = -0.25;
    const corpo = bloco(mat.conteiner); corpo.scale.set(1.1, 0.42, 0.42); corpo.position.y = 0.21; c.add(corpo);
    const ondas: THREE.BufferGeometry[] = [];
    for (let i = 0; i < 22; i++) { const g = new THREE.BoxGeometry(0.02, 0.38, 0.44); g.translate(-0.52 + i * 0.05, 0.21, 0); ondas.push(g); }
    c.add(malha(mergeGeometries(ondas), mat.conteiner)); ondas.forEach(g => g.dispose());
    const porta = bloco(mat.grafite); porta.scale.set(0.2, 0.3, 0.01); porta.position.set(0.3, 0.17, 0.215); c.add(porta);
    const janela = bloco(mat.janelaAcesa, false); janela.scale.set(0.22, 0.12, 0.01); janela.position.set(-0.2, 0.26, 0.215); c.add(janela);
    cena.add(c);
    const palete = (x: number, z: number, r: number) => {
      const p = new THREE.Group(); p.position.set(x, 0, z); p.rotation.y = r;
      const base = bloco(mat.madeira); base.scale.set(0.36, 0.04, 0.3); base.position.y = 0.02; p.add(base);
      const pilha = bloco(mat.bloco); pilha.scale.set(0.32, 0.18, 0.26); pilha.position.y = 0.13; p.add(pilha);
      cena.add(p);
    };
    palete(-fx + 0.35, fz + 0.45, 0.2); palete(-fx + 0.8, fz + 0.5, -0.1);
  }

  // ---------- prédio: um grupo por andar ----------
  type Andar = { pilares: THREE.Mesh[]; laje: THREE.Mesh; fachada: THREE.Group; andaime: THREE.Mesh };
  const predio = new THREE.Group(); cena.add(predio);
  const fundacao = bloco(mat.concreto); fundacao.scale.set(LARGURA + 0.3, 0.12, PROFUNDIDADE + 0.3); fundacao.position.y = 0.06; predio.add(fundacao);
  const listaAndares: Andar[] = [];
  const posPilares: [number, number][] = [];
  for (const x of [-1, -1 / 3, 1 / 3, 1]) for (const z of [-1, 1]) posPilares.push([x * (LARGURA / 2 - 0.07), z * (PROFUNDIDADE / 2 - 0.07)]);
  // andaime tubular (uma geometria só, reaproveitada em todos os andares)
  const andaimeGeo = (() => {
    const W = LARGURA / 2 + 0.09, D = PROFUNDIDADE / 2 + 0.09, H = ALTURA_ANDAR / 2, gs: THREE.BufferGeometry[] = [];
    const v = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);
    for (const [x, z] of [[-W, -D], [W, -D], [W, D], [-W, D]]) gs.push(barra(v(x, -H, z), v(x, H, z), 0.012));
    for (const y of [-H, H]) { gs.push(barra(v(-W, y, D), v(W, y, D), 0.01), barra(v(-W, y, -D), v(W, y, -D), 0.01), barra(v(W, y, -D), v(W, y, D), 0.01), barra(v(-W, y, -D), v(-W, y, D), 0.01)); }
    gs.push(barra(v(-W, -H, D), v(0, H, D), 0.008), barra(v(0, -H, -D), v(W, H, -D), 0.008), barra(v(W, -H, -D), v(W, H, D), 0.008), barra(v(-W, -H, D), v(-W, H, -D), 0.008));
    const g = mergeGeometries(gs); gs.forEach(x => x.dispose()); return guarda(g);
  })();
  const pilarGeo = guarda(new THREE.BoxGeometry(0.11, 1, 0.11));
  for (let i = 0; i < andares; i++) {
    const base = 0.12 + i * ALTURA_ANDAR;
    const pilares = posPilares.map(([x, z]) => { const p = new THREE.Mesh(pilarGeo, mat.concreto); p.castShadow = p.receiveShadow = true; p.scale.y = ALTURA_ANDAR; p.position.set(x, base, z); predio.add(p); return p; });
    const laje = bloco(mat.concreto); laje.scale.set(LARGURA + 0.08, 0.07, PROFUNDIDADE + 0.08); laje.position.y = base + ALTURA_ANDAR - 0.035; predio.add(laje);
    // fachada: pele de vidro + caixilhos de alumínio + miolo escuro (vira 3 malhas por andar)
    const vidros: THREE.BufferGeometry[] = [], acesas: THREE.BufferGeometry[] = [], caix: THREE.BufferGeometry[] = [];
    const yJ = base + (ALTURA_ANDAR - 0.07) / 2, hJ = ALTURA_ANDAR - 0.1;
    const painel = (w: number, x: number, z: number, rotY: number) => {
      const n = Math.max(2, Math.round(w / 0.42));
      for (let k = 0; k < n; k++) {
        const acesa = ((i * 7 + k * 3 + (rotY ? 5 : 0)) % 5) === 0;
        const t = -w / 2 + (k + 0.5) * (w / n);
        const g = new THREE.BoxGeometry(w / n - 0.03, hJ, 0.02); g.rotateY(rotY); g.translate(rotY ? x : x + t, yJ, rotY ? z + t : z);
        (acesa ? acesas : vidros).push(g);
        const tc = -w / 2 + k * (w / n);
        const c = new THREE.BoxGeometry(0.025, hJ + 0.02, 0.035); c.rotateY(rotY); c.translate(rotY ? x : x + tc, yJ, rotY ? z + tc : z); caix.push(c);
      }
      const h1 = new THREE.BoxGeometry(w, 0.022, 0.035); h1.rotateY(rotY); h1.translate(x, yJ + hJ * 0.18, z); caix.push(h1);
    };
    painel(LARGURA - 0.16, 0, PROFUNDIDADE / 2 - 0.02, 0); painel(LARGURA - 0.16, 0, -PROFUNDIDADE / 2 + 0.02, 0);
    painel(PROFUNDIDADE - 0.16, LARGURA / 2 - 0.02, 0, Math.PI / 2); painel(PROFUNDIDADE - 0.16, -LARGURA / 2 + 0.02, 0, Math.PI / 2);
    const fachada = new THREE.Group();
    fachada.add(malha(mergeGeometries(vidros), mat.vidro, false), malha(mergeGeometries(caix), mat.caixilho, false));
    if (acesas.length) fachada.add(malha(mergeGeometries(acesas), mat.janelaAcesa, false));
    const miolo = bloco(mat.miolo, false); miolo.scale.set(LARGURA - 0.3, ALTURA_ANDAR - 0.08, PROFUNDIDADE - 0.3); miolo.position.y = yJ; fachada.add(miolo);
    vidros.concat(acesas, caix).forEach(g => g.dispose());
    predio.add(fachada);
    const andaime = new THREE.Mesh(andaimeGeo, mat.andaime); andaime.castShadow = true; andaime.position.y = base + ALTURA_ANDAR / 2; predio.add(andaime);
    listaAndares.push({ pilares, laje, fachada, andaime });
  }
  // cobertura (aparece com 100%)
  const cobertura = new THREE.Group();
  const casaMaq = bloco(mat.concreto); casaMaq.scale.set(0.7, 0.32, 0.6); casaMaq.position.set(0.5, 0.16, -0.2); cobertura.add(casaMaq);
  const caixaAgua = bloco(mat.grafite); caixaAgua.scale.set(0.5, 0.22, 0.45); caixaAgua.position.set(-0.55, 0.11, 0.2); cobertura.add(caixaAgua);
  const platibanda = bloco(mat.caixilho); platibanda.scale.set(LARGURA + 0.08, 0.05, PROFUNDIDADE + 0.08); platibanda.position.y = 0.0; cobertura.add(platibanda);
  cobertura.position.y = 0.12 + andares * ALTURA_ANDAR; predio.add(cobertura);

  // ---------- guindaste de treliça ----------
  const grua = new THREE.Group(); grua.position.set(-LARGURA / 2 - 0.55, 0, -PROFUNDIDADE / 2 - 0.35); cena.add(grua);
  const alturaGrua = alturaTotal + 1.1;
  {
    const s = 0.085, gs: THREE.BufferGeometry[] = [], v = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);
    const cantos: [number, number][] = [[-s, -s], [s, -s], [s, s], [-s, s]];
    for (const [x, z] of cantos) gs.push(barra(v(x, 0, z), v(x, alturaGrua, z), 0.014));
    const passo = 0.24;
    for (let y = 0; y < alturaGrua - 0.01; y += passo) {
      const y2 = Math.min(alturaGrua, y + passo);
      for (let k = 0; k < 4; k++) {
        const [ax, az] = cantos[k], [bx, bz] = cantos[(k + 1) % 4];
        gs.push(barra(v(ax, y, az), v(bx, y, bz), 0.008));
        gs.push(k % 2 ? barra(v(ax, y, az), v(bx, y2, bz), 0.007) : barra(v(bx, y, bz), v(ax, y2, az), 0.007));
      }
    }
    grua.add(malha(mergeGeometries(gs), mat.amarelo)); gs.forEach(g => g.dispose());
    const sapata = bloco(mat.concreto); sapata.scale.set(0.5, 0.1, 0.5); sapata.position.y = 0.05; grua.add(sapata);
  }
  const giro = new THREE.Group(); giro.position.y = alturaGrua; grua.add(giro);
  {
    const cabine = bloco(mat.grafite); cabine.scale.set(0.24, 0.2, 0.22); cabine.position.set(0.16, -0.06, 0.12); giro.add(cabine);
    const vidroCab = bloco(mat.vidro, false); vidroCab.scale.set(0.2, 0.12, 0.01); vidroCab.position.set(0.16, -0.04, 0.231); giro.add(vidroCab);
    // lança e contralança em treliça triangular
    const gs: THREE.BufferGeometry[] = [], v = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);
    const trelica = (x0: number, x1: number, alt: number) => {
      const z = 0.06, ps = 0.2;
      gs.push(barra(v(x0, 0.06, -z), v(x1, 0.06, -z), 0.012), barra(v(x0, 0.06, z), v(x1, 0.06, z), 0.012), barra(v(x0, 0.06 + alt, 0), v(x1, 0.06 + alt, 0), 0.012));
      for (let x = x0; x < x1 - 0.01; x += ps) {
        const xb = Math.min(x1, x + ps);
        gs.push(barra(v(x, 0.06, -z), v(xb, 0.06 + alt, 0), 0.006), barra(v(x, 0.06, z), v(xb, 0.06 + alt, 0), 0.006), barra(v(x, 0.06, -z), v(x, 0.06, z), 0.006));
      }
    };
    trelica(0, 3.5, 0.12); trelica(-1.05, 0, 0.1);
    const mastro = [v(-0.05, 0.06, 0), v(0, 0.68, 0)];
    gs.push(barra(mastro[0], mastro[1], 0.02), barra(v(0.05, 0.06, 0), v(0, 0.68, 0), 0.02));
    giro.add(malha(mergeGeometries(gs), mat.amarelo)); gs.forEach(g => g.dispose());
    const contrapeso = bloco(mat.concreto); contrapeso.scale.set(0.3, 0.24, 0.18); contrapeso.position.set(-0.85, -0.02, 0); giro.add(contrapeso);
    // tirantes (cabos de aço)
    giro.add(malha(barra(v(0, 0.68, 0), v(3.2, 0.18, 0), 0.006, 4), mat.cabo, false), malha(barra(v(0, 0.68, 0), v(-0.9, 0.16, 0), 0.006, 4), mat.cabo, false));
  }
  const carro = new THREE.Group(); carro.position.set(2.2, 0.06, 0); giro.add(carro);
  const trole = bloco(mat.grafite); trole.scale.set(0.12, 0.05, 0.14); carro.add(trole);
  const cabo = malha(new THREE.CylinderGeometry(0.005, 0.005, 1, 4), mat.cabo, false); carro.add(cabo);
  const gancho = bloco(mat.amarelo); gancho.scale.set(0.05, 0.05, 0.05); carro.add(gancho);
  const carga = new THREE.Group(); carro.add(carga);
  {
    const p = bloco(mat.madeira); p.scale.set(0.34, 0.03, 0.26); p.position.y = -0.05; carga.add(p);
    const b = bloco(mat.bloco); b.scale.set(0.3, 0.12, 0.22); b.position.y = 0.025; carga.add(b);
  }

  // ---------- enquadramento e controle ----------
  let w = 1, h = 1;
  const ajustar = () => {
    w = Math.max(1, el.clientWidth); h = Math.max(1, el.clientHeight);
    renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix();
  };
  ajustar();
  const ro = new ResizeObserver(ajustar); ro.observe(el);

  let yaw = 0.75, arrastando = false, ultimoX = 0, inerciaYaw = 0, tocouEm = -10, relogio = 0;
  const down = (e: PointerEvent) => { arrastando = true; ultimoX = e.clientX; canvas.style.cursor = 'grabbing'; };
  const move = (e: PointerEvent) => { if (!arrastando) return; const dx = e.clientX - ultimoX; ultimoX = e.clientX; yaw -= dx * 0.008; inerciaYaw = -dx * 0.008; tocouEm = relogio; };
  const up = () => { arrastando = false; canvas.style.cursor = 'grab'; };
  canvas.addEventListener('pointerdown', down); window.addEventListener('pointermove', move); window.addEventListener('pointerup', up);

  // ---------- laço (pausa fora da tela / aba oculta) ----------
  let atual = 0, ultimo = performance.now(), id = 0, rodando = false, visivel = true, cicloVitrine = 0;
  const passo = (agora: number) => {
    if (!rodando) return;
    const dt = Math.min((agora - ultimo) / 1000, 0.05); ultimo = agora; relogio += dt;

    // progresso animado (vitrine: constrói em loop)
    let meta = Math.max(0, Math.min(100, op.progresso() || 0)) / 100;
    if (vitrine) { cicloVitrine = (cicloVitrine + dt / 12) % 1; meta = Math.min(1, cicloVitrine * 1.25); }
    atual += (meta - atual) * Math.min(1, dt * (vitrine ? 6 : 2.2));
    if (reduzir) atual = meta;
    const feito = atual * andares;

    listaAndares.forEach((a, i) => {
      const f = Math.max(0, Math.min(1, feito - i));            // 0..1 deste andar
      const sobe = Math.min(1, f / 0.55), laje = Math.max(0, Math.min(1, (f - 0.55) / 0.3)), vidro = Math.max(0, Math.min(1, (f - 0.85) / 0.15));
      const base = 0.12 + i * ALTURA_ANDAR;
      a.pilares.forEach((p) => { p.visible = sobe > 0.01; p.scale.y = ALTURA_ANDAR * Math.max(0.01, sobe); p.position.y = base + (ALTURA_ANDAR * sobe) / 2; });
      a.laje.visible = laje > 0.01; a.laje.scale.x = (LARGURA + 0.08) * Math.max(0.01, laje);
      a.laje.material = laje < 1 ? mat.concretoFresco : mat.concreto;
      a.fachada.visible = vidro > 0.01; a.fachada.scale.y = Math.max(0.01, vidro);
      a.fachada.position.y = (1 - vidro) * (base + ALTURA_ANDAR / 2);
      a.andaime.visible = f < 1 && i <= feito + 1;   // andaime só no andar em obra e no próximo
    });
    cobertura.visible = atual > 0.995;

    // guindaste: gira devagar, carro corre na lança, carga balança
    const subir = Math.min(alturaGrua - 0.3, 0.3 + feito * ALTURA_ANDAR + 0.4);
    if (!reduzir) giro.rotation.y = -0.6 + Math.sin(relogio * 0.35) * 0.9;
    carro.position.x = 1.4 + (Math.sin(relogio * 0.5) * 0.5 + 0.5) * 1.6;
    const comprimento = Math.max(0.25, alturaGrua - subir - 0.15 + (reduzir ? 0 : Math.sin(relogio * 0.9) * 0.15));
    cabo.scale.y = comprimento; cabo.position.y = -comprimento / 2;
    gancho.position.y = -comprimento; carga.position.y = -comprimento - 0.09;
    carga.rotation.y = reduzir ? 0 : Math.sin(relogio * 0.7) * 0.4;

    // câmera orbitando
    if (!arrastando) { if (relogio - tocouEm > 2.5 && !reduzir) yaw += dt * VELOCIDADE_GIRO; else { yaw += inerciaYaw; inerciaYaw *= 0.9; } }
    const meiaFov = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
    const raio = Math.max((alturaGrua + 1.4) * 0.62 / meiaFov, 6.4 / (meiaFov * Math.max(0.5, w / h))) * ENQUADRAMENTO;
    camera.position.set(Math.sin(yaw) * raio, alturaGrua * 0.55 + raio * 0.24, Math.cos(yaw) * raio);
    camera.lookAt(0, alturaGrua * 0.42, 0);

    renderer.render(cena, camera);
    id = requestAnimationFrame(passo);
  };
  const atualizar = () => {
    const deve = visivel && document.visibilityState === 'visible';
    if (deve && !rodando) { rodando = true; ultimo = performance.now(); id = requestAnimationFrame(passo); }
    else if (!deve && rodando) { rodando = false; cancelAnimationFrame(id); }
  };
  const io = new IntersectionObserver(([e]) => { visivel = e.isIntersecting; atualizar(); });
  io.observe(el);
  document.addEventListener('visibilitychange', atualizar);
  atualizar();

  return () => {
    rodando = false; cancelAnimationFrame(id);
    io.disconnect(); ro.disconnect();
    document.removeEventListener('visibilitychange', atualizar);
    canvas.removeEventListener('pointerdown', down); window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up);
    (cena.environment as THREE.Texture | null)?.dispose();
    cena.traverse(o => { const m = o as THREE.Mesh; if (m.isMesh) m.geometry.dispose(); });
    descartaveis.forEach((d) => d.dispose());
    renderer.dispose(); renderer.forceContextLoss();
    canvas.remove();
  };
}
