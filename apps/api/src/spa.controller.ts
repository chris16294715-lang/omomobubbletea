import { Controller, Get, Res } from '@nestjs/common';
import { Response } from 'express';
import { existsSync } from 'fs';
import { join } from 'path';

const indexPath = join(__dirname, '..', 'public', 'index.html');

@Controller()
export class SpaController {
  @Get(['', 'login', 'home'])
  serve(@Res() res: Response) {
    if (!existsSync(indexPath)) {
      return res.status(404).json({
        message: 'Admin web not deployed. Build admin-web or use /v1/health for API.',
      });
    }
    return res.sendFile(indexPath);
  }
}
