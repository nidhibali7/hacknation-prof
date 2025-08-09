'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/store/useAppStore';
import { Lesson } from '@/types';
import { 
  Trophy, 
  Brain, 
  Target, 
  Clock, 
  Eye, 
  Sparkles, 
  ChevronRight,
  Award,
  Star,
  TrendingUp
} from 'lucide-react';
import confetti from 'canvas-confetti';

export default function CompletePage() {
  const router = useRouter();
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [attentionScore, setAttentionScore] = useState(0);
  const [timeSpent, setTimeSpent] = useState(0);
  const { session, resetSession } = useAppStore();

  useEffect(() => {
    // Trigger confetti celebration
    const duration = 3 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

    function randomInRange(min: number, max: number) {
      return Math.random() * (max - min) + min;
    }

    const interval: any = setInterval(function() {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
        colors: ['#8B5CF6', '#3B82F6', '#EC4899']
      });
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
        colors: ['#8B5CF6', '#3B82F6', '#EC4899']
      });
    }, 250);

    // Load completed lessons
    const storedLessons = localStorage.getItem('currentLessons');
    if (storedLessons) {
      const parsedLessons = JSON.parse(storedLessons);
      setLessons(Array.isArray(parsedLessons) ? parsedLessons : [parsedLessons]);
    }

    // Calculate metrics
    const startTime = localStorage.getItem('lessonStartTime');
    if (startTime) {
      const elapsed = Date.now() - parseInt(startTime);
      setTimeSpent(Math.floor(elapsed / 1000));
    }

    // Generate attention score (for demo)
    setAttentionScore(85 + Math.floor(Math.random() * 10));

    return () => clearInterval(interval);
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleNewLesson = () => {
    resetSession();
    localStorage.removeItem('currentLessons');
    localStorage.removeItem('lessonStartTime');
    router.push('/');
  };

  const achievements = [
    { icon: Target, label: 'Focused Learner', value: `${attentionScore}% attention` },
    { icon: Clock, label: 'Time Invested', value: formatTime(timeSpent) },
    { icon: Brain, label: 'Concepts Mastered', value: `${lessons.reduce((acc, l) => acc + l.segments.length, 0)} concepts` },
    { icon: Award, label: 'Challenge Complete', value: '100% success' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-prof-purple/10 to-prof-blue/10 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 bg-prof-purple/20 rounded-full"
            initial={{ 
              x: Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 1000),
              y: Math.random() * (typeof window !== 'undefined' ? window.innerHeight : 1000),
              scale: 0
            }}
            animate={{ 
              y: -100,
              scale: [0, 1, 0],
              opacity: [0, 1, 0]
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              delay: Math.random() * 3,
              ease: "easeOut"
            }}
          />
        ))}
      </div>

      <div className="container mx-auto px-4 py-12 relative z-10">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-4xl mx-auto"
        >
          {/* Success Header */}
          <motion.div
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-center mb-12"
          >
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 0.5, delay: 0.5 }}
              className="inline-block mb-6"
            >
              <div className="w-24 h-24 bg-gradient-to-br from-prof-purple to-prof-blue rounded-full flex items-center justify-center shadow-2xl">
                <Trophy size={48} className="text-white" />
              </div>
            </motion.div>

            <h1 className="text-5xl font-bold text-white mb-4">
              Congratulations! 🎉
            </h1>
            <p className="text-xl text-gray-300">
              You've successfully completed your adaptive micro-lesson
            </p>
          </motion.div>

          {/* Achievement Cards */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
            {achievements.map((achievement, index) => (
              <motion.div
                key={achievement.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + index * 0.1 }}
                className="bg-gray-900/50 backdrop-blur rounded-xl p-6 border border-gray-800 hover:border-prof-purple/50 transition-all"
              >
                <achievement.icon className="text-prof-purple mb-3" size={24} />
                <p className="text-sm text-gray-400 mb-1">{achievement.label}</p>
                <p className="text-lg font-bold text-white">{achievement.value}</p>
              </motion.div>
            ))}
          </div>

          {/* Learning Summary */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="bg-gray-900/50 backdrop-blur rounded-2xl p-8 border border-gray-800 mb-8"
          >
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
              <Sparkles className="text-prof-purple" size={24} />
              What You Learned
            </h2>
            
            <div className="space-y-4">
              {lessons.map((lesson, lessonIndex) => (
                <div key={lesson.id} className="border-l-2 border-prof-purple/50 pl-6">
                  <h3 className="text-lg font-semibold text-white mb-2">
                    {lesson.title}
                  </h3>
                  <div className="space-y-2">
                    {lesson.segments.map((segment, segIndex) => (
                      <motion.div
                        key={segment.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.8 + segIndex * 0.1 }}
                        className="flex items-start gap-2"
                      >
                        <Star size={16} className="text-prof-purple mt-1 flex-shrink-0" />
                        <p className="text-gray-300 text-sm">
                          {segment.concept}
                        </p>
                      </motion.div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Performance Insights */}
            <div className="mt-8 pt-6 border-t border-gray-700">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <TrendingUp className="text-green-500" size={20} />
                Performance Insights
              </h3>
              <div className="grid md:grid-cols-3 gap-4 text-sm">
                <div className="bg-gray-800/50 rounded-lg p-3">
                  <p className="text-gray-400">Learning Style</p>
                  <p className="text-white font-medium">Visual + Auditory</p>
                </div>
                <div className="bg-gray-800/50 rounded-lg p-3">
                  <p className="text-gray-400">Adaptation Count</p>
                  <p className="text-white font-medium">3 simplifications</p>
                </div>
                <div className="bg-gray-800/50 rounded-lg p-3">
                  <p className="text-gray-400">Engagement Level</p>
                  <p className="text-green-500 font-medium">High</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Action Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleNewLesson}
              className="px-8 py-4 bg-gradient-to-r from-prof-purple to-prof-blue text-white font-bold rounded-lg shadow-lg hover:shadow-prof-purple/25 transition-all flex items-center justify-center gap-2"
            >
              Start New Lesson
              <ChevronRight size={20} />
            </motion.button>
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => window.print()}
              className="px-8 py-4 bg-gray-800 text-white font-bold rounded-lg hover:bg-gray-700 transition-all flex items-center justify-center gap-2"
            >
              <Award size={20} />
              Download Certificate
            </motion.button>
          </motion.div>

          {/* MIT Hackathon Badge */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2 }}
            className="text-center mt-12"
          >
            <p className="text-sm text-gray-500">
              Built with 💜 at MIT Hackathon • Powered by AI
            </p>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}