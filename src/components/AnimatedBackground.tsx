import React, { useRef, useEffect, useId } from 'react';

const AnimatedBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let particles: Particle[];
    let animationFrameId: number;
    let grid: { [key: string]: Particle[] };
    const cellSize = 120;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
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
        this.speedX = Math.random() * 1.0 - 0.5;
        this.speedY = Math.random() * 1.0 - 0.5;
      }

      update() {
        this.x += this.speedX;
        this.y += this.speedY;

        if (this.x > canvas.width || this.x < 0) this.speedX *= -1;
        if (this.y > canvas.height || this.y < 0) this.speedY *= -1;
      }

      draw() {
        ctx!.fillStyle = 'hsla(24.6, 95%, 53.1%, 0.7)';
        ctx!.beginPath();
        ctx!.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx!.fill();
      }
    }

    const init = () => {
      resizeCanvas();
      particles = [];
      particleIdCounter = 0;
      const numberOfParticles = (canvas.width * canvas.height) / 9000;
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

                const distance = Math.sqrt(
                  Math.pow(particle.x - other.x, 2) +
                  Math.pow(particle.y - other.y, 2)
                );

                if (distance < 120) {
                  opacityValue = 1 - (distance / 120);
                  ctx!.strokeStyle = `hsla(24.6, 95%, 53.1%, ${opacityValue * 0.8})`;
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

    const animate = () => {
      const gradient = ctx!.createRadialGradient(
        canvas.width / 2,
        canvas.height / 2,
        0,
        canvas.width / 2,
        canvas.height / 2,
        Math.max(canvas.width, canvas.height) / 2
      );
      gradient.addColorStop(0, 'hsla(224, 71%, 4%, 1)');
      gradient.addColorStop(1, 'hsla(224, 71%, 2%, 1)');
      
      ctx!.fillStyle = gradient;
      ctx!.fillRect(0, 0, canvas.width, canvas.height);
      
      updateGrid();

      particles.forEach(p => {
        p.update();
        p.draw();
      });
      connect();
      animationFrameId = requestAnimationFrame(animate);
    };
    
    init();
    animate();

    window.addEventListener('resize', init);

    return () => {
      window.removeEventListener('resize', init);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return <canvas ref={canvasRef} className="fixed top-0 left-0 -z-10 bg-[#0A0F1E]" />;
};

export default AnimatedBackground; 