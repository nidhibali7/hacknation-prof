import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import {
  AppState,
  Lesson,
  SensingState,
  LessonEvent,
  LessonState,
  UserSession,
  Achievement,
} from '@/types';
import { getNextState, determineTransition } from '@/lib/stateMachine';

const initialSensingState: SensingState = {
  face: null,
  gaze: null,
  lastVoiceCommand: null,
  attentionLevel: 'medium',
  shouldTakeBreak: false,
};

const initialSession: UserSession = {
  id: crypto.randomUUID(),
  startedAt: new Date(),
  lessons: [],
  totalAttentionScore: 0,
  completedChallenges: 0,
  achievements: [],
};

export const useAppStore = create<AppState>()(
  devtools(
    (set, get) => ({
      // Initial state
      currentLesson: null,
      currentSegment: 0,
      currentVariant: 'normal',
      lessonState: 'intro',
      sensing: initialSensingState,
      session: initialSession,
      isLoading: false,
      error: null,
      showBreakSuggestion: false,

      // Actions
      setCurrentLesson: (lesson: Lesson) =>
        set((state) => ({
          currentLesson: lesson,
          currentSegment: 0,
          currentVariant: 'normal',
          lessonState: 'intro',
          error: null,
        })),

      updateSensing: (data: Partial<SensingState>) =>
        set((state) => {
          const newSensing = { ...state.sensing, ...data };
          
          // Auto-determine if we should transition states
          const autoTransition = determineTransition(state.lessonState, newSensing);
          if (autoTransition) {
            const nextState = getNextState(state.lessonState, autoTransition);
            
            // Auto-switch variant based on state
            let variant = state.currentVariant;
            if (nextState === 'simplify') variant = 'simplified';
            if (nextState === 'advanced') variant = 'advanced';
            if (nextState === 'explain') variant = 'normal';

            return {
              sensing: newSensing,
              lessonState: nextState,
              currentVariant: variant,
            };
          }

          // Check for break suggestion
          const shouldSuggestBreak =
            newSensing.attentionLevel === 'low' ||
            (newSensing.gaze?.distractionEvents || 0) > 5;

          return {
            sensing: newSensing,
            showBreakSuggestion: shouldSuggestBreak,
          };
        }),

      transitionState: (event: LessonEvent) =>
        set((state) => {
          const nextState = getNextState(state.lessonState, event);
          
          // Update session progress
          if (state.session && state.currentLesson) {
            const lessonProgress = state.session.lessons.find(
              (l) => l.lessonId === state.currentLesson!.id
            );
            
            if (lessonProgress) {
              lessonProgress.state = nextState;
              if (event.type === 'CONFUSION' || event.type === 'DEEPEN') {
                lessonProgress.adaptations++;
              }
            }
          }

          // Auto-switch variant based on state
          let variant = state.currentVariant;
          if (nextState === 'simplify') variant = 'simplified';
          if (nextState === 'advanced') variant = 'advanced';
          if (nextState === 'explain') variant = 'normal';

          // Check for achievements
          const achievements = checkAchievements(state, nextState);

          return {
            lessonState: nextState,
            currentVariant: variant,
            session: state.session
              ? {
                  ...state.session,
                  achievements: [...state.session.achievements, ...achievements],
                }
              : state.session,
          };
        }),

      nextSegment: () =>
        set((state) => {
          if (!state.currentLesson) return state;
          
          const maxSegments = state.currentLesson.segments.length;
          if (state.currentSegment < maxSegments - 1) {
            return {
              currentSegment: state.currentSegment + 1,
              lessonState: 'explain',
              currentVariant: 'normal',
            };
          } else {
            // Move to challenge phase
            return {
              lessonState: 'challenge',
            };
          }
        }),

      previousSegment: () =>
        set((state) => {
          if (state.currentSegment > 0) {
            return {
              currentSegment: state.currentSegment - 1,
              lessonState: 'explain',
              currentVariant: 'normal',
            };
          }
          return state;
        }),

      setVariant: (variant: 'normal' | 'simplified' | 'advanced') =>
        set({ currentVariant: variant }),

      resetSession: () =>
        set({
          currentLesson: null,
          currentSegment: 0,
          currentVariant: 'normal',
          lessonState: 'intro',
          sensing: initialSensingState,
          session: {
            ...initialSession,
            id: crypto.randomUUID(),
            startedAt: new Date(),
          },
          isLoading: false,
          error: null,
          showBreakSuggestion: false,
        }),
    }),
    {
      name: 'profai-store',
    }
  )
);

// Achievement checking logic
function checkAchievements(
  state: AppState,
  nextState: LessonState
): Achievement[] {
  const achievements: Achievement[] = [];
  const now = new Date();

  // First lesson completed
  if (nextState === 'complete' && state.session?.lessons.length === 1) {
    achievements.push({
      id: 'first-lesson',
      name: 'First Steps',
      description: 'Completed your first lesson!',
      icon: '🎯',
      unlockedAt: now,
    });
  }

  // High attention
  if (state.sensing.attentionLevel === 'high' && !hasAchievement(state, 'focused-learner')) {
    achievements.push({
      id: 'focused-learner',
      name: 'Focused Learner',
      description: 'Maintained high attention throughout a lesson',
      icon: '👁️',
      unlockedAt: now,
    });
  }

  // Used voice commands
  if (state.sensing.lastVoiceCommand && !hasAchievement(state, 'voice-master')) {
    achievements.push({
      id: 'voice-master',
      name: 'Voice Master',
      description: 'Successfully used voice commands',
      icon: '🎤',
      unlockedAt: now,
    });
  }

  // Completed a challenge
  if (nextState === 'prove' && !hasAchievement(state, 'problem-solver')) {
    achievements.push({
      id: 'problem-solver',
      name: 'Problem Solver',
      description: 'Completed your first coding challenge',
      icon: '💻',
      unlockedAt: now,
    });
  }

  return achievements;
}

function hasAchievement(state: AppState, achievementId: string): boolean {
  return state.session?.achievements.some((a) => a.id === achievementId) || false;
}