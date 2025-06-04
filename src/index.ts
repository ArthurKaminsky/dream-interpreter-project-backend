import Fastify from 'fastify';
import fastifyCors from '@fastify/cors';
import { dreamRoutes } from './routes/dreamRoutes';
import { authRoutes } from './routes/auth';

const fastify = Fastify({ 
  logger: true
});

const port = Number(process.env.PORT) || 3000;

// Middleware
fastify.register(fastifyCors, {
  origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:3000'],
  credentials: true
});

// Routes
fastify.register(dreamRoutes, { prefix: '/api/dreams' });
fastify.register(authRoutes, { prefix: '/api/auth' });

// Health check
fastify.get('/health', async (request, reply) => {
  return { status: 'ok', timestamp: new Date().toISOString() };
});

// Error handling
fastify.setErrorHandler((error, request, reply) => {
  fastify.log.error(error);
  reply.status(error.statusCode || 500).send({
    success: false,
    error: error.message || 'Internal server error',
    code: 'INTERNAL_ERROR'
  });
});

// Start server
fastify.listen({ port, host: '0.0.0.0' }, (err, address) => {
  if (err) {
    fastify.log.error(err);
    process.exit(1);
  }
  fastify.log.info(`Server is running on ${address}`);
}); 