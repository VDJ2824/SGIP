import { env, connectDatabase, configureCloudinary } from './config/index.js';
import createApp from './app.js';
import { logger } from './common/logger.js';

async function bootstrap() {
  configureCloudinary();
  await connectDatabase();

  const app = createApp();
  app.listen(env.PORT, () => {
    logger.info('SGIP backend started', {
      port: env.PORT,
      environment: env.NODE_ENV,
    });
  });
}

bootstrap().catch((error) => {
  logger.error('Failed to start backend', { message: error.message, stack: error.stack });
  process.exit(1);
});
