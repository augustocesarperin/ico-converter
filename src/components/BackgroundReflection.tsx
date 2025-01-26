import React, { useEffect, useRef } from "react";

// Draws the visible portion of the background canvas into this overlay canvas,
// so particles appear inside the card with a reflective/light effect.
interface BackgroundReflectionProps {
  variant?: "cards" | "hero";
}

const BackgroundReflection: React.FC<BackgroundReflectionProps> = ({ variant = "cards" }) => {
  const overlayRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const visibleRef = useRef<boolean>(true);
  const hoveredRef = useRef<boolean>(false);
  const mouseRef = useRef<{ x: number; y: number } | null>(null);
  const filterIdRef = useRef<string>(`icosmith-water-${Math.random().toString(36).slice(2)}`);
  const turbRef = useRef<SVGFETurbulenceElement | null>(null);
  const dispRef = useRef<SVGFEDisplacementMapElement | null>(null);

  useEffect(() => {
    const canvas = overlayRef.current;
    const getBgCanvas = () => (window as any).__ICOSMITH_BG_CANVAS__ as
      | HTMLCanvasElement
      | undefined;

    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let lastW = 0;
    let lastH = 0;
    let lastDpr = 0;

    // Offscreen buffer to sample background region before distorting
    const buffer = document.createElement("canvas");
    const bctx = buffer.getContext("2d");

    const reduce =
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // Pause drawing when offscreen
    const hostForIO = canvas.parentElement as HTMLElement | null;
    let io: IntersectionObserver | null = null;
    if (hostForIO && "IntersectionObserver" in window) {
      io = new IntersectionObserver((entries) => {
        const entry = entries[0];
        visibleRef.current = !!entry?.isIntersecting;
      });
      io.observe(hostForIO);
    }

    // Track hover and mouse position for stronger effect
    const onEnter = () => (hoveredRef.current = true);
    const onLeave = () => {
      hoveredRef.current = false;
      mouseRef.current = null;
    };
    const onMove = (e: MouseEvent) => {
      const host = canvas.parentElement as HTMLElement | null;
      if (!host) return;
      const r = host.getBoundingClientRect();
      mouseRef.current = { x: e.clientX - r.left, y: e.clientY - r.top };
    };
    hostForIO?.addEventListener("mouseenter", onEnter);
    hostForIO?.addEventListener("mouseleave", onLeave);
    hostForIO?.addEventListener("mousemove", onMove);

    const draw = () => {
      const host = canvas.parentElement as HTMLElement | null;
      const bg = getBgCanvas();
      if (!host || !bg) {
        rafRef.current = requestAnimationFrame(draw);
        return;
      }

      const rect = host.getBoundingClientRect();
      const cssW = Math.max(1, Math.floor(rect.width));
      const cssH = Math.max(1, Math.floor(rect.height));
      const dpr = Math.min(1.75, window.devicePixelRatio || 1);

      const pixelW = Math.max(1, Math.floor(cssW * dpr));
      const pixelH = Math.max(1, Math.floor(cssH * dpr));

      if (canvas.width !== pixelW || canvas.height !== pixelH) {
        canvas.width = pixelW;
        canvas.height = pixelH;
        canvas.style.width = `${rect.width}px`;
        canvas.style.height = `${rect.height}px`;
        lastW = pixelW;
        lastH = pixelH;
      }
      if (dpr !== lastDpr) {
        const ctx2 = canvas.getContext("2d");
        if (ctx2) ctx2.setTransform(dpr, 0, 0, dpr, 0, 0);
        lastDpr = dpr;
      }

      // Copy the portion of the background canvas that lies under the card
      ctx.clearRect(0, 0, cssW, cssH);

      try {
        if (bctx) {
          if (buffer.width !== cssW || buffer.height !== cssH) {
            buffer.width = cssW;
            buffer.height = cssH;
          }
          bctx.setTransform(1, 0, 0, 1, 0, 0);
          bctx.imageSmoothingEnabled = true;
          bctx.clearRect(0, 0, cssW, cssH);
          bctx.drawImage(
            bg,
            rect.left,
            rect.top,
            rect.width,
            rect.height,
            0,
            0,
            cssW,
            cssH,
          );

          // Draw once with reduced alpha; distortion is applied by the GPU filter (lighter)
          ctx.save();
          ctx.globalAlpha = 0.5;
          ctx.drawImage(buffer, 0, 0, cssW, cssH, 0, 0, cssW, cssH);
          ctx.restore();
        } else {
          // Fallback: direct copy with reduced alpha
          ctx.save();
          ctx.globalAlpha = 0.5;
          ctx.drawImage(
            bg,
            rect.left,
            rect.top,
            rect.width,
            rect.height,
            0,
            0,
            cssW,
            cssH,
          );
          ctx.restore();
        }
      } catch {
        // Ignore draw errors while bg is not ready
      }

      // Remove extra glow to avoid liquid/bleeding artifacts
      // ctx.globalCompositeOperation = "screen";
      // const grad = ctx.createRadialGradient(
      //   cssW * 0.5,
      //   cssH * 0.1,
      //   Math.max(20, Math.min(cssW, cssH) * 0.1),
      //   cssW * 0.5,
      //   cssH * 0.1,
      //   Math.max(cssW, cssH) * 0.8,
      // );
      // grad.addColorStop(0, "rgba(255,255,255,0.06)");
      // grad.addColorStop(1, "rgba(255,255,255,0)");
      // ctx.fillStyle = grad;
      // ctx.fillRect(0, 0, cssW, cssH);
      // ctx.globalCompositeOperation = "source-over";

      rafRef.current = requestAnimationFrame(draw);
    };

    rafRef.current = requestAnimationFrame(draw);
    // Animate GPU filter for strong but cheap refraction
    let raf2: number | null = null;
    const animateFilter = () => {
      const t = performance.now() * 0.001;
      // Prefer global filter nodes if present
      const globalTurb = document.getElementById(
        variant === "hero" ? "icosmith-turb-hero" : "icosmith-turb-cards",
      ) as SVGFETurbulenceElement | null;
      const globalDisp = document.getElementById(
        variant === "hero" ? "icosmith-disp-hero" : "icosmith-disp-cards",
      ) as SVGFEDisplacementMapElement | null;

      const turb = globalTurb || turbRef.current;
      const disp = globalDisp || dispRef.current;

      if (turb) {
        // Cards: +10% base frequency; Hero: suavizado (0.004/0.008)
        const baseX = variant === "hero" ? 0.004 : 0.0088;
        const baseY = variant === "hero" ? 0.008 : 0.0143;
        const ampX = variant === "hero" ? 0.003 : 0.006;
        const ampY = variant === "hero" ? 0.003 : 0.007;
        const bfX = baseX + ampX * Math.sin(t * 0.8);
        const bfY = baseY + ampY * Math.cos(t * 0.6);
        turb.setAttribute("baseFrequency", `${bfX.toFixed(4)} ${bfY.toFixed(4)}`);
      }
      if (disp) {
        // Cards hover: faixa 44–48; demais valores mantêm dinâmica existente
        const base = variant === "hero"
          ? (hoveredRef.current ? 18 : 14)
          : (hoveredRef.current ? 46 : 26);
        const extra = variant === "hero"
          ? (hoveredRef.current ? 8 : 5)
          : (hoveredRef.current ? 2 : 12);
        const scale = base + extra * Math.sin(t * 1.1);
        disp.setAttribute("scale", scale.toFixed(1));
      }
      raf2 = requestAnimationFrame(animateFilter);
    };
    raf2 = requestAnimationFrame(animateFilter);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (raf2) cancelAnimationFrame(raf2);
      if (io) io.disconnect();
      hostForIO?.removeEventListener("mouseenter", onEnter);
      hostForIO?.removeEventListener("mouseleave", onLeave);
      hostForIO?.removeEventListener("mousemove", onMove);
    };
  }, []);

  return (
    <>
      <canvas
        ref={overlayRef}
        className={`pointer-events-none absolute inset-0 z-0 ${variant === "hero" ? "rounded-2xl" : "rounded-[11px]"} opacity-35 transition-opacity duration-200 ${variant === "hero" ? "group-hover:opacity-45 mix-blend-normal" : "group-hover:opacity-70 mix-blend-screen"}`}
        style={{
          WebkitMaskImage: "radial-gradient(120% 140% at 50% 35%, #000 60%, transparent 95%)",
          maskImage: "radial-gradient(120% 140% at 50% 35%, #000 60%, transparent 95%)",
          filter: `url(#${variant === "hero" ? "icosmith-refraction-hero" : "icosmith-refraction-cards"})`,
          willChange: "filter, opacity",
          contain: "layout paint size",
          transform: "translateZ(0)",
          backfaceVisibility: "hidden",
        }}
      />
      {/* Hidden controllers to animate global filters if present; fallback to local refs otherwise */}
      <svg aria-hidden className="absolute h-0 w-0">
        <defs>
          <filter id={filterIdRef.current} x="-20%" y="-20%" width="140%" height="140%">
            <feTurbulence ref={turbRef as any} type="fractalNoise" baseFrequency="0.008 0.013" numOctaves={2} seed={3} result="noise" />
            <feGaussianBlur in="noise" stdDeviation="0.5" result="blurredNoise" />
            <feDisplacementMap ref={dispRef as any} in="SourceGraphic" in2="blurredNoise" scale={26} xChannelSelector="R" yChannelSelector="G" />
          </filter>
        </defs>
      </svg>
    </>
  );
};

export default BackgroundReflection;


