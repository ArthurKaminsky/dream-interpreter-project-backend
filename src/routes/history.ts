import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { getDreamHistoryByUserId } from '../dao/dreamDao';

async function history(fastify: FastifyInstance, options: FastifyPluginOptions) {
  fastify.get('/history', async (request, reply) => {
    const { userId } = request.query as { userId?: string };
    if (!userId || typeof userId !== 'string') {
      return reply.status(400).send({
        message: 'User ID is required',
      });
    }
    const dreams = await getDreamHistoryByUserId(userId);
    reply.send({
      data: dreams,
    });
  });
}

export { history }; 