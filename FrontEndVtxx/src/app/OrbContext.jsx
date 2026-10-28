import React, { createContext, useContext, useRef, useState, useCallback } from 'react';

/**
 * OrbContext — Compartilha a instância global do OrbScene entre rotas.
 *
 * Expõe:
 *   • orbRef          — ref do OrbScene (dive, reset, setTransition, container)
 *   • slotRect        — posição de "repouso" do globo na tela atual
 *   • setSlotRect(r)  — cada página chama isso para informar onde o globo deve ficar
 *   • triggerTransition(navigate, targetPath) — dispara a transição cinematográfica
 *   • isTransitioning  — true durante a animação
 *   • setIsTransitioning
 */
const OrbCtx = createContext(null);

export function OrbProvider({ children }) {
  const orbRef = useRef(null);
  const [slotRect, setSlotRect] = useState(null);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const value = {
    orbRef,
    slotRect,
    setSlotRect,
    isTransitioning,
    setIsTransitioning,
  };

  return <OrbCtx.Provider value={value}>{children}</OrbCtx.Provider>;
}

export function useOrb() {
  const ctx = useContext(OrbCtx);
  if (!ctx) throw new Error('useOrb must be used within <OrbProvider>');
  return ctx;
}
