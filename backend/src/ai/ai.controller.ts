import { Controller, Post, Get, Query, Body, Res, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { Response } from 'express';
import { AiService } from './ai.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('api/ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @UseGuards(JwtAuthGuard)
  @Throttle({ short: { limit: 15, ttl: 60000 }, medium: { limit: 40, ttl: 300000 } })
  @Post('chat')
  async chat(@Body() body: { messages: any[] }) {
    return this.aiService.generateChatCompletion(body.messages || []);
  }

  @UseGuards(JwtAuthGuard)
  @Throttle({ short: { limit: 10, ttl: 60000 }, medium: { limit: 30, ttl: 300000 } })
  @Get('tts')
  async streamTts(
    @Query('text') text: string,
    @Query('voice') voice: string,
    @Res() res: Response
  ) {
    return this.aiService.streamSpeech(text, voice, res);
  }
}
