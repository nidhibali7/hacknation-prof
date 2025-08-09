'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import Webcam from 'react-webcam';
import { motion, AnimatePresence } from 'framer-motion';
import { Video, StopCircle, Upload, RotateCcw, CheckCircle, AlertCircle } from 'lucide-react';
import { CodingChallenge, Evaluation } from '@/types';

interface ProofRecorderProps {
  challenge: CodingChallenge;
  onSubmit: (evaluation: Evaluation) => void;
}

export function ProofRecorder({ challenge, onSubmit }: ProofRecorderProps) {
  const [recording, setRecording] = useState(false);
  const [videoBlob, setVideoBlob] = useState<Blob | null>(null);
  const [countdown, setCountdown] = useState(30);
  const [isUploading, setIsUploading] = useState(false);
  const [evaluation, setEvaluation] = useState<Evaluation | null>(null);
  
  const webcamRef = useRef<Webcam>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Start recording
  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 1280, height: 720 },
        audio: true,
      });

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'video/webm;codecs=vp8,opus',
      });

      chunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'video/webm' });
        setVideoBlob(blob);
        
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start(100); // Collect data every 100ms
      setRecording(true);
      setCountdown(30);

      // Start countdown
      countdownIntervalRef.current = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            stopRecording();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      console.log('[ProofRecorder] Recording started');
    } catch (error) {
      console.error('[ProofRecorder] Error starting recording:', error);
    }
  }, []);

  // Stop recording
  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop();
      setRecording(false);
      
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
        countdownIntervalRef.current = null;
      }
      
      console.log('[ProofRecorder] Recording stopped');
    }
  }, [recording]);

  // Submit proof video
  const submitProof = useCallback(async () => {
    if (!videoBlob) return;

    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append('video', videoBlob, 'proof.webm');
      formData.append('challenge', challenge.id);
      formData.append('lesson', 'current-lesson'); // Would come from context

      const response = await fetch('/api/evaluate', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();
      
      if (result.success) {
        setEvaluation(result.data);
        onSubmit(result.data);
      } else {
        console.error('[ProofRecorder] Evaluation failed:', result.error);
      }
    } catch (error) {
      console.error('[ProofRecorder] Submit error:', error);
    } finally {
      setIsUploading(false);
    }
  }, [videoBlob, challenge.id, onSubmit]);

  // Reset recording
  const resetRecording = useCallback(() => {
    setVideoBlob(null);
    setEvaluation(null);
    setCountdown(30);
  }, []);

  // Auto-stop after 30 seconds
  useEffect(() => {
    if (countdown === 0 && recording) {
      stopRecording();
    }
  }, [countdown, recording, stopRecording]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
      }
      if (mediaRecorderRef.current) {
        mediaRecorderRef.current.stop();
      }
    };
  }, []);

  return (
    <div className="w-full max-w-4xl mx-auto p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gray-900 rounded-2xl overflow-hidden shadow-2xl"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-prof-purple to-prof-blue p-6">
          <h2 className="text-2xl font-bold text-white mb-2">
            🎯 Prove Your Understanding
          </h2>
          <p className="text-white/80">
            Explain what you built in 30 seconds or less
          </p>
        </div>

        {/* Video area */}
        <div className="p-6">
          <div className="relative aspect-video bg-black rounded-lg overflow-hidden mb-6">
            {!videoBlob ? (
              <>
                <Webcam
                  ref={webcamRef}
                  audio={true}
                  className="w-full h-full object-cover"
                  videoConstraints={{
                    width: 1280,
                    height: 720,
                    facingMode: 'user',
                  }}
                />
                
                {recording && (
                  <div className="absolute top-4 right-4 flex items-center gap-2 bg-red-500 text-white px-3 py-2 rounded-lg">
                    <div className="w-3 h-3 bg-white rounded-full animate-pulse" />
                    <span className="font-medium">{countdown}s</span>
                  </div>
                )}

                {!recording && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <div className="text-center text-white">
                      <Video size={48} className="mx-auto mb-4" />
                      <p className="text-lg">Ready to record your explanation?</p>
                      <p className="text-sm text-white/60 mt-2">
                        You'll have 30 seconds to explain your solution
                      </p>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <video
                src={URL.createObjectURL(videoBlob)}
                controls
                className="w-full h-full"
              />
            )}
          </div>

          {/* Challenge reminder */}
          <div className="bg-gray-800 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-white mb-2">Your Challenge:</h3>
            <p className="text-gray-300 text-sm">{challenge.description}</p>
          </div>

          {/* Controls */}
          <div className="flex justify-center gap-4">
            {!recording && !videoBlob && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={startRecording}
                className="px-8 py-3 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium flex items-center gap-2"
              >
                <Video size={20} />
                Start Recording
              </motion.button>
            )}

            {recording && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={stopRecording}
                className="px-8 py-3 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium flex items-center gap-2 animate-pulse"
              >
                <StopCircle size={20} />
                Stop Recording
              </motion.button>
            )}

            {videoBlob && !evaluation && (
              <>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={resetRecording}
                  className="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium flex items-center gap-2"
                >
                  <RotateCcw size={20} />
                  Re-record
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={submitProof}
                  disabled={isUploading}
                  className="px-8 py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium flex items-center gap-2 disabled:opacity-50"
                >
                  {isUploading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                      Evaluating...
                    </>
                  ) : (
                    <>
                      <Upload size={20} />
                      Submit Proof
                    </>
                  )}
                </motion.button>
              </>
            )}
          </div>
        </div>

        {/* Evaluation results */}
        <AnimatePresence>
          {evaluation && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="border-t border-gray-800"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-white">
                    AI Evaluation
                  </h3>
                  <div className="flex items-center gap-2">
                    <div className={`text-2xl font-bold ${
                      evaluation.score >= 80 ? 'text-green-500' : 
                      evaluation.score >= 60 ? 'text-yellow-500' : 
                      'text-red-500'
                    }`}>
                      {evaluation.score}/100
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  {/* Feedback */}
                  <div className="bg-gray-800 rounded-lg p-4">
                    <p className="text-gray-300">{evaluation.feedback}</p>
                  </div>

                  {/* Strengths */}
                  {evaluation.strengths.length > 0 && (
                    <div>
                      <h4 className="text-green-500 font-medium mb-2 flex items-center gap-2">
                        <CheckCircle size={20} />
                        Strengths
                      </h4>
                      <ul className="space-y-1">
                        {evaluation.strengths.map((strength, index) => (
                          <li key={index} className="text-gray-300 text-sm flex items-start gap-2">
                            <span className="text-green-500 mt-1">•</span>
                            {strength}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Improvements */}
                  {evaluation.improvements.length > 0 && (
                    <div>
                      <h4 className="text-yellow-500 font-medium mb-2 flex items-center gap-2">
                        <AlertCircle size={20} />
                        Areas for Improvement
                      </h4>
                      <ul className="space-y-1">
                        {evaluation.improvements.map((improvement, index) => (
                          <li key={index} className="text-gray-300 text-sm flex items-start gap-2">
                            <span className="text-yellow-500 mt-1">•</span>
                            {improvement}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Continue button */}
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => onSubmit(evaluation)}
                    className="w-full py-3 bg-prof-purple hover:bg-prof-purple/80 text-white rounded-lg font-medium"
                  >
                    Continue to Next Lesson
                  </motion.button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}