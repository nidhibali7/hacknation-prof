'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Upload, Link, BookOpen, Sparkles, Brain, Zap, ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { ContentSource } from '@/types';

export default function HomePage() {
  const router = useRouter();
  const [inputType, setInputType] = useState<'youtube' | 'pdf' | 'topic'>('youtube');
  const [inputValue, setInputValue] = useState('');
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      let response;
      
      if (inputType === 'youtube') {
        response = await fetch('/api/ingest/youtube', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: inputValue }),
        });
      } else if (inputType === 'pdf' && pdfFile) {
        const formData = new FormData();
        formData.append('file', pdfFile);
        
        response = await fetch('/api/ingest/pdf', {
          method: 'POST',
          body: formData,
        });
      } else if (inputType === 'topic') {
        response = await fetch('/api/lesson/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            content: inputValue,
            source: { type: 'topic', query: inputValue },
          }),
        });
      }

      if (response?.ok) {
        const result = await response.json();
        // Store lessons and navigate
        if (result.success && result.data) {
          localStorage.setItem('currentLessons', JSON.stringify(result.data));
          router.push('/lesson');
        }
      }
    } catch (error) {
      console.error('Error processing input:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-prof-purple/10 to-prof-blue/10">
      {/* Hero Section */}
      <div className="container mx-auto px-4 pt-20 pb-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-4xl mx-auto"
        >
          <div className="flex justify-center mb-6">
            <div className="p-4 bg-gradient-to-br from-prof-purple to-prof-blue rounded-2xl">
              <Brain size={48} className="text-white" />
            </div>
          </div>
          
          <h1 className="text-5xl lg:text-7xl font-bold mb-6 bg-gradient-to-r from-prof-purple via-prof-pink to-prof-blue bg-clip-text text-transparent">
            ProfAI
          </h1>
          
          <p className="text-2xl lg:text-3xl text-gray-300 mb-4">
            The Video That Watches You Back
          </p>
          
          <p className="text-lg text-gray-400 mb-12 max-w-2xl mx-auto">
            60-second AI lessons that adapt to your confusion in real-time. 
            Turn any PDF, YouTube video, or topic into personalized micro-lessons.
          </p>

          {/* Feature pills */}
          <div className="flex flex-wrap justify-center gap-3 mb-12">
            {[
              { icon: '👁️', text: 'Eye Tracking' },
              { icon: '🎤', text: 'Voice Commands' },
              { icon: '🧠', text: 'Adaptive Content' },
              { icon: '⚡', text: '60-Second Lessons' },
              { icon: '💻', text: 'Coding Challenges' },
              { icon: '🎥', text: 'Proof Videos' },
            ].map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
                className="px-4 py-2 bg-white/10 backdrop-blur rounded-full flex items-center gap-2"
              >
                <span className="text-xl">{feature.icon}</span>
                <span className="text-sm text-gray-300">{feature.text}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Input Section */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="max-w-2xl mx-auto"
        >
          <div className="bg-gray-900/50 backdrop-blur-lg rounded-2xl p-8 border border-gray-800">
            <h2 className="text-2xl font-bold mb-6 text-center">
              Start Learning in Seconds
            </h2>

            {/* Input type selector */}
            <div className="flex justify-center gap-2 mb-6">
              {[
                { value: 'youtube', icon: Link, label: 'YouTube' },
                { value: 'pdf', icon: Upload, label: 'PDF' },
                { value: 'topic', icon: BookOpen, label: 'Topic' },
              ].map((type) => (
                <button
                  key={type.value}
                  onClick={() => setInputType(type.value as any)}
                  className={`px-6 py-3 rounded-lg font-medium transition-all flex items-center gap-2 ${
                    inputType === type.value
                      ? 'bg-prof-purple text-white'
                      : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                  }`}
                >
                  <type.icon size={20} />
                  {type.label}
                </button>
              ))}
            </div>

            {/* Input form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {inputType === 'youtube' && (
                <div>
                  <label className="block text-sm text-gray-400 mb-2">
                    YouTube URL
                  </label>
                  <input
                    type="url"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder="https://youtube.com/watch?v=..."
                    className="w-full px-4 py-3 bg-gray-800 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-prof-purple"
                    required
                  />
                </div>
              )}

              {inputType === 'pdf' && (
                <div>
                  <label className="block text-sm text-gray-400 mb-2">
                    Upload PDF or Image
                  </label>
                  <div className="relative">
                    <input
                      type="file"
                      accept=".pdf,image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        setPdfFile(file || null);
                      }}
                      className="hidden"
                      id="pdf-upload"
                      required
                    />
                    <label
                      htmlFor="pdf-upload"
                      className="block w-full px-4 py-8 bg-gray-800 rounded-lg text-center cursor-pointer hover:bg-gray-700 transition border-2 border-dashed border-gray-600"
                    >
                      {pdfFile ? (
                        <div>
                          <Upload size={32} className="mx-auto mb-2 text-prof-purple" />
                          <p className="text-white">
                            {(() => {
                              // Clean up long macOS temp paths
                              const name = pdfFile.name;
                              if (name.includes('/')) {
                                // Extract just the filename from path
                                const filename = name.split('/').pop() || name;
                                // Further clean if it's a Screenshot
                                if (filename.includes('Screenshot')) {
                                  return `Screenshot.${filename.split('.').pop()}`;
                                }
                                return filename;
                              }
                              return name;
                            })()}
                          </p>
                          <p className="text-sm text-gray-400 mt-1">
                            {(pdfFile.size / 1024 / 1024).toFixed(2)} MB
                            {pdfFile.type.includes('image') && ' (Image)'}
                          </p>
                        </div>
                      ) : (
                        <div>
                          <Upload size={32} className="mx-auto mb-2 text-gray-500" />
                          <p className="text-gray-400">
                            Click to upload PDF or Image
                          </p>
                          <p className="text-sm text-gray-500 mt-1">
                            PDF, PNG, JPG (Max 10MB)
                          </p>
                        </div>
                      )}
                    </label>
                  </div>
                </div>
              )}

              {inputType === 'topic' && (
                <div>
                  <label className="block text-sm text-gray-400 mb-2">
                    What do you want to learn?
                  </label>
                  <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder="e.g., React hooks, Machine learning basics, Quantum computing"
                    className="w-full px-4 py-3 bg-gray-800 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-prof-purple"
                    required
                  />
                </div>
              )}

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={isLoading}
                className="w-full py-4 bg-gradient-to-r from-prof-purple to-prof-blue text-white font-bold rounded-lg hover:shadow-lg hover:shadow-prof-purple/25 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                    Generating Lessons...
                  </>
                ) : (
                  <>
                    <Sparkles size={20} />
                    Generate Adaptive Lessons
                    <ArrowRight size={20} />
                  </>
                )}
              </motion.button>
            </form>
          </div>

          {/* Demo notice */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500">
              🎯 Demo Mode: Try "Introduction to React Hooks" or paste any YouTube URL
            </p>
          </div>
        </motion.div>

        {/* How it works */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-20 max-w-4xl mx-auto"
        >
          <h3 className="text-2xl font-bold text-center mb-12">
            How ProfAI Works
          </h3>
          
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: '1',
                title: 'Watch',
                description: '60-second micro-lessons that respond to your face and voice',
                icon: '👁️',
              },
              {
                step: '2',
                title: 'Build',
                description: '5-minute coding challenges to apply what you learned',
                icon: '💻',
              },
              {
                step: '3',
                title: 'Prove',
                description: '30-second video explaining your solution for AI feedback',
                icon: '🎥',
              },
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 + index * 0.1 }}
                className="text-center"
              >
                <div className="text-4xl mb-4">{item.icon}</div>
                <div className="text-sm text-prof-purple mb-2">Step {item.step}</div>
                <h4 className="text-xl font-bold mb-2">{item.title}</h4>
                <p className="text-gray-400 text-sm">{item.description}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}