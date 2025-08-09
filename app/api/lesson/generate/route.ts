import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { ApiResponse, Lesson, GenerateLessonRequest, LessonSegment } from '@/types';

// Initialize OpenAI client (will use env variable in production)
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || 'demo-key-for-hackathon',
});

export async function POST(request: NextRequest) {
  try {
    const body: GenerateLessonRequest = await request.json();
    const { content, source, options } = body;

    console.log('[Lesson Generate] Creating lesson from', source.type);

    // Always use high-quality mock data for demo
    const mockLesson = createDetailedMockLesson(content, source);
    return NextResponse.json<ApiResponse<Lesson>>({
      success: true,
      data: mockLesson,
      timestamp: Date.now(),
    });

  } catch (error) {
    console.error('[Lesson Generate] Error:', error);
    return NextResponse.json<ApiResponse<null>>({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate lesson',
      timestamp: Date.now(),
    }, { status: 500 });
  }
}

function createDetailedMockLesson(content: string, source: any): Lesson {
  // Analyze content to create specific lessons
  const contentLower = content.toLowerCase();
  
  // Determine topic and create specific lesson plans
  let lessons: any = {};
  
  if (contentLower.includes('quantum') || contentLower.includes('computing')) {
    lessons = {
      title: 'Quantum Computing Fundamentals',
      segments: [
        {
          title: 'What Makes Quantum Different',
          normal: "Quantum computing uses the strange rules of quantum physics to process information. Unlike classical bits that are either 0 or 1, quantum bits or 'qubits' can be both at the same time through superposition.",
          simplified: "Imagine a coin spinning in the air - it's both heads AND tails until it lands. That's how quantum bits work - they can be multiple things at once!",
          advanced: "Quantum superposition allows qubits to exist in a linear combination of basis states |0⟩ and |1⟩, represented as α|0⟩ + β|1⟩ where |α|² + |β|² = 1.",
        },
        {
          title: 'The Power of Entanglement',
          normal: "When qubits become entangled, measuring one instantly affects the other, no matter how far apart they are. This 'spooky action at a distance' enables quantum computers to process complex correlations.",
          simplified: "It's like having magic twins - when one feels something, the other instantly knows, even if they're on opposite sides of the universe!",
          advanced: "Entanglement creates non-local correlations described by Bell states like |Φ+⟩ = (|00⟩ + |11⟩)/√2, enabling quantum parallelism and exponential speedup.",
        },
        {
          title: 'Real-World Applications',
          normal: "Quantum computers excel at specific tasks like drug discovery, cryptography, and optimization. They could revolutionize how we develop medicines and secure data.",
          simplified: "Quantum computers are like super-powered problem solvers for really hard puzzles - finding new medicines or keeping secrets safe!",
          advanced: "Applications include Shor's algorithm for factoring large numbers (breaking RSA), Grover's search algorithm, and variational quantum eigensolvers for molecular simulation.",
        }
      ]
    };
  } else if (contentLower.includes('react') || contentLower.includes('hooks')) {
    lessons = {
      title: 'React Hooks Mastery',
      segments: [
        {
          title: 'Why Hooks Changed Everything',
          normal: "React Hooks let you use state and other React features without writing a class. The useState hook manages component state, while useEffect handles side effects like data fetching.",
          simplified: "Hooks are like special tools that give your components superpowers - memory with useState, and actions with useEffect!",
          advanced: "Hooks provide a more direct API to React concepts you already know: props, state, context, refs, and lifecycle. They enable better code reuse through custom hooks.",
        },
        {
          title: 'The Rules You Must Follow',
          normal: "Hooks have two important rules: Only call them at the top level of your function, and only call them from React functions. This ensures hooks are called in the same order every render.",
          simplified: "Think of hooks like a recipe - you must follow the steps in order every time, or your cake won't turn out right!",
          advanced: "React relies on the call order of hooks to correctly preserve state between renders. The rules ensure the hooks call order is consistent, maintaining the state association.",
        },
        {
          title: 'Building Custom Hooks',
          normal: "Custom hooks let you extract component logic into reusable functions. Any function starting with 'use' that calls other hooks is a custom hook.",
          simplified: "Custom hooks are like creating your own LEGO blocks - you can combine existing pieces to make something new and reusable!",
          advanced: "Custom hooks enable sharing stateful logic between components without changing component hierarchy, solving the 'wrapper hell' problem of HOCs and render props.",
        }
      ]
    };
  } else if (contentLower.includes('machine learning') || contentLower.includes('neural')) {
    lessons = {
      title: 'Machine Learning Essentials',
      segments: [
        {
          title: 'How Machines Learn from Data',
          normal: "Machine learning algorithms find patterns in data to make predictions. They learn by adjusting their parameters based on examples, getting better with more data.",
          simplified: "It's like teaching a child to recognize animals - show them many pictures of cats, and they learn what makes a cat a cat!",
          advanced: "ML models minimize a loss function through optimization algorithms like gradient descent, adjusting weights θ to minimize L(θ) = Σ(y_pred - y_true)².",
        },
        {
          title: 'Neural Networks: Digital Brains',
          normal: "Neural networks are inspired by the human brain. They consist of layers of connected nodes that process information, learning complex patterns through training.",
          simplified: "Imagine a team where each person does a small job and passes the result to the next person - together they solve big problems!",
          advanced: "Deep neural networks use backpropagation to compute gradients ∂L/∂w through the chain rule, updating weights via w = w - α∇L(w).",
        },
        {
          title: 'Training vs Testing',
          normal: "We split data into training and testing sets. The model learns from training data, and we evaluate its performance on unseen test data to ensure it generalizes well.",
          simplified: "It's like studying with practice questions (training), then taking the real test (testing) to see if you truly learned!",
          advanced: "Cross-validation techniques like k-fold ensure robust evaluation, while regularization (L1/L2) prevents overfitting by penalizing model complexity.",
        }
      ]
    };
  } else {
    // Generic but specific lessons for any topic
    lessons = {
      title: 'Core Concepts Breakdown',
      segments: [
        {
          title: 'Foundation Principles',
          normal: "Every complex system is built on fundamental principles. Understanding these core concepts provides the foundation for mastering advanced techniques.",
          simplified: "Like building with blocks - you need a strong base before adding fancy pieces on top!",
          advanced: "Foundational principles establish invariants and constraints that guide system design, ensuring consistency and predictability at scale.",
        },
        {
          title: 'Practical Implementation',
          normal: "Theory becomes powerful when applied. Implementation requires understanding both the concepts and the tools, bridging abstract ideas with concrete solutions.",
          simplified: "It's like following a recipe - you need to know both what to do and how to use the kitchen tools!",
          advanced: "Implementation patterns emerge from architectural decisions, balancing performance, maintainability, and scalability through design patterns and best practices.",
        },
        {
          title: 'Real-World Applications',
          normal: "Knowledge gains value through application. Real-world scenarios test understanding and reveal the nuances that theory alone cannot capture.",
          simplified: "Learning to ride a bike is different from reading about it - you need to actually try it to really understand!",
          advanced: "Production systems require handling edge cases, error boundaries, and graceful degradation while maintaining performance SLAs and operational excellence.",
        }
      ]
    };
  }
  
  // Build the complete lesson structure
  return {
    id: crypto.randomUUID(),
    title: lessons.title,
    source,
    duration: 180,
    segments: lessons.segments.map((seg: any, index: number) => ({
      id: crypto.randomUUID(),
      order: index,
      variants: {
        normal: {
          text: seg.normal,
          code: seg.code,
          speakingRate: 1.0,
          emphasis: extractKeyWords(seg.normal),
        },
        simplified: {
          text: seg.simplified,
          speakingRate: 0.9,
          emphasis: extractKeyWords(seg.simplified),
        },
        advanced: {
          text: seg.advanced,
          code: seg.advancedCode,
          speakingRate: 1.1,
          emphasis: extractKeyWords(seg.advanced),
        },
      },
      triggers: [
        { condition: 'confusion', threshold: 0.7, action: 'simplify' },
        { condition: 'voice_command', action: 'deepen' },
      ],
    })),
    challenge: {
      id: crypto.randomUUID(),
      title: 'Apply Your Knowledge',
      description: `Build something that demonstrates your understanding of ${lessons.title.toLowerCase()}.`,
      starterCode: generateStarterCode(lessons.title),
      tests: [
        {
          input: 'test',
          expectedOutput: 'success',
          description: 'Your implementation should handle basic cases',
        },
      ],
      hints: [
        'Start with the simplest implementation',
        'Think about what you just learned',
        'Consider edge cases',
      ],
      timeLimit: 5,
    },
    metadata: {
      difficulty: 'intermediate',
      topics: extractTopicsFromTitle(lessons.title),
      prerequisites: [],
      estimatedTime: 10,
    },
  };
}

function extractKeyWords(text: string): string[] {
  const important = ['quantum', 'superposition', 'entanglement', 'hooks', 'state', 'effect', 'neural', 'learning', 'pattern'];
  return important.filter(word => text.toLowerCase().includes(word)).slice(0, 5);
}

function generateStarterCode(title: string): string {
  if (title.includes('React')) {
    return `// Create a custom hook that demonstrates your understanding
function useYourHook() {
  // Your implementation here
  
  return { /* your return values */ };
}

// Test your hook
function TestComponent() {
  const result = useYourHook();
  return <div>{/* display result */}</div>;
}`;
  } else if (title.includes('Quantum')) {
    return `# Demonstrate quantum concepts with pseudocode
def quantum_operation(qubits):
    # Apply superposition
    # Your code here
    
    # Create entanglement
    # Your code here
    
    # Measure result
    return measurement`;
  } else {
    return `// Implement a function that demonstrates the concept
function demonstrateConcept(input) {
  // Your implementation here
  
  return result;
}

// Test cases
console.log(demonstrateConcept('test'));`;
  }
}

function extractTopicsFromTitle(title: string): string[] {
  const titleLower = title.toLowerCase();
  const topics = [];
  
  if (titleLower.includes('quantum')) topics.push('quantum computing', 'physics', 'qubits');
  if (titleLower.includes('react')) topics.push('React', 'JavaScript', 'frontend');
  if (titleLower.includes('machine')) topics.push('machine learning', 'AI', 'data science');
  if (titleLower.includes('hook')) topics.push('React Hooks', 'state management', 'functional components');
  
  if (topics.length === 0) {
    topics.push('programming', 'concepts', 'implementation');
  }
  
  return topics.slice(0, 5);
}