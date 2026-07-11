import { Controller, Get } from '@nestjs/common';
import { connection } from 'mongoose';

@Controller()
export class AppController {
  @Get()
  root() {
    return {
      service: 'milk-tea-api',
      status: 'running',
      health: '/v1/health',
      login: 'POST /v1/auth/login',
      message: 'Bubble Tea SaaS API — use /v1/* endpoints',
    };
  }

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