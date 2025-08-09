'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { VoiceCommand } from '@/types';
import { useAppStore } from '@/store/useAppStore';
import { Mic, MicOff, Volume2 } from 'lucide-react';

interface VoiceCommandsProps {
  onCommand?: (command: VoiceCommand) => void;
  enabled?: boolean;
  showStatus?: boolean;
}

const COMMAND_MAPPINGS: Record<string, VoiceCommand> = {
  'go deeper': 'DEEPEN',
  'deeper': 'DEEPEN',
  'more detail': 'DEEPEN',
  'advanced': 'DEEPEN',
  'simplify': 'SIMPLIFY',
  'simpler': 'SIMPLIFY',
  'easier': 'SIMPLIFY',
  'simple': 'SIMPLIFY',
  'i don\'t understand': 'SIMPLIFY',
  'confused': 'CONFUSED',
  'what': 'CONFUSED',
  'huh': 'CONFUSED',
  'show code': 'SHOW_CODE',
  'code': 'SHOW_CODE',
  'example': 'EXAMPLE',
  'show example': 'EXAMPLE',
  'give example': 'EXAMPLE',
  'skip': 'SKIP',
  'next': 'SKIP',
  'move on': 'SKIP',
  'pause': 'PAUSE',
  'stop': 'PAUSE',
  'wait': 'PAUSE',
  'repeat': 'REPEAT',
  'again': 'REPEAT',
  'say that again': 'REPEAT',
  'help': 'HELP',
};

export function VoiceCommands({ 
  onCommand, 
  enabled = true,
  showStatus = true 
}: VoiceCommandsProps) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [lastCommand, setLastCommand] = useState<VoiceCommand | null>(null);
  const [confidence, setConfidence] = useState(0);
  const recognitionRef = useRef<any>(null);
  
  const updateSensing = useAppStore((state) => state.updateSensing);

  // Initialize speech recognition
  const initializeSpeechRecognition = useCallback(() => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      console.error('[VoiceCommands] Speech recognition not supported');
      return;
    }

    // @ts-ignore
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();

    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.language = 'en-US';

    recognition.onresult = (event: any) => {
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript.toLowerCase();
        const confidence = event.results[i][0].confidence;

        if (event.results[i].isFinal) {
          finalTranscript += transcript;
          setConfidence(confidence);
          
          // Check for commands
          const command = detectCommand(transcript);
          if (command) {
            console.log(`[VoiceCommands] Detected command: ${command} ("${transcript}")`);
            setLastCommand(command);
            onCommand?.(command);
            updateSensing({ lastVoiceCommand: command });
            
            // Visual feedback
            flashCommandDetected();
          }
        } else {
          interimTranscript += transcript;
        }
      }

      setTranscript(interimTranscript || finalTranscript);
    };

    recognition.onerror = (event: any) => {
      console.error('[VoiceCommands] Recognition error:', event.error);
      if (event.error === 'no-speech') {
        // Restart recognition
        setTimeout(() => {
          if (enabled && recognitionRef.current) {
            try {
              recognitionRef.current.start();
            } catch (e) {
              // Already started
            }
          }
        }, 100);
      }
    };

    recognition.onend = () => {
      console.log('[VoiceCommands] Recognition ended');
      setIsListening(false);
      
      // Auto-restart if enabled
      if (enabled) {
        setTimeout(() => {
          startListening();
        }, 100);
      }
    };

    recognitionRef.current = recognition;
  }, [enabled, onCommand, updateSensing]);

  // Start listening
  const startListening = useCallback(() => {
    if (recognitionRef.current && !isListening) {
      try {
        recognitionRef.current.start();
        setIsListening(true);
        console.log('[VoiceCommands] Started listening');
      } catch (error) {
        console.error('[VoiceCommands] Start error:', error);
      }
    }
  }, [isListening]);

  // Stop listening
  const stopListening = useCallback(() => {
    if (recognitionRef.current && isListening) {
      try {
        recognitionRef.current.stop();
        setIsListening(false);
        console.log('[VoiceCommands] Stopped listening');
      } catch (error) {
        console.error('[VoiceCommands] Stop error:', error);
      }
    }
  }, [isListening]);

  // Toggle listening
  const toggleListening = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [isListening, startListening, stopListening]);

  // Initialize on mount
  useEffect(() => {
    initializeSpeechRecognition();
    
    if (enabled) {
      // Auto-start after a short delay
      setTimeout(() => {
        startListening();
      }, 1000);
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {
          // Ignore
        }
      }
    };
  }, [initializeSpeechRecognition, enabled, startListening]);

  // Handle enabled state changes
  useEffect(() => {
    if (enabled && !isListening) {
      startListening();
    } else if (!enabled && isListening) {
      stopListening();
    }
  }, [enabled, isListening, startListening, stopListening]);

  if (!showStatus) {
    return null;
  }

  return (
    <div className="bg-gray-900 rounded-lg p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={toggleListening}
            className={`p-2 rounded-full transition-colors ${
              isListening 
                ? 'bg-green-500 text-white animate-pulse' 
                : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
            }`}
          >
            {isListening ? <Mic size={20} /> : <MicOff size={20} />}
          </button>
          <span className="text-sm text-gray-400">
            {isListening ? 'Listening...' : 'Click to start'}
          </span>
        </div>
        
        {lastCommand && (
          <div className="flex items-center gap-2">
            <Volume2 size={16} className="text-green-500" />
            <span className="text-sm text-green-500 font-medium">
              {lastCommand}
            </span>
          </div>
        )}
      </div>

      {transcript && (
        <div className="bg-gray-800 rounded p-2">
          <p className="text-xs text-gray-400">
            "{transcript}"
          </p>
          {confidence > 0 && (
            <p className="text-xs text-gray-500 mt-1">
              Confidence: {Math.round(confidence * 100)}%
            </p>
          )}
        </div>
      )}

      <div className="text-xs text-gray-500">
        <p className="font-semibold mb-1">Available commands:</p>
        <div className="grid grid-cols-2 gap-1">
          <span>• "simplify" - Easier explanation</span>
          <span>• "go deeper" - More detail</span>
          <span>• "show code" - See example</span>
          <span>• "skip" - Next section</span>
          <span>• "pause" - Pause lesson</span>
          <span>• "repeat" - Hear again</span>
        </div>
      </div>
    </div>
  );
}

// Detect command from transcript
function detectCommand(transcript: string): VoiceCommand | null {
  const lowerTranscript = transcript.toLowerCase().trim();
  
  for (const [phrase, command] of Object.entries(COMMAND_MAPPINGS)) {
    if (lowerTranscript.includes(phrase)) {
      return command;
    }
  }
  
  return null;
}

// Visual feedback when command is detected
function flashCommandDetected() {
  // Create a temporary flash element
  const flash = document.createElement('div');
  flash.className = 'fixed inset-0 bg-green-500 opacity-0 pointer-events-none z-50';
  flash.style.transition = 'opacity 0.2s';
  document.body.appendChild(flash);
  
  // Trigger flash animation
  requestAnimationFrame(() => {
    flash.style.opacity = '0.1';
    setTimeout(() => {
      flash.style.opacity = '0';
      setTimeout(() => {
        document.body.removeChild(flash);
      }, 200);
    }, 100);
  });
}