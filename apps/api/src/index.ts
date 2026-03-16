import Fastify from 'fastify';
import cors from '@fastify/cors';
import { serializerCompiler, validatorCompiler } from 'fastify-type-provider-zod';
import { initDb } from './db';
import { settingsRoutes } from './routes/settings';
import { syncRoutes } from './routes/sync';
import { entriesRoutes } from './routes/entries';
import { metricsRoutes } from './routes/metrics';
import { aiRoutes } from './routes/ai';

const app = Fastify({
  logger: true
});

app.setValidatorCompiler(validatorCompiler);
app.setSerializerCompiler(serializerCompiler);

app.register(cors, {
  origin: 'http://localhost:5173'
});

app.register(settingsRoutes);
app.register(syncRoutes);
app.register(entriesRoutes);
app.register(metricsRoutes);
app.register(aiRoutes);

const start = async () => {
  try {
    initDb();
    await app.listen({ port: 3001, host: '0.0.0.0' });
    console.log('Server listening on http://localhost:3001');
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();
