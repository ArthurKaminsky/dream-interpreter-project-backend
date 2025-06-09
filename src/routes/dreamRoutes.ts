import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { interpret } from './interpret';
import { history } from './history';
import { dreamById } from './dreamById';
import { insights } from './insights';

// In-memory storage for dream interpretations
const dreamHistory: { id: string; dreamText: string; interpretation: string }[] = [];

async function dreamRoutes(fastify: FastifyInstance, options: FastifyPluginOptions) {
  fastify.register(interpret);
  fastify.register(history);
  fastify.register(dreamById);
  fastify.register(insights);
}

export { dreamRoutes }; 