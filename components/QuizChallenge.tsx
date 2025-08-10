'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Quiz, QuizQuestion, QuizAttempt } from '@/types';
import { Brain, CheckCircle, XCircle, RotateCcw, ChevronRight, Trophy, Target } from 'lucide-react';
import confetti from 'canvas-confetti';

interface QuizChallengeProps {
  quiz: Quiz;
  onComplete: (passed: boolean, score: number) => void;
}

export function QuizChallenge({ quiz, onComplete }: QuizChallengeProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [attempt, setAttempt] = useState<QuizAttempt>({
    attemptNumber: 1,
    answers: [],
    score: 0,
    startedAt: new Date(),
  });
  const [isComplete, setIsComplete] = useState(false);
  const [hasSubmittedAnswer, setHasSubmittedAnswer] = useState(false);

  const currentQuestion = quiz.questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / quiz.questions.length) * 100;

  // Calculate score when quiz is complete
  useEffect(() => {
    if (attempt.answers.length === quiz.questions.length && !isComplete) {
      const correctAnswers = attempt.answers.filter(
        (answer, index) => answer === quiz.questions[index].correctAnswer
      );
      const score = Math.round((correctAnswers.length / quiz.questions.length) * 100);
      
      setAttempt(prev => ({
        ...prev,
        score,
        completedAt: new Date(),
        timeSpent: Math.floor((new Date().getTime() - prev.startedAt.getTime()) / 1000),
      }));
      
      setIsComplete(true);

      // Celebrate if passed
      if (score >= quiz.passingScore) {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#9333ea', '#3b82f6', '#ec4899'],
        });
      }
    }
  }, [attempt.answers, quiz.questions, quiz.passingScore, isComplete]);

  const handleAnswerSelect = (answerIndex: number) => {
    if (hasSubmittedAnswer) return;
    setSelectedAnswer(answerIndex);
  };

  const handleSubmitAnswer = () => {
    if (selectedAnswer === null) return;
    
    setHasSubmittedAnswer(true);
    setShowExplanation(true);
    
    // Record the answer
    setAttempt(prev => ({
      ...prev,
      answers: [...prev.answers, selectedAnswer],
    }));
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < quiz.questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setSelectedAnswer(null);
      setShowExplanation(false);
      setHasSubmittedAnswer(false);
    }
  };

  const handleRetake = () => {
    setCurrentQuestionIndex(0);
    setSelectedAnswer(null);
    setShowExplanation(false);
    setHasSubmittedAnswer(false);
    setIsComplete(false);
    setAttempt({
      attemptNumber: attempt.attemptNumber + 1,
      answers: [],
      score: 0,
      startedAt: new Date(),
    });
  };

  const handleFinish = () => {
    const passed = attempt.score >= quiz.passingScore;
    onComplete(passed, attempt.score);
  };

  if (isComplete) {
    const passed = attempt.score >= quiz.passingScore;
    
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-gray-900 rounded-2xl p-8 max-w-2xl mx-auto"
      >
        <div className="text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", duration: 0.5 }}
            className="inline-flex p-4 rounded-full mb-4"
            style={{
              background: passed 
                ? 'linear-gradient(135deg, #10b981, #3b82f6)' 
                : 'linear-gradient(135deg, #ef4444, #f97316)'
            }}
          >
            {passed ? <Trophy size={48} className="text-white" /> : <Target size={48} className="text-white" />}
          </motion.div>
          
          <h2 className="text-3xl font-bold text-white mb-2">
            {passed ? 'Excellent Work!' : 'Good Effort!'}
          </h2>
          
          <div className="text-5xl font-bold bg-gradient-to-r from-prof-purple to-prof-blue bg-clip-text text-transparent mb-4">
            {attempt.score}%
          </div>
          
          <p className="text-gray-400 mb-6">
            You got {attempt.answers.filter((a, i) => a === quiz.questions[i].correctAnswer).length} out of {quiz.questions.length} questions correct
            {attempt.timeSpent && ` in ${Math.floor(attempt.timeSpent / 60)}:${(attempt.timeSpent % 60).toString().padStart(2, '0')}`}
          </p>
          
          <div className="flex gap-4 justify-center">
            {quiz.allowRetakes && !passed && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleRetake}
                className="px-6 py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-lg font-semibold flex items-center gap-2 transition-colors"
              >
                <RotateCcw size={20} />
                Retake Quiz
              </motion.button>
            )}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleFinish}
              className="px-6 py-3 bg-gradient-to-r from-prof-purple to-prof-blue text-white rounded-lg font-semibold flex items-center gap-2 shadow-lg hover:shadow-prof-purple/25 transition-all"
            >
              Continue
              <ChevronRight size={20} />
            </motion.button>
          </div>

          {attempt.attemptNumber > 1 && (
            <p className="text-sm text-gray-500 mt-4">
              Attempt {attempt.attemptNumber}
            </p>
          )}
        </div>
      </motion.div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gray-900 rounded-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-prof-purple to-prof-blue p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <Brain size={24} className="text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">{quiz.title}</h2>
                <p className="text-white/80 text-sm">Test your understanding</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-white/80 text-sm">Question</p>
              <p className="text-2xl font-bold text-white">
                {currentQuestionIndex + 1}/{quiz.questions.length}
              </p>
            </div>
          </div>
          
          {/* Progress bar */}
          <div className="h-2 bg-white/20 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-white"
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>

        {/* Question */}
        <div className="p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentQuestion.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <h3 className="text-xl font-semibold text-white mb-6">
                {currentQuestion.question}
              </h3>

              {/* Options */}
              <div className="space-y-3">
                {currentQuestion.options.map((option, index) => {
                  const isSelected = selectedAnswer === index;
                  const isCorrect = index === currentQuestion.correctAnswer;
                  const showResult = hasSubmittedAnswer;
                  
                  return (
                    <motion.button
                      key={index}
                      whileHover={!hasSubmittedAnswer ? { scale: 1.02 } : {}}
                      whileTap={!hasSubmittedAnswer ? { scale: 0.98 } : {}}
                      onClick={() => handleAnswerSelect(index)}
                      disabled={hasSubmittedAnswer}
                      className={`w-full text-left p-4 rounded-lg transition-all ${
                        showResult
                          ? isCorrect
                            ? 'bg-green-500/20 border-2 border-green-500'
                            : isSelected
                            ? 'bg-red-500/20 border-2 border-red-500'
                            : 'bg-gray-800 border-2 border-gray-700'
                          : isSelected
                          ? 'bg-prof-purple/20 border-2 border-prof-purple'
                          : 'bg-gray-800 border-2 border-gray-700 hover:border-gray-600'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                            showResult
                              ? isCorrect
                                ? 'border-green-500 bg-green-500'
                                : isSelected
                                ? 'border-red-500 bg-red-500'
                                : 'border-gray-600'
                              : isSelected
                              ? 'border-prof-purple bg-prof-purple'
                              : 'border-gray-600'
                          }`}>
                            {isSelected && !showResult && (
                              <div className="w-2 h-2 bg-white rounded-full" />
                            )}
                            {showResult && isCorrect && (
                              <CheckCircle size={16} className="text-white" />
                            )}
                            {showResult && isSelected && !isCorrect && (
                              <XCircle size={16} className="text-white" />
                            )}
                          </div>
                          <span className={`${
                            showResult && isCorrect ? 'text-green-400' :
                            showResult && isSelected && !isCorrect ? 'text-red-400' :
                            'text-gray-300'
                          }`}>
                            {option}
                          </span>
                        </div>
                      </div>
                    </motion.button>
                  );
                })}
              </div>

              {/* Explanation */}
              <AnimatePresence>
                {showExplanation && currentQuestion.explanation && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg"
                  >
                    <p className="text-sm text-blue-400 font-semibold mb-1">Explanation:</p>
                    <p className="text-gray-300">{currentQuestion.explanation}</p>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Action buttons */}
              <div className="flex justify-between mt-8">
                <div>
                  {attempt.attemptNumber > 1 && (
                    <span className="text-sm text-gray-500">
                      Attempt {attempt.attemptNumber}
                    </span>
                  )}
                </div>
                <div className="flex gap-3">
                  {!hasSubmittedAnswer ? (
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleSubmitAnswer}
                      disabled={selectedAnswer === null}
                      className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                        selectedAnswer !== null
                          ? 'bg-gradient-to-r from-prof-purple to-prof-blue text-white shadow-lg hover:shadow-prof-purple/25'
                          : 'bg-gray-800 text-gray-500 cursor-not-allowed'
                      }`}
                    >
                      Submit Answer
                    </motion.button>
                  ) : (
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleNextQuestion}
                      className="px-6 py-3 bg-gradient-to-r from-prof-purple to-prof-blue text-white rounded-lg font-semibold shadow-lg hover:shadow-prof-purple/25 transition-all flex items-center gap-2"
                    >
                      {currentQuestionIndex < quiz.questions.length - 1 ? 'Next Question' : 'See Results'}
                      <ChevronRight size={20} />
                    </motion.button>
                  )}
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}