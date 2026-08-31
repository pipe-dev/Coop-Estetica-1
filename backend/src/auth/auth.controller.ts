import { Controller, Post, Body, UseGuards, Get, Request } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';

@Controller('api/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async login(@Body() body: { email: string; pass: string; password?: string }) {
    const password = body.pass || body.password || '';
    return this.authService.login(body.email, password);
  }

  @Post('verify-pin')
  async verifyPin(@Body() body: { pin: string }) {
    const valid = await this.authService.verifyPin(body.pin);
    return { valid };
  }

  @UseGuards(JwtAuthGuard)
  @Post('change-pin')
  async changePin(@Body() body: { currentPin: string; newPin: string }) {
    return this.authService.updateMasterPin(body.currentPin, body.newPin);
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  getProfile(@Request() req) {
    return req.user;
  }
}
