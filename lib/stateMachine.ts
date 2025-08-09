import { LessonState, LessonEvent, SensingState } from '@/types';

export interface StateMachineConfig {
  initial: LessonState;
  states: Record<LessonState, StateConfig>;
}

interface StateConfig {
  on?: Record<string, LessonState>;
  entry?: () => void;
  exit?: () => void;
  after?: Record<number, LessonState>;
}

export const lessonStateMachine: StateMachineConfig = {
  initial: 'intro',
  states: {
    intro: {
      on: {
        START: 'explain',
      },
    },
    explain: {
      on: {
        CONFUSION: 'simplify',
        DEEPEN: 'advanced',
        DISTRACTION: 'break',
        COMPLETE: 'challenge',
        SKIP: 'challenge',
      },
    },
    simplify: {
      on: {
        UNDERSTOOD: 'explain',
        STILL_CONFUSED: 'analogy',
        SKIP: 'challenge',
        TIMEOUT: 'break',
      },
    },
    advanced: {
      on: {
        CONFUSION: 'explain',
        COMPLETE: 'challenge',
        SKIP: 'challenge',
      },
    },
    analogy: {
      on: {
        UNDERSTOOD: 'explain',
        SKIP: 'challenge',
        TIMEOUT: 'break',
      },
    },
    break: {
      after: {
        60000: 'explain', // Auto-resume after 60 seconds
      },
      on: {
        START: 'explain',
        SKIP: 'challenge',
      },
    },
    challenge: {
      on: {
        COMPLETE: 'prove',
        SKIP: 'prove',
        TIMEOUT: 'feedback',
      },
    },
    prove: {
      on: {
        SUBMITTED: 'feedback',
        SKIP: 'feedback',
        TIMEOUT: 'feedback',
      },
    },
    feedback: {
      on: {
        COMPLETE: 'complete',
      },
    },
    complete: {
      // Final state
    },
  },
};

// Intelligent state transition based on sensing data
export function determineTransition(
  currentState: LessonState,
  sensing: SensingState
): LessonEvent | null {
  // Voice command mapping ONLY - remove automatic transitions
  if (sensing.lastVoiceCommand) {
    switch (sensing.lastVoiceCommand) {
      case 'DEEPEN':
        if (currentState === 'explain') {
          return { type: 'DEEPEN', timestamp: Date.now() };
        }
        break;
      case 'SIMPLIFY':
        if (currentState === 'explain' || currentState === 'advanced') {
          return { type: 'CONFUSION', timestamp: Date.now() };
        }
        break;
      case 'SKIP':
        return { type: 'SKIP', timestamp: Date.now() };
      case 'CONFUSED':
        if (currentState === 'simplify') {
          return { type: 'STILL_CONFUSED', timestamp: Date.now() };
        }
        return { type: 'CONFUSION', timestamp: Date.now() };
    }
  }

  // Don't auto-trigger states based on face/gaze for demo
  // This prevents unexpected state changes during the hackathon
  
  return null;
}

// Get the next state based on current state and event
export function getNextState(
  currentState: LessonState,
  event: LessonEvent
): LessonState {
  const stateConfig = lessonStateMachine.states[currentState];
  if (stateConfig.on && stateConfig.on[event.type]) {
    return stateConfig.on[event.type];
  }
  return currentState;
}

// Adaptation messages for state transitions
export function getTransitionMessage(
  fromState: LessonState,
  toState: LessonState
): string {
  const transitions: Record<string, string> = {
    'explain-simplify': "I see that face - let me explain this differently...",
    'explain-advanced': "Let's dive deeper into the details...",
    'explain-break': "Hey, looks like you need a quick break. That's okay!",
    'simplify-analogy': "Still tricky? Let me try an analogy...",
    'simplify-explain': "Great! Let's continue...",
    'advanced-explain': "Let's get back to the main content...",
    'break-explain': "Welcome back! Let's continue where we left off...",
    'challenge-prove': "Nice work! Now explain what you built...",
    'prove-feedback': "Let me analyze your explanation...",
  };

  const key = `${fromState}-${toState}`;
  return transitions[key] || "Moving to the next section...";
}

// Calculate attention score based on sensing data
export function calculateAttentionScore(
  sensingHistory: SensingState[],
  duration: number
): number {
  if (sensingHistory.length === 0) return 0;

  let score = 100;
  let distractionTime = 0;
  let confusionTime = 0;

  sensingHistory.forEach((state, index) => {
    // Penalize for looking away
    if (state.gaze?.outsideViewport) {
      distractionTime += 1;
    }

    // Slight penalty for confusion (it's normal to be confused sometimes)
    if (state.face?.confused) {
      confusionTime += 0.5;
    }

    // Bonus for high engagement
    if (state.face?.engaged) {
      score += 0.5;
    }
  });

  // Calculate penalties
  const distractionPenalty = (distractionTime / sensingHistory.length) * 50;
  const confusionPenalty = (confusionTime / sensingHistory.length) * 20;

  score = Math.max(0, Math.min(100, score - distractionPenalty - confusionPenalty));

  return Math.round(score);
}

// Determine content speed based on user state
export function determineContentSpeed(sensing: SensingState): number {
  if (sensing.face?.confused) return 0.8; // Slow down
  if (sensing.face?.bored) return 1.2; // Speed up
  if (sensing.attentionLevel === 'low') return 0.9;
  if (sensing.attentionLevel === 'high' && sensing.face?.engaged) return 1.1;
  return 1.0; // Normal speed
}