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
  // First, analyze the content to determine optimal segmentation
  const analysisPrompt = `You are an expert educator and learning designer. Analyze this content and determine how to best teach it.

Content to analyze:
${content.substring(0, 5000)}

Analyze:
1. What are the core concepts that must be understood?
2. What is the logical learning progression?
3. How many segments would best teach this (1-6)?
4. What makes this content interesting or important?
5. What examples or applications are in the source?

Return a teaching plan as JSON:
{
  "contentSummary": "What this content teaches",
  "segmentCount": <number 1-6>,
  "concepts": ["concept1", "concept2", ...],
  "difficulty": "beginner|intermediate|advanced",
  "keyInsight": "The main 'aha moment' to convey"
}`;

  const analysisMessage = await anthropic.messages.create({
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 1000,
    temperature: 0.5,
    messages: [{
      role: 'user',
      content: analysisPrompt
    }]
  });

  const analysisText = analysisMessage.content[0].type === 'text' ? analysisMessage.content[0].text : '';
  const analysisMatch = analysisText.match(/\{[\s\S]*\}/);
  if (!analysisMatch) throw new Error('Invalid analysis format');
  const analysis = JSON.parse(analysisMatch[0]);

  // Now generate rich educational content based on the analysis
  const prompt = `You are the world's best tutor creating an adaptive learning experience.

Based on this analysis: ${JSON.stringify(analysis)}

Create ${analysis.segmentCount} lesson segments from this content:
${content.substring(0, 8000)}

Each segment must include:

1. **Hook** (20-30 words): An intriguing opening that makes learners care
2. **Main Content** (200-250 words): Deep, clear explanation with insights from the source
3. **Example**: A concrete example, code snippet, or vivid analogy from the content
4. **Application**: Where/how this is used in practice
5. **Memory Trick**: A mnemonic, pattern, or trick to remember this

Create three versions for each segment:

**Normal Version**: Clear, engaging explanation for general audience. Use examples from the source. Make connections explicit.

**Simplified Version**: Use a memorable everyday analogy. Tell it like a story. Make it impossible to forget. Like explaining to a curious 12-year-old.

**Advanced Version**: Include technical depth, edge cases, mathematical formulas, or code implementations. Challenge the learner with nuance.

IMPORTANT:
- Extract ACTUAL content from the source, not generic explanations
- Each segment should create an "aha moment"
- Make it feel like learning from a passionate expert, not reading a textbook
- Use specific examples and data from the source material

Output JSON:
{
  "title": "<Compelling title from the content>",
  "segments": [
    {
      "concept": "<Clear concept name>",
      "hook": "<Intriguing opening>",
      "normal": {
        "text": "<200-250 word explanation>",
        "example": "<Concrete example>",
        "application": "<Real-world use>",
        "memoryTrick": "<How to remember>"
      },
      "simplified": {
        "text": "<200-250 word story/analogy>",
        "example": "<Relatable example>",
        "memoryTrick": "<Simple pattern>"
      },
      "advanced": {
        "text": "<200-250 word technical explanation>",
        "code": "<Code if applicable>",
        "theory": "<Mathematical or theoretical depth>"
      },
      "keywords": ["emphasis", "words"]
    }
  ],
  "mainTopics": ["extracted", "topics"]
}`;

  const message = await anthropic.messages.create({
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 4000,
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
  const systemPrompt = `You are an exceptional educator and learning experience designer. Your expertise lies in breaking down complex topics into engaging, memorable lessons that create "aha moments" for learners.

Your approach:
1. First understand what makes this content important and interesting
2. Identify the core concepts and their relationships
3. Create a learning journey that builds understanding progressively
4. Use concrete examples, analogies, and applications from the source
5. Make every segment valuable and memorable`;

  // First analyze the content
  const analysisPrompt = `Analyze this content to create an optimal learning experience:

${content.substring(0, 5000)}

Determine:
1. Core concepts that must be understood
2. Optimal number of segments (1-6) to teach this effectively
3. The key insight or "aha moment" to convey
4. Specific examples and applications from the source

Return analysis as JSON:
{
  "contentSummary": "Main topic and importance",
  "segmentCount": <1-6>,
  "concepts": ["concept names"],
  "keyInsight": "The main revelation",
  "difficulty": "beginner|intermediate|advanced"
}`;

  const analysisCompletion = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: analysisPrompt }
    ],
    temperature: 0.5,
    max_tokens: 1000,
    response_format: { type: 'json_object' },
  });

  const analysis = JSON.parse(analysisCompletion.choices[0].message.content || '{}');

  // Generate rich lesson content
  const userPrompt = `Based on your analysis: ${JSON.stringify(analysis)}

Create ${analysis.segmentCount} lesson segments from this content:
${content.substring(0, 8000)}

For each segment, create:

1. **Hook** (20-30 words): Opening that grabs attention and shows why this matters
2. **Main Explanation** (200-250 words): Deep, insightful teaching with examples from source
3. **Concrete Example**: Specific example, data, or code from the content
4. **Real Application**: Where this is used in practice
5. **Memory Aid**: Pattern, mnemonic, or trick to remember

Generate three adaptive versions:

**NORMAL**: Clear, engaging explanation for general learners. Connect concepts explicitly. Use examples from source.

**SIMPLIFIED**: Memorable analogy or story. Make it visual and relatable. Like teaching a smart 12-year-old.

**ADVANCED**: Technical depth with theory, math, code, or edge cases. Challenge with nuance.

Rules:
- Extract REAL insights from the source, not generic knowledge
- Each segment teaches something concrete and valuable
- Make it feel like learning from a passionate expert
- Create "aha moments" and memorable understanding

Return as JSON:
{
  "title": "<Compelling title from content>",
  "segments": [{
    "concept": "<Concept name>",
    "hook": "<Attention grabber>",
    "normal": {
      "text": "<200-250 words>",
      "example": "<From source>",
      "application": "<Real use>",
      "memoryTrick": "<Aid>"
    },
    "simplified": {
      "text": "<200-250 word analogy>",
      "example": "<Relatable>",
      "memoryTrick": "<Simple pattern>"
    },
    "advanced": {
      "text": "<200-250 technical>",
      "code": "<If applicable>",
      "theory": "<Deep insight>"
    },
    "keywords": ["key", "terms"]
  }],
  "mainTopics": ["topics"]
}`;

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ],
    temperature: 0.7,
    max_tokens: 4000,
    response_format: { type: 'json_object' },
  });

  const result = JSON.parse(completion.choices[0].message.content || '{}');
  return transformToLesson(result, source, content);
}

async function generateFromContent(
  content: string,
  source: any
): Promise<Lesson> {
  // Intelligent content extraction without AI
  // Creates educational segments from the source material
  
  const sentences = content.match(/[^.!?]+[.!?]+/g) || [];
  const paragraphs = content.split(/\n\n+/).filter(p => p.trim().length > 50);
  
  // Find the most important paragraphs based on keyword density
  const scoreParagraph = (para: string): number => {
    const importantWords = [
      'important', 'key', 'main', 'concept', 'principle', 'fundamental',
      'essential', 'core', 'critical', 'means', 'defined', 'works',
      'used', 'allows', 'enables', 'because', 'therefore', 'thus'
    ];
    let score = 0;
    const lower = para.toLowerCase();
    importantWords.forEach(word => {
      if (lower.includes(word)) score += 2;
    });
    // Bonus for paragraphs with examples or code
    if (lower.includes('example') || lower.includes('for instance')) score += 3;
    if (para.includes('```') || para.includes('    ')) score += 3; // code blocks
    return score;
  };
  
  // Sort paragraphs by importance
  const rankedParagraphs = paragraphs
    .map(p => ({ text: p, score: scoreParagraph(p) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 6); // Max 6 segments
  
  // Determine optimal segment count (1-6)
  const segmentCount = Math.min(Math.max(1, Math.ceil(content.length / 2000)), 6);
  
  // Create rich segments from top paragraphs
  const segments = rankedParagraphs.slice(0, segmentCount).map((para, index) => {
    const text = para.text;
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [];
    const firstSentence = sentences[0] || text.substring(0, 100);
    const conceptTitle = firstSentence.substring(0, 80).replace(/[.!?]/g, '').trim();
    
    // Extract keywords from this paragraph
    const words = text.toLowerCase().split(/\W+/);
    const wordFreq: Record<string, number> = {};
    words.forEach(word => {
      if (word.length > 4) {
        wordFreq[word] = (wordFreq[word] || 0) + 1;
      }
    });
    const keywords = Object.entries(wordFreq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([word]) => word);
    
    // Create a hook from the most interesting sentence
    const hook = sentences.find(s => 
      s.includes('?') || s.includes('!') || s.toLowerCase().includes('imagine')
    ) || `Let's explore ${conceptTitle.toLowerCase()}`;
    
    // Expand the content to be educational (200+ words)
    const expandedNormal = `${text} ${sentences.length < 3 ? 
      `This concept is fundamental to understanding the broader topic. When we look at ${conceptTitle.toLowerCase()}, we're seeing a key building block that connects to many other ideas. Understanding this will help you grasp more complex concepts that build upon it.` : ''}`;
    
    const simplifiedText = `Imagine ${conceptTitle.toLowerCase()} is like ${createAnalogy(text)}. ${simplifyExplanation(text)} In everyday terms, this means ${extractSimpleExplanation(text)}. The key thing to remember is that ${firstSentence.toLowerCase()}`;
    
    const advancedText = `${text} At a deeper level, ${extractTechnicalAspects(text)}. This involves understanding the underlying mechanisms and theoretical foundations. Advanced practitioners should consider edge cases, performance implications, and how this integrates with related systems.`;
    
    return {
      concept: conceptTitle,
      hook: hook.substring(0, 100),
      normal: {
        text: expandedNormal,
        hook: seg.hook || seg.normal?.hook,
        example: seg.normal?.example,
        application: seg.normal?.application,
        memoryTrick: seg.normal?.memoryTrick,
        code: seg.normal?.code,
        speakingRate: 1.0,
        emphasis: seg.keywords || extractKeywords(normalContent),
      },
      simplified: {
        text: simplifiedText,
        hook: seg.simplified?.hook || seg.hook,
        example: seg.simplified?.example,
        memoryTrick: seg.simplified?.memoryTrick,
        speakingRate: 0.9,
        emphasis: (seg.keywords || []).slice(0, 3),
      },
      advanced: {
        text: advancedText,
        hook: seg.advanced?.hook || seg.hook,
        code: seg.advanced?.code || seg.code,
        example: seg.advanced?.theory || seg.advanced?.example,
        application: seg.advanced?.application,
        speakingRate: 1.1,
        emphasis: [...(seg.keywords || []), ...(seg.technicalTerms || [])],
      },
      keywords: keywords
    };
  });

  // If we still don't have enough segments, create one comprehensive segment
  if (segments.length === 0) {
    const summary = content.substring(0, 1000);
    const firstSentence = summary.split('.')[0] || 'This content';
    segments.push({
      concept: 'Core Concept',
      hook: 'Let\'s understand this step by step',
      normal: {
        text: summary.length < 200 ? summary + ' This forms the foundation of our understanding.' : summary,
        example: 'Consider how this applies in practice.',
        application: 'This concept is widely used in real-world scenarios.',
        memoryTrick: 'Focus on the key relationship between cause and effect.'
      },
      simplified: {
        text: `Think of it as ${createAnalogy(firstSentence)}. ${simplifyExplanation(summary)}`,
        example: 'Like learning to ride a bike - practice makes perfect.',
        memoryTrick: 'Remember the simple pattern.'
      },
      advanced: {
        text: `${summary} This requires understanding the underlying mechanisms and theoretical foundations.`,
        code: extractCode(summary),
        theory: extractTechnicalAspects(summary)
      },
      keywords: extractKeywords(summary)
    });
  }

  const result = {
    title: extractTitle(content) || 'Key Concepts',
    segments: segments.slice(0, 3),
    mainTopics: extractTopics(content).slice(0, 5)
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
  
  // Calculate realistic duration based on word count (150 words per minute speaking rate)
  const calculateDuration = (text: string) => {
    const wordCount = text.split(/\s+/).length;
    return Math.ceil(wordCount / 150 * 60); // seconds
  };
  
  const transformedSegments = segments.map((seg: any, index: number) => {
    // Handle both old and new format
    const normalContent = seg.normal?.text || seg.normal || seg.explanation || '';
    const simplifiedContent = seg.simplified?.text || seg.simplified || seg.simple || '';
    const advancedContent = seg.advanced?.text || seg.advanced || seg.technical || '';
    
    return {
      id: crypto.randomUUID(),
      order: index,
      concept: seg.concept || `Concept ${index + 1}`,
      variants: {
        normal: {
          text: normalContent,
          hook: seg.hook || seg.normal?.hook,
          example: seg.normal?.example,
          application: seg.normal?.application,
          memoryTrick: seg.normal?.memoryTrick,
          code: seg.normal?.code,
          speakingRate: 1.0,
          emphasis: seg.keywords || extractKeywords(normalContent),
        },
        simplified: {
          text: simplifiedContent,
          hook: seg.simplified?.hook || seg.hook,
          example: seg.simplified?.example,
          memoryTrick: seg.simplified?.memoryTrick,
          speakingRate: 0.9,
          emphasis: (seg.keywords || []).slice(0, 3),
        },
        advanced: {
          text: advancedContent,
          hook: seg.advanced?.hook || seg.hook,
          code: seg.advanced?.code || seg.code,
          example: seg.advanced?.theory || seg.advanced?.example,
          application: seg.advanced?.application,
          speakingRate: 1.1,
          emphasis: [...(seg.keywords || []), ...(seg.technicalTerms || [])],
        },
      },
      triggers: [
        { condition: 'confusion', threshold: 0.7, action: 'simplify' },
        { condition: 'voice_command', action: 'deepen' },
        { condition: 'distraction', threshold: 3, action: 'break' },
      ],
    };
  });
  
  // Calculate total duration from actual content
  const totalDuration = transformedSegments.reduce((acc: number, seg: any) => {
    return acc + calculateDuration(seg.variants.normal.text);
  }, 0);
  
  return {
    id: crypto.randomUUID(),
    title: aiResult.title || 'Adaptive Lesson',
    source,
    duration: totalDuration,
    segments: transformedSegments,
    challenge: {
      id: crypto.randomUUID(),
      title: 'Apply Your Knowledge',
      description: `Based on what you learned about ${aiResult.title}, demonstrate your understanding.`,
      starterCode: generateChallengeCode(aiResult.title, aiResult.mainTopics),
      tests: [],
      hints: segments.map((seg: any, i: number) => 
        `Apply ${seg.concept || `concept ${i + 1}`}: ${seg.normal?.memoryTrick || seg.hook || 'Think step by step'}`
      ).slice(0, 3),
      timeLimit: 5,
    },
    metadata: {
      difficulty: aiResult.difficulty || determineDifficulty(originalContent),
      topics: aiResult.mainTopics || extractTopics(originalContent),
      prerequisites: [],
      estimatedTime: Math.ceil(totalDuration / 60), // Convert to minutes
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

function extractExample(text: string): string {
  // Try to find example in text
  const lower = text.toLowerCase();
  const exampleIndex = lower.indexOf('example');
  const forInstanceIndex = lower.indexOf('for instance');
  const suchAsIndex = lower.indexOf('such as');
  
  if (exampleIndex > -1) {
    return text.substring(exampleIndex, Math.min(exampleIndex + 150, text.length));
  } else if (forInstanceIndex > -1) {
    return text.substring(forInstanceIndex, Math.min(forInstanceIndex + 150, text.length));
  } else if (suchAsIndex > -1) {
    return text.substring(suchAsIndex, Math.min(suchAsIndex + 150, text.length));
  }
  
  // Return first interesting sentence as example
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [];
  return sentences[1] || sentences[0] || 'Consider how this works in practice.';
}

function extractApplication(text: string): string {
  const applications = [
    'solving complex problems',
    'building efficient systems',
    'analyzing data',
    'making decisions',
    'optimizing performance'
  ];
  
  // Look for application keywords in text
  const lower = text.toLowerCase();
  if (lower.includes('used')) {
    const usedIndex = lower.indexOf('used');
    return text.substring(usedIndex, Math.min(usedIndex + 100, text.length));
  }
  
  return applications[Math.floor(Math.random() * applications.length)];
}

function createSimpleExample(concept: string): string {
  return `It's like when you ${concept.toLowerCase().includes('process') ? 'organize your desk' : 
    concept.toLowerCase().includes('data') ? 'sort your photos' :
    concept.toLowerCase().includes('connect') ? 'call a friend' :
    'learn something new'} - start simple, then build up.`;
}

function extractCode(text: string): string | undefined {
  // Look for code blocks
  const codeMatch = text.match(/```[\s\S]*?```/);
  if (codeMatch) {
    return codeMatch[0].replace(/```/g, '').trim();
  }
  
  // Look for indented code
  const lines = text.split('\n');
  const codeLines = lines.filter(line => line.startsWith('    ') || line.startsWith('\t'));
  if (codeLines.length > 0) {
    return codeLines.join('\n').trim();
  }
  
  return undefined;
}

function extractSimpleExplanation(text: string): string {
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [];
  const simple = sentences[0] || text.substring(0, 100);
  return simple
    .replace(/\b(utilize|utilization)\b/gi, 'use')
    .replace(/\b(implement|implementation)\b/gi, 'make')
    .replace(/\b(demonstrate)\b/gi, 'show')
    .toLowerCase();
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