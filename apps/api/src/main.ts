import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import mongoose from 'mongoose';
import { AppModule } from './app.module';

async function connectMongo(config: ConfigService) {
  const uri = config.get<string>('MONGODB_URI');
  if (!uri) {
    console.warn('MONGODB_URI is not set. API will start but database features are disabled.');
    return;
  }

  try {
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 15000,
      connectTimeoutMS: 15000,
    });
    console.log('MongoDB connected');
  } catch (err) {
    console.error('MongoDB connection failed:', err instanceof Error ? err.message : err);
  }
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);

  app.setGlobalPrefix('v1');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  const corsOrigins = config.get<string>('CORS_ORIGINS', '*');
  app.enableCors({
    origin: corsOrigins === '*' ? true : corsOrigins.split(',').map((o) => o.trim()),
    credentials: true,
  });

  const port = Number(process.env.PORT ?? config.get('PORT') ?? 8080);
  await app.listen(port, '0.0.0.0');
  console.log(`API running on http://0.0.0.0:${port}/v1`);

  void connectMongo(config);
}

bootstrap().catch((err) => {
  console.error('Failed to start application:', err);
  process.exit(1);
});
