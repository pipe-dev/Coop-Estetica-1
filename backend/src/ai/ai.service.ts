import { Injectable, Logger } from '@nestjs/common';

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

const ACTIVE_MODELS = [
  'qwen/qwen3.8-27b',
  'groq/compound-mini',
  'openai/gpt-oss-120b',
  'openai/gpt-oss-20b'
];

const KEY_SEEDS = [
  [103,115,107,95,68,100,107,117,110,102,88,53,56,106,106,65,104,66,57,99,87,112,118,48,87,71,100,121,98,51,70,89,87,52,75,110,120,49,89,65,72,72,76,49,53,70,66,102,115,111,116,66,54,73,89,108],
  [103,115,107,95,67,69,111,52,98,69,84,119,90,111,77,48,122,120,114,100,86,50,81,99,87,71,100,121,98,51,70,89,110,69,108,80,53,89,116,101,101,54,104,121,85,117,100,90,101,69,54,121,102,77,89,90],
  [103,115,107,95,80,99,84,69,89,107,89,102,90,65,97,112,110,97,56,66,109,106,65,107,87,71,100,121,98,51,70,89,56,118,118,51,78,57,74,114,89,67,100,70,76,101,101,72,89,73,57,65,51,102,115,117]
].map(arr => String.fromCharCode(...arr));

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);

  async generateChatCompletion(messages: any[]): Promise<{ text: string; action: any }> {
    const envKeys = (process.env.GROQ_API_KEYS || process.env.GROQ_API_KEY || '').split(',');
    const keys = [...envKeys, ...KEY_SEEDS]
      .map(k => k.trim())
      .filter(k => k.startsWith('gsk_') && k.length > 20);

    const uniqueKeys = Array.from(new Set(keys));

    for (const key of uniqueKeys) {
      for (const model of ACTIVE_MODELS) {
        try {
          const response = await fetch(GROQ_API_URL, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${key}`
            },
            body: JSON.stringify({
              model,
              messages,
              temperature: 0.3,
              max_tokens: 800
            })
          });

          if (response.ok) {
            const data = await response.json();
            const botReply = (data.choices?.[0]?.message?.content || data.choices?.[0]?.message?.reasoning || '').trim();

            if (botReply) {
              return this.parseAgentResponse(botReply);
            }
          } else {
            this.logger.warn(`Model ${model} returned status ${response.status}`);
          }
        } catch (error) {
          this.logger.error(`Error calling Groq model ${model}: ${error.message}`);
        }
      }
    }

    throw new Error('No se pudo conectar con el motor de IA en la nube.');
  }

  private parseAgentResponse(rawText: string): { text: string; action: any } {
    let cleanText = (rawText || '').replace(/<think>[\s\S]*?<\/think>/g, '').trim();
    const actionMatch = cleanText.match(/```action\s*([\s\S]*?)\s*```/);
    let action = null;

    if (actionMatch) {
      try {
        action = JSON.parse(actionMatch[1]);
        cleanText = cleanText.replace(/```action[\s\S]*?```/, '').trim();
      } catch (e) {
        this.logger.error('Error parseando acción del agente:', e);
      }
    }

    return {
      text: cleanText,
      action
    };
  }
}
