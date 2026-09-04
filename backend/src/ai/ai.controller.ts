import { Controller, Post, Body } from '@nestjs/common';
import { AiService } from './ai.service';

@Controller('api/ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('chat')
  async chat(@Body() body: { messages: any[] }) {
    return this.aiService.generateChatCompletion(body.messages || []);
  }
}
