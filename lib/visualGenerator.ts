import { VisualContent } from '@/types';

// Concept to visual mapping
const conceptVisuals: Record<string, (text: string) => VisualContent> = {
  // Programming concepts
  'algorithm': (text) => ({
    type: 'canvas',
    data: { type: 'sorting', array: [64, 34, 25, 12, 22, 11, 90] },
    timing: { showAt: 20, transition: 'fade' }
  }),
  'array': (text) => ({
    type: 'diagram',
    data: { type: 'array', elements: ['[0]', '[1]', '[2]', '[3]', '[4]'] },
    timing: { showAt: 30, transition: 'draw' }
  }),
  'loop': (text) => ({
    type: 'animation',
    data: { type: 'loop', iterations: 5 },
    timing: { showAt: 25, transition: 'fade' }
  }),
  'function': (text) => ({
    type: 'code',
    data: { highlight: true, lineByLine: true },
    timing: { showAt: 15, transition: 'slide' }
  }),
  'neural network': (text) => ({
    type: 'diagram',
    data: { type: 'neural', layers: [3, 5, 5, 2] },
    timing: { showAt: 20, transition: 'draw' }
  }),
  
  // Science concepts
  'photosynthesis': (text) => ({
    type: 'animation',
    data: { type: 'photosynthesis', showChloroplast: true },
    timing: { showAt: 30, transition: 'fade' }
  }),
  'dna': (text) => ({
    type: 'animation',
    data: { type: 'dna-helix', rotate: true },
    timing: { showAt: 25, transition: 'zoom' }
  }),
  'atom': (text) => ({
    type: 'animation',
    data: { type: 'atom', electrons: 8, orbits: 3 },
    timing: { showAt: 20, transition: 'fade' }
  }),
  
  // Math concepts
  'equation': (text) => ({
    type: 'canvas',
    data: { type: 'equation', solve: true },
    timing: { showAt: 35, transition: 'draw' }
  }),
  'graph': (text) => ({
    type: 'canvas',
    data: { type: 'graph', function: 'sin(x)', animate: true },
    timing: { showAt: 30, transition: 'draw' }
  }),
  'probability': (text) => ({
    type: 'animation',
    data: { type: 'dice', rolls: 100, showDistribution: true },
    timing: { showAt: 40, transition: 'fade' }
  })
};

// Generate Unsplash query from text
export function generateImageQuery(text: string): string {
  const keywords = extractKeywords(text);
  
  // Map technical terms to visual concepts
  const visualMappings: Record<string, string> = {
    'algorithm': 'abstract network visualization',
    'programming': 'code on screen',
    'machine learning': 'artificial intelligence brain',
    'data': 'data visualization dashboard',
    'physics': 'quantum particles abstract',
    'biology': 'microscope cells nature',
    'chemistry': 'molecular structure science',
    'mathematics': 'mathematical equations blackboard',
    'history': 'vintage historical artifacts',
    'psychology': 'human brain mind',
    'economics': 'stock market graphs',
    'web': 'modern web design',
    'react': 'modern user interface',
    'python': 'python code programming',
    'javascript': 'javascript code screen'
  };
  
  // Find best visual mapping
  for (const [term, query] of Object.entries(visualMappings)) {
    if (text.toLowerCase().includes(term)) {
      return query;
    }
  }
  
  // Fallback to keywords
  return keywords.slice(0, 3).join(' ') || 'abstract learning education';
}

// Extract main keywords for visualization
function extractKeywords(text: string): string[] {
  const words = text.toLowerCase().split(/\W+/);
  const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for']);
  
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

// Generate visual content based on text analysis
export function generateVisualContent(text: string, concept?: string): VisualContent {
  const lowerText = text.toLowerCase();
  const lowerConcept = concept?.toLowerCase() || '';
  
  // Check for specific concept visualizations
  for (const [key, generator] of Object.entries(conceptVisuals)) {
    if (lowerText.includes(key) || lowerConcept.includes(key)) {
      return generator(text);
    }
  }
  
  // Default to relevant educational images
  return {
    type: 'image',
    query: generateImageQuery(text),
    timing: {
      showAt: 0,
      transition: 'fade',
      duration: 30000 // 30 second Ken Burns effect
    }
  };
}

// Get educational images based on concept
export async function getEducationalImages(query: string): Promise<string[]> {
  // For hackathon demo, use curated educational image sets
  const educationalImages: Record<string, string[]> = {
    'neural network': [
      'https://images.pexels.com/photos/373543/pexels-photo-373543.jpeg',
      'https://images.pexels.com/photos/577585/pexels-photo-577585.jpeg',
      'https://cdn.pixabay.com/photo/2018/05/18/15/30/web-3411373_1280.jpg'
    ],
    'algorithm': [
      'https://images.pexels.com/photos/546819/pexels-photo-546819.jpeg',
      'https://images.pexels.com/photos/1181671/pexels-photo-1181671.jpeg',
      'https://cdn.pixabay.com/photo/2016/11/19/14/00/code-1839406_1280.jpg'
    ],
    'data': [
      'https://images.pexels.com/photos/590022/pexels-photo-590022.jpeg',
      'https://images.pexels.com/photos/669615/pexels-photo-669615.jpeg',
      'https://cdn.pixabay.com/photo/2017/07/31/11/44/analytics-2557485_1280.jpg'
    ],
    'machine learning': [
      'https://images.pexels.com/photos/8386440/pexels-photo-8386440.jpeg',
      'https://images.pexels.com/photos/3861969/pexels-photo-3861969.jpeg',
      'https://cdn.pixabay.com/photo/2019/05/07/14/58/artificial-intelligence-4186202_1280.jpg'
    ],
    'web development': [
      'https://images.pexels.com/photos/1181263/pexels-photo-1181263.jpeg',
      'https://images.pexels.com/photos/270360/pexels-photo-270360.jpeg',
      'https://cdn.pixabay.com/photo/2021/08/04/13/06/software-developer-6521720_1280.jpg'
    ],
    'physics': [
      'https://images.pexels.com/photos/714699/pexels-photo-714699.jpeg',
      'https://images.pexels.com/photos/60582/newton-s-cradle-balls-sphere-action-60582.jpeg',
      'https://cdn.pixabay.com/photo/2016/10/20/18/35/earth-1756274_1280.jpg'
    ],
    'biology': [
      'https://images.pexels.com/photos/2280547/pexels-photo-2280547.jpeg',
      'https://images.pexels.com/photos/3938022/pexels-photo-3938022.jpeg',
      'https://cdn.pixabay.com/photo/2018/07/15/10/44/dna-3539309_1280.jpg'
    ],
    'chemistry': [
      'https://images.pexels.com/photos/2280571/pexels-photo-2280571.jpeg',
      'https://images.pexels.com/photos/256262/pexels-photo-256262.jpeg',
      'https://cdn.pixabay.com/photo/2017/02/01/13/53/analysis-2030265_1280.jpg'
    ],
    'mathematics': [
      'https://images.pexels.com/photos/3729557/pexels-photo-3729557.jpeg',
      'https://images.pexels.com/photos/6238050/pexels-photo-6238050.jpeg',
      'https://cdn.pixabay.com/photo/2015/11/15/07/47/geometry-1044090_1280.jpg'
    ],
    'default': [
      'https://images.pexels.com/photos/256541/pexels-photo-256541.jpeg',
      'https://images.pexels.com/photos/267885/pexels-photo-267885.jpeg',
      'https://cdn.pixabay.com/photo/2016/06/01/06/26/open-book-1428428_1280.jpg'
    ]
  };
  
  // Find best matching image set
  const lowerQuery = query.toLowerCase();
  for (const [key, images] of Object.entries(educationalImages)) {
    if (lowerQuery.includes(key) || key.includes(lowerQuery.split(' ')[0])) {
      return images;
    }
  }
  
  // Default educational images
  return educationalImages.default;
}

// Icon mapping for concepts
export const conceptIcons: Record<string, string> = {
  'algorithm': 'GitBranch',
  'data': 'Database',
  'array': 'Grid3x3',
  'function': 'Function',
  'loop': 'RefreshCw',
  'variable': 'Box',
  'class': 'Package',
  'api': 'Globe',
  'database': 'Database',
  'server': 'Server',
  'cloud': 'Cloud',
  'security': 'Shield',
  'network': 'Network',
  'brain': 'Brain',
  'learn': 'GraduationCap',
  'think': 'Lightbulb',
  'analyze': 'TrendingUp',
  'create': 'Sparkles',
  'build': 'Hammer',
  'design': 'Palette',
  'test': 'TestTube',
  'debug': 'Bug',
  'deploy': 'Rocket',
  'scale': 'TrendingUp',
  'optimize': 'Zap'
};

// Get appropriate icon for concept
export function getConceptIcon(text: string): string | null {
  const lowerText = text.toLowerCase();
  
  for (const [key, icon] of Object.entries(conceptIcons)) {
    if (lowerText.includes(key)) {
      return icon;
    }
  }
  
  return null;
}