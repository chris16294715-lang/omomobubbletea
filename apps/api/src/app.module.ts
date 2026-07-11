import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { join } from 'path';
import { AuthModule } from './modules/auth/auth.module';
import { MenuModule } from './modules/menu/menu.module';
import { OrderModule } from './modules/order/order.module';
import { PublicModule } from './modules/public/public.module';
import { ReportModule } from './modules/report/report.module';
import { TenantModule } from './modules/tenant/tenant.module';
import { AppController } from './app.controller';
import { SpaController } from './spa.controller';
import { sanitizeMongoUri } from './common/config/mongo-uri';

const LOCAL_MONGO_URI = 'mongodb://127.0.0.1:27017/milktea?directConnection=true';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      ignoreEnvFile: process.env.NODE_ENV === 'production',
      envFilePath: [join(__dirname, '../../../.env'), join(__dirname, '../.env'), '.env'],
    }),
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const raw = config.get<string>('MONGODB_URI');
        const uri = sanitizeMongoUri(raw);

        if (!uri) {
          if (raw?.trim()) {
            console.error(
              `Invalid MONGODB_URI format. Value must start with mongodb:// or mongodb+srv://. Received: ${raw.slice(0, 40)}...`,
            );
          }
          return {
            uri: LOCAL_MONGO_URI,
            lazyConnection: true,
            serverSelectionTimeoutMS: 15000,
            connectTimeoutMS: 15000,
          };
        }

        return {
          uri,
          lazyConnection: true,
          serverSelectionTimeoutMS: 15000,
          connectTimeoutMS: 15000,
        };
      },
    }),
    TenantModule,
    AuthModule,
    MenuModule,
    OrderModule,
    PublicModule,
    ReportModule,
  ],
  controllers: [AppController, SpaController],
})
export class AppModule {}
