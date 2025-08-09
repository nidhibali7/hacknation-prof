import { NextRequest, NextResponse } from 'next/server';
import { ApiResponse, Lesson, ContentSource } from '@/types';
// @ts-ignore - pdf-parse doesn't have types
import pdf from 'pdf-parse';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: 'No file provided',
        timestamp: Date.now(),
      }, { status: 400 });
    }

    console.log('[File Ingest] Processing:', file.name, 'Type:', file.type);

    let text = '';
    let pageCount = 1;

    // Check if it's an image
    if (file.type.startsWith('image/')) {
      // For images, we'll use OCR or just create a placeholder
      // In a real implementation, you'd use an OCR service like Tesseract or Google Vision
      console.log('[File Ingest] Image detected, using placeholder text');
      text = `[Image Content: ${file.name}]\n\nThis appears to be an image document. In production, this would be processed with OCR to extract text. For the demo, we'll generate sample educational content based on common topics.`;
      
      // For demo, generate some educational content
      text += '\n\nSample Educational Content:\n';
      text += 'Understanding Visual Information:\n';
      text += 'Images and diagrams are powerful tools for learning. They can convey complex information quickly and help with retention. ';
      text += 'When studying from visual materials, focus on key elements, patterns, and relationships between components. ';
      text += 'Practice describing what you see to reinforce your understanding.';
    } else {
      // Parse PDF as before
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const data = await pdf(buffer);
      text = data.text;
      pageCount = data.numpages;
    }

    // Generate lessons from PDF text
    const lessons = await generateLessonsFromPDF(text, {
      source: { type: 'pdf', url: file.name, filename: file.name },
      maxLessons: 5,
      targetDuration: 60,
    });

    console.log('[File Ingest] Generated', lessons.length, 'lessons from', pageCount, 'pages');

    return NextResponse.json<ApiResponse<{
      lessons: Lesson[];
      metadata: {
        pages: number;
        filename: string;
        textLength: number;
        fileType: string;
      };
    }>>({
      success: true,
      data: {
        lessons,
        metadata: {
          pages: pageCount,
          filename: file.name,
          textLength: text.length,
          fileType: file.type,
        },
      },
      timestamp: Date.now(),
    });

  } catch (error) {
    console.error('[File Ingest] Error:', error);
    return NextResponse.json<ApiResponse<null>>({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to process file',
      timestamp: Date.now(),
    }, { status: 500 });
  }
}

async function generateLessonsFromPDF(
  text: string,
  options: {
    source: ContentSource;
    maxLessons: number;
    targetDuration: number;
  }
): Promise<Lesson[]> {
  // Intelligent text chunking based on sections/paragraphs
  const sections = intelligentChunking(text);
  const lessons: Lesson[] = [];

  for (let i = 0; i < Math.min(sections.length, options.maxLessons); i++) {
    const section = sections[i];
    
    const lesson: Lesson = {
      id: crypto.randomUUID(),
      title: extractTitle(section) || `Section ${i + 1}`,
      source: options.source,
      duration: options.targetDuration,
      segments: createSegments(section),
      challenge: generateChallenge(section),
      metadata: {
        difficulty: determineDifficulty(section),
        topics: extractTopics(section),
        prerequisites: [],
        estimatedTime: 10,
      },
    };
    
    lessons.push(lesson);
  }

  return lessons;
}

function intelligentChunking(text: string): string[] {
  // Split by common section markers
  const sectionMarkers = [
    /Chapter \d+/gi,
    /Section \d+/gi,
    /\n\n[A-Z][^.!?]*[.!?]\n\n/g, // Paragraphs starting with capital letter
    /\n#{1,3} .+\n/g, // Markdown headers
  ];

  let sections = [text];
  
  for (const marker of sectionMarkers) {
    const newSections: string[] = [];
    for (const section of sections) {
      const parts = section.split(marker);
      if (parts.length > 1) {
        newSections.push(...parts.filter(p => p.trim().length > 100));
      } else {
        newSections.push(section);
      }
    }
    sections = newSections;
    
    // Stop if we have enough sections
    if (sections.length >= 10) break;
  }

  // If still too few sections, split by word count
  if (sections.length < 3) {
    const words = text.split(' ');
    const wordsPerSection = Math.ceil(words.length / 5);
    sections = [];
    
    for (let i = 0; i < words.length; i += wordsPerSection) {
      sections.push(words.slice(i, i + wordsPerSection).join(' '));
    }
  }

  return sections.slice(0, 10); // Max 10 sections
}

function createSegments(text: string): Lesson['segments'] {
  // Break text into smaller segments for micro-lessons
  const paragraphs = text.split(/\n\n+/).filter(p => p.trim().length > 50);
  
  return paragraphs.slice(0, 3).map((para, index) => ({
    id: crypto.randomUUID(),
    order: index,
    variants: {
      normal: {
        text: para,
        code: extractCodeBlock(para),
        speakingRate: 1.0,
        emphasis: extractKeyPhrases(para),
      },
      simplified: {
        text: simplifyParagraph(para),
        code: extractCodeBlock(para),
        speakingRate: 0.9,
        emphasis: extractKeyPhrases(para).slice(0, 3),
      },
      advanced: {
        text: expandParagraph(para),
        code: extractCodeBlock(para),
        speakingRate: 1.1,
        emphasis: [...extractKeyPhrases(para), ...extractTechnicalTerms(para)],
      },
    },
    triggers: [
      {
        condition: 'confusion',
        threshold: 0.7,
        action: 'simplify',
      },
      {
        condition: 'distraction',
        threshold: 2000,
        action: 'break',
      },
    ],
  }));
}

function generateChallenge(text: string): Lesson['challenge'] {
  const hasCode = text.includes('function') || text.includes('class') || text.includes('def');
  
  return {
    id: crypto.randomUUID(),
    title: hasCode ? 'Code Implementation' : 'Concept Application',
    description: hasCode 
      ? 'Implement a function that demonstrates the concept you just learned.'
      : 'Write a short explanation of how you would apply this concept.',
    starterCode: hasCode 
      ? '// Implement the concept here\nfunction solution() {\n  // Your code\n}\n'
      : '// Explain the concept in code comments\n// or implement a related example\n',
    tests: [
      {
        input: 'test',
        expectedOutput: 'result',
        description: 'Basic test case',
      },
    ],
    hints: [
      'Review the key concept from the lesson',
      'Start with the simplest implementation',
      'Think about edge cases',
    ],
    timeLimit: 5,
  };
}

function extractTitle(text: string): string | null {
  // Look for heading patterns
  const headingPatterns = [
    /^#+ (.+)$/m,
    /^Chapter \d+[:\s]+(.+)$/mi,
    /^Section \d+[:\s]+(.+)$/mi,
    /^([A-Z][^.!?]{10,50})[.!?]/,
  ];

  for (const pattern of headingPatterns) {
    const match = text.match(pattern);
    if (match) return match[1].trim();
  }

  return null;
}

function extractCodeBlock(text: string): string | undefined {
  const codePattern = /```[\s\S]*?```|~~~[\s\S]*?~~~/;
  const match = text.match(codePattern);
  if (match) {
    return match[0].replace(/```|~~~/g, '').trim();
  }
  return undefined;
}

function extractKeyPhrases(text: string): string[] {
  // Extract important phrases (mock implementation)
  const words = text.toLowerCase().split(/\W+/);
  const phrases: string[] = [];
  
  for (let i = 0; i < words.length - 1; i++) {
    if (words[i].length > 4 && words[i + 1].length > 4) {
      phrases.push(`${words[i]} ${words[i + 1]}`);
    }
  }
  
  return [...new Set(phrases)].slice(0, 5);
}

function extractTechnicalTerms(text: string): string[] {
  // Simple technical term extraction
  const technicalPatterns = [
    /\b[A-Z]{2,}\b/g, // Acronyms
    /\b\w+(?:tion|ment|ity|ance|ence)\b/gi, // Technical suffixes
  ];
  
  const terms: string[] = [];
  technicalPatterns.forEach(pattern => {
    const matches = text.match(pattern);
    if (matches) terms.push(...matches);
  });
  
  return [...new Set(terms)].slice(0, 5);
}

function simplifyParagraph(text: string): string {
  // Mock simplification
  const sentences = text.split(/[.!?]+/);
  return sentences.slice(0, Math.ceil(sentences.length * 0.6)).join('. ') + '.';
}

function expandParagraph(text: string): string {
  // Mock expansion
  return text + '\n\nTo understand this more deeply, consider the underlying principles...';
}

function determineDifficulty(text: string): 'beginner' | 'intermediate' | 'advanced' {
  const technicalTerms = extractTechnicalTerms(text).length;
  const avgWordLength = text.split(/\s+/).reduce((sum, word) => sum + word.length, 0) / text.split(/\s+/).length;
  
  if (technicalTerms > 10 || avgWordLength > 6) return 'advanced';
  if (technicalTerms > 5 || avgWordLength > 5) return 'intermediate';
  return 'beginner';
}

function extractTopics(text: string): string[] {
  // Mock topic extraction
  const topics = new Set<string>();
  
  if (text.match(/function|class|method|variable/i)) topics.add('programming');
  if (text.match(/algorithm|complexity|performance/i)) topics.add('algorithms');
  if (text.match(/data|structure|array|list/i)) topics.add('data structures');
  if (text.match(/learn|understand|concept/i)) topics.add('education');
  
  return Array.from(topics);
}