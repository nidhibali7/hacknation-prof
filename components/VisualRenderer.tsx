'use client';

import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { VisualContent } from '@/types';
import { getEducationalImages, getConceptIcon } from '@/lib/visualGenerator';
import * as Icons from 'lucide-react';

interface VisualRendererProps {
  visual?: VisualContent;
  progress: number; // 0-100 percentage of text completion
  concept?: string;
}

export function VisualRenderer({ visual, progress, concept }: VisualRendererProps) {
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>();
  
  // Load educational images
  useEffect(() => {
    if (visual?.type === 'image' && visual.query) {
      getEducationalImages(visual.query).then(setImageUrls);
    }
  }, [visual]);
  
  // Cycle through images
  useEffect(() => {
    if (imageUrls.length > 1) {
      const interval = setInterval(() => {
        setCurrentImageIndex(prev => (prev + 1) % imageUrls.length);
      }, 10000); // Change image every 10 seconds
      
      return () => clearInterval(interval);
    }
  }, [imageUrls]);
  
  // Check if visual should be shown based on progress
  const shouldShow = !visual?.timing || progress >= (visual.timing.showAt || 0);
  
  if (!visual || !shouldShow) return null;
  
  const transition = visual.timing?.transition || 'fade';
  const animationVariants = {
    fade: {
      initial: { opacity: 0 },
      animate: { opacity: 1 },
      exit: { opacity: 0 }
    },
    slide: {
      initial: { opacity: 0, x: 50 },
      animate: { opacity: 1, x: 0 },
      exit: { opacity: 0, x: -50 }
    },
    zoom: {
      initial: { opacity: 0, scale: 0.8 },
      animate: { opacity: 1, scale: 1 },
      exit: { opacity: 0, scale: 0.8 }
    },
    draw: {
      initial: { opacity: 0, pathLength: 0 },
      animate: { opacity: 1, pathLength: 1 },
      exit: { opacity: 0 }
    }
  };
  
  const variants = animationVariants[transition];
  
  return (
    <AnimatePresence>
      <motion.div
        key={visual.type}
        initial={variants.initial}
        animate={variants.animate}
        exit={variants.exit}
        transition={{ duration: 0.5 }}
        className="absolute inset-0 pointer-events-none"
      >
        {visual.type === 'image' && imageUrls.length > 0 && (
          <div className="absolute inset-0">
            <AnimatePresence mode="wait">
              <motion.img
                key={currentImageIndex}
                src={imageUrls[currentImageIndex]}
                alt={concept || 'Visual content'}
                className="absolute inset-0 w-full h-full object-cover"
                initial={{ opacity: 0, scale: 1.1 }}
                animate={{ 
                  opacity: 1, 
                  scale: 1.15,
                  x: [-20, 20],
                  y: [-10, 10]
                }}
                exit={{ opacity: 0 }}
                transition={{ 
                  opacity: { duration: 1 },
                  scale: { duration: 30, ease: "linear" },
                  x: { duration: 30, ease: "linear" },
                  y: { duration: 30, ease: "linear" }
                }}
              />
            </AnimatePresence>
            {/* Gradient overlay for text readability */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-black/30" />
            <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-transparent to-black/40" />
            
            {/* Image indicators */}
            {imageUrls.length > 1 && (
              <div className="absolute bottom-4 left-4 flex gap-2">
                {imageUrls.map((_, index) => (
                  <div
                    key={index}
                    className={`w-2 h-2 rounded-full transition-all ${
                      index === currentImageIndex 
                        ? 'bg-white w-8' 
                        : 'bg-white/40'
                    }`}
                  />
                ))}
              </div>
            )}
          </div>
        )}
        
        {visual.type === 'animation' && (
          <div className="absolute inset-0 flex items-center justify-center">
            <AnimatedVisual data={visual.data} />
          </div>
        )}
        
        {visual.type === 'canvas' && (
          <div className="absolute inset-0 flex items-center justify-center">
            <CanvasVisual canvasRef={canvasRef} data={visual.data} progress={progress} />
          </div>
        )}
        
        {visual.type === 'diagram' && (
          <div className="absolute inset-0 flex items-center justify-center">
            <DiagramVisual data={visual.data} />
          </div>
        )}
        
        {visual.type === 'code' && (
          <div className="absolute bottom-10 right-10 max-w-md">
            <CodeVisual code={visual.source || ''} progress={progress} />
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}

// Animated visual components
function AnimatedVisual({ data }: { data: any }) {
  const iconName = getConceptIcon(data?.type || '');
  const Icon = iconName ? (Icons as any)[iconName] : Icons.Sparkles;
  
  if (data?.type === 'sorting') {
    return <SortingAnimation array={data.array} />;
  }
  
  if (data?.type === 'neural') {
    return <NeuralNetworkAnimation layers={data.layers} />;
  }
  
  if (data?.type === 'loop') {
    return <LoopAnimation iterations={data.iterations} />;
  }
  
  if (data?.type === 'atom') {
    return <AtomAnimation electrons={data.electrons} />;
  }
  
  // Default icon animation
  return (
    <motion.div
      animate={{
        scale: [1, 1.2, 1],
        rotate: [0, 180, 360],
      }}
      transition={{
        duration: 3,
        repeat: Infinity,
        repeatType: 'reverse'
      }}
      className="text-prof-purple/30"
    >
      <Icon size={200} />
    </motion.div>
  );
}

// Sorting animation
function SortingAnimation({ array }: { array: number[] }) {
  const [bars, setBars] = useState(array);
  const [comparing, setComparing] = useState<number[]>([]);
  
  useEffect(() => {
    let sorted = [...array];
    let steps: { bars: number[], comparing: number[] }[] = [];
    
    // Generate bubble sort steps
    for (let i = 0; i < sorted.length; i++) {
      for (let j = 0; j < sorted.length - i - 1; j++) {
        steps.push({ bars: [...sorted], comparing: [j, j + 1] });
        if (sorted[j] > sorted[j + 1]) {
          [sorted[j], sorted[j + 1]] = [sorted[j + 1], sorted[j]];
          steps.push({ bars: [...sorted], comparing: [j, j + 1] });
        }
      }
    }
    
    // Animate through steps
    let stepIndex = 0;
    const interval = setInterval(() => {
      if (stepIndex < steps.length) {
        setBars(steps[stepIndex].bars);
        setComparing(steps[stepIndex].comparing);
        stepIndex++;
      } else {
        stepIndex = 0; // Loop
      }
    }, 500);
    
    return () => clearInterval(interval);
  }, [array]);
  
  return (
    <div className="flex items-end gap-2 h-48">
      {bars.map((value, index) => (
        <motion.div
          key={index}
          className={`w-12 ${
            comparing.includes(index) ? 'bg-prof-purple' : 'bg-prof-blue/50'
          }`}
          animate={{ height: value * 2 }}
          transition={{ duration: 0.3 }}
        />
      ))}
    </div>
  );
}

// Neural network visualization
function NeuralNetworkAnimation({ layers }: { layers: number[] }) {
  return (
    <div className="flex items-center gap-8">
      {layers.map((nodeCount, layerIndex) => (
        <div key={layerIndex} className="flex flex-col gap-4">
          {Array.from({ length: nodeCount }).map((_, nodeIndex) => (
            <motion.div
              key={nodeIndex}
              className="w-8 h-8 rounded-full bg-prof-purple/50 border-2 border-prof-purple"
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.5, 1, 0.5]
              }}
              transition={{
                duration: 2,
                delay: layerIndex * 0.2 + nodeIndex * 0.1,
                repeat: Infinity
              }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

// Loop animation
function LoopAnimation({ iterations }: { iterations: number }) {
  const [current, setCurrent] = useState(0);
  
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrent(c => (c + 1) % iterations);
    }, 1000);
    return () => clearInterval(interval);
  }, [iterations]);
  
  return (
    <div className="text-center">
      <motion.div
        key={current}
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        className="text-6xl font-bold text-prof-purple"
      >
        {current + 1} / {iterations}
      </motion.div>
      <div className="mt-4 flex gap-2 justify-center">
        {Array.from({ length: iterations }).map((_, i) => (
          <div
            key={i}
            className={`w-3 h-3 rounded-full ${
              i === current ? 'bg-prof-purple' : 'bg-gray-600'
            }`}
          />
        ))}
      </div>
    </div>
  );
}

// Atom animation
function AtomAnimation({ electrons }: { electrons: number }) {
  return (
    <div className="relative w-64 h-64">
      {/* Nucleus */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-12 h-12 rounded-full bg-prof-purple animate-pulse" />
      </div>
      
      {/* Electron orbits */}
      {Array.from({ length: 3 }).map((_, orbit) => (
        <motion.div
          key={orbit}
          className="absolute inset-0 border-2 border-prof-blue/30 rounded-full"
          style={{
            width: `${100 + orbit * 60}px`,
            height: `${100 + orbit * 60}px`,
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)'
          }}
          animate={{ rotate: 360 }}
          transition={{
            duration: 5 + orbit * 2,
            repeat: Infinity,
            ease: 'linear'
          }}
        >
          {/* Electrons */}
          {orbit < electrons / 3 && (
            <div className="absolute w-3 h-3 bg-prof-green rounded-full"
              style={{ top: 0, left: '50%', transform: 'translateX(-50%)' }}
            />
          )}
        </motion.div>
      ))}
    </div>
  );
}

// Canvas visualizations
function CanvasVisual({ canvasRef, data, progress }: any) {
  useEffect(() => {
    if (!canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    
    if (data?.type === 'graph') {
      drawGraph(ctx, progress);
    } else if (data?.type === 'equation') {
      drawEquation(ctx, progress);
    }
  }, [canvasRef, data, progress]);
  
  return (
    <canvas
      ref={canvasRef}
      width={400}
      height={300}
      className="border border-prof-purple/30 rounded-lg"
    />
  );
}

// Helper functions for canvas drawing
function drawGraph(ctx: CanvasRenderingContext2D, progress: number) {
  const width = ctx.canvas.width;
  const height = ctx.canvas.height;
  const centerY = height / 2;
  
  ctx.strokeStyle = '#8b5cf6';
  ctx.lineWidth = 2;
  ctx.beginPath();
  
  for (let x = 0; x < width * (progress / 100); x++) {
    const y = centerY + Math.sin(x * 0.05) * 50;
    if (x === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  }
  
  ctx.stroke();
}

function drawEquation(ctx: CanvasRenderingContext2D, progress: number) {
  ctx.font = '24px monospace';
  ctx.fillStyle = '#8b5cf6';
  const equation = 'E = mc²';
  const chars = Math.floor(equation.length * (progress / 100));
  ctx.fillText(equation.substring(0, chars), 50, 150);
}

// Diagram visualizations
function DiagramVisual({ data }: { data: any }) {
  if (data?.type === 'array') {
    return (
      <div className="flex gap-2">
        {data.elements.map((elem: string, i: number) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.1 }}
            className="w-16 h-16 border-2 border-prof-purple bg-prof-purple/10 flex items-center justify-center font-mono"
          >
            {elem}
          </motion.div>
        ))}
      </div>
    );
  }
  
  return null;
}

// Code visualization with syntax highlighting
function CodeVisual({ code, progress }: { code: string; progress: number }) {
  const lines = code.split('\n');
  const visibleLines = Math.floor(lines.length * (progress / 100));
  
  return (
    <motion.pre
      className="bg-black/80 backdrop-blur p-4 rounded-lg text-sm text-green-400 font-mono"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      {lines.slice(0, visibleLines).map((line, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.1 }}
        >
          {line}
        </motion.div>
      ))}
    </motion.pre>
  );
}