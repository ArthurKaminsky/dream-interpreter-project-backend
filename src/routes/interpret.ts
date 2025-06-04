import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { interpretDream } from '../services/chatgptService';
import { saveDream } from '../dao/dreamDao';

async function interpret(fastify: FastifyInstance, options: FastifyPluginOptions) {
  fastify.post('/interpret', async (request, reply) => {
    const body = request.body as { dreamText?: string; };
    const { dreamText } = body;
    if (!dreamText || typeof dreamText !== 'string' || dreamText.length < 10 || dreamText.length > 1000) {
      return reply.status(400).send({
        message: 'Dream text must be a string between 10 and 1000 characters',
      });
    }

    try {
      const interpretation = await interpretDream(dreamText);
      // const id = await saveDream(userId, dreamText, interpretation);
      reply.send({
        data: { interpretation },
      });
    } catch (error) {
      reply.status(500).send({
        message: 'Failed to interpret dream',
      });
    }
  });
}

export { interpret }; 