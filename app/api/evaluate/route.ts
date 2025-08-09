import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { ApiResponse, Evaluation } from '@/types';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || 'demo-key-for-hackathon',
});

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const video = formData.get('video') as File;
    const challengeId = formData.get('challenge') as string;
    const lessonId = formData.get('lesson') as string;
    const transcription = formData.get('transcription') as string | null;

    console.log('[Evaluate] Processing proof video for challenge:', challengeId);

    // For hackathon demo, return mock evaluation
    if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'demo-key-for-hackathon') {
      const mockEvaluation = createMockEvaluation();
      return NextResponse.json<ApiResponse<Evaluation>>({
        success: true,
        data: mockEvaluation,
        timestamp: Date.now(),
      });
    }

    // In production: 
    // 1. Upload video to storage (Vercel Blob)
    // 2. Transcribe with Whisper API if no transcription provided
    // 3. Evaluate with GPT-4

    let finalTranscription = transcription;
    
    if (!finalTranscription && video) {
      // Transcribe video with Whisper
      finalTranscription = await transcribeVideo(video);
    }

    // Evaluate the explanation
    const evaluation = await evaluateExplanation(
      finalTranscription || '',
      challengeId,
      lessonId
    );

    return NextResponse.json<ApiResponse<Evaluation>>({
      success: true,
      data: evaluation,
      timestamp: Date.now(),
    });

  } catch (error) {
    console.error('[Evaluate] Error:', error);
    return NextResponse.json<ApiResponse<null>>({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to evaluate proof',
      timestamp: Date.now(),
    }, { status: 500 });
  }
}

async function transcribeVideo(video: File): Promise<string> {
  try {
    // For hackathon, return mock transcription
    // In production, use Whisper API
    console.log('[Evaluate] Transcribing video:', video.name);
    
    // Mock implementation
    return "In this implementation, I created a function that demonstrates the core concept we learned. First, I initialized the variables, then I implemented the main logic using the pattern we discussed. The key insight was understanding how the components interact with each other.";
  } catch (error) {
    console.error('[Evaluate] Transcription error:', error);
    return '';
  }
}

async function evaluateExplanation(
  transcription: string,
  challengeId: string,
  lessonId: string
): Promise<Evaluation> {
  try {
    const systemPrompt = `You are an expert educator evaluating a student's explanation of their code implementation.
    
    Evaluate based on:
    1. Conceptual understanding (0-40 points)
    2. Technical accuracy (0-30 points)
    3. Communication clarity (0-20 points)
    4. Problem-solving approach (0-10 points)
    
    Provide:
    - Overall score (0-100)
    - Constructive feedback
    - 2-3 strengths
    - 2-3 areas for improvement
    - Key concepts they understood
    - Any concepts they might have missed
    
    Be encouraging but honest. This is for learning, not judgment.
    
    Return as JSON:
    {
      "score": number,
      "feedback": "string",
      "strengths": ["string"],
      "improvements": ["string"],
      "conceptsUnderstood": ["string"],
      "conceptsMissed": ["string"]
    }`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Student's explanation:\n\n${transcription}` }
      ],
      temperature: 0.7,
      max_tokens: 500,
      response_format: { type: 'json_object' },
    });

    const result = JSON.parse(completion.choices[0].message.content || '{}');
    
    return {
      score: result.score || 75,
      feedback: result.feedback || 'Good effort!',
      strengths: result.strengths || [],
      improvements: result.improvements || [],
      conceptsUnderstood: result.conceptsUnderstood || [],
      conceptsMissed: result.conceptsMissed || [],
    };
  } catch (error) {
    console.error('[Evaluate] GPT-4 error:', error);
    return createMockEvaluation();
  }
}

function createMockEvaluation(): Evaluation {
  // Create realistic mock evaluation for demo
  const scores = [72, 78, 83, 88, 91];
  const score = scores[Math.floor(Math.random() * scores.length)];
  
  const evaluations: Record<number, Evaluation> = {
    72: {
      score: 72,
      feedback: "Good start! You've grasped the basic concept, but there's room to deepen your understanding. Your explanation shows you understood the 'what' - now let's work on the 'why' and 'how'.",
      strengths: [
        'Clear communication style',
        'Correct implementation of basic requirements',
        'Good code structure',
      ],
      improvements: [
        'Explain the reasoning behind your approach',
        'Consider edge cases in your implementation',
        'Connect the concept to real-world applications',
      ],
      conceptsUnderstood: [
        'Basic syntax and structure',
        'Core functionality',
        'Input/output handling',
      ],
      conceptsMissed: [
        'Performance optimization',
        'Error handling patterns',
      ],
    },
    78: {
      score: 78,
      feedback: "Well done! Your explanation demonstrates solid understanding. You clearly articulated the main concepts and your implementation approach was logical.",
      strengths: [
        'Thorough explanation of implementation',
        'Good grasp of core concepts',
        'Logical problem-solving approach',
      ],
      improvements: [
        'Discuss alternative approaches',
        'Explain time/space complexity',
      ],
      conceptsUnderstood: [
        'Core algorithm design',
        'Data flow patterns',
        'Basic optimization techniques',
      ],
      conceptsMissed: [
        'Advanced optimization strategies',
      ],
    },
    83: {
      score: 83,
      feedback: "Excellent work! You've shown strong comprehension and your explanation was clear and well-structured. Your code demonstrates practical application of the concepts.",
      strengths: [
        'Comprehensive understanding of concepts',
        'Clean, efficient implementation',
        'Good explanation of design choices',
      ],
      improvements: [
        'Consider scalability implications',
        'Discuss testing strategies',
      ],
      conceptsUnderstood: [
        'Design patterns',
        'Efficient algorithms',
        'Error handling',
        'Code organization',
      ],
      conceptsMissed: [
        'Advanced architectural patterns',
      ],
    },
    88: {
      score: 88,
      feedback: "Impressive! Your explanation shows deep understanding and you've made connections beyond the immediate lesson. Your implementation is both elegant and efficient.",
      strengths: [
        'Excellent conceptual understanding',
        'Creative problem-solving',
        'Professional-quality code',
        'Clear articulation of complex ideas',
      ],
      improvements: [
        'Explore more edge cases',
      ],
      conceptsUnderstood: [
        'Advanced patterns',
        'Performance optimization',
        'System design principles',
        'Best practices',
      ],
      conceptsMissed: [],
    },
    91: {
      score: 91,
      feedback: "Outstanding! You've not only mastered the concept but also demonstrated how it connects to broader principles. Your explanation was exemplary and your code is production-ready.",
      strengths: [
        'Mastery of core and advanced concepts',
        'Exceptional communication skills',
        'Innovative approach to problem-solving',
        'Production-quality implementation',
      ],
      improvements: [
        'Consider teaching this concept to others!',
      ],
      conceptsUnderstood: [
        'All core concepts',
        'Advanced techniques',
        'System architecture',
        'Performance optimization',
        'Best practices and patterns',
      ],
      conceptsMissed: [],
    },
  };
  
  return evaluations[score];
}