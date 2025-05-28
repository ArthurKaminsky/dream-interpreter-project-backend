import { FastifyInstance } from 'fastify';

// In-memory storage for dream interpretations
const dreamHistory: { id: string; userId: string; dreamText: string; interpretation: string }[] = [];

export async function getDreamHistoryByUserId(userId: string): Promise<{ id: string; dreamText: string; interpretation: string }[]> {
  // Simulate a database query to fetch dream history for a specific user
  return dreamHistory.filter(dream => dream.userId === userId);
}

export async function getDreamById(id: string): Promise<{ id: string; userId: string; dreamText: string; interpretation: string } | undefined> {
  // Simulate a database query to fetch a specific dream by ID
  return dreamHistory.find(dream => dream.id === id);
}

export async function saveDream(userId: string, dreamText: string, interpretation: string): Promise<string> {
  const id = Date.now().toString();
  dreamHistory.push({ id, userId, dreamText, interpretation });
  return id;
} 