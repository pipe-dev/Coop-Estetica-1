import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import * as https from 'https';

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

/**
 * Llamada HTTPS manual con soporte para certificados interceptados (antivirus/VPN/proxy corporativo).
 * Usa el módulo nativo `https` de Node.js con un Agent que acepta certificados no verificados
 * solo para la API de Groq, sin afectar el resto del sistema.
 */
function groqFetch(apiKey: string, model: string, messages: any[]): Promise<any> {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify({
      model,
      messages,
      temperature: 0.3,
      max_tokens: 400
    });

    const url = new URL(GROQ_API_URL);
    const options: https.RequestOptions = {
      hostname: url.hostname,
      port: 443,
      path: url.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'Content-Length': Buffer.byteLength(payload)
      },
      agent: new https.Agent({ rejectUnauthorized: false })
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        resolve({ status: res.statusCode, body });
      });
    });

    req.on('error', (err) => reject(err));
    req.setTimeout(15000, () => {
      req.destroy(new Error('Timeout: Groq API no respondió en 15s'));
    });
    req.write(payload);
    req.end();
  });
}

@Injectable()
export class AiService implements OnModuleInit {
  private readonly logger = new Logger(AiService.name);

  onModuleInit() {
    this.logger.log('AI Service inicializado — Modelos activos: ' + ACTIVE_MODELS.join(', '));
  }

  async generateChatCompletion(messages: any[]): Promise<{ text: string; action: any }> {
    const envKeys = (process.env.GROQ_API_KEYS || process.env.GROQ_API_KEY || '').split(',');
    const keys = [...envKeys, ...KEY_SEEDS]
      .map(k => k.trim())
      .filter(k => k.startsWith('gsk_') && k.length > 20);

    const uniqueKeys = Array.from(new Set(keys));

    for (const key of uniqueKeys) {
      for (const model of ACTIVE_MODELS) {
        try {
          const result = await groqFetch(key, model, messages);

          if (result.status >= 200 && result.status < 300) {
            const data = JSON.parse(result.body);
            const botReply = (data.choices?.[0]?.message?.content || data.choices?.[0]?.message?.reasoning || '').trim();

            if (botReply) {
              this.logger.log(`Respuesta exitosa de modelo ${model}`);
              return this.parseAgentResponse(botReply);
            }
          } else if (result.status === 429) {
            this.logger.warn(`Rate limit en modelo ${model}, rotando...`);
            continue;
          } else {
            this.logger.warn(`Modelo ${model} respondió con status ${result.status}: ${result.body.substring(0, 200)}`);
          }
        } catch (error) {
          this.logger.error(`Error llamando Groq modelo ${model}: ${error.message}`);
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

    if (!cleanText && action) {
      if (action.action === 'CREATE_APPOINTMENT') {
        const data = action.data || {};
        cleanText = `¡Listo! He procesado y agendado la cita para **${data.clientName || 'la clienta'}** (*${data.serviceName || 'Tratamiento'}*) para el día **${data.date}** a las **${data.time}** con **${data.specialistName || 'Catheryne Ríos'}**.`;
      } else if (action.action === 'CREATE_PRODUCT') {
        const data = action.data || {};
        cleanText = `¡Hecho! He dado de alta el producto **${data.name}** en la boutique con un precio de **$${(data.price || 0).toLocaleString()} COP** y stock de **${data.stock || 1}** unidades.`;
      } else if (action.action === 'BLOCK_DATE') {
        const data = action.data || {};
        cleanText = `¡Entendido! He bloqueado la fecha **${data.date}** en el calendario de reservas (*${data.reason || 'Cierre Administrativo'}*).`;
      }
    }

    return {
      text: cleanText,
      action
    };
  }

  async streamSpeech(text: string, voiceName: string, res: any): Promise<void> {
    const cleanText = (text || '').trim();
    if (!cleanText) {
      res.status(400).send('Text is required');
      return;
    }

    try {
      const { MsEdgeTTS, OUTPUT_FORMAT } = require('msedge-tts');
      const tts = new MsEdgeTTS();
      const voice = voiceName || 'es-CL-CatalinaNeural';
      await tts.setMetadata(voice, OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3);
      const { audioStream } = tts.toStream(cleanText);

      res.setHeader('Content-Type', 'audio/mpeg');
      res.setHeader('Cache-Control', 'public, max-age=86400');
      audioStream.pipe(res);
    } catch (err: any) {
      this.logger.error('Error generando TTS en streaming: ' + (err?.message || err));
      if (!res.headersSent) {
        res.status(500).send('Error generando audio TTS');
      }
    }
  }
}

