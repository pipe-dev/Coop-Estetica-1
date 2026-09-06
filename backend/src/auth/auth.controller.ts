import { Controller, Post, Body, UseGuards, Get, Request, ForbiddenException } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';

@Controller('api/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // S.H.I.E.L.D. Pillar 5 & 13: Anti-Brute-Force (Máximo 5 intentos por minuto)
  @Throttle({ short: { limit: 5, ttl: 60000 }, medium: { limit: 10, ttl: 300000 } })
  @Post('login')
  async login(@Body() body: { email: string; pass: string; password?: string }) {
    const password = body.pass || body.password || '';
    return this.authService.login(body.email, password);
  }

  // S.H.I.E.L.D. Pillar 5 & 13: Anti-Brute-Force PIN (Máximo 5 intentos por minuto)
  @Throttle({ short: { limit: 5, ttl: 60000 }, medium: { limit: 10, ttl: 300000 } })
  @Post('verify-pin')
  async verifyPin(@Body() body: { pin: string }) {
    return this.authService.verifyPin(body.pin);
  }

  @UseGuards(JwtAuthGuard)
  @Post('change-pin')
  async changePin(@Body() body: { currentPin: string; newPin: string }, @Request() req: any) {
    if (req.user?.role !== 'OWNER') {
      throw new ForbiddenException('Acceso denegado: Solo la Propietaria (CEO) puede modificar el PIN maestro.');
    }
    return this.authService.updateMasterPin(body.currentPin, body.newPin);
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  getProfile(@Request() req) {
    return req.user;
  }
}
