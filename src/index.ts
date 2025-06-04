import Fastify from 'fastify';
import fastifyCors from '@fastify/cors';
import fastifyHelmet from '@fastify/helmet';
import dotenv from 'dotenv';
import { dreamRoutes } from './routes/dreamRoutes';
import { logger } from './utils/logger';

// Load environment variables
dotenv.config();

const fastify = Fastify({ logger: false });
const port = Number(process.env.PORT) || 3000;

// Middleware
fastify.register(fastifyHelmet);
fastify.register(fastifyCors);

// Routes
fastify.register(dreamRoutes, { prefix: '/api/dreams' });

// Error handling
fastify.setErrorHandler((error, request, reply) => {
  logger.error(error);
  reply.status(error.statusCode || 500).send({
    status: 'error',
    message: error.message || 'Internal server error',
  });
});

// Start server
fastify.listen({ port, host: '0.0.0.0' }, (err, address) => {
  if (err) {
    logger.error(err);
    process.exit(1);
  }
  logger.info(`Server is running on ${address}`);
}); 