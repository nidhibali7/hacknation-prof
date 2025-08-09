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

    // For hackathon demo, use mock data if no API key
    if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'demo-key-for-hackathon') {
      const mockLesson = createMockLesson(content, source);
      return NextResponse.json<ApiResponse<Lesson>>({
        success: true,
        data: mockLesson,
        timestamp: Date.now(),
      });
    }

    // Generate lesson using GPT-4
    const systemPrompt = `You are an expert educator creating adaptive micro-lessons.
    Convert the given content into a ${options?.segments || 3}-segment lesson.
    
    Each segment should:
    1. Focus on ONE key concept
    2. Be explainable in 60 seconds
    3. Have three variants: normal, simplified (for confused learners), and advanced (for those wanting depth)
    4. Include code examples where relevant
    5. Identify key phrases to emphasize
    
    Also create a 5-minute coding challenge that tests understanding.
    
    Return as JSON matching this structure:
    {
      "title": "Lesson title",
      "segments": [
        {
          "variants": {
            "normal": { "text": "...", "code": "...", "emphasis": ["..."] },
            "simplified": { "text": "...", "code": "...", "emphasis": ["..."] },
            "advanced": { "text": "...", "code": "...", "emphasis": ["..."] }
          }
        }
      ],
      "challenge": {
        "title": "...",
        "description": "...",
        "starterCode": "...",
        "hints": ["..."]
      }
    }`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Content to convert:\n\n${content}` }
      ],
      temperature: 0.7,
      max_tokens: 2000,
      response_format: { type: 'json_object' },
    });

    const generatedContent = JSON.parse(completion.choices[0].message.content || '{}');
    
    // Transform to our Lesson type
    const lesson: Lesson = {
      id: crypto.randomUUID(),
      title: generatedContent.title || 'Generated Lesson',
      source,
      duration: 60 * (generatedContent.segments?.length || 3),
      segments: generatedContent.segments?.map((seg: any, index: number) => ({
        id: crypto.randomUUID(),
        order: index,
        variants: seg.variants,
        triggers: [
          { condition: 'confusion', threshold: 0.7, action: 'simplify' },
          { condition: 'voice_command', action: 'deepen' },
        ],
      })) || [],
      challenge: generatedContent.challenge ? {
        ...generatedContent.challenge,
        id: crypto.randomUUID(),
        tests: [],
        timeLimit: 5,
      } : undefined,
      metadata: {
        difficulty: options?.difficulty as any || 'intermediate',
        topics: extractTopicsFromContent(content),
        prerequisites: [],
        estimatedTime: 10,
      },
    };

    return NextResponse.json<ApiResponse<Lesson>>({
      success: true,
      data: lesson,
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

function createMockLesson(content: string, source: any): Lesson {
  // Create a compelling mock lesson for the demo
  const isCode = content.includes('function') || content.includes('class');
  
  return {
    id: crypto.randomUUID(),
    title: 'Understanding Core Concepts',
    source,
    duration: 180,
    segments: [
      {
        id: crypto.randomUUID(),
        order: 0,
        variants: {
          normal: {
            text: "Let's break down this concept step by step. The key idea here is that complex systems can be understood by examining their fundamental components.",
            code: isCode ? `function example() {\n  console.log("Learning by doing");\n}` : undefined,
            speakingRate: 1.0,
            emphasis: ['break down', 'fundamental', 'components'],
          },
          simplified: {
            text: "Think of it like building with LEGO blocks. Each piece is simple, but together they create something amazing.",
            code: isCode ? `// Simple version\nconsole.log("Hello!");` : undefined,
            speakingRate: 0.9,
            emphasis: ['LEGO', 'simple', 'amazing'],
          },
          advanced: {
            text: "The theoretical foundation stems from systems theory, where emergent properties arise from the interaction of simpler subsystems.",
            code: isCode ? `class System {\n  constructor() {\n    this.components = [];\n  }\n  \n  addComponent(component) {\n    this.components.push(component);\n    this.recalculateEmergentProperties();\n  }\n}` : undefined,
            speakingRate: 1.1,
            emphasis: ['theoretical', 'emergent properties', 'subsystems'],
          },
        },
        triggers: [
          { condition: 'confusion', threshold: 0.7, action: 'simplify' },
          { condition: 'voice_command', action: 'deepen' },
        ],
      },
      {
        id: crypto.randomUUID(),
        order: 1,
        variants: {
          normal: {
            text: "Now, let's see how this applies in practice. When you encounter a new problem, start by identifying the core components.",
            speakingRate: 1.0,
            emphasis: ['practice', 'identifying', 'core'],
          },
          simplified: {
            text: "It's like solving a puzzle. First, find the corner pieces - they're the easiest to spot!",
            speakingRate: 0.9,
            emphasis: ['puzzle', 'corner pieces', 'easiest'],
          },
          advanced: {
            text: "Application requires decomposition analysis, followed by systematic reconstruction with attention to interface boundaries.",
            speakingRate: 1.1,
            emphasis: ['decomposition', 'systematic', 'interface boundaries'],
          },
        },
        triggers: [
          { condition: 'confusion', threshold: 0.7, action: 'simplify' },
          { condition: 'distraction', threshold: 2000, action: 'break' },
        ],
      },
      {
        id: crypto.randomUUID(),
        order: 2,
        variants: {
          normal: {
            text: "Finally, remember that mastery comes from practice. Each time you apply these concepts, you'll see new patterns.",
            speakingRate: 1.0,
            emphasis: ['mastery', 'practice', 'patterns'],
          },
          simplified: {
            text: "Keep practicing! It's like riding a bike - wobbly at first, but soon it becomes second nature.",
            speakingRate: 0.9,
            emphasis: ['practicing', 'bike', 'second nature'],
          },
          advanced: {
            text: "Expertise development follows a power law distribution, with rapid initial gains followed by incremental refinements.",
            speakingRate: 1.1,
            emphasis: ['power law', 'rapid', 'incremental'],
          },
        },
        triggers: [
          { condition: 'confusion', threshold: 0.7, action: 'simplify' },
        ],
      },
    ],
    challenge: {
      id: crypto.randomUUID(),
      title: 'Apply Your Knowledge',
      description: 'Create a simple implementation that demonstrates your understanding of the core concept.',
      starterCode: `// Your challenge: Implement a function that demonstrates the concept\n\nfunction demonstrateConcept() {\n  // Your code here\n  \n}\n\n// Test your implementation\nconsole.log(demonstrateConcept());`,
      tests: [
        {
          input: 'test',
          expectedOutput: 'success',
          description: 'Basic functionality test',
        },
      ],
      hints: [
        'Start with the simplest case',
        'Think about what makes this concept unique',
        'Consider edge cases',
      ],
      timeLimit: 5,
    },
    metadata: {
      difficulty: 'intermediate',
      topics: ['learning', 'concepts', 'practice'],
      prerequisites: [],
      estimatedTime: 10,
    },
  };
}

function extractTopicsFromContent(content: string): string[] {
  const topics = new Set<string>();
  const contentLower = content.toLowerCase();
  
  // Common programming topics
  const topicKeywords = {
    'algorithms': ['algorithm', 'sort', 'search', 'complexity'],
    'data structures': ['array', 'list', 'tree', 'graph', 'stack', 'queue'],
    'web development': ['html', 'css', 'javascript', 'react', 'api'],
    'machine learning': ['neural', 'training', 'model', 'dataset'],
    'systems': ['operating system', 'memory', 'process', 'thread'],
  };
  
  for (const [topic, keywords] of Object.entries(topicKeywords)) {
    if (keywords.some(keyword => contentLower.includes(keyword))) {
      topics.add(topic);
    }
  }
  
  return Array.from(topics).slice(0, 5);
}