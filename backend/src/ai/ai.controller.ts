import { Controller, Post, Get, Query, Body, Res } from '@nestjs/common';
import { Response } from 'express';
import { AiService } from './ai.service';

@Controller('api/ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('chat')
  async chat(@Body() body: { messages: any[] }) {
    return this.aiService.generateChatCompletion(body.messages || []);
  }

  @Get('tts')
  async streamTts(
    @Query('text') text: string,
    @Query('voice') voice: string,
    @Res() res: Response
  ) {
    return this.aiService.streamSpeech(text, voice, res);
  }
}
