import React, { useRef, useEffect, useImperativeHandle, forwardRef } from 'react';
import * as THREE from 'three';
import worldData from 'world-atlas/land-110m.json';
import { feature } from 'topojson-client';
import '../styles/orbColor.css';

/**
 * Ative para visualizar o índice (#1 a #19) em cima de cada Pegman, facilitando a identificação.
 */
export const DEBUG_PEGMEN = false;

/**
 * Cidades e países reais nos continentes do Planeta Terra.
 * Coordenadas geográficas reais (lat, lng).
 */
export const PEGMEN = [
  // América do Sul
  { city: 'São Paulo', country: 'Brasil', lat: -23.55, lng: -46.63 },
  { city: 'Brasília', country: 'Brasil', lat: -15.79, lng: -47.88 },
  { city: 'Lima', country: 'Peru', lat: -12.04, lng: -77.04 },
  { city: 'Bogotá', country: 'Colômbia', lat: 4.71, lng: -74.07 },

  // América do Norte
  { city: 'Nova York', country: 'Estados Unidos', lat: 40.71, lng: -74.00 },
  { city: 'Los Angeles', country: 'Estados Unidos', lat: 34.05, lng: -118.24 },
  { city: 'Chicago', country: 'Estados Unidos', lat: 41.87, lng: -87.62 },
  { city: 'Cidade do México', country: 'México', lat: 19.43, lng: -99.13 },

  // Europa
  { city: 'Londres', country: 'Reino Unido', lat: 51.50, lng: -0.12 },
  { city: 'Roma', country: 'Itália', lat: 41.90, lng: 12.49 },
  { city: 'Berlim', country: 'Alemanha', lat: 52.52, lng: 13.40 },
  { city: 'Madrid', country: 'Espanha', lat: 40.41, lng: -3.70 },

  // África
  { city: 'Cairo', country: 'Egito', lat: 30.04, lng: 31.23 },
  { city: 'Nairóbi', country: 'Quênia', lat: -1.29, lng: 36.82 },
  { city: 'Lagos', country: 'Nigéria', lat: 6.52, lng: 3.37 },

  // Ásia e Oriente Médio
  { city: 'Dubai', country: 'Emirados Árabes', lat: 25.20, lng: 55.27 },
  { city: 'Mumbai', country: 'Índia', lat: 19.07, lng: 72.87 },
  { city: 'Tóquio', country: 'Japão', lat: 35.67, lng: 139.65 },
  { city: 'Pequim', country: 'China', lat: 39.90, lng: 116.40 },

  // Oceania
  { city: 'Brisbane', country: 'Austrália', lat: -27.47, lng: 153.02 },
];

/**
 * Divide anéis poligonais que cruzam o antimeridiano (-180 / +180) para evitar
 * linhas horizontais atravessando o canvas 2D.
 */
function splitRing(ring) {
  const subRings = [];
  let current = [];
  for (let i = 0; i < ring.length; i++) {
    const pt = ring[i];
    if (current.length > 0) {
      const prev = current[current.length - 1];
      const dLng = pt[0] - prev[0];
      if (Math.abs(dLng) > 180) {
        const boundaryLng = dLng > 0 ? -180 : 180;
        const otherBoundaryLng = dLng > 0 ? 180 : -180;
        const totalDist = 360 - Math.abs(dLng);
        const distToBoundary = Math.abs(boundaryLng - prev[0]);
        const frac = totalDist > 0 ? distToBoundary / totalDist : 0.5;
        const latAtBoundary = prev[1] + (pt[1] - prev[1]) * frac;
        current.push([boundaryLng, latAtBoundary]);
        subRings.push(current);
        current = [[otherBoundaryLng, latAtBoundary], pt];
        continue;
      }
    }
    current.push(pt);
  }
  if (current.length > 0) subRings.push(current);
  return subRings;
}

/**
 * Gera a textura equirretangular dos continentes reais da Terra usando o world-atlas (TopoJSON).
 * Executado localmente em offscreen canvas (100% offline, 0 requisições externas).
 */
function createEarthMaskTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 2048;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d');

  // 1. Oceano = Preto (0.0 no canal Red do shader)
  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // 2. Continentes = Branco (1.0 no canal Red do shader)
  ctx.fillStyle = '#ffffff';

  const land = feature(worldData, worldData.objects.land);
  const geom = land.features ? land.features[0].geometry : land.geometry;
  const w = canvas.width;
  const h = canvas.height;

  for (const polygon of geom.coordinates) {
    for (const ring of polygon) {
      const subRings = splitRing(ring);
      for (const sr of subRings) {
        if (sr.length < 3) continue;
        ctx.beginPath();
        for (let i = 0; i < sr.length; i++) {
          const [lng, lat] = sr[i];
          const x = ((lng + 180) / 360) * w;
          const y = ((90 - lat) / 180) * h;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.fill();
      }
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.needsUpdate = true;
  return texture;
}

/**
 * Desenha a textura do Pegman estilo Google Maps em um Canvas 2D.
 */
function createPegmanTexture(index = 0, isDebug = false) {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');

  ctx.clearRect(0, 0, 128, 128);

  // 1. Sombrinha elíptica na base
  ctx.fillStyle = 'rgba(0, 0, 0, 0.42)';
  ctx.beginPath();
  ctx.ellipse(64, 120, 24, 6, 0, 0, Math.PI * 2);
  ctx.fill();

  // 2. Cores do Pegman
  ctx.fillStyle = '#FBBF24';
  ctx.strokeStyle = '#B45309';
  ctx.lineWidth = 4;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';

  // 3. Cabeça redonda
  ctx.beginPath();
  ctx.arc(64, 30, 16, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Olho/viseira sutil
  ctx.fillStyle = '#D97706';
  ctx.beginPath();
  ctx.arc(67, 28, 3, 0, Math.PI * 2);
  ctx.fill();

  // 4. Corpo com ombros, braços curtos e pernas
  ctx.fillStyle = '#FBBF24';
  ctx.beginPath();
  // Braço esquerdo
  ctx.moveTo(64, 46);
  ctx.lineTo(44, 53);
  ctx.lineTo(36, 76);
  ctx.lineTo(44, 78);
  ctx.lineTo(50, 64);
  // Perna esquerda
  ctx.lineTo(50, 114);
  ctx.lineTo(60, 114);
  ctx.lineTo(62, 82);
  // Perna direita
  ctx.lineTo(66, 82);
  ctx.lineTo(68, 114);
  ctx.lineTo(78, 114);
  ctx.lineTo(78, 64);
  // Braço direito
  ctx.lineTo(84, 78);
  ctx.lineTo(92, 76);
  ctx.lineTo(84, 53);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // 5. Badge com índice se DEBUG_PEGMEN estiver ativo
  if (isDebug) {
    ctx.fillStyle = '#0f172a';
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(38, 2, 52, 22, 6);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 15px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`#${index + 1}`, 64, 13);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

/**
 * Utilitários para ler as cores do Planeta Terra definidas em orbColor.css e convertê-las em THREE.Color.
 */
function readCssColor(style, varName, fallback) {
  const val = style.getPropertyValue(varName).trim();
  try {
    return new THREE.Color(val || fallback);
  } catch {
    return new THREE.Color(fallback);
  }
}

function updateColorsFromCss(uniforms) {
  const style = getComputedStyle(document.documentElement);
  uniforms.uOceanDeep.value.copy(readCssColor(style, '--orb-ocean-deep', '#061A40'));
  uniforms.uOceanBright.value.copy(readCssColor(style, '--orb-ocean-bright', '#0878C9'));
  uniforms.uContinent.value.copy(readCssColor(style, '--orb-continent', '#48A860'));
  uniforms.uClouds.value.copy(readCssColor(style, '--orb-clouds', '#D8E8D5'));
  uniforms.uAtmosphere.value.copy(readCssColor(style, '--orb-atmosphere', '#42D9FF'));
}

/**
 * OrbScene — Planeta Terra 3D com continentes reais e Pegmen com hover tooltip.
 *
 * Expõe via ref:
 *   • dive(callback)  — câmera mergulha dentro da esfera; chama callback ao terminar.
 *   • reset()          — volta instantaneamente ao estado inicial.
 *   • get container()  — retorna o elemento DOM do wrapper (para animação FLIP).
 */
const OrbScene = forwardRef(function OrbScene(_props, ref) {
  const containerRef = useRef(null);
  const state = useRef({});

  useImperativeHandle(ref, () => ({
    dive(callback) {
      const s = state.current;
      if (!s.scene) return;
      s.busy = true;
      s.hovering = false;
      s.doneCb = callback;
      s.diveTarget = 1;
    },
    diveIn(durationMs = 1100) {
      const s = state.current;
      if (!s.scene) return;
      s.isDivingIn = true;
      s.diveInStart = performance.now();
      s.diveInDuration = durationMs;
      s.hovering = false;
    },
    reset() {
      const s = state.current;
      s.busy = false;
      s.isDivingIn = false;
      s.doneCb = null;
      s.diveTarget = 0;
      s.dive = 0;
      s.transPhase = 0;
      s.transProgress = 0;
    },
    /**
     * setTransition({ phase, progress })
     * Chamado pelo TransitionOrchestrator a cada frame.
     *   phase 0 = repouso
     *   phase 1 = saída da UI (globo fica parado)
     *   phase 2 = globo ao centro (câmera se prepara)
     *   phase 3 = mergulho (câmera dolly-in)
     *   phase 4 = dissolve (fade-out)
     */
    setTransition({ phase, progress }) {
      const s = state.current;
      s.transPhase = phase;
      s.transProgress = progress;
    },
    get container() {
      return containerRef.current;
    },
  }));

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    // React 19 StrictMode: limpa qualquer canvas/tooltip remanescente do primeiro ciclo
    while (el.firstChild) {
      el.removeChild(el.firstChild);
    }

    let isDisposed = false;

    const T = THREE;
    const scene = new T.Scene();
    const cam = new T.PerspectiveCamera(38, 1, 0.05, 50);
    cam.position.set(0, 0.2, 6);
    cam.lookAt(0, 0, 0);

    const renderer = new T.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.domElement.style.cssText =
      'width:100%;height:100%;display:block;position:relative;z-index:1';
    el.appendChild(renderer.domElement);

    // Tooltip flutuante de localização ao passar o mouse sobre os bonequinhos
    const tooltipEl = document.createElement('div');
    tooltipEl.className = 'orb-tooltip';
    tooltipEl.innerHTML = `
      <div class="orb-tooltip-title">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
          <circle cx="12" cy="10" r="3"></circle>
        </svg>
        <span class="orb-city-text"></span>
      </div>
      <div class="orb-country-text"></div>
    `;
    el.appendChild(tooltipEl);
    const cityTextEl = tooltipEl.querySelector('.orb-city-text');
    const countryTextEl = tooltipEl.querySelector('.orb-country-text');

    // Máscara com a geografia real dos continentes da Terra
    const earthMaskTexture = createEarthMaskTexture();

    /* ---------- Shaders do Planeta Terra Real ---------- */
    const vert = `varying vec3 vN;varying vec3 vP;varying vec3 vV;
void main(){vP=position;vN=normalize(normalMatrix*normal);vec4 mv=modelViewMatrix*vec4(position,1.);vV=-mv.xyz;gl_Position=projectionMatrix*mv;}`;

    const frag = `precision highp float;
uniform float uTime;
uniform float uMouseOn;
uniform float uDive;
uniform vec3 uMouse;
uniform sampler2D uLandMask;

uniform vec3 uOceanDeep;
uniform vec3 uOceanBright;
uniform vec3 uContinent;
uniform vec3 uClouds;
uniform vec3 uAtmosphere;

varying vec3 vN;
varying vec3 vP;
varying vec3 vV;

// Ruído 3D para as nuvens dinâmicas
float h(vec3 p){
  p = fract(p * 0.3183099 + 0.1);
  p *= 17.0;
  return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
}

float n3(vec3 x){
  vec3 i = floor(x);
  vec3 f = fract(x);
  f = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(mix(h(i), h(i + vec3(1,0,0)), f.x), mix(h(i + vec3(0,1,0)), h(i + vec3(1,1,0)), f.x), f.y),
    mix(mix(h(i + vec3(0,0,1)), h(i + vec3(1,0,1)), f.x), mix(h(i + vec3(0,1,1)), h(i + vec3(1,1,1)), f.x), f.y),
    f.z
  );
}

float fbm(vec3 p){
  float a = 0.5;
  float s = 0.0;
  for(int i = 0; i < 4; i++){
    s += a * n3(p);
    p *= 2.02;
    a *= 0.5;
  }
  return s;
}

void main(){
  vec3 N = normalize(vN);
  vec3 V = normalize(vV);
  vec3 p = normalize(vP);

  // Efeito Fresnel para o halo atmosférico visto do espaço
  float NdotV = max(dot(N, V), 0.0);
  float fres = pow(1.0 - NdotV, 2.2);

  // --- 1. CONTINENTES REAIS DA TERRA ---
  float u = atan(p.x, p.z) / (2.0 * 3.141592653589793) + 0.5;
  float v = asin(clamp(p.y, -1.0, 1.0)) / 3.141592653589793 + 0.5;
  vec2 uv = vec2(u, v);

  // Amostra a máscara real de terra (1.0 = Terra, 0.0 = Oceano)
  float isLand = texture2D(uLandMask, uv).r;

  // Cor do oceano: fundo escuro com reflexo luminoso de águas rasas na costa
  vec3 oceanColor = mix(uOceanDeep, uOceanBright, 0.15);

  // Reflexo de sol/luz interativo com o mouse sobre a água
  float mouseDist = distance(p, normalize(uMouse));
  float sunGlint = smoothstep(0.65, 0.0, mouseDist) * uMouseOn;
  oceanColor += uOceanBright * sunGlint * 0.55 * (1.0 - isLand);

  // Continentes reais com relevo sutil de vegetação
  float relief = fbm(p * 8.0);
  vec3 continentColor = mix(uContinent * 0.90, uContinent * 1.10, relief);

  // Superfície combinada (Oceanos Reais ~71% + Continentes Reais ~29%)
  vec3 surface = mix(oceanColor, continentColor, isLand);

  // --- 2. FORMAÇÕES DE NUVENS ---
  vec3 cloudP = p * 2.6 + vec3(uTime * 0.02, 0.0, uTime * 0.012);
  float cloudDensity = fbm(cloudP) * 0.7 + fbm(cloudP * 2.1 + vec3(0.4, 0.8, 0.2)) * 0.3;
  float clouds = smoothstep(0.48, 0.68, cloudDensity);

  // Sombra suave projetada pelas nuvens sobre o solo/mar
  vec3 shadowCoord = cloudP - vec3(0.035, 0.035, 0.0);
  float cloudShadow = smoothstep(0.48, 0.68, fbm(shadowCoord) * 0.7 + fbm(shadowCoord * 2.1) * 0.3) * 0.30;
  surface = mix(surface, surface * 0.70, cloudShadow * (1.0 - clouds));

  // Aplicação das nuvens brancas
  vec3 withClouds = mix(surface, uClouds, clouds * 0.92);

  // --- 3. ATMOSFERA E HALO CIANO ---
  withClouds = mix(withClouds, uAtmosphere, fres * 0.38);
  withClouds += uAtmosphere * pow(fres, 1.8) * 1.25;

  // Realce sutil da luz do mouse na atmosfera
  withClouds += uAtmosphere * sunGlint * 0.2;

  // --- 4. TRANSIÇÃO DE LOGIN (MERGULHO) ---
  float a = mix(0.96, 1.0, fres) * (1.0 - smoothstep(0.3, 0.85, uDive) * 0.98);

  gl_FragColor = vec4(withClouds, a);
}`;

    /* ---------- Uniforms do Planeta Terra via orbColor.css ---------- */
    const computedStyle = getComputedStyle(document.documentElement);
    const uniforms = {
      uTime: { value: 0 },
      uMouse: { value: new T.Vector3(0, 0, 1) },
      uMouseOn: { value: 0 },
      uDive: { value: 0 },
      uLandMask: { value: earthMaskTexture },
      uOceanDeep: { value: readCssColor(computedStyle, '--orb-ocean-deep', '#061A40') },
      uOceanBright: { value: readCssColor(computedStyle, '--orb-ocean-bright', '#0878C9') },
      uContinent: { value: readCssColor(computedStyle, '--orb-continent', '#48A860') },
      uClouds: { value: readCssColor(computedStyle, '--orb-clouds', '#D8E8D5') },
      uAtmosphere: { value: readCssColor(computedStyle, '--orb-atmosphere', '#42D9FF') },
    };

    /* ---------- Sphere Mesh ---------- */
    const geo = new T.SphereGeometry(1.5, 96, 64);
    const mat = new T.ShaderMaterial({
      vertexShader: vert,
      fragmentShader: frag,
      uniforms,
      transparent: true,
    });
    const mesh = new T.Mesh(geo, mat);
    scene.add(mesh);

    /* ---------- Pegmen (Bonequinhos Amarelos estilo Google Maps) ---------- */
    const R = 1.5;
    const basePegmanTexture = !DEBUG_PEGMEN ? createPegmanTexture(0, false) : null;
    const texturesToDispose = [earthMaskTexture];
    if (basePegmanTexture) texturesToDispose.push(basePegmanTexture);

    const pegmenData = PEGMEN.map((p, idx) => {
      const latRad = (p.lat * Math.PI) / 180;
      const lngRad = (p.lng * Math.PI) / 180;

      // Normal unitária do ponto na esfera
      const norm = new T.Vector3(
        Math.cos(latRad) * Math.sin(lngRad),
        Math.sin(latRad),
        Math.cos(latRad) * Math.cos(lngRad)
      ).normalize();

      let texture = basePegmanTexture;
      if (DEBUG_PEGMEN) {
        texture = createPegmanTexture(idx, true);
        texturesToDispose.push(texture);
      }

      const spriteMat = new T.SpriteMaterial({
        map: texture,
        transparent: true,
        depthTest: false,
        depthWrite: false,
      });

      const sprite = new T.Sprite(spriteMat);
      // Pés do boneco exatamente na superfície
      sprite.center.set(0.5, 0.0);
      sprite.renderOrder = 10;
      sprite.scale.set(0.24, 0.24, 1.0);
      sprite.position.copy(norm).multiplyScalar(R * 1.018);

      // Adiciona como filho do mesh do globo para girar junto
      mesh.add(sprite);

      return {
        sprite,
        norm,
        mat: spriteMat,
        city: p.city,
        country: p.country,
        idx,
      };
    });

    /* ---------- Interaction state ---------- */
    const s = {
      scene,
      cam,
      renderer,
      mesh,
      uniforms,
      geo,
      mat,
      hovering: false,
      diveTarget: 0,
      dive: 0,
      busy: false,
      doneCb: null,
      animId: null,
    };
    state.current = s;

    const ray = new T.Raycaster();
    const ndc = new T.Vector2();
    let mousePixelX = -9999;
    let mousePixelY = -9999;

    const onPointerMove = (e) => {
      const b = el.getBoundingClientRect();
      mousePixelX = e.clientX - b.left;
      mousePixelY = e.clientY - b.top;
      ndc.set(
        ((e.clientX - b.left) / b.width) * 2 - 1,
        -((e.clientY - b.top) / b.height) * 2 + 1,
      );
      s.hovering = true;
    };

    const onPointerLeave = () => {
      mousePixelX = -9999;
      mousePixelY = -9999;
      s.hovering = false;
    };

    el.addEventListener('pointermove', onPointerMove);
    el.addEventListener('pointerleave', onPointerLeave);

    /* ---------- Resize ---------- */
    function size() {
      if (isDisposed || !el) return;
      const w = el.clientWidth;
      const h = el.clientHeight;
      if (!w || !h) return;
      renderer.setSize(w, h, false);
      cam.aspect = w / h;
      cam.updateProjectionMatrix();
    }
    const ro = new ResizeObserver(size);
    ro.observe(el);
    size();

    /* ---------- Reduced‑motion check ---------- */
    const prefersReducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches;

    /* ---------- Animation loop ---------- */
    const t0 = performance.now();
    let lastTime = t0;
    let frame = 0;
    let rotSpeed = 0.25;
    let targetRotSpeed = 0.25;

    const tempWorldNorm = new T.Vector3();
    const tempCamDir = new T.Vector3();
    const tempWorldPos = new T.Vector3();
    const basePegmanScale = 0.24;

    function tick(now) {
      if (isDisposed) return;
      const delta = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;
      const t = (now - t0) / 1000;
      frame++;

      // Atualiza cores dinamicamente se orbColor.css for alterado em tempo real
      if (frame % 45 === 0) {
        updateColorsFromCss(uniforms);
      }

      /* --- Transição cinematográfica (controlada pelo Orchestrator) --- */
      const tPhase = s.transPhase || 0;
      const tProg = s.transProgress || 0;

      /* --- Transição de Mergulho ao Logar (diveIn) --- */
      if (s.isDivingIn) {
        const elapsed = now - s.diveInStart;
        const p = Math.min(1, elapsed / s.diveInDuration);
        const ease = p * p * (3 - 2 * p);
        const camZ = 6 - (6 - 2.8) * ease;
        cam.position.set(0, 0.2 * (1 - ease), camZ);
        cam.lookAt(0, 0, 0);

        // Desvanece os pegmen rapidamente para imersão limpa no planeta
        const pegOpacity = Math.max(0, 1 - p * 3.5);
        pegmenData.forEach((peg) => {
          peg.sprite.visible = pegOpacity > 0.01;
          peg.mat.opacity = pegOpacity;
        });

        mesh.rotation.y += (rotSpeed + 0.5 * ease) * delta;
        mesh.rotation.x = 0.04 * (1 - ease);
        mesh.updateMatrixWorld();
      } else if (tPhase >= 3) {
        /* Fase 3: Câmera com aproximação limitada (nunca cobre a tela inteira) */
        const eased = tProg * tProg * tProg; // easeInCubic
        const camZ = Math.max(5.2, 6 - 0.8 * eased);
        cam.position.set(0, 0.2 * (1 - eased), camZ);
        cam.lookAt(0, 0, 0);
        // uDive controla a transparência no shader
        s.dive = Math.min(eased * 0.3, 0.3);
      } else if (tPhase >= 1) {
        /* Fases 1–2: Câmera parada na posição normal */
        s.dive = 0;
        cam.position.set(0, 0.2, 6);
        cam.lookAt(0, 0, 0);
      } else {
        /* Fase 0 (repouso) ou sem transição: dive legado limitado */
        s.dive += (s.diveTarget - s.dive) * 0.045;
        if (s.doneCb && s.dive > 0.97) {
          const f = s.doneCb;
          s.doneCb = null;
          f();
        }
        const d = Math.min(s.dive, 0.3);
        const camZ = Math.max(5.2, 6 - 0.8 * d);
        cam.position.set(0, 0.2 * (1 - d), camZ);
        cam.lookAt(0, 0, 0);
      }

      const d = Math.min(s.dive, 0.3);

      // Suaviza velocidade de rotação (desacelera quando em hover)
      rotSpeed += (targetRotSpeed - rotSpeed) * 0.08;
      if (!prefersReducedMotion) {
        mesh.rotation.y += rotSpeed * delta;
      }
      mesh.rotation.x = 0.04;
      mesh.updateMatrixWorld();

      // Animação, profundidade e visibilidade dos Pegmen
      tempCamDir.copy(cam.position).normalize();

      let hoveredPeg = null;
      let closestDist = 34; // Limite de 34px para hover interativo suave e preciso

      pegmenData.forEach((peg, i) => {
        // Pulinho suave ao longo da normal entre R*1.018 e R*1.038
        const hop = prefersReducedMotion ? 0 : (Math.sin(t * 2.0 + i * 1.7) + 1.0) * 0.5;
        const rCur = R * (1.018 + 0.02 * hop);
        peg.sprite.position.copy(peg.norm).multiplyScalar(rCur);

        // Direção normal no espaço de mundo para calcular dot com a câmera
        tempWorldNorm.copy(peg.norm).applyEuler(mesh.rotation);
        const dot = tempWorldNorm.dot(tempCamDir);

        // Suaviza e esconde boneco apenas bem próximo da face traseira
        const edgeT = Math.max(0, Math.min(1, (dot - 0.01) / (0.12 - 0.01)));
        const opacity = edgeT * edgeT * (3.0 - 2.0 * edgeT);

        // Mantém tamanho íntegro na face frontal
        const scaleFactor = 0.9 + 0.1 * opacity;
        peg.sprite.scale.set(basePegmanScale * scaleFactor, basePegmanScale * scaleFactor, 1.0);

        peg.mat.opacity = opacity;
        peg.sprite.visible = opacity > 0.01;

        // Se estiver de frente para a câmera, verifica hover do mouse
        if (opacity > 0.15 && dot > 0.04) {
          peg.sprite.getWorldPosition(tempWorldPos);
          // Eleva levemente o ponto de referência para a cabeça do boneco
          tempWorldPos.y += 0.10;
          tempWorldPos.project(cam);

          const screenX = ((tempWorldPos.x + 1) / 2) * el.clientWidth;
          const screenY = ((-tempWorldPos.y + 1) / 2) * el.clientHeight;

          const dist = Math.hypot(mousePixelX - screenX, mousePixelY - screenY);
          if (dist < closestDist) {
            closestDist = dist;
            hoveredPeg = { peg, screenX, screenY };
          }
        }
      });

      // Atualiza card flutuante de localização e velocidade do globo
      if (hoveredPeg && s.hovering && d < 0.2) {
        targetRotSpeed = 0.03; // Desacelera para visualização fácil
        el.style.cursor = 'pointer';
        cityTextEl.textContent = hoveredPeg.peg.city;
        countryTextEl.textContent = hoveredPeg.peg.country;
        tooltipEl.style.left = `${hoveredPeg.screenX}px`;
        tooltipEl.style.top = `${hoveredPeg.screenY}px`;
        tooltipEl.classList.add('show');
        // Aumenta o tamanho do boneco focado
        hoveredPeg.peg.sprite.scale.multiplyScalar(1.25);
      } else {
        targetRotSpeed = 0.25; // Retoma rotação normal
        el.style.cursor = 'default';
        tooltipEl.classList.remove('show');
      }

      let on = 0;
      if (s.hovering && d < 0.2) {
        ray.setFromCamera(ndc, cam);
        const hit = ray.intersectObject(mesh)[0];
        if (hit) {
          uniforms.uMouse.value.copy(mesh.worldToLocal(hit.point.clone()));
          on = 1;
        }
      }
      uniforms.uMouseOn.value += (on - uniforms.uMouseOn.value) * 0.08;
      uniforms.uTime.value = t;
      uniforms.uDive.value = d;

      renderer.render(scene, cam);
      s.animId = requestAnimationFrame(tick);
    }

    s.animId = requestAnimationFrame(tick);

    /* ---------- Cleanup ---------- */
    return () => {
      isDisposed = true;
      if (s.animId) {
        cancelAnimationFrame(s.animId);
        s.animId = null;
      }
      ro.disconnect();
      el.removeEventListener('pointermove', onPointerMove);
      el.removeEventListener('pointerleave', onPointerLeave);

      // Limpeza do tooltip
      if (tooltipEl && tooltipEl.parentNode) {
        tooltipEl.remove();
      }

      // Limpeza dos Pegmen e Texturas
      pegmenData.forEach((peg) => {
        mesh.remove(peg.sprite);
        if (peg.mat) peg.mat.dispose();
      });
      texturesToDispose.forEach((tex) => {
        if (tex && typeof tex.dispose === 'function') tex.dispose();
      });

      // Percorre scene e faz dispose de todas as geometrias e materiais
      scene.traverse((obj) => {
        if (obj.geometry && typeof obj.geometry.dispose === 'function') {
          obj.geometry.dispose();
        }
        if (obj.material) {
          if (Array.isArray(obj.material)) {
            obj.material.forEach((m) => m && typeof m.dispose === 'function' && m.dispose());
          } else if (typeof obj.material.dispose === 'function') {
            obj.material.dispose();
          }
        }
      });

      // Dispose do renderer e liberação do WebGL context
      if (renderer) {
        renderer.dispose();
        if (typeof renderer.forceContextLoss === 'function') {
          renderer.forceContextLoss();
        }
        if (renderer.domElement && renderer.domElement.parentNode) {
          renderer.domElement.remove();
        }
      }

      state.current = {};
    };
  }, []);

  return <div ref={containerRef} className="orb" aria-hidden="true" />;
});

export default OrbScene;
