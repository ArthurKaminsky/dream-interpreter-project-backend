import { FastifyInstance } from 'fastify';

// Enhanced dream interface with tags and insights
interface Dream {
  id: string;
  userId: string;
  dreamText: string;
  interpretation: string;
  tags: string[];
  sentiment: 'positive' | 'negative' | 'neutral';
  themes: string[];
  symbols: string[];
  timestamp: string;
  mood: string;
  clarity: number; // 1-10 scale
}

// In-memory storage for dream interpretations
const dreamHistory: Dream[] = [
  {
    id: "1",
    userId: "test-user-1",
    dreamText: "I was flying over a beautiful ocean with crystal clear water. I felt so free and peaceful, soaring above the waves. The sun was setting, painting the sky in purple and gold colors.",
    interpretation: "Flying dreams often represent a desire for freedom and liberation from life's constraints. The ocean symbolizes your emotional depths and the subconscious mind. The beautiful colors suggest you're entering a period of transformation and spiritual growth.",
    tags: ["flying", "good_dream", "water", "spiritual"],
    sentiment: "positive",
    themes: ["freedom", "transformation", "spirituality"],
    symbols: ["water", "light"],
    timestamp: "2024-01-15T10:30:00.000Z",
    mood: "liberated",
    clarity: 8
  },
  {
    id: "2", 
    userId: "test-user-1",
    dreamText: "I was in my childhood house but it was much bigger and darker than I remember. I kept looking for my mother but couldn't find her anywhere. I felt scared and lost.",
    interpretation: "Dreams about childhood homes often relate to your past and foundational experiences. The house appearing larger suggests unresolved issues may seem bigger than they actually are. Searching for your mother indicates a need for comfort and security.",
    tags: ["family", "nightmare"],
    sentiment: "negative", 
    themes: ["family", "fear", "healing"],
    symbols: ["house"],
    timestamp: "2024-01-10T08:15:00.000Z",
    mood: "anxious",
    clarity: 7
  },
  {
    id: "3",
    userId: "test-user-1", 
    dreamText: "I was at work giving a presentation but realized I was completely naked. Everyone was staring at me but I couldn't find any clothes. I felt embarrassed but also strangely confident.",
    interpretation: "Nakedness in dreams often represents vulnerability and fear of exposure. The work setting suggests concerns about professional judgment. However, feeling confident despite the situation indicates growing self-acceptance and authenticity.",
    tags: ["work", "recurring"],
    sentiment: "neutral",
    themes: ["anxiety", "growth", "communication"],
    symbols: [],
    timestamp: "2024-01-05T07:45:00.000Z", 
    mood: "curious",
    clarity: 6
  },
  {
    id: "4",
    userId: "test-user-1",
    dreamText: "I was in a beautiful garden with my partner. We were planting flowers together and laughing. Everything felt perfect and full of love.",
    interpretation: "Garden dreams symbolize growth, nurturing, and cultivation of relationships. Planting flowers with your partner represents the conscious effort you're both putting into your relationship. This dream reflects harmony and shared goals.",
    tags: ["romance", "good_dream"],
    sentiment: "positive",
    themes: ["relationships", "growth"],
    symbols: ["flower", "garden"],
    timestamp: "2024-01-20T09:20:00.000Z",
    mood: "loving", 
    clarity: 9
  },
  {
    id: "5",
    userId: "test-user-1",
    dreamText: "I was driving a car but the brakes weren't working. I was going downhill very fast and couldn't control the car. I was terrified but somehow managed to stop safely.",
    interpretation: "Car dreams often represent your life's direction and control. Malfunctioning brakes suggest feeling out of control in some area of your life. The downhill motion indicates momentum in a situation, while stopping safely shows your inner resilience.",
    tags: ["nightmare", "recurring"],
    sentiment: "negative",
    themes: ["control", "fear"],
    symbols: ["car"],
    timestamp: "2024-01-12T06:30:00.000Z",
    mood: "anxious",
    clarity: 8
  }
];

// Simplified dream analysis - ChatGPT will handle the real analysis
function createBasicDream(userId: string, dreamText: string, interpretation: string): Dream {
  return {
    id: Date.now().toString(),
    userId,
    dreamText,
    interpretation,
    timestamp: new Date().toISOString(),
    // Default values - in real implementation, ChatGPT API will provide these
    tags: ["vivid"],
    sentiment: "neutral",
    themes: ["transformation"],
    symbols: [],
    mood: "curious",
    clarity: 5
  };
}

export async function getDreamHistoryByUserId(userId: string): Promise<Dream[]> {
  // Simulate a database query to fetch dream history for a specific user
  return dreamHistory.filter(dream => dream.userId === userId);
}

export async function getDreamById(id: string): Promise<Dream | undefined> {
  // Simulate a database query to fetch a specific dream by ID
  return dreamHistory.find(dream => dream.id === id);
}

export async function saveDream(userId: string, dreamText: string, interpretation: string): Promise<string> {
  const dream = createBasicDream(userId, dreamText, interpretation);
  dreamHistory.push(dream);
  return dream.id;
} 