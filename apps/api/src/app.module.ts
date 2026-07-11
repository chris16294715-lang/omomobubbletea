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
        const uri = config.get<string>('MONGODB_URI');
        if (!uri) {
          throw new Error('MONGODB_URI environment variable is required');
        }
        return {
          uri,
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
  controllers: [AppController],
})
export class AppModule {}
