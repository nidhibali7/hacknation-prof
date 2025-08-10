import { NextRequest, NextResponse } from 'next/server';
import { ContentSource, ApiResponse, Lesson } from '@/types';
// @ts-ignore - youtube-transcript doesn't have types
import { YoutubeTranscript } from 'youtube-transcript';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url, options } = body;

    console.log('[YouTube Ingest] Starting:', url);

    // Extract video ID from URL
    const videoId = extractVideoId(url);
    if (!videoId) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: 'Invalid YouTube URL',
        timestamp: Date.now(),
      }, { status: 400 });
    }

    // Fetch transcript
    const transcript = await YoutubeTranscript.fetchTranscript(videoId);
    const fullText = transcript.map((t: any) => t.text).join(' ');

    // Get video metadata (mock for now - in production use YouTube API)
    const videoTitle = await getVideoTitle(videoId);

    // Generate lessons from transcript
    const lessons = await generateLessonsFromText(fullText, {
      source: { type: 'youtube', url, title: videoTitle },
      maxLessons: options?.maxLessons || 5,
      targetDuration: options?.targetDuration || 60,
    });

    console.log('[YouTube Ingest] Generated', lessons.length, 'lessons');

    return NextResponse.json<ApiResponse<Lesson[]>>({
      success: true,
      data: lessons,
      timestamp: Date.now(),
    });

  } catch (error) {
    console.error('[YouTube Ingest] Error:', error);
    return NextResponse.json<ApiResponse<null>>({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to process YouTube video',
      timestamp: Date.now(),
    }, { status: 500 });
  }
}

function extractVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  
  return null;
}

async function getVideoTitle(videoId: string): Promise<string> {
  // In production, use YouTube Data API
  // For hackathon, return a placeholder
  return `YouTube Video ${videoId}`;
}

async function generateLessonsFromText(
  text: string,
  options: {
    source: ContentSource;
    maxLessons: number;
    targetDuration: number;
  }
): Promise<Lesson[]> {
  // For the hackathon, create mock lessons
  // In production, this would call OpenAI API
  
  const chunks = chunkText(text, 500); // Split into ~500 word chunks
  const lessons: Lesson[] = [];

  for (let i = 0; i < Math.min(chunks.length, options.maxLessons); i++) {
    const lesson: Lesson = {
      id: crypto.randomUUID(),
      title: `Lesson ${i + 1}: Key Concepts`,
      source: options.source,
      duration: options.targetDuration,
      segments: [
        {
          id: crypto.randomUUID(),
          order: 0,
          concept: chunks[i].split('.')[0].substring(0, 80) || `Part ${i + 1}`,
          variants: {
            normal: {
              text: chunks[i],
              speakingRate: 1.0,
              emphasis: extractKeyWords(chunks[i]),
            },
            simplified: {
              text: simplifyText(chunks[i]),
              speakingRate: 0.9,
              emphasis: extractKeyWords(chunks[i]),
            },
            advanced: {
              text: expandText(chunks[i]),
              speakingRate: 1.1,
              emphasis: extractKeyWords(chunks[i]),
            },
          },
          triggers: [
            {
              condition: 'confusion',
              threshold: 0.7,
              action: 'simplify',
            },
            {
              condition: 'voice_command',
              action: 'deepen',
            },
          ],
        },
      ],
      challenge: {
        id: crypto.randomUUID(),
        title: 'Apply What You Learned',
        description: `Build a small project that demonstrates the concepts from this lesson.`,
        starterCode: '// Your code here\n',
        tests: [],
        hints: ['Think about the main concept', 'Start simple'],
        timeLimit: 5,
      },
      metadata: {
        difficulty: 'intermediate',
        topics: extractTopics(chunks[i]),
        prerequisites: [],
        estimatedTime: 10,
      },
    };
    
    lessons.push(lesson);
  }

  return lessons;
}

function chunkText(text: string, wordsPerChunk: number): string[] {
  const words = text.split(' ');
  const chunks: string[] = [];
  
  for (let i = 0; i < words.length; i += wordsPerChunk) {
    chunks.push(words.slice(i, i + wordsPerChunk).join(' '));
  }
  
  return chunks;
}

function extractKeyWords(text: string): string[] {
  // Simple keyword extraction - in production use NLP
  const commonWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for']);
  const words = text.toLowerCase().split(/\W+/);
  const wordFreq: Record<string, number> = {};
  
  words.forEach(word => {
    if (!commonWords.has(word) && word.length > 3) {
      wordFreq[word] = (wordFreq[word] || 0) + 1;
    }
  });
  
  return Object.entries(wordFreq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([word]) => word);
}

function simplifyText(text: string): string {
  // Mock simplification - in production use GPT-4
  return text.substring(0, Math.floor(text.length * 0.7)) + '...';
}

function expandText(text: string): string {
  // Mock expansion - in production use GPT-4
  return text + '\n\nIn more detail, this concept involves...';
}

function extractTopics(text: string): string[] {
  // Mock topic extraction
  return ['programming', 'concepts', 'learning'];
}