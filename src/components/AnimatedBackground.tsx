import React, { useRef, useEffect } from "react";

const AnimatedBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Expose background canvas so cards can sample it for reflections
    try {
      (window as any).__ICOSMITH_BG_CANVAS__ = canvas;
    } catch {
      // no-op
    }

    let particles: Particle[];
    let animationFrameId: number;
    let grid: { [key: string]: Particle[] };
    let lastTime = performance.now();
    const cellSize = 120;

    let lastCanvasW = 0;
    let lastCanvasH = 0;
    const resizeCanvas = () => {
      const newW = window.innerWidth;
      const newH = window.innerHeight;
      const sx = lastCanvasW > 0 ? newW / lastCanvasW : 1;
      const sy = lastCanvasH > 0 ? newH / lastCanvasH : 1;
      canvas.width = newW;
      canvas.height = newH;
      if (particles) {
        for (const p of particles) {
          p.x *= sx;
          p.y *= sy;
          // clamp to bounds
          if (p.x < 0) p.x = 0;
          if (p.x > newW) p.x = newW;
          if (p.y < 0) p.y = 0;
          if (p.y > newH) p.y = newH;
        }
      }
      lastCanvasW = newW;
      lastCanvasH = newH;
    };

    let particleIdCounter = 0;
    class Particle {
      id: number;
      x: number;
      y: number;
      size: number;
      speedX: number;
      speedY: number;

      constructor() {
        this.id = particleIdCounter++;
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.size = Math.random() * 2 + 1;
        this.speedX = (Math.random() - 0.5) * 50;
        this.speedY = (Math.random() - 0.5) * 50;
      }

      update(dt: number) {
        this.x += this.speedX * dt;
        this.y += this.speedY * dt;

        if (this.x > canvas.width || this.x < 0) this.speedX *= -1;
        if (this.y > canvas.height || this.y < 0) this.speedY *= -1;
      }

      draw() {
        ctx!.fillStyle = "hsla(25, 70%, 45%, 0.4)";
        ctx!.beginPath();
        ctx!.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx!.fill();
      }
    }

    const init = () => {
      resizeCanvas();
      particles = [];
      particleIdCounter = 0;
      const reduce =
        window.matchMedia &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const baseCount = (canvas.width * canvas.height) / 12000;
      const numberOfParticles = Math.max(
        10,
        Math.floor(reduce ? baseCount / 3 : baseCount),
      );
      for (let i = 0; i < numberOfParticles; i++) {
        particles.push(new Particle());
      }
    };

    const updateGrid = () => {
      grid = {};
      for (const particle of particles) {
        const cellX = Math.floor(particle.x / cellSize);
        const cellY = Math.floor(particle.y / cellSize);
        const key = `${cellX},${cellY}`;
        if (!grid[key]) {
          grid[key] = [];
        }
        grid[key].push(particle);
      }
    };

    const connect = () => {
      let opacityValue = 1;
      for (const particle of particles) {
        const cellX = Math.floor(particle.x / cellSize);
        const cellY = Math.floor(particle.y / cellSize);

        for (let i = -1; i <= 1; i++) {
          for (let j = -1; j <= 1; j++) {
            const key = `${cellX + i},${cellY + j}`;

            if (grid[key]) {
              for (const other of grid[key]) {
                if (particle.id >= other.id) continue;

                const dx = particle.x - other.x;
                const dy = particle.y - other.y;
                const distanceSq = dx * dx + dy * dy;

                if (distanceSq < 14400) {
                  // 120 * 120
                  const distance = Math.sqrt(distanceSq);
                  opacityValue = 1 - distance / 120;
                  ctx!.strokeStyle = `hsla(25, 70%, 45%, ${opacityValue * 0.5})`;
                  ctx!.lineWidth = 1;
                  ctx!.beginPath();
                  ctx!.moveTo(particle.x, particle.y);
                  ctx!.lineTo(other.x, other.y);
                  ctx!.stroke();
                }
              }
            }
          }
        }
      }
    };

    const animate = (timestamp: number) => {
      const dt = (timestamp - lastTime) / 1000;
      lastTime = timestamp;
      const effectiveDt = Math.min(dt, 0.1);

      const gradient = ctx!.createRadialGradient(
        canvas.width / 2,
        canvas.height / 2,
        0,
        canvas.width / 2,
        canvas.height / 2,
        Math.max(canvas.width, canvas.height) / 2,
      );
      gradient.addColorStop(0, "hsla(224, 71%, 4%, 1)");
      gradient.addColorStop(1, "hsla(224, 71%, 2%, 1)");

      ctx!.fillStyle = gradient;
      ctx!.fillRect(0, 0, canvas.width, canvas.height);

      updateGrid();

      particles.forEach((p) => {
        p.update(effectiveDt);
        p.draw();
      });
      connect();
      animationFrameId = requestAnimationFrame(animate);
    };

    init();
    requestAnimationFrame(animate);

    let resizePending = false;
    const onResize = () => {
      if (!resizePending) {
        resizePending = true;
        requestAnimationFrame(() => {
          resizeCanvas();
          resizePending = false;
        });
      }
    };
    window.addEventListener("resize", onResize);

    return () => {
      window.removeEventListener("resize", onResize);
      cancelAnimationFrame(animationFrameId);
      try {
        if ((window as any).__ICOSMITH_BG_CANVAS__ === canvas) {
          delete (window as any).__ICOSMITH_BG_CANVAS__;
        }
      } catch {
        // no-op
      }
    };
  }, []);

  return (
    <canvas ref={canvasRef} className="fixed left-0 top-0 -z-10 bg-[#0A0F1E]" />
  );
};

export default AnimatedBackground;
