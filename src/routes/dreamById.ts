import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { getDreamById } from '../dao/dreamDao';

async function dreamById(fastify: FastifyInstance, options: FastifyPluginOptions) {
  fastify.get('/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const { userId } = request.query as { userId?: string };
    if (!userId || typeof userId !== 'string') {
      return reply.status(400).send({
        message: 'User ID is required',
      });
    }
    const dream = await getDreamById(id);
    if (!dream || dream.userId !== userId) {
      return reply.status(404).send({
        message: 'Dream not found',
      });
    }
    reply.send({
      data: dream,
    });
  });
}

export { dreamById }; 