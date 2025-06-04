import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { interpret } from './interpret';
import { history } from './history';
import { dreamById } from './dreamById';

// In-memory storage for dream interpretations
const dreamHistory: { id: string; dreamText: string; interpretation: string }[] = [];

async function dreamRoutes(fastify: FastifyInstance, options: FastifyPluginOptions) {
  fastify.register(interpret);
  fastify.register(history);
  fastify.register(dreamById);
}

export { dreamRoutes }; 