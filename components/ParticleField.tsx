'use client';

import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

interface ParticleFieldProps {
  concept?: string;
  intensity?: 'low' | 'medium' | 'high';
}

// Particle class definition
class Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  
  constructor(canvas: HTMLCanvasElement, config: any) {
    this.x = Math.random() * canvas.width;
    this.y = Math.random() * canvas.height;
    this.vx = (Math.random() - 0.5) * config.speed;
    this.vy = (Math.random() - 0.5) * config.speed;
    this.radius = Math.random() * 2 + 1;
  }
  
  update(canvas: HTMLCanvasElement) {
    this.x += this.vx;
    this.y += this.vy;
    
    // Bounce off walls
    if (this.x < 0 || this.x > canvas.width) this.vx *= -1;
    if (this.y < 0 || this.y > canvas.height) this.vy *= -1;
    
    // Keep in bounds
    this.x = Math.max(0, Math.min(canvas.width, this.x));
    this.y = Math.max(0, Math.min(canvas.height, this.y));
  }
  
  draw(ctx: CanvasRenderingContext2D, config: any) {
    if (!ctx) return;
    
    ctx.beginPath();
    
    if (config.shape === 'neuron') {
      // Draw neuron-like particle
      ctx.arc(this.x, this.y, this.radius * 2, 0, Math.PI * 2);
      ctx.fillStyle = config.color;
      ctx.fill();
      
      // Inner glow
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
      ctx.fillStyle = config.color.replace('0.3', '0.6');
      ctx.fill();
    } else if (config.shape === 'orbit') {
      // Draw orbiting particle
      const time = Date.now() * 0.001;
      const orbitX = this.x + Math.cos(time + this.x) * 10;
      const orbitY = this.y + Math.sin(time + this.y) * 10;
      
      ctx.arc(orbitX, orbitY, this.radius, 0, Math.PI * 2);
      ctx.fillStyle = config.color;
      ctx.fill();
    } else {
      // Default dot
      ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
      ctx.fillStyle = config.color;
      ctx.fill();
    }
  }
}

export function ParticleField({ concept = '', intensity = 'medium' }: ParticleFieldProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const particlesRef = useRef<Particle[]>([]);
  
  // Determine particle behavior based on concept
  const getParticleConfig = () => {
    const conceptLower = concept.toLowerCase();
    
    if (conceptLower.includes('data') || conceptLower.includes('algorithm')) {
      return {
        count: 50,
        speed: 0.5,
        connectionDistance: 150,
        color: 'rgba(139, 92, 246, 0.3)', // Purple
        shape: 'node'
      };
    }
    
    if (conceptLower.includes('neural') || conceptLower.includes('network')) {
      return {
        count: 30,
        speed: 0.3,
        connectionDistance: 200,
        color: 'rgba(59, 130, 246, 0.3)', // Blue
        shape: 'neuron'
      };
    }
    
    if (conceptLower.includes('physics') || conceptLower.includes('atom')) {
      return {
        count: 60,
        speed: 1.5,
        connectionDistance: 0,
        color: 'rgba(34, 197, 94, 0.3)', // Green
        shape: 'orbit'
      };
    }
    
    // Default particles
    return {
      count: 40,
      speed: 0.5,
      connectionDistance: 120,
      color: 'rgba(168, 85, 247, 0.2)', // Light purple
      shape: 'dot'
    };
  };
  
  useEffect(() => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Set canvas size
    const updateSize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    
    const config = getParticleConfig();
    
    // Create particles
    const particleCount = intensity === 'high' ? config.count * 1.5 :
                          intensity === 'low' ? config.count * 0.5 :
                          config.count;
                          
    for (let i = 0; i < particleCount; i++) {
      particlesRef.current.push(new Particle(canvas, config));
    }
    
    // Animation loop
    const animate = () => {
      if (!ctx) return;
      
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Update and draw particles
      particlesRef.current.forEach(particle => {
        particle.update(canvas);
        particle.draw(ctx, config);
      });
      
      // Draw connections if configured
      if (config.connectionDistance > 0) {
        ctx.strokeStyle = config.color.replace('0.3', '0.1');
        ctx.lineWidth = 0.5;
        
        for (let i = 0; i < particlesRef.current.length; i++) {
          for (let j = i + 1; j < particlesRef.current.length; j++) {
            const p1 = particlesRef.current[i];
            const p2 = particlesRef.current[j];
            const distance = Math.sqrt(
              Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2)
            );
            
            if (distance < config.connectionDistance) {
              ctx.beginPath();
              ctx.moveTo(p1.x, p1.y);
              ctx.lineTo(p2.x, p2.y);
              ctx.stroke();
            }
          }
        }
      }
      
      animationRef.current = requestAnimationFrame(animate);
    };
    
    animate();
    
    return () => {
      window.removeEventListener('resize', updateSize);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      particlesRef.current = [];
    };
  }, [concept, intensity]);
  
  return (
    <motion.canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 2 }}
      style={{ zIndex: 0 }}
    />
  );
}