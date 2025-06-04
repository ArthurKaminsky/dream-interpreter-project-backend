import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { getDreamHistoryByUserId } from '../dao/dreamDao';

interface DreamInsights {
  totalDreams: number;
  sentimentAnalysis: {
    positive: number;
    negative: number;
    neutral: number;
  };
  commonTags: Array<{ tag: string; count: number }>;
  commonThemes: Array<{ theme: string; count: number }>;
  commonSymbols: Array<{ symbol: string; count: number }>;
  moodDistribution: Array<{ mood: string; count: number }>;
  averageClarity: number;
  recentActivity: {
    last7Days: number;
    last30Days: number;
  };
  dreamPatterns: {
    mostActiveDay: string;
    averageDreamLength: number;
    longestDream: number;
    shortestDream: number;
  };
}

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
  clarity: number;
}

async function insights(fastify: FastifyInstance, options: FastifyPluginOptions) {
  fastify.get('/insights', async (request, reply) => {
    const { userId } = request.query as { userId?: string };
    if (!userId || typeof userId !== 'string') {
      return reply.status(400).send({
        message: 'User ID is required',
      });
    }

    try {
      const dreams = await getDreamHistoryByUserId(userId);
      
      if (dreams.length === 0) {
        return reply.send({
          data: {
            totalDreams: 0,
            message: 'No dreams found for analysis. Start by interpreting your first dream!'
          }
        });
      }

      // Calculate insights
      const insights: DreamInsights = {
        totalDreams: dreams.length,
        sentimentAnalysis: {
          positive: dreams.filter(d => d.sentiment === 'positive').length,
          negative: dreams.filter(d => d.sentiment === 'negative').length,
          neutral: dreams.filter(d => d.sentiment === 'neutral').length,
        },
        commonTags: getTopTags(dreams.flatMap(d => d.tags)),
        commonThemes: getTopThemes(dreams.flatMap(d => d.themes)),
        commonSymbols: getTopSymbols(dreams.flatMap(d => d.symbols)),
        moodDistribution: getTopMoods(dreams.map(d => d.mood)),
        averageClarity: dreams.reduce((sum, d) => sum + d.clarity, 0) / dreams.length,
        recentActivity: {
          last7Days: getRecentDreams(dreams, 7),
          last30Days: getRecentDreams(dreams, 30),
        },
        dreamPatterns: {
          mostActiveDay: getMostActiveDay(dreams),
          averageDreamLength: dreams.reduce((sum, d) => sum + d.dreamText.length, 0) / dreams.length,
          longestDream: Math.max(...dreams.map(d => d.dreamText.length)),
          shortestDream: Math.min(...dreams.map(d => d.dreamText.length)),
        }
      };

      reply.send({
        data: insights,
        dreams: dreams
      });
    } catch (error) {
      reply.status(500).send({
        message: 'Failed to generate insights',
      });
    }
  });
}

// Helper functions
function getTopTags(items: string[]): Array<{ tag: string; count: number }> {
  const counts = items.reduce((acc, item) => {
    acc[item] = (acc[item] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return Object.entries(counts)
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
}

function getTopThemes(items: string[]): Array<{ theme: string; count: number }> {
  const counts = items.reduce((acc, item) => {
    acc[item] = (acc[item] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return Object.entries(counts)
    .map(([theme, count]) => ({ theme, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
}

function getTopSymbols(items: string[]): Array<{ symbol: string; count: number }> {
  const counts = items.reduce((acc, item) => {
    acc[item] = (acc[item] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return Object.entries(counts)
    .map(([symbol, count]) => ({ symbol, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
}

function getTopMoods(items: string[]): Array<{ mood: string; count: number }> {
  const counts = items.reduce((acc, item) => {
    acc[item] = (acc[item] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return Object.entries(counts)
    .map(([mood, count]) => ({ mood, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
}

function getRecentDreams(dreams: Dream[], days: number): number {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);
  
  return dreams.filter(dream => new Date(dream.timestamp) >= cutoffDate).length;
}

function getMostActiveDay(dreams: Dream[]): string {
  const dayCount = dreams.reduce((acc, dream) => {
    const day = new Date(dream.timestamp).toLocaleDateString('en-US', { weekday: 'long' });
    acc[day] = (acc[day] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const mostActive = Object.entries(dayCount).sort((a, b) => b[1] - a[1])[0];
  return mostActive ? mostActive[0] : 'Unknown';
}

export { insights }; 