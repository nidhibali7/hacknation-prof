'use client';

import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '@/store/useAppStore';
import { Lesson } from '@/types';
import { getTransitionMessage, determineContentSpeed } from '@/lib/stateMachine';
import { Play, Pause, SkipForward, Volume2, Code, Brain, Sparkles } from 'lucide-react';

interface LessonPlayerProps {
  lesson: Lesson;
  onComplete: () => void;
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
  const [speed, setSpeed] = useState(1.0);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  const segment = lesson.segments[currentSegment];
  const content = segment?.variants[currentVariant];

  // Adjust speed based on sensing data
  useEffect(() => {
    const newSpeed = determineContentSpeed(sensing);
    setSpeed(newSpeed);
    
    if (utteranceRef.current) {
      utteranceRef.current.rate = newSpeed;
    }
  }, [sensing]);

  // Handle state transitions
  useEffect(() => {
    if (lessonState === 'intro' && !isPlaying) {
      // Auto-start after 2 seconds
      setTimeout(() => {
        transitionState({ type: 'START', timestamp: Date.now() });
        setIsPlaying(true);
      }, 2000);
    }
  }, [lessonState, isPlaying, transitionState]);

  // Animated text display
  useEffect(() => {
    if (!content?.text || !isPlaying) return;

    const words = content.text.split(' ');
    let index = 0;

    const interval = setInterval(() => {
      if (index <= words.length) {
        setDisplayText(words.slice(0, index).join(' '));
        setCurrentWordIndex(index);
        index++;
      } else {
        clearInterval(interval);
        // Move to next segment or challenge
        if (currentSegment < lesson.segments.length - 1) {
          setTimeout(() => nextSegment(), 2000);
        } else {
          transitionState({ type: 'COMPLETE', timestamp: Date.now() });
        }
      }
    }, (60 / (words.length * speed)) * 1000); // Adjust timing based on speed

    return () => clearInterval(interval);
  }, [content, isPlaying, speed, currentSegment, lesson.segments.length, nextSegment, transitionState]);

  // Text-to-speech with ElevenLabs
  useEffect(() => {
    if (!content?.text || !isPlaying) return;

    const playElevenLabsSpeech = async () => {
      try {
        // Call our API endpoint that uses ElevenLabs
        const response = await fetch('/api/tts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: content.text,
            speed: speed,
          }),
        });

        if (response.ok) {
          const audioBlob = await response.blob();
          const audioUrl = URL.createObjectURL(audioBlob);
          const audio = new Audio(audioUrl);
          audio.playbackRate = speed;
          audio.volume = 0.8;
          
          audio.onended = () => {
            console.log('[LessonPlayer] ElevenLabs speech ended');
            URL.revokeObjectURL(audioUrl);
          };
          
          await audio.play();
        } else {
          // Fallback to browser TTS if ElevenLabs fails
          console.log('[LessonPlayer] ElevenLabs failed, using browser TTS');
          const utterance = new SpeechSynthesisUtterance(content.text);
          utterance.rate = speed;
          utterance.pitch = 1.0;
          utterance.volume = 0.8;
          speechSynthesis.speak(utterance);
        }
      } catch (error) {
        console.error('[LessonPlayer] TTS error:', error);
        // Fallback to browser TTS
        const utterance = new SpeechSynthesisUtterance(content.text);
        utterance.rate = speed;
        speechSynthesis.speak(utterance);
      }
    };

    playElevenLabsSpeech();

    return () => {
      speechSynthesis.cancel();
    };
  }, [content, isPlaying, speed]);

  // Handle voice commands
  useEffect(() => {
    if (sensing.lastVoiceCommand === 'SHOW_CODE') {
      setShowCode(true);
    } else if (sensing.lastVoiceCommand === 'PAUSE') {
      setIsPlaying(false);
      speechSynthesis.pause();
    } else if (sensing.lastVoiceCommand === 'SKIP') {
      nextSegment();
    }
  }, [sensing.lastVoiceCommand, nextSegment]);

  // Handle confusion/distraction
  useEffect(() => {
    if (sensing.face?.confused && sensing.face.confidence > 0.7) {
      // Show encouragement
      console.log('[LessonPlayer] User seems confused, adapting...');
    }

    if (sensing.gaze?.outsideViewport && sensing.gaze.duration > 2000) {
      // Pause and alert
      setIsPlaying(false);
      speechSynthesis.pause();
    }
  }, [sensing]);

  const togglePlayPause = () => {
    setIsPlaying(!isPlaying);
    if (isPlaying) {
      speechSynthesis.pause();
    } else {
      speechSynthesis.resume();
    }
  };

  return (
    <div className="relative w-full max-w-4xl mx-auto">
      {/* Main video-like container */}
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

          {/* Main content area */}
          <AnimatePresence mode="wait">
            <motion.div
              key={`${currentSegment}-${currentVariant}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex-1 flex flex-col justify-center items-center text-center"
            >
              {/* Animated text */}
              <div className="max-w-3xl">
                <motion.p className="text-2xl lg:text-4xl font-bold text-white leading-relaxed">
                  {displayText.split(' ').map((word, index) => {
                    const isEmphasized = content?.emphasis?.includes(word.toLowerCase());
                    const isCurrent = index === currentWordIndex - 1;
                    
                    return (
                      <motion.span
                        key={index}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: index * 0.05 }}
                        className={`inline-block mr-2 ${
                          isEmphasized ? 'text-prof-yellow' : ''
                        } ${isCurrent ? 'scale-110' : ''}`}
                      >
                        {word}
                      </motion.span>
                    );
                  })}
                </motion.p>
              </div>

              {/* Code display */}
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

          {/* Attention alerts */}
          <AnimatePresence>
            {sensing.gaze?.outsideViewport && sensing.gaze.duration > 2000 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="absolute inset-0 bg-black/50 flex items-center justify-center"
              >
                <div className="bg-white rounded-xl p-6 text-center">
                  <p className="text-2xl font-bold text-gray-900 mb-2">
                    👋 Hey! Eyes here!
                  </p>
                  <p className="text-gray-600">This part is important!</p>
                  <button
                    onClick={() => setIsPlaying(true)}
                    className="mt-4 px-6 py-2 bg-prof-purple text-white rounded-lg"
                  >
                    Continue
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Controls */}
          <div className="absolute bottom-0 left-0 right-0 bg-black/20 backdrop-blur p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  onClick={togglePlayPause}
                  className="p-3 bg-white/20 hover:bg-white/30 rounded-full transition"
                >
                  {isPlaying ? <Pause size={24} /> : <Play size={24} />}
                </button>
                
                <button
                  onClick={() => nextSegment()}
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
                <span className="text-sm">Speed: {speed.toFixed(1)}x</span>
              </div>
            </div>

            {/* Progress bar */}
            <div className="mt-3 h-1 bg-white/20 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-white"
                animate={{ width: `${(currentWordIndex / (content?.text.split(' ').length || 1)) * 100}%` }}
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
              I see that face - let me explain this differently...
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
              Let's dive deeper into the details...
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