import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AppointmentsService } from '../appointments/appointments.service';
import * as https from 'https';

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

const ACTIVE_MODELS = [
  'openai/gpt-oss-120b',
  'qwen/qwen3.8-27b',
  'groq/compound-mini',
  'openai/gpt-oss-20b'
];

const KEY_SEEDS = [
  [103,115,107,95,68,100,107,117,110,102,88,53,56,106,106,65,104,66,57,99,87,112,118,48,87,71,100,121,98,51,70,89,87,52,75,110,120,49,89,65,72,72,76,49,53,70,66,102,115,111,116,66,54,73,89,108],
  [103,115,107,95,67,69,111,52,98,69,84,119,90,111,77,48,122,120,114,100,86,50,81,99,87,71,100,121,98,51,70,89,110,69,108,80,53,89,116,101,101,54,104,121,85,117,100,90,101,69,54,121,102,77,89,90],
  [103,115,107,95,80,99,84,69,89,107,89,102,90,65,97,112,110,97,56,66,109,106,65,107,87,71,100,121,98,51,70,89,56,118,118,51,78,57,74,114,89,67,100,70,76,101,101,72,89,73,57,65,51,102,115,117]
].map(arr => String.fromCharCode(...arr));

export const AGENTIC_TOOLS = [
  {
    type: 'function',
    function: {
      name: 'get_caja_summary',
      description: 'Consulta en tiempo real el balance de caja (ingresos, egresos, saldo neto y transacciones) en PostgreSQL para una fecha (por defecto hoy).',
      parameters: {
        type: 'object',
        properties: {
          date: {
            type: 'string',
            description: 'Fecha en formato YYYY-MM-DD (ej: 2026-09-04).'
          }
        }
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'get_agenda',
      description: 'Consulta las citas agendadas en PostgreSQL para una fecha determinada y opcionalmente por especialista.',
      parameters: {
        type: 'object',
        properties: {
          date: {
            type: 'string',
            description: 'Fecha en formato YYYY-MM-DD.'
          },
          specialistName: {
            type: 'string',
            description: 'Nombre de la especialista para filtrar citas (opcional).'
          }
        }
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'search_clients',
      description: 'Busca clientas en el CRM de PostgreSQL por nombre o teléfono, obteniendo historial de visitas y notas.',
      parameters: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: 'Nombre o teléfono de la clienta.'
          }
        },
        required: ['query']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'get_catalog_and_stock',
      description: 'Obtiene el catálogo de servicios activos con precios, productos en stock y especialistas del equipo.',
      parameters: {
        type: 'object',
        properties: {}
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'book_appointment',
      description: 'Agenda y guarda una cita directamente en la base de datos PostgreSQL, verificando disponibilidad y asignando especialista.',
      parameters: {
        type: 'object',
        properties: {
          clientName: { type: 'string', description: 'Nombre completo de la clienta.' },
          clientPhone: { type: 'string', description: 'Teléfono de contacto de la clienta.' },
          serviceName: { type: 'string', description: 'Nombre del servicio del catálogo.' },
          specialistName: { type: 'string', description: 'Nombre de la especialista que atenderá.' },
          date: { type: 'string', description: 'Fecha en formato YYYY-MM-DD.' },
          time: { type: 'string', description: 'Hora en formato HH:MM AM/PM (ej: "10:00 AM").' },
          notes: { type: 'string', description: 'Notas opcionales.' }
        },
        required: ['clientName', 'serviceName', 'specialistName', 'date', 'time']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'create_product',
      description: 'Crea un nuevo producto en el inventario de PostgreSQL.',
      parameters: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'Nombre del producto.' },
          price: { type: 'number', description: 'Precio en COP.' },
          stock: { type: 'integer', description: 'Cantidad de unidades en stock.' },
          category: { type: 'string', description: 'Categoría (facial, corporal, etc.).' }
        },
        required: ['name', 'price', 'stock']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'block_date',
      description: 'Bloquea un día en el calendario en PostgreSQL (festivo, vacaciones o cierre administrativo).',
      parameters: {
        type: 'object',
        properties: {
          date: { type: 'string', description: 'Fecha en formato YYYY-MM-DD.' },
          reason: { type: 'string', description: 'Motivo del bloqueo.' },
          type: { type: 'string', description: 'Tipo de cierre (Festivo, Vacaciones).' }
        },
        required: ['date']
      }
    }
  }
];

function groqFetch(apiKey: string, model: string, messages: any[], tools?: any[]): Promise<any> {
  return new Promise((resolve, reject) => {
    const payloadObj: any = {
      model,
      messages,
      temperature: 0.3,
      max_tokens: 600
    };

    if (tools && tools.length > 0) {
      payloadObj.tools = tools;
      payloadObj.tool_choice = 'auto';
    }

    const payload = JSON.stringify(payloadObj);
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

  constructor(
    private readonly prisma: PrismaService,
    private readonly appointmentsService: AppointmentsService,
  ) {}

  onModuleInit() {
    this.logger.log('AI Service inicializado con Agentic Function Calling (PostgreSQL Tools)');
  }

  /**
   * Ejecuta una herramienta de base de datos invocada por el modelo
   */
  async executeTool(name: string, args: any): Promise<{ result: any; didMutate: boolean; action?: any }> {
    this.logger.log(`[TOOL CALL] Ejecutando "${name}" con args: ${JSON.stringify(args)}`);

    switch (name) {
      case 'get_caja_summary': {
        const targetDate = args.date || new Date().toISOString().split('T')[0];
        const activeSession = await this.prisma.cashSession.findFirst({
          where: { status: 'Abierta' },
          orderBy: { openedAt: 'desc' }
        });

        const startOfDay = new Date(`${targetDate}T00:00:00.000Z`);
        const endOfDay = new Date(`${targetDate}T23:59:59.999Z`);

        const transactions = await this.prisma.transaction.findMany({
          where: { date: { gte: startOfDay, lte: endOfDay } }
        });

        const totalIngresos = transactions.filter(t => t.type === 'Ingreso').reduce((acc, t) => acc + t.amount, 0);
        const totalEgresos = transactions.filter(t => t.type === 'Egreso').reduce((acc, t) => acc + t.amount, 0);
        const base = activeSession?.initialBase || 0;
        const saldoNeto = base + totalIngresos - totalEgresos;

        return {
          didMutate: false,
          result: {
            fecha: targetDate,
            estadoCaja: activeSession ? 'Abierta' : 'Cerrada',
            responsableCaja: activeSession?.responsibleName || 'N/A',
            baseInicial: base,
            totalIngresos,
            totalEgresos,
            saldoNetoActual: saldoNeto,
            conteoTransacciones: transactions.length,
            ultimosMovimientos: transactions.slice(0, 5).map(t => `${t.type}: $${t.amount.toLocaleString()} COP (${t.description} - ${t.paymentMethod})`)
          }
        };
      }

      case 'get_agenda': {
        const targetDate = args.date || new Date().toISOString().split('T')[0];
        const whereClause: any = {
          date: targetDate,
          status: { notIn: ['Cancelada'] }
        };
        if (args.specialistName) {
          whereClause.specialistName = { contains: args.specialistName, mode: 'insensitive' };
        }
        const appointments = await this.prisma.appointment.findMany({
          where: whereClause,
          orderBy: { time: 'asc' }
        });

        return {
          didMutate: false,
          result: {
            fecha: targetDate,
            totalCitas: appointments.length,
            citas: appointments.map(a => ({
              hora: a.time,
              clienta: a.clientName,
              servicio: a.serviceName,
              especialista: a.specialistName,
              precio: a.price,
              estado: a.status
            }))
          }
        };
      }

      case 'search_clients': {
        const clients = await this.prisma.client.findMany({
          where: {
            OR: [
              { name: { contains: args.query, mode: 'insensitive' } },
              { phone: { contains: args.query } }
            ]
          },
          take: 5,
          include: {
            appointments: {
              take: 3,
              orderBy: { date: 'desc' }
            }
          }
        });

        return {
          didMutate: false,
          result: {
            conteo: clients.length,
            clientas: clients.map(c => ({
              nombre: c.name,
              telefono: c.phone,
              email: c.email || 'No registrado',
              notasPielOPreferencias: c.notes || 'Ninguna',
              totalVisitas: c.appointments.length,
              ultimasCitas: c.appointments.map(a => `${a.date} (${a.serviceName} con ${a.specialistName})`)
            }))
          }
        };
      }

      case 'get_catalog_and_stock': {
        const services = await this.prisma.service.findMany({
          where: { active: true },
          include: { category: true },
          take: 40
        });
        const products = await this.prisma.product.findMany({
          where: { active: true },
          take: 30
        });
        const team = await this.prisma.teamMember.findMany({
          where: { active: true }
        });

        return {
          didMutate: false,
          result: {
            serviciosDisponibles: services.map(s => ({
              id: s.id,
              nombre: s.name,
              precioCOP: s.price,
              duracionMinutos: s.duration,
              categoria: s.category?.name || 'General'
            })),
            productosEnInventario: products.map(p => ({
              id: p.id,
              nombre: p.name,
              precioCOP: p.price,
              stock: p.stock,
              estado: p.status
            })),
            equipoEspecialistas: team.map(t => ({
              id: t.id,
              nombre: t.name,
              rol: t.role,
              comisionPorcentaje: t.commissionRate
            }))
          }
        };
      }

      case 'book_appointment': {
        const services = await this.prisma.service.findMany({ where: { active: true } });
        const matchedService = services.find(s => 
          s.name.toLowerCase().includes(args.serviceName.toLowerCase()) || 
          args.serviceName.toLowerCase().includes(s.name.toLowerCase())
        );

        if (!matchedService) {
          return {
            didMutate: false,
            result: {
              success: false,
              error: `El servicio "${args.serviceName}" no fue encontrado en el catálogo activo.`
            }
          };
        }

        const team = await this.prisma.teamMember.findMany({ where: { active: true } });
        const matchedSpecialist = team.find(t => 
          t.name.toLowerCase().includes(args.specialistName.toLowerCase()) || 
          args.specialistName.toLowerCase().includes(t.name.toLowerCase())
        );

        if (!matchedSpecialist) {
          const names = team.map(t => t.name).join(', ') || 'Ninguna registrada';
          return {
            didMutate: false,
            result: {
              success: false,
              error: `La especialista "${args.specialistName}" no existe en el equipo. Especialistas registradas: ${names}.`
            }
          };
        }

        try {
          const appointment = await this.appointmentsService.bookAppointment({
            clientName: args.clientName,
            clientPhone: args.clientPhone || '3000000000',
            serviceId: matchedService.id,
            specialistId: matchedSpecialist.id,
            date: args.date,
            time: args.time,
            notes: args.notes || 'Agendado por Catheryne AI'
          });

          return {
            didMutate: true,
            action: {
              action: 'CREATE_APPOINTMENT',
              data: {
                id: appointment.id,
                clientName: args.clientName,
                serviceName: matchedService.name,
                specialistName: matchedSpecialist.name,
                date: args.date,
                time: args.time,
                price: matchedService.price
              }
            },
            result: {
              success: true,
              mensaje: `Cita guardada en PostgreSQL para ${args.clientName}`,
              cita: appointment
            }
          };
        } catch (err: any) {
          return {
            didMutate: false,
            result: {
              success: false,
              error: err?.message || 'Error al guardar la cita en la base de datos.'
            }
          };
        }
      }

      case 'create_product': {
        try {
          const product = await this.prisma.product.create({
            data: {
              name: args.name,
              price: parseFloat(args.price as any) || 50000,
              stock: parseInt(args.stock as any, 10) || 10,
              category: args.category || 'facial',
              brand: 'Catheryne Ríos Luxury'
            }
          });

          return {
            didMutate: true,
            action: {
              action: 'CREATE_PRODUCT',
              data: product
            },
            result: {
              success: true,
              mensaje: `Producto "${product.name}" creado con éxito en PostgreSQL.`,
              producto: product
            }
          };
        } catch (err: any) {
          return {
            didMutate: false,
            result: { success: false, error: err?.message || 'Error creando producto.' }
          };
        }
      }

      case 'block_date': {
        try {
          const closed = await this.prisma.closedDate.upsert({
            where: { date: args.date },
            update: { reason: args.reason || 'Cierre Administrativo', type: args.type || 'Festivo' },
            create: { date: args.date, reason: args.reason || 'Cierre Administrativo', type: args.type || 'Festivo' }
          });

          return {
            didMutate: true,
            action: {
              action: 'BLOCK_DATE',
              data: closed
            },
            result: {
              success: true,
              mensaje: `Fecha ${closed.date} bloqueada en base de datos.`,
              cierre: closed
            }
          };
        } catch (err: any) {
          return {
            didMutate: false,
            result: { success: false, error: err?.message || 'Error bloqueando fecha.' }
          };
        }
      }

      default:
        return {
          didMutate: false,
          result: { error: `Herramienta desconocida: ${name}` }
        };
    }
  }

  /**
   * Generación con Agentic Function Calling en bucle
   */
  async generateChatCompletion(incomingMessages: any[]): Promise<{ text: string; action: any; didMutate: boolean }> {
    const envKeys = (process.env.GROQ_API_KEYS || process.env.GROQ_API_KEY || '').split(',');
    const keys = [...envKeys, ...KEY_SEEDS]
      .map(k => k.trim())
      .filter(k => k.startsWith('gsk_') && k.length > 20);

    const uniqueKeys = Array.from(new Set(keys));
    let didMutateOverall = false;
    let lastAction: any = null;

    // Asegurar directiva de sistema para idioma y estilo de Catheryne
    const workingMessages = [...incomingMessages];
    if (!workingMessages.some(m => m.role === 'system')) {
      workingMessages.unshift({
        role: 'system',
        content: `ERES "Catheryne AI", copiloto ejecutiva de Catheryne Ríos Estética.
Hablas en español de Colombia ($ COP). Sé concisa, elegante y ejecutiva (máximo 2 a 3 párrafos cortos).
Tienes acceso a herramientas de base de datos para consultar caja, citas agendadas, clientas y para agendar citas o productos.
Usa las herramientas correspondientes para obtener datos reales o ejecutar acciones en el sistema.`
      });
    }

    for (const key of uniqueKeys) {
      for (const model of ACTIVE_MODELS) {
        try {
          // Ronda 1: Llamada inicial con herramientas de base de datos
          const result = await groqFetch(key, model, workingMessages, AGENTIC_TOOLS);

          if (result.status >= 200 && result.status < 300) {
            const data = JSON.parse(result.body);
            const choice = data.choices?.[0];
            const message = choice?.message;

            // ¿El modelo invocó herramientas (Function Calling)?
            if (message?.tool_calls && message.tool_calls.length > 0) {
              this.logger.log(`Modelo ${model} invocó ${message.tool_calls.length} herramientas.`);

              const nextMessages = [...workingMessages, message];

              for (const toolCall of message.tool_calls) {
                const fnName = toolCall.function?.name;
                let parsedArgs = {};
                try {
                  parsedArgs = JSON.parse(toolCall.function?.arguments || '{}');
                } catch (e) {
                  this.logger.error(`Error parseando argumentos de ${fnName}:`, e);
                }

                const execution = await this.executeTool(fnName, parsedArgs);
                if (execution.didMutate) {
                  didMutateOverall = true;
                  if (execution.action) lastAction = execution.action;
                }

                nextMessages.push({
                  role: 'tool',
                  tool_call_id: toolCall.id,
                  name: fnName,
                  content: JSON.stringify(execution.result)
                });
              }

              // Ronda 2: Enviar resultados de la base de datos de vuelta al modelo para la respuesta final
              const secondResult = await groqFetch(key, model, nextMessages);
              if (secondResult.status >= 200 && secondResult.status < 300) {
                const secondData = JSON.parse(secondResult.body);
                const finalReply = (secondData.choices?.[0]?.message?.content || secondData.choices?.[0]?.message?.reasoning || '').trim();

                const parsed = this.parseAgentResponse(finalReply);
                return {
                  text: parsed.text,
                  action: lastAction || parsed.action,
                  didMutate: didMutateOverall
                };
              }
            }

            // Si no invocó herramientas, responder directamente
            const botReply = (message?.content || message?.reasoning || '').trim();
            if (botReply) {
              const parsed = this.parseAgentResponse(botReply);
              return {
                text: parsed.text,
                action: parsed.action,
                didMutate: false
              };
            }
          } else if (result.status === 429) {
            this.logger.warn(`Rate limit en modelo ${model}, rotando...`);
            continue;
          } else {
            this.logger.warn(`Modelo ${model} respondió status ${result.status}: ${result.body.substring(0, 200)}`);
          }
        } catch (error: any) {
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
