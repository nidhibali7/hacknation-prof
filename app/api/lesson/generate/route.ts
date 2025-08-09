import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { ApiResponse, Lesson, GenerateLessonRequest } from '@/types';

// Initialize AI clients
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
});

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
});

export async function POST(request: NextRequest) {
  try {
    const body: GenerateLessonRequest = await request.json();
    const { content, source, options } = body;

    console.log('[Lesson Generate] Creating ADAPTIVE lesson from', source.type);
    console.log('[Lesson Generate] Content preview:', content.substring(0, 200));

    // Check which APIs are configured
    const hasAnthropic = !!process.env.ANTHROPIC_API_KEY;
    const hasOpenAI = !!process.env.OPENAI_API_KEY;
    
    console.log('[Lesson Generate] Available AI providers:');
    console.log('  - Anthropic (Claude):', hasAnthropic ? '✅ Configured' : '❌ No API key (set ANTHROPIC_API_KEY in .env.local)');
    console.log('  - OpenAI (GPT-4):', hasOpenAI ? '✅ Configured' : '❌ No API key (set OPENAI_API_KEY in .env.local)');

    // Determine which AI to use
    let lesson: Lesson | null = null;
    let usedProvider = 'none';

    // Try Anthropic first (Claude is great for education)
    if (hasAnthropic) {
      console.log('[Lesson Generate] 🤖 Using Anthropic Claude for superior educational content...');
      try {
        lesson = await generateWithAnthropic(content, source, options);
        usedProvider = 'anthropic';
        console.log('[Lesson Generate] ✅ Successfully generated with Anthropic Claude!');
      } catch (error) {
        console.error('[Lesson Generate] ⚠️ Anthropic failed:', error);
      }
    }

    // Fallback to OpenAI
    if (!lesson && hasOpenAI) {
      console.log('[Lesson Generate] 🤖 Using OpenAI GPT-4...');
      try {
        lesson = await generateWithOpenAI(content, source, options);
        usedProvider = 'openai';
        console.log('[Lesson Generate] ✅ Successfully generated with OpenAI GPT-4!');
      } catch (error) {
        console.error('[Lesson Generate] ⚠️ OpenAI failed:', error);
      }
    }

    // Last resort - basic extraction (NOT mock data)
    if (!lesson) {
      console.log('[Lesson Generate] ⚠️ Using basic content extraction (no AI APIs configured)');
      console.log('[Lesson Generate] 💡 For best results, add ANTHROPIC_API_KEY or OPENAI_API_KEY to .env.local');
      lesson = await generateFromContent(content, source);
      usedProvider = 'extraction';
    }
    
    // Add metadata about which AI was used
    if (lesson) {
      lesson.metadata = {
        ...lesson.metadata,
        generatedBy: usedProvider as any
      };
    }

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

async function generateWithAnthropic(
  content: string,
  source: any,
  options: any
): Promise<Lesson> {
  const prompt = `You are an expert educator creating adaptive 60-second micro-lessons.
Analyze this content and create EXACTLY 3 lesson segments that teach the KEY CONCEPTS.

Content to analyze:
${content.substring(0, 3000)}

Requirements for each segment:
1. Extract a SPECIFIC concept from the content (not generic)
2. Provide a clear, concise concept title (5-10 words)
3. Create three adaptive versions:
   - normal: Clear explanation of the concept (50-60 words)
   - simplified: Use everyday analogies, like explaining to a child (50-60 words)
   - advanced: Technical depth with formulas/theory (50-60 words)

Output JSON format:
{
  "title": "Specific title based on the actual content",
  "segments": [
    {
      "concept": "Clear, concise concept title (5-10 words)",
      "normal": "Normal explanation",
      "simplified": "Simple analogy",
      "advanced": "Technical explanation",
      "keywords": ["key", "terms", "to", "emphasize"]
    }
  ],
  "mainTopics": ["actual", "topics", "from", "content"]
}`;

  const message = await anthropic.messages.create({
    model: 'claude-3-opus-20240229',
    max_tokens: 2000,
    temperature: 0.7,
    messages: [{
      role: 'user',
      content: prompt
    }]
  });

  const responseText = message.content[0].type === 'text' ? message.content[0].text : '';
  
  // Extract JSON from response
  const jsonMatch = responseText.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('Invalid response format');
  
  const result = JSON.parse(jsonMatch[0]);

  return transformToLesson(result, source, content);
}

async function generateWithOpenAI(
  content: string,
  source: any,
  options: any
): Promise<Lesson> {
  const systemPrompt = `You are an expert educator creating adaptive 60-second micro-lessons.
Your job is to analyze the provided content and extract the KEY CONCEPTS to teach.

IMPORTANT: 
- Base your lessons on the ACTUAL CONTENT provided
- Extract SPECIFIC concepts, not generic topics
- Each segment should teach something concrete from the source material`;

  const userPrompt = `Analyze this content and create 3 lesson segments:

${content.substring(0, 3000)}

For each segment provide:
1. A clear concept title (5-10 words)
2. Normal explanation (50-60 words)
3. Simplified version with analogies (50-60 words)
4. Advanced technical version (50-60 words)

Return as JSON with this structure:
{
  "title": "Based on actual content",
  "segments": [{
    "concept": "Clear concept title (5-10 words)",
    "normal": "Explanation",
    "simplified": "Simple version",
    "advanced": "Technical version",
    "keywords": ["important", "terms"]
  }],
  "mainTopics": ["extracted", "topics"]
}`;

  const completion = await openai.chat.completions.create({
    model: 'gpt-4-turbo-preview',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ],
    temperature: 0.7,
    max_tokens: 2000,
    response_format: { type: 'json_object' },
  });

  const result = JSON.parse(completion.choices[0].message.content || '{}');
  return transformToLesson(result, source, content);
}

async function generateFromContent(
  content: string,
  source: any
): Promise<Lesson> {
  // Smart content extraction without AI
  // This analyzes the actual content structure
  
  const sentences = content.match(/[^.!?]+[.!?]+/g) || [];
  const paragraphs = content.split(/\n\n+/);
  
  // Extract key concepts by finding important sentences
  const concepts: string[] = [];
  const keywords = new Set<string>();
  
  // Find sentences with key indicators
  const importantIndicators = [
    'important', 'key', 'main', 'concept', 'principle', 'fundamental',
    'essential', 'core', 'critical', 'means', 'defined as', 'is a',
    'works by', 'used for', 'allows', 'enables'
  ];
  
  sentences.forEach(sentence => {
    const lower = sentence.toLowerCase();
    if (importantIndicators.some(indicator => lower.includes(indicator))) {
      concepts.push(sentence.trim());
    }
  });

  // Extract technical terms (capitalized words, acronyms)
  const technicalTerms = content.match(/\b[A-Z][a-z]+\b|\b[A-Z]{2,}\b/g) || [];
  technicalTerms.forEach(term => keywords.add(term.toLowerCase()));

  // Create segments from extracted concepts
  const segments = concepts.slice(0, 3).map((concept, index) => {
    const words = concept.split(' ');
    const keyTerms = words.filter(w => w.length > 4).slice(0, 3);
    const conceptTitle = concept.split('.')[0].substring(0, 80);
    
    return {
      concept: conceptTitle,
      normal: concept,
      simplified: `This is like ${createAnalogy(concept)}. ${simplifyExplanation(concept)}`,
      advanced: `${concept} This involves ${extractTechnicalAspects(concept)} at a fundamental level.`,
      keywords: keyTerms
    };
  });

  // If we couldn't extract enough concepts, create from paragraphs
  while (segments.length < 3 && paragraphs.length > segments.length) {
    const para = paragraphs[segments.length];
    const firstSentence = para.split('.')[0];
    const conceptTitle = firstSentence.substring(0, 80).trim() || `Key Concept ${segments.length + 1}`;
    segments.push({
      concept: conceptTitle,
      normal: para.substring(0, 200),
      simplified: `Think of it as ${createAnalogy(firstSentence)}. ${simplifyExplanation(para)}`,
      advanced: `${para.substring(0, 150)} This requires understanding the underlying mechanisms.`,
      keywords: extractKeywords(para)
    });
  }

  const result = {
    title: extractTitle(content) || 'Key Concepts',
    segments: segments.slice(0, 3),
    mainTopics: Array.from(keywords).slice(0, 5)
  };

  return transformToLesson(result, source, content);
}

function transformToLesson(
  aiResult: any,
  source: any,
  originalContent: string
): Lesson {
  // Transform AI result to our Lesson structure
  const segments = aiResult.segments || [];
  
  return {
    id: crypto.randomUUID(),
    title: aiResult.title || 'Adaptive Lesson',
    source,
    duration: segments.length * 60,
    segments: segments.map((seg: any, index: number) => ({
      id: crypto.randomUUID(),
      order: index,
      concept: seg.concept || `Concept ${index + 1}`, // Preserve the concept
      variants: {
        normal: {
          text: seg.normal || seg.explanation || 'Content not available',
          speakingRate: 1.0,
          emphasis: seg.keywords || extractKeywords(seg.normal || ''),
        },
        simplified: {
          text: seg.simplified || seg.simple || seg.normal,
          speakingRate: 0.9,
          emphasis: (seg.keywords || []).slice(0, 3),
        },
        advanced: {
          text: seg.advanced || seg.technical || seg.normal,
          speakingRate: 1.1,
          emphasis: [...(seg.keywords || []), ...(seg.technicalTerms || [])],
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
      description: `Based on what you learned about ${aiResult.title}, demonstrate your understanding.`,
      starterCode: generateChallengeCode(aiResult.title, aiResult.mainTopics),
      tests: [],
      hints: [
        `Think about ${segments[0]?.concept || 'the first concept'}`,
        'Apply what you learned step by step',
        'Consider real-world applications'
      ],
      timeLimit: 5,
    },
    metadata: {
      difficulty: determineDifficulty(originalContent),
      topics: aiResult.mainTopics || extractTopics(originalContent),
      prerequisites: [],
      estimatedTime: 10,
    },
  };
}

function extractKeywords(text: string): string[] {
  const words = text.toLowerCase().split(/\W+/);
  const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were']);
  
  const wordFreq: Record<string, number> = {};
  words.forEach(word => {
    if (!stopWords.has(word) && word.length > 3) {
      wordFreq[word] = (wordFreq[word] || 0) + 1;
    }
  });
  
  return Object.entries(wordFreq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([word]) => word);
}

function extractTitle(content: string): string | null {
  // Try to extract a meaningful title from the content
  const lines = content.split('\n');
  for (const line of lines) {
    if (line.length > 10 && line.length < 100) {
      // Check if it looks like a title
      if (line.match(/^[A-Z]/) || line.match(/^#/) || line.includes(':')) {
        return line.replace(/^#+\s*/, '').replace(/[:.\n]/g, '').trim();
      }
    }
  }
  return null;
}

function extractTopics(content: string): string[] {
  const topics = new Set<string>();
  const contentLower = content.toLowerCase();
  
  // Domain detection
  const domains = {
    'computer science': ['algorithm', 'data structure', 'complexity', 'binary', 'search'],
    'machine learning': ['neural', 'training', 'model', 'dataset', 'prediction'],
    'web development': ['react', 'javascript', 'html', 'css', 'component'],
    'physics': ['quantum', 'particle', 'wave', 'energy', 'force'],
    'mathematics': ['equation', 'theorem', 'proof', 'integral', 'derivative'],
    'biology': ['cell', 'dna', 'protein', 'evolution', 'organism'],
  };
  
  for (const [domain, keywords] of Object.entries(domains)) {
    if (keywords.some(kw => contentLower.includes(kw))) {
      topics.add(domain);
    }
  }
  
  return Array.from(topics).slice(0, 5);
}

function createAnalogy(concept: string): string {
  // Create simple analogies based on concept keywords
  const lower = concept.toLowerCase();
  
  if (lower.includes('network') || lower.includes('connect')) {
    return 'a spider web where everything is connected';
  } else if (lower.includes('process') || lower.includes('algorithm')) {
    return 'following a recipe step by step';
  } else if (lower.includes('data') || lower.includes('information')) {
    return 'organizing books in a library';
  } else if (lower.includes('function') || lower.includes('method')) {
    return 'a tool that does a specific job';
  } else if (lower.includes('state') || lower.includes('memory')) {
    return 'a notebook that remembers things';
  } else {
    return 'building blocks that fit together';
  }
}

function simplifyExplanation(text: string): string {
  // Create simplified version
  const sentences = text.split('.')[0];
  const simple = sentences
    .replace(/\b(implement|utilize|leverage|optimize)\b/gi, 'use')
    .replace(/\b(construct|create|generate)\b/gi, 'make')
    .replace(/\b(demonstrate|illustrate)\b/gi, 'show')
    .replace(/\b(complex|sophisticated)\b/gi, 'hard')
    .replace(/\b(fundamental|essential)\b/gi, 'basic');
  
  return simple.substring(0, 100);
}

function extractTechnicalAspects(text: string): string {
  // Extract technical terms for advanced explanation
  const technical = text.match(/\b[A-Z][a-z]+\b|\b[A-Z]{2,}\b/g) || [];
  if (technical.length > 0) {
    return technical.slice(0, 3).join(', ');
  }
  return 'advanced mechanisms and optimizations';
}

function generateChallengeCode(title: string, topics: string[]): string {
  const topicsStr = topics?.join(', ') || 'concepts';
  
  if (topics?.some(t => t.includes('react') || t.includes('javascript'))) {
    return `// Implement a solution that demonstrates ${title}
function implementConcept(input) {
  // Your code here
  // Apply what you learned about ${topicsStr}
  
  return result;
}

// Test your implementation
console.log(implementConcept('test'));`;
  } else if (topics?.some(t => t.includes('python') || t.includes('machine'))) {
    return `# Implement a solution that demonstrates ${title}
def implement_concept(input_data):
    """Apply concepts: ${topicsStr}"""
    # Your code here
    
    return result

# Test your implementation
print(implement_concept('test'))`;
  } else {
    return `// Demonstrate your understanding of ${title}
// Key concepts: ${topicsStr}

function solution(input) {
  // Your implementation
  
  return output;
}

// Verify your solution
console.log(solution('example'));`;
  }
}

function determineDifficulty(content: string): 'beginner' | 'intermediate' | 'advanced' {
  const technicalTerms = (content.match(/\b[A-Z]{2,}\b/g) || []).length;
  const avgWordLength = content.split(/\s+/).reduce((sum, word) => sum + word.length, 0) / content.split(/\s+/).length;
  const complexWords = (content.match(/\w{10,}/g) || []).length;
  
  const score = technicalTerms * 2 + complexWords + (avgWordLength > 5 ? 10 : 0);
  
  if (score > 30) return 'advanced';
  if (score > 15) return 'intermediate';
  return 'beginner';
}