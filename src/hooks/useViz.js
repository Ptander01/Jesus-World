// useViz.js — small animation hooks shared by the visual components.
import { useState, useEffect, useRef } from "react";

// Fires once when the element scrolls into view (drives intro animations).
// Falls back to "visible" where IntersectionObserver is unavailable.
export function useInView({ threshold = 0.2, once = true } = {}) {
  const ref = useRef(null);
  // The no-IntersectionObserver fallback is the *initial* state rather than a
  // setState inside the effect, which would cascade an extra render.
  const [inView, setInView] = useState(() => typeof IntersectionObserver === "undefined");
  useEffect(() => {
    const node = ref.current;
    if (!node || typeof IntersectionObserver === "undefined") return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) { setInView(true); if (once) obs.disconnect(); }
        else if (!once) setInView(false);
      },
      { threshold }
    );
    obs.observe(node);
    return () => obs.disconnect();
  }, [threshold, once]);
  return [ref, inView];
}

// Eased (in-out) count-up to `target`, restarts when `active` flips true.
export function useCountUp(target, active, { duration = 850 } = {}) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!active) return;
    let raf, start;
    const tick = (t) => {
      if (start === undefined) start = t;
      const p = Math.min((t - start) / duration, 1);
      const eased = 0.5 - Math.cos(Math.PI * p) / 2;
      setVal(Math.round(target * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, active, duration]);
  // Derived rather than reset via setState when inactive — same result, no cascade.
  return active ? val : 0;
}

// Respects prefers-reduced-motion so animations can be skipped.
export function useReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    if (typeof matchMedia === "undefined") return;
    const mq = matchMedia("(prefers-reduced-motion: reduce)");
    const on = () => setReduced(mq.matches);
    on();
    mq.addEventListener?.("change", on);
    return () => mq.removeEventListener?.("change", on);
  }, []);
  return reduced;
}
