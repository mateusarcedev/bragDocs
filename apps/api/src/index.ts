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

const webOrigin = process.env.WEB_ORIGIN ?? 'http://localhost:5173';
app.register(cors, {
  origin: webOrigin
});

app.register(settingsRoutes);
app.register(syncRoutes);
app.register(entriesRoutes);
app.register(metricsRoutes);
app.register(aiRoutes);

const start = async () => {
  try {
    initDb();
    const port = Number(process.env.PORT ?? 8089);
    const host = process.env.HOST ?? '0.0.0.0';
    await app.listen({ port, host });
    console.log(`Server listening on http://${host}:${port}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();
