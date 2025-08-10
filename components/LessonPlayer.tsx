'use client';

// Audio Caching Strategy:
// - Each segment+variant combination gets a unique cache key
// - Audio is only fetched once per unique content
// - Next segment's normal variant is prefetched while current plays
// - This reduces TTS API calls from ~7 per lesson to ~2-3 per lesson

import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '@/store/useAppStore';
import { Lesson } from '@/types';
import { Play, Pause, SkipForward, Volume2, Code, Brain, Sparkles } from 'lucide-react';

interface LessonPlayerProps {
  lesson: Lesson;
  onComplete: () => void;
}

// Cache for audio URLs to prevent duplicate TTS calls
const audioCache = new Map<string, string>();

// Clean up old audio URLs to prevent memory leaks
const cleanupAudioCache = () => {
  console.log('[LessonPlayer] Cleaning up audio cache, size:', audioCache.size);
  audioCache.forEach((url) => {
    URL.revokeObjectURL(url);
  });
  audioCache.clear();
};

// Clean cache when window unloads
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', cleanupAudioCache);
}

export function LessonPlayer({ lesson, onComplete }: LessonPlayerProps) {
  const {
    currentSegment,
    currentVariant,
    lessonState,
    sensing,
    transitionState,
    nextSegment,
  } = useAppStore();

  const [isPlaying, setIsPlaying] = useState(false);
  const [displayText, setDisplayText] = useState('');
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [showCode, setShowCode] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const currentContentKeyRef = useRef<string | null>(null);
  const prefetchedKeysRef = useRef<Set<string>>(new Set());

  const segment = lesson.segments[currentSegment];
  const content = segment?.variants[currentVariant];

  // Generate unique key for caching audio
  const getContentKey = (segmentIndex: number, variant: string): string => {
    return `${lesson.id}-${segmentIndex}-${variant}`;
  };

  // Fetch and cache audio
  const fetchAndCacheAudio = async (text: string, key: string): Promise<string | null> => {
    // Check if already cached
    if (audioCache.has(key)) {
      console.log('[LessonPlayer] Using cached audio for:', key);
      return audioCache.get(key)!;
    }

    try {
      console.log('[LessonPlayer] Fetching audio for:', key);
      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });

      if (!response.ok) {
        throw new Error('Audio fetch failed');
      }

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      
      // Cache the URL
      audioCache.set(key, audioUrl);
      return audioUrl;
    } catch (error) {
      console.error('[LessonPlayer] Error fetching audio:', error);
      return null;
    }
  };

  // Prefetch next segment's normal variant only
  const prefetchNextSegment = async () => {
    try {
      if (currentSegment < lesson.segments.length - 1) {
        const nextSegmentIndex = currentSegment + 1;
        const nextKey = getContentKey(nextSegmentIndex, 'normal');
        
        // Only prefetch if not already done
        if (!prefetchedKeysRef.current.has(nextKey) && !audioCache.has(nextKey)) {
          prefetchedKeysRef.current.add(nextKey);
          const nextSegment = lesson.segments[nextSegmentIndex];
          const nextContent = nextSegment?.variants?.normal;
          if (nextContent?.text) {
            console.log('[LessonPlayer] Prefetching next segment:', nextKey);
            await fetchAndCacheAudio(nextContent.text, nextKey);
          }
        }
      }
    } catch (error) {
      console.error('[LessonPlayer] Prefetch error (non-critical):', error);
    }
  };

  // Log cache statistics on mount for debugging
  useEffect(() => {
    console.log('[LessonPlayer] Component mounted, cache size:', audioCache.size);
    console.log('[LessonPlayer] Lesson has', lesson?.segments?.length || 0, 'segments');
    if (lesson?.segments?.length > 0) {
      console.log('[LessonPlayer] Expected max TTS calls:', 
        Math.min(lesson.segments.length + 1, 3), // Current + prefetch, max 3
        '(current + prefetch)');
    }
    return () => {
      console.log('[LessonPlayer] Component unmounting, cache size:', audioCache.size);
    };
  }, [lesson]);

  // Auto-start lesson after intro
  useEffect(() => {
    if (lessonState === 'intro' && !hasStarted) {
      const timer = setTimeout(() => {
        transitionState({ type: 'START', timestamp: Date.now() });
        setIsPlaying(true);
        setHasStarted(true);
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, [lessonState, hasStarted, transitionState]);

  // Play lesson segment - Only fetch audio when actually playing new content
  useEffect(() => {
    if (!isPlaying || !content?.text) return;

    const contentKey = getContentKey(currentSegment, currentVariant);
    
    // Skip if we're already playing this content
    if (currentContentKeyRef.current === contentKey && audioRef.current) {
      return;
    }

    let isCancelled = false;
    const words = content.text.split(' ');
    let wordIndex = 0;

    const playSegment = async () => {
      try {
        setIsLoadingAudio(true);
        currentContentKeyRef.current = contentKey;

        // Fetch audio (will use cache if available)
        const audioUrl = await fetchAndCacheAudio(content.text, contentKey);
        
        if (!audioUrl || isCancelled) {
          throw new Error('Audio fetch failed');
        }

        // Create and play audio
        const audio = new Audio(audioUrl);
        audioRef.current = audio;
        
        // Animate text based on audio duration
        audio.addEventListener('loadedmetadata', () => {
          if (isCancelled) return;
          
          setIsLoadingAudio(false);
          const duration = audio.duration * 1000;
          const timePerWord = duration / words.length;
          
          // Start prefetching next segment after audio starts playing
          prefetchNextSegment();
          
          const animateWords = () => {
            if (isCancelled || !audioRef.current) return;
            
            if (wordIndex < words.length) {
              setDisplayText(words.slice(0, wordIndex + 1).join(' '));
              setCurrentWordIndex(wordIndex);
              wordIndex++;
              
              const startTime = performance.now();
              const animate = () => {
                if (performance.now() - startTime >= timePerWord) {
                  animateWords();
                } else if (!isCancelled) {
                  animationFrameRef.current = requestAnimationFrame(animate);
                }
              };
              animationFrameRef.current = requestAnimationFrame(animate);
            }
          };
          
          animateWords();
        });

        // Handle audio end
        audio.addEventListener('ended', () => {
          if (isCancelled) return;
          
          console.log('[LessonPlayer] Segment complete');
          setDisplayText(content.text);
          
          // Move to next segment
          setTimeout(() => {
            if (currentSegment < lesson.segments.length - 1) {
              nextSegment();
              setDisplayText('');
              setCurrentWordIndex(0);
              currentContentKeyRef.current = null; // Reset for next segment
            } else {
              transitionState({ type: 'COMPLETE', timestamp: Date.now() });
            }
          }, 1500);
        });

        await audio.play();
        console.log('[LessonPlayer] Playing audio for:', contentKey);
        
      } catch (error) {
        if (isCancelled) return;
        
        setIsLoadingAudio(false);
        console.error('[LessonPlayer] Error:', error);
        
        // Fallback: Just show text without audio
        const interval = setInterval(() => {
          if (wordIndex < words.length && !isCancelled) {
            setDisplayText(words.slice(0, wordIndex + 1).join(' '));
            setCurrentWordIndex(wordIndex);
            wordIndex++;
          } else {
            clearInterval(interval);
            if (!isCancelled) {
              setTimeout(() => {
                if (currentSegment < lesson.segments.length - 1) {
                  nextSegment();
                  currentContentKeyRef.current = null;
                } else {
                  transitionState({ type: 'COMPLETE', timestamp: Date.now() });
                }
              }, 1500);
            }
          }
        }, 150);
      }
    };

    playSegment();

    // Cleanup function
    return () => {
      isCancelled = true;
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isPlaying, currentSegment, currentVariant]); // Removed unnecessary dependencies

  // Handle voice commands
  useEffect(() => {
    if (sensing.lastVoiceCommand === 'SHOW_CODE') {
      setShowCode(true);
    } else if (sensing.lastVoiceCommand === 'PAUSE') {
      handlePause();
    } else if (sensing.lastVoiceCommand === 'SKIP') {
      handleSkip();
    } else if (sensing.lastVoiceCommand === 'SIMPLIFY' || sensing.lastVoiceCommand === 'DEEPEN') {
      // When variant changes, reset the current content key to trigger new audio fetch
      currentContentKeyRef.current = null;
    }
  }, [sensing.lastVoiceCommand]);

  const handlePause = () => {
    setIsPlaying(false);
    if (audioRef.current) {
      audioRef.current.pause();
    }
  };

  const handlePlay = () => {
    if (audioRef.current && audioRef.current.paused) {
      audioRef.current.play();
    }
    setIsPlaying(true);
  };

  const handleSkip = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    // Reset current content tracking
    currentContentKeyRef.current = null;
    
    if (currentSegment < lesson.segments.length - 1) {
      nextSegment();
      setDisplayText('');
      setCurrentWordIndex(0);
    } else {
      transitionState({ type: 'COMPLETE', timestamp: Date.now() });
    }
  };

  return (
    <div className="relative w-full max-w-4xl mx-auto">
      <div className="aspect-[9/16] lg:aspect-[16/9] bg-gradient-to-br from-prof-purple via-prof-blue to-prof-pink rounded-2xl overflow-hidden shadow-2xl">
        <div className="relative h-full p-8 flex flex-col justify-center">
          
          {/* State indicator */}
          <div className="absolute top-4 left-4 flex items-center gap-2">
            <StateIndicator state={lessonState} variant={currentVariant} />
          </div>

          {/* Segment progress */}
          <div className="absolute top-4 right-4 text-white/80 text-sm">
            Segment {currentSegment + 1} / {lesson.segments.length}
          </div>

          {/* Main content */}
          <AnimatePresence mode="wait">
            <motion.div
              key={`${currentSegment}-${currentVariant}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex-1 flex flex-col justify-center items-center text-center"
            >
              <div className="max-w-3xl">
                <motion.p className="text-2xl lg:text-4xl font-bold text-white leading-relaxed">
                  {isLoadingAudio ? 'Loading audio...' : 
                   displayText || (isPlaying ? 'Preparing...' : 'Press play to start')}
                </motion.p>
              </div>

              {showCode && content?.code && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="mt-6 w-full max-w-2xl"
                >
                  <pre className="bg-black/30 backdrop-blur rounded-lg p-4 text-left">
                    <code className="text-green-400 text-sm lg:text-base">
                      {content.code}
                    </code>
                  </pre>
                </motion.div>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Controls */}
          <div className="absolute bottom-0 left-0 right-0 bg-black/20 backdrop-blur p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => isPlaying ? handlePause() : handlePlay()}
                  className="p-3 bg-white/20 hover:bg-white/30 rounded-full transition"
                >
                  {isPlaying ? <Pause size={24} /> : <Play size={24} />}
                </button>
                
                <button
                  onClick={handleSkip}
                  className="p-3 bg-white/20 hover:bg-white/30 rounded-full transition"
                >
                  <SkipForward size={24} />
                </button>

                <button
                  onClick={() => setShowCode(!showCode)}
                  className="p-3 bg-white/20 hover:bg-white/30 rounded-full transition"
                  disabled={!content?.code}
                >
                  <Code size={24} />
                </button>
              </div>

              <div className="flex items-center gap-2 text-white">
                <Volume2 size={20} />
                <span className="text-sm">
                  ElevenLabs Voice
                  {audioCache.has(getContentKey(currentSegment, currentVariant)) && (
                    <span className="ml-2 text-xs text-green-400">(Cached)</span>
                  )}
                </span>
              </div>
            </div>

            {/* Progress bar */}
            <div className="mt-3 h-1 bg-white/20 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-white"
                animate={{ 
                  width: `${(currentWordIndex / (content?.text.split(' ').length || 1)) * 100}%` 
                }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Adaptation messages */}
      <AnimatePresence>
        {lessonState === 'simplify' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mt-4 p-4 bg-blue-500/10 border border-blue-500 rounded-lg"
          >
            <p className="text-blue-500 flex items-center gap-2">
              <Brain size={20} />
              Let me explain this more simply...
            </p>
          </motion.div>
        )}

        {lessonState === 'advanced' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mt-4 p-4 bg-purple-500/10 border border-purple-500 rounded-lg"
          >
            <p className="text-purple-500 flex items-center gap-2">
              <Sparkles size={20} />
              Let's dive deeper...
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function StateIndicator({ state, variant }: { state: string; variant: string }) {
  const stateColors: Record<string, string> = {
    intro: 'bg-gray-500',
    explain: 'bg-blue-500',
    simplify: 'bg-green-500',
    advanced: 'bg-purple-500',
    challenge: 'bg-orange-500',
    prove: 'bg-red-500',
    feedback: 'bg-indigo-500',
  };

  return (
    <div className="flex items-center gap-2">
      <div className={`w-3 h-3 rounded-full ${stateColors[state] || 'bg-gray-500'} animate-pulse`} />
      <span className="text-white/80 text-sm capitalize">
        {state} {variant !== 'normal' && `(${variant})`}
      </span>
    </div>
  );
}