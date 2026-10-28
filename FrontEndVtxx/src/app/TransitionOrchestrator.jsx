import React, { useRef, useCallback, useEffect } from 'react';
import { useOrb } from './OrbContext';
import '../styles/transition.css';

/* ==========================================================================
   CONSTANTES DE TIMING — edite aqui para ajustar a animação
   ========================================================================== */

/** Duração total da transição em ms */
const TOTAL_DURATION = 3800;

/** Breakpoints de fase (0–1 normalizado) */
const PHASE1_END = 0.105;  // ~400ms  — Saída da UI
const PHASE2_END = 0.368;  // ~1400ms — Globo vai ao centro
const PHASE3_END = 0.737;  // ~2800ms — Mergulho no planeta
const PHASE4_END = 1.0;    // ~3800ms — Dissolve para nova tela

/** Quando chamar navigate() (durante a fase 3, com tela já coberta) */
const NAVIGATE_AT = 0.55;  // ~2100ms

/* Duração do fallback prefers-reduced-motion */
const REDUCED_MOTION_DURATION = 300;

/* ==========================================================================
   EASINGS
   ========================================================================== */
function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function easeInCubic(t) {
  return t * t * t;
}

/** Mapeia t global para progresso [0–1] de uma fase */
function phaseProgress(t, start, end) {
  if (t <= start) return 0;
  if (t >= end) return 1;
  return (t - start) / (end - start);
}

/* ==========================================================================
   COMPONENTE
   ========================================================================== */

/**
 * TransitionOrchestrator
 *
 * Renderiza:
 *   • Overlay de cobertura de cor (fases 3→4)
 *   • Click blocker durante a animação
 *
 * Expõe via ref:
 *   • start({ navigate, targetPath, heroEl, cardEl, wrapEl })
 *     Dispara a animação cinematográfica de 4 fases.
 */
const TransitionOrchestrator = React.forwardRef(function TransitionOrchestrator(_props, ref) {
  const { orbRef, slotRect, setIsTransitioning } = useOrb();

  const colorOverlayRef = useRef(null);
  const blockerRef = useRef(null);
  const rafIdRef = useRef(null);
  const hasNavigatedRef = useRef(false);

  /* Cleanup rAF no unmount */
  useEffect(() => {
    return () => {
      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
    };
  }, []);

  const start = useCallback(({ navigate, targetPath, heroEl, cardEl }) => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    /* ---- Reduced motion: simples cross-fade ---- */
    if (prefersReducedMotion) {
      setIsTransitioning(true);
      document.body.classList.add('dark-bg');

      const overlay = colorOverlayRef.current;
      if (overlay) {
        overlay.style.opacity = '1';
      }
      setTimeout(() => {
        navigate(targetPath);
        setTimeout(() => {
          if (overlay) overlay.style.opacity = '0';
          setIsTransitioning(false);
          document.body.classList.remove('dark-bg');
        }, 50);
      }, REDUCED_MOTION_DURATION);
      return;
    }

    /* ---- Animação completa ---- */
    setIsTransitioning(true);
    hasNavigatedRef.current = false;

    const orbScene = orbRef.current;
    const orbWrapper = orbScene?.container?.closest('.global-orb-wrapper');
    const colorOverlay = colorOverlayRef.current;
    const blocker = blockerRef.current;

    /* Mostrar blocker */
    if (blocker) blocker.style.display = 'block';
    if (orbWrapper) orbWrapper.classList.add('transitioning');

    /* Capturar posição de repouso do globo */
    const startRect = slotRect || (orbWrapper ? orbWrapper.getBoundingClientRect() : null);

    /* Viewport center */
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    /* Animações DOM (fase 1: fade-out da UI) */
    const fadeOutElements = [heroEl, cardEl].filter(Boolean);
    const fadeOutAnimations = fadeOutElements.map(el =>
      el.animate(
        [
          { opacity: 1, transform: 'scale(1) translateY(0)' },
          { opacity: 0, transform: 'scale(0.96) translateY(12px)' },
        ],
        {
          duration: PHASE1_END * TOTAL_DURATION,
          easing: 'cubic-bezier(0.65, 0, 0.35, 1)',
          fill: 'forwards',
        }
      )
    );

    /* ---- Single rAF driver ---- */
    const t0 = performance.now();

    function tick(now) {
      const elapsed = now - t0;
      const tGlobal = Math.min(elapsed / TOTAL_DURATION, 1);

      /* --- Fase 2: Globo vai ao centro (posição + escala) --- */
      const p2 = easeInOutCubic(phaseProgress(tGlobal, PHASE1_END, PHASE2_END));

      if (orbWrapper && startRect) {
        /* Tamanho do globo em repouso */
        const sw = startRect.width;
        const sh = startRect.height;

        /* Centro do slot */
        const sx = startRect.left + sw / 2;
        const sy = startRect.top + sh / 2;

        /* Centro da viewport */
        const cx = vw / 2;
        const cy = vh / 2;

        /* Posição interpolada */
        const curX = sx + (cx - sx) * p2;
        const curY = sy + (cy - sy) * p2;

        /* Escala: 1 → 1.3 durante fase 2 */
        const scaleP2 = 1 + 0.3 * p2;

        /* --- Fase 3: Mergulho (zoom massivo) --- */
        const p3 = easeInCubic(phaseProgress(tGlobal, PHASE2_END, PHASE3_END));
        const scaleP3 = scaleP2 + (8.0 - scaleP2) * p3; // 1.3 → 8.0

        /* Aplicar posição e escala via transform */
        const finalScale = tGlobal <= PHASE2_END ? scaleP2 : scaleP3;
        orbWrapper.style.left = '0';
        orbWrapper.style.top = '0';
        orbWrapper.style.width = `${sw}px`;
        orbWrapper.style.height = `${sh}px`;
        orbWrapper.style.transform = `translate(${curX - sw / 2}px, ${curY - sh / 2}px) scale(${finalScale})`;
      }

      /* Informar o OrbScene sobre o estado da transição para câmera */
      if (orbScene?.setTransition) {
        let phase = 0;
        let progress = 0;

        if (tGlobal <= PHASE1_END) {
          phase = 1;
          progress = phaseProgress(tGlobal, 0, PHASE1_END);
        } else if (tGlobal <= PHASE2_END) {
          phase = 2;
          progress = phaseProgress(tGlobal, PHASE1_END, PHASE2_END);
        } else if (tGlobal <= PHASE3_END) {
          phase = 3;
          progress = phaseProgress(tGlobal, PHASE2_END, PHASE3_END);
        } else {
          phase = 4;
          progress = phaseProgress(tGlobal, PHASE3_END, PHASE4_END);
        }

        orbScene.setTransition({ phase, progress });
      }

      /* --- Overlay de cor (sobe no final da fase 3) --- */
      if (colorOverlay) {
        const colorStart = PHASE2_END + (PHASE3_END - PHASE2_END) * 0.4; // 60% da fase 3
        const pColor = phaseProgress(tGlobal, colorStart, PHASE3_END);
        const easedColor = easeInCubic(pColor);

        if (tGlobal <= PHASE3_END) {
          colorOverlay.style.opacity = `${easedColor}`;
        } else {
          /* Fase 4: overlay faz fade-out revelando a nova tela */
          const p4 = easeInOutCubic(phaseProgress(tGlobal, PHASE3_END, PHASE4_END));
          colorOverlay.style.opacity = `${1 - p4}`;
        }
      }

      /* --- Navegar durante a fase 3 --- */
      if (tGlobal >= NAVIGATE_AT && !hasNavigatedRef.current) {
        hasNavigatedRef.current = true;
        navigate(targetPath);
      }

      /* --- Fim da animação --- */
      if (tGlobal >= 1) {
        /* Cleanup */
        if (colorOverlay) colorOverlay.style.opacity = '0';
        if (blocker) blocker.style.display = 'none';
        if (orbWrapper) {
          orbWrapper.classList.remove('transitioning');
          orbWrapper.style.transform = '';
          orbWrapper.style.width = '';
          orbWrapper.style.height = '';
          orbWrapper.style.left = '';
          orbWrapper.style.top = '';
        }

        /* Resetar o OrbScene */
        if (orbScene?.setTransition) {
          orbScene.setTransition({ phase: 0, progress: 0 });
        }

        fadeOutAnimations.forEach(a => { try { a.cancel(); } catch (_e) { /* ok */ } });
        setIsTransitioning(false);
        document.body.classList.remove('dark-bg');
        rafIdRef.current = null;
        return;
      }

      rafIdRef.current = requestAnimationFrame(tick);
    }

    rafIdRef.current = requestAnimationFrame(tick);
  }, [orbRef, slotRect, setIsTransitioning]);

  /* Expor start via ref */
  React.useImperativeHandle(ref, () => ({ start }), [start]);

  return (
    <>
      <div ref={colorOverlayRef} className="transition-color-overlay" />
      <div
        ref={blockerRef}
        className="transition-blocker"
        style={{ display: 'none' }}
      />
    </>
  );
});

export default TransitionOrchestrator;
