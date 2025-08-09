'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Lesson } from '@/types';
import { useAppStore } from '@/store/useAppStore';
import { LessonPlayer } from '@/components/LessonPlayer';
import { CameraAttention } from '@/components/CameraAttention';
import { VoiceCommands } from '@/components/VoiceCommands';
import { ProofRecorder } from '@/components/ProofRecorder';
import { Brain, Eye, Mic, ChevronRight } from 'lucide-react';

export default function LessonPage() {
  const router = useRouter();
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [currentLessonIndex, setCurrentLessonIndex] = useState(0);
  const [showProof, setShowProof] = useState(false);
  
  const {
    lessonState,
    setCurrentLesson,
    transitionState,
    sensing,
  } = useAppStore();

  // Load lessons from localStorage
  useEffect(() => {
    const storedLessons = localStorage.getItem('currentLessons');
    if (storedLessons) {
      const parsedLessons = JSON.parse(storedLessons);
      // Handle both single lesson and array of lessons
      const lessonArray = Array.isArray(parsedLessons) ? parsedLessons : [parsedLessons];
      setLessons(lessonArray);
      if (lessonArray.length > 0) {
        setCurrentLesson(lessonArray[0]);
      }
    } else {
      // No lessons, redirect to home
      router.push('/');
    }
  }, [setCurrentLesson, router]);

  const currentLesson = lessons[currentLessonIndex];

  // Handle lesson completion
  const handleLessonComplete = () => {
    console.log('[LessonPage] Lesson completed, moving to challenge');
    transitionState({ type: 'COMPLETE', timestamp: Date.now() });
  };

  // Handle proof submission
  const handleProofSubmit = (evaluation: any) => {
    console.log('[LessonPage] Proof submitted:', evaluation);
    transitionState({ type: 'SUBMITTED', timestamp: Date.now() });
    
    // Move to next lesson or complete
    if (currentLessonIndex < lessons.length - 1) {
      setTimeout(() => {
        setCurrentLessonIndex(currentLessonIndex + 1);
        setCurrentLesson(lessons[currentLessonIndex + 1]);
        setShowProof(false);
      }, 3000);
    } else {
      // All lessons complete
      setTimeout(() => {
        router.push('/complete');
      }, 3000);
    }
  };

  // Show proof recorder when in prove state
  useEffect(() => {
    if (lessonState === 'prove') {
      setShowProof(true);
    }
  }, [lessonState]);

  if (!currentLesson) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-prof-purple mx-auto mb-4" />
          <p className="text-gray-400">Loading lesson...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-prof-purple/5 to-prof-blue/5">
      {/* Header */}
      <div className="bg-gray-900/50 backdrop-blur border-b border-gray-800">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-gradient-to-br from-prof-purple to-prof-blue rounded-lg">
                <Brain size={24} className="text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">ProfAI</h1>
                <p className="text-xs text-gray-400">
                  Lesson {currentLessonIndex + 1} of {lessons.length}
                </p>
              </div>
            </div>

            {/* Attention indicators */}
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <Eye size={20} className={sensing.gaze?.outsideViewport ? 'text-red-500' : 'text-green-500'} />
                <span className="text-sm text-gray-400">
                  Attention: {sensing.gaze?.attentionScore || 0}%
                </span>
              </div>
              
              <div className="flex items-center gap-2">
                <Mic size={20} className={sensing.lastVoiceCommand ? 'text-green-500 animate-pulse' : 'text-gray-500'} />
                <span className="text-sm text-gray-400">
                  {sensing.lastVoiceCommand || 'Listening'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-12 gap-8">
          {/* Sensing sidebar */}
          <div className="lg:col-span-3 space-y-6">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-gray-900 rounded-xl p-4"
            >
              <h3 className="text-sm font-semibold text-gray-400 mb-3">
                Face Tracking
              </h3>
              <CameraAttention showDebug={false} />
              
              {/* Expression indicators */}
              <div className="mt-4 space-y-2">
                {sensing.face && (
                  <>
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-400">Confused</span>
                      <span className={sensing.face.confused ? 'text-yellow-500' : 'text-gray-600'}>
                        {sensing.face.confused ? 'Yes' : 'No'}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-400">Engaged</span>
                      <span className={sensing.face.engaged ? 'text-green-500' : 'text-gray-600'}>
                        {sensing.face.engaged ? 'Yes' : 'No'}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-400">Looking Away</span>
                      <span className={sensing.face.lookingAway ? 'text-red-500' : 'text-gray-600'}>
                        {sensing.face.lookingAway ? 'Yes' : 'No'}
                      </span>
                    </div>
                  </>
                )}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
            >
              <VoiceCommands showStatus={true} />
            </motion.div>
          </div>

          {/* Main lesson area */}
          <div className="lg:col-span-9">
            <AnimatePresence mode="wait">
              {!showProof ? (
                <motion.div
                  key="lesson"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                >
                  <LessonPlayer
                    lesson={currentLesson}
                    onComplete={handleLessonComplete}
                  />
                </motion.div>
              ) : (
                <motion.div
                  key="proof"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                >
                  <ProofRecorder
                    challenge={currentLesson.challenge!}
                    onSubmit={handleProofSubmit}
                  />
                </motion.div>
              )}
            </AnimatePresence>

            {/* State flow indicator */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mt-8"
            >
              <div className="bg-gray-900 rounded-xl p-6">
                <h3 className="text-sm font-semibold text-gray-400 mb-4">
                  Learning Flow
                </h3>
                <div className="flex items-center justify-between">
                  {['watch', 'challenge', 'prove', 'feedback'].map((state, index) => (
                    <div key={state} className="flex items-center">
                      <div className="text-center">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold ${
                          lessonState === state || 
                          (state === 'watch' && ['intro', 'explain', 'simplify', 'advanced'].includes(lessonState))
                            ? 'bg-prof-purple text-white'
                            : 'bg-gray-800 text-gray-500'
                        }`}>
                          {index + 1}
                        </div>
                        <p className="text-xs text-gray-400 mt-2 capitalize">
                          {state}
                        </p>
                      </div>
                      {index < 3 && (
                        <ChevronRight className="mx-2 text-gray-600" size={20} />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}