import { NestFactory } from '@nestjs/core';
import { ValidationPipe, RequestMethod } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestExpressApplication } from '@nestjs/platform-express';
import { existsSync } from 'fs';
import { join } from 'path';
import mongoose from 'mongoose';
import { AppModule } from './app.module';
import { maskMongoUri, sanitizeMongoUri } from './common/config/mongo-uri';

async function connectMongo(config: ConfigService) {
  const raw = config.get<string>('MONGODB_URI');
  const uri = sanitizeMongoUri(raw);

  if (!uri) {
    if (raw?.trim()) {
      console.error(
        'MONGODB_URI is invalid. Fix Cloud Run env var — it must start with mongodb:// or mongodb+srv:// and must not include quotes.',
      );
      console.error(`Received (first 60 chars): ${raw.slice(0, 60)}`);
    } else {
      console.warn('MONGODB_URI is not set. Database features are disabled.');
    }
    return;
  }

  try {
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 15000,
      connectTimeoutMS: 15000,
    });
    console.log(`MongoDB connected (${maskMongoUri(uri)})`);
  } catch (err) {
    console.error('MongoDB connection failed:', err instanceof Error ? err.message : err);
  }
}

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const config = app.get(ConfigService);

  app.setGlobalPrefix('v1', {
    exclude: [
      { path: '/', method: RequestMethod.GET },
      { path: 'login', method: RequestMethod.GET },
      { path: 'home', method: RequestMethod.GET },
      { path: 'menu', method: RequestMethod.GET },
      { path: 'pos', method: RequestMethod.GET },
      { path: 'reports', method: RequestMethod.GET },
    ],
  });
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

  const publicPath = join(__dirname, '..', 'public');
  if (existsSync(join(publicPath, 'index.html'))) {
    app.useStaticAssets(publicPath);
    console.log('Serving admin web static assets from /public');
  }

  const port = Number(process.env.PORT ?? config.get('PORT') ?? 8080);
  await app.listen(port, '0.0.0.0');
  console.log(`API running on http://0.0.0.0:${port}/v1`);

  void connectMongo(config);
}

bootstrap().catch((err) => {
  console.error('Failed to start application:', err);
  process.exit(1);
});
