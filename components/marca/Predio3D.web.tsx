// Prédio 3D que vai sendo construído conforme o progresso da obra (somente web, three.js).
// Andares concluídos: laje + pilares + fachada de vidro (janelas acesas no tema escuro).
// Andar em execução: pilares subindo e laje sendo concretada. Andares futuros: andaime em linhas.
// Um guindaste gira devagar e leva uma carga. Arraste para girar o prédio.
import React, { useEffect, useRef } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import * as THREE from 'three';

import { C } from '../../constants/brand';
import Anel from './Anel';

type Props = {
  progresso: number;            // 0..100
  andares?: number;             // andares do prédio
  tema?: 'claro' | 'escuro';
  vitrine?: boolean;            // login: constrói em loop
  style?: StyleProp<ViewStyle>;
};

// ===== AJUSTES =====
const ALTURA_ANDAR = 0.42;
const LARGURA = 2.4, PROFUNDIDADE = 1.7;
const VELOCIDADE_GIRO = 0.14;   // giro automático da câmera (rad/s)

function temWebGL() {
  try { const c = document.createElement('canvas'); return !!(c.getContext('webgl2') || c.getContext('webgl')); } catch { return false; }
}

export default function Predio3D({ progresso, andares = 8, tema = 'claro', vitrine = false, style }: Props) {
  const caixa = useRef<View>(null);
  const alvo = useRef(progresso);
  const suporta = useRef<boolean | null>(null);
  if (suporta.current === null) suporta.current = typeof document !== 'undefined' && temWebGL();
  alvo.current = Math.max(0, Math.min(100, progresso || 0));

  useEffect(() => {
    const el = caixa.current as unknown as HTMLDivElement | null;
    if (!el || !suporta.current) return;
    const escuro = tema === 'escuro';
    const reduzir = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const celular = window.matchMedia('(pointer: coarse)').matches;

    const renderer = new THREE.WebGLRenderer({ antialias: !celular, alpha: true, powerPreference: 'low-power' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, celular ? 1.5 : 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.setClearColor(0x000000, 0);
    const canvas = renderer.domElement;
    Object.assign(canvas.style, { position: 'absolute', inset: '0', width: '100%', height: '100%', display: 'block', cursor: 'grab', touchAction: 'pan-y' });
    canvas.setAttribute('aria-hidden', 'true');
    el.appendChild(canvas);

    const cena = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);
    const alturaTotal = andares * ALTURA_ANDAR;

    // ---------- luz ----------
    cena.add(new THREE.HemisphereLight(escuro ? 0x9fb3c8 : 0xffffff, escuro ? 0x1d2024 : 0xbdb6a8, escuro ? 1.1 : 1.6));
    const sol = new THREE.DirectionalLight(0xfff1d6, escuro ? 1.6 : 2.2);
    sol.position.set(5, 9, 6);
    sol.castShadow = true;
    sol.shadow.mapSize.set(1024, 1024);
    Object.assign(sol.shadow.camera, { left: -6, right: 6, top: 8, bottom: -4, near: 1, far: 30 });
    sol.shadow.bias = -0.0008;
    cena.add(sol);

    // ---------- materiais ----------
    const mat = {
      chao: new THREE.MeshStandardMaterial({ color: escuro ? 0x2a2e34 : 0xe6e1d7, roughness: 1 }),
      concreto: new THREE.MeshStandardMaterial({ color: 0xbfb9ae, roughness: 0.9 }),
      concretoFresco: new THREE.MeshStandardMaterial({ color: 0x8f8a82, roughness: 1 }),
      vidro: new THREE.MeshStandardMaterial({ color: escuro ? 0x2b4a63 : 0x7fa3bb, roughness: 0.15, metalness: 0.4 }),
      janelaAcesa: new THREE.MeshStandardMaterial({ color: 0xffd680, emissive: 0xffb800, emissiveIntensity: escuro ? 1.4 : 0.35, roughness: 0.4 }),
      amarelo: new THREE.MeshStandardMaterial({ color: 0xf5b800, roughness: 0.55, metalness: 0.2 }),
      grafite: new THREE.MeshStandardMaterial({ color: 0x2a2e34, roughness: 0.7 }),
      andaime: new THREE.LineBasicMaterial({ color: 0xf5b800, transparent: true, opacity: escuro ? 0.45 : 0.6 }),
      cabo: new THREE.LineBasicMaterial({ color: escuro ? 0xcfd3d8 : 0x3a3f46 }),
    };
    const descartaveis: { dispose: () => void }[] = Object.values(mat);
    const geo = <T extends THREE.BufferGeometry>(g: T) => { descartaveis.push(g); return g; };
    const caixaGeo = geo(new THREE.BoxGeometry(1, 1, 1));
    const bloco = (m: THREE.Material, sombra = true) => { const b = new THREE.Mesh(caixaGeo, m); b.castShadow = sombra; b.receiveShadow = true; return b; };

    // ---------- terreno + tapume de obra ----------
    const chao = new THREE.Mesh(geo(new THREE.CylinderGeometry(6.2, 6.4, 0.16, 64)), mat.chao);
    chao.position.y = -0.08; chao.receiveShadow = true; cena.add(chao);
    const tapume = new THREE.Group();
    const lado = (x: number, z: number, comp: number, girar: boolean) => {
      const n = Math.round(comp / 0.25);
      for (let i = 0; i < n; i++) {
        const b = bloco(i % 2 ? mat.grafite : mat.amarelo, false);
        b.scale.set(0.25, 0.09, 0.04);
        const t = -comp / 2 + 0.125 + i * 0.25;
        b.position.set(girar ? x : x + t, 0.12, girar ? z + t : z);
        if (girar) b.rotation.y = Math.PI / 2;
        tapume.add(b);
      }
    };
    const fx = LARGURA / 2 + 0.75, fz = PROFUNDIDADE / 2 + 0.75;
    lado(0, fz, fx * 2, false); lado(0, -fz, fx * 2, false); lado(fx, 0, fz * 2, true); lado(-fx, 0, fz * 2, true);
    cena.add(tapume);

    // ---------- prédio: um grupo por andar ----------
    type Andar = { pilares: THREE.Mesh[]; laje: THREE.Mesh; fachada: THREE.Group; andaime: THREE.LineSegments; janelas: THREE.Mesh[] };
    const predio = new THREE.Group(); cena.add(predio);
    const fundacao = bloco(mat.concreto); fundacao.scale.set(LARGURA + 0.3, 0.12, PROFUNDIDADE + 0.3); fundacao.position.y = 0.06; predio.add(fundacao);
    const listaAndares: Andar[] = [];
    const posPilares: [number, number][] = [];
    for (const x of [-1, -1 / 3, 1 / 3, 1]) for (const z of [-1, 1]) posPilares.push([x * (LARGURA / 2 - 0.07), z * (PROFUNDIDADE / 2 - 0.07)]);
    const andaimeGeo = geo(new THREE.EdgesGeometry(new THREE.BoxGeometry(LARGURA + 0.12, ALTURA_ANDAR, PROFUNDIDADE + 0.12)));
    for (let i = 0; i < andares; i++) {
      const base = 0.12 + i * ALTURA_ANDAR;
      const pilares = posPilares.map(([x, z]) => { const p = bloco(mat.concreto); p.scale.set(0.11, ALTURA_ANDAR, 0.11); p.position.set(x, base, z); predio.add(p); return p; });
      const laje = bloco(mat.concreto); laje.scale.set(LARGURA + 0.08, 0.07, PROFUNDIDADE + 0.08); laje.position.y = base + ALTURA_ANDAR - 0.035; predio.add(laje);
      // fachada: faixas de vidro com janelas (algumas acesas)
      const fachada = new THREE.Group();
      const janelas: THREE.Mesh[] = [];
      const painel = (w: number, x: number, z: number, rotY: number) => {
        const n = Math.max(2, Math.round(w / 0.42));
        for (let k = 0; k < n; k++) {
          const acesa = ((i * 7 + k * 3 + (rotY ? 5 : 0)) % 5) === 0;
          const j = bloco(acesa ? mat.janelaAcesa : mat.vidro, false);
          const larg = w / n - 0.05;
          j.scale.set(larg, ALTURA_ANDAR - 0.12, 0.03);
          const t = -w / 2 + (k + 0.5) * (w / n);
          j.position.set(rotY ? x : x + t, base + (ALTURA_ANDAR - 0.07) / 2, rotY ? z + t : z);
          j.rotation.y = rotY;
          fachada.add(j); if (acesa) janelas.push(j);
        }
      };
      painel(LARGURA - 0.16, 0, PROFUNDIDADE / 2 - 0.02, 0); painel(LARGURA - 0.16, 0, -PROFUNDIDADE / 2 + 0.02, 0);
      painel(PROFUNDIDADE - 0.16, LARGURA / 2 - 0.02, 0, Math.PI / 2); painel(PROFUNDIDADE - 0.16, -LARGURA / 2 + 0.02, 0, Math.PI / 2);
      predio.add(fachada);
      const andaime = new THREE.LineSegments(andaimeGeo, mat.andaime); andaime.position.y = base + ALTURA_ANDAR / 2; predio.add(andaime);
      listaAndares.push({ pilares, laje, fachada, andaime, janelas });
    }
    // cobertura (aparece com 100%)
    const cobertura = new THREE.Group();
    const casaMaq = bloco(mat.concreto); casaMaq.scale.set(0.7, 0.32, 0.6); casaMaq.position.set(0.5, 0.16, -0.2); cobertura.add(casaMaq);
    const caixaAgua = bloco(mat.grafite); caixaAgua.scale.set(0.5, 0.22, 0.45); caixaAgua.position.set(-0.55, 0.11, 0.2); cobertura.add(caixaAgua);
    cobertura.position.y = 0.12 + andares * ALTURA_ANDAR; predio.add(cobertura);

    // ---------- guindaste ----------
    const grua = new THREE.Group(); grua.position.set(-LARGURA / 2 - 0.55, 0, -PROFUNDIDADE / 2 - 0.35); cena.add(grua);
    const alturaGrua = alturaTotal + 1.1;
    const mastro = bloco(mat.amarelo); mastro.scale.set(0.14, alturaGrua, 0.14); mastro.position.y = alturaGrua / 2; grua.add(mastro);
    // treliça do mastro: diagonais em linha
    const trel: THREE.Vector3[] = [];
    for (let y = 0; y < alturaGrua - 0.2; y += 0.28) { trel.push(new THREE.Vector3(-0.08, y, 0.08), new THREE.Vector3(0.08, y + 0.28, 0.08), new THREE.Vector3(0.08, y, -0.08), new THREE.Vector3(-0.08, y + 0.28, -0.08)); }
    grua.add(new THREE.LineSegments(geo(new THREE.BufferGeometry().setFromPoints(trel)), mat.cabo));
    const giro = new THREE.Group(); giro.position.y = alturaGrua; grua.add(giro);
    const cabine = bloco(mat.grafite); cabine.scale.set(0.24, 0.2, 0.24); cabine.position.set(0.14, -0.05, 0); giro.add(cabine);
    const lanca = bloco(mat.amarelo); lanca.scale.set(3.6, 0.1, 0.12); lanca.position.set(1.65, 0.12, 0); giro.add(lanca);
    const contraLanca = bloco(mat.amarelo); contraLanca.scale.set(1.0, 0.1, 0.12); contraLanca.position.set(-0.55, 0.12, 0); giro.add(contraLanca);
    const contrapeso = bloco(mat.concreto); contrapeso.scale.set(0.3, 0.26, 0.2); contrapeso.position.set(-0.9, 0.0, 0); giro.add(contrapeso);
    const torre = bloco(mat.amarelo); torre.scale.set(0.08, 0.5, 0.08); torre.position.set(0, 0.42, 0); giro.add(torre);
    const tirantes = new THREE.LineSegments(geo(new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, 0.67, 0), new THREE.Vector3(3.3, 0.17, 0), new THREE.Vector3(0, 0.67, 0), new THREE.Vector3(-0.9, 0.17, 0),
    ])), mat.cabo); giro.add(tirantes);
    const carro = new THREE.Group(); carro.position.set(2.2, 0.06, 0); giro.add(carro);
    const caboGeo = geo(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, -1, 0)]));
    const cabo = new THREE.Line(caboGeo, mat.cabo); carro.add(cabo);
    const carga = bloco(mat.concretoFresco); carga.scale.set(0.34, 0.14, 0.26); carro.add(carga);

    // ---------- enquadramento e controle ----------
    let w = 1, h = 1;
    const ajustar = () => {
      w = Math.max(1, el.clientWidth); h = Math.max(1, el.clientHeight);
      renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix();
    };
    ajustar();
    const ro = new ResizeObserver(ajustar); ro.observe(el);

    let yaw = 0.75, arrastando = false, ultimoX = 0, inerciaYaw = 0, tocouEm = -10;
    const down = (e: PointerEvent) => { arrastando = true; ultimoX = e.clientX; canvas.style.cursor = 'grabbing'; };
    const move = (e: PointerEvent) => { if (!arrastando) return; const dx = e.clientX - ultimoX; ultimoX = e.clientX; yaw -= dx * 0.008; inerciaYaw = -dx * 0.008; tocouEm = relogio; };
    const up = () => { arrastando = false; canvas.style.cursor = 'grab'; };
    canvas.addEventListener('pointerdown', down); window.addEventListener('pointermove', move); window.addEventListener('pointerup', up);

    // ---------- laço (pausa fora da tela / aba oculta) ----------
    let atual = 0, relogio = 0, ultimo = performance.now(), id = 0, rodando = false, visivel = true, cicloVitrine = 0;
    const passo = (agora: number) => {
      if (!rodando) return;
      const dt = Math.min((agora - ultimo) / 1000, 0.05); ultimo = agora; relogio += dt;

      // progresso animado (vitrine: constrói em loop)
      let meta = alvo.current / 100;
      if (vitrine) { cicloVitrine = (cicloVitrine + dt / 11) % 1; meta = Math.min(1, cicloVitrine * 1.25); }
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
        a.andaime.visible = f < 1;
      });
      cobertura.visible = atual > 0.995;

      // guindaste: gira devagar, carro corre na lança, carga balança
      const subir = Math.min(alturaGrua - 0.3, 0.3 + feito * ALTURA_ANDAR + 0.4);
      if (!reduzir) giro.rotation.y = -0.6 + Math.sin(relogio * 0.35) * 0.9;
      carro.position.x = 1.4 + (Math.sin(relogio * 0.5) * 0.5 + 0.5) * 1.6;
      const comprimento = Math.max(0.25, alturaGrua - subir - 0.15 + (reduzir ? 0 : Math.sin(relogio * 0.9) * 0.15));
      cabo.scale.y = comprimento; carga.position.y = -comprimento - 0.07;

      // câmera orbitando
      if (!arrastando) { if (relogio - tocouEm > 2.5 && !reduzir) yaw += dt * VELOCIDADE_GIRO; else { yaw += inerciaYaw; inerciaYaw *= 0.9; } }
      const raio = Math.max(9.5, alturaTotal * 2.6) * (w / h < 1 ? 1.35 : 1);
      camera.position.set(Math.sin(yaw) * raio, alturaTotal * 0.85 + 2.2, Math.cos(yaw) * raio);
      camera.lookAt(0, alturaTotal * 0.42, 0);

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
      descartaveis.forEach((d) => d.dispose());
      renderer.dispose(); renderer.forceContextLoss();
      canvas.remove();
    };
  }, [andares, tema, vitrine]);

  if (!suporta.current) {
    return (
      <View style={[{ alignItems: 'center', justifyContent: 'center' }, style]}>
        <Anel valor={progresso} tamanho={110} espessura={9} trilho={tema === 'escuro' ? C.graphite3 : C.line} textoCor={tema === 'escuro' ? C.onGraphite : C.ink} />
      </View>
    );
  }
  return <View ref={caixa} style={[{ position: 'relative', overflow: 'hidden' }, style]} />;
}
