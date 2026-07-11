import { Controller, Get } from '@nestjs/common';
import { connection } from 'mongoose';

@Controller()
export class AppController {
  @Get('health')
  health() {
    const dbReadyState = connection.readyState;
    const dbStatus =
      dbReadyState === 1 ? 'connected' : dbReadyState === 2 ? 'connecting' : 'disconnected';

    return {
      status: 'ok',
      service: 'milk-tea-api',
      db: dbStatus,
      timestamp: new Date().toISOString(),
    };
  }
}