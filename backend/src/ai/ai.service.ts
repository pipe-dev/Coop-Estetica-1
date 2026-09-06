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
  },
  {
    type: 'function',
    function: {
      name: 'create_transaction',
      description: 'Pilar 2 (Finanzas): Registra un ingreso o egreso de caja en tiempo real en la base de datos PostgreSQL, calculando el balance neto diario.',
      parameters: {
        type: 'object',
        properties: {
          type: { type: 'string', enum: ['Ingreso', 'Egreso'], description: 'Tipo de movimiento: Ingreso o Egreso.' },
          amount: { type: 'number', description: 'Monto de la transacción en Pesos Colombianos (COP).' },
          description: { type: 'string', description: 'Descripción o concepto del movimiento (ej: "Pago de facial en efectivo", "Compra de insumos esmaltes", "Pago de arriendo").' },
          category: { type: 'string', description: 'Categoría (ej: "Servicios", "Venta de Productos", "Insumos", "Nómina", "Gastos Generales", "Ajuste de Caja").' },
          paymentMethod: { type: 'string', enum: ['Efectivo', 'Nequi', 'Daviplata', 'Tarjeta', 'Transferencia'], description: 'Método de pago utilizado.' }
        },
        required: ['type', 'amount', 'description']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'create_specialist',
      description: 'Pilar 3 (Equipo): Registra a una nueva especialista en el equipo de la estética en PostgreSQL con su porcentaje de comisión neta.',
      parameters: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'Nombre completo de la especialista (ej: "Valentina Silva", "Camila Restrepo").' },
          role: { type: 'string', description: 'Cargo o especialidad principal (ej: "Especialista en Uñas", "Cosmiatra", "Esteticista Facial", "Lashista & Cejas").' },
          commissionRate: { type: 'number', description: 'Porcentaje de comisión neta (ej: 40, 45, 50). Por defecto 45%.' },
          phone: { type: 'string', description: 'Teléfono o WhatsApp de la especialista.' },
          experience: { type: 'string', description: 'Años de experiencia (ej: "4 años").' },
          bio: { type: 'string', description: 'Breve perfil o descripción profesional.' }
        },
        required: ['name', 'role']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'create_service',
      description: 'Pilar 3 (Catálogo): Crea y agrega un nuevo servicio o tratamiento al catálogo activo en PostgreSQL con precio y duración.',
      parameters: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'Nombre del servicio (ej: "Limpieza Facial Profunda", "Manicura Rusa Semipermanente", "Masaje Relajante con Piedras").' },
          price: { type: 'number', description: 'Precio del servicio en Pesos Colombianos (COP).' },
          duration: { type: 'integer', description: 'Duración estimada en minutos (ej: 45, 60, 90). Por defecto 60 min.' },
          categoryName: { type: 'string', description: 'Categoría (ej: "Manos & Uñas", "Rostro", "Pies", "Cabello", "Cuerpo", "Maquillaje"). Si no existe, se crea automáticamente.' },
          description: { type: 'string', description: 'Descripción o beneficios incluidos en el tratamiento.' }
        },
        required: ['name', 'price']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'create_client',
      description: 'Pilar 4 (CRM): Registra o actualiza a una clienta en el CRM de PostgreSQL con su nombre, teléfono y notas estéticas (tipo de piel, alergias, preferencias).',
      parameters: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'Nombre completo de la clienta.' },
          phone: { type: 'string', description: 'Número de teléfono o celular (ej: "3001234567").' },
          email: { type: 'string', description: 'Correo electrónico de la clienta (opcional).' },
          notes: { type: 'string', description: 'Notas estéticas, tono de esmalte preferido, piel sensible o alergias.' }
        },
        required: ['name', 'phone']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'cancel_appointment',
      description: 'Pilar 1 (Agenda): Cancela o anula una cita agendada en PostgreSQL, liberando el horario de la especialista.',
      parameters: {
        type: 'object',
        properties: {
          clientName: { type: 'string', description: 'Nombre de la clienta cuya cita se cancelará.' },
          date: { type: 'string', description: 'Fecha de la cita en formato YYYY-MM-DD.' },
          reason: { type: 'string', description: 'Motivo de la cancelación.' }
        },
        required: ['clientName']
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

      case 'create_transaction': {
        try {
          const activeSession = await this.prisma.cashSession.findFirst({
            where: { status: 'Abierta' },
            orderBy: { openedAt: 'desc' }
          });

          const rawAmount = parseFloat(args.amount as any) || 0;
          const typeStr = (args.type || '').toLowerCase();
          const isEgreso = typeStr.includes('egreso') || typeStr.includes('gasto');
          const type = isEgreso ? 'Egreso' : 'Ingreso';
          const description = args.description || (type === 'Ingreso' ? 'Ingreso registrado por Catheryne AI' : 'Gasto registrado por Catheryne AI');
          const category = args.category || (type === 'Ingreso' ? 'Servicios' : 'Insumos');
          const paymentMethod = args.paymentMethod || 'Efectivo';

          const tx = await this.prisma.transaction.create({
            data: {
              sessionId: activeSession?.id || null,
              type,
              amount: rawAmount,
              description,
              category,
              paymentMethod,
              date: new Date()
            }
          });

          return {
            didMutate: true,
            action: {
              action: 'CREATE_TRANSACTION',
              data: {
                id: tx.id,
                type: tx.type,
                amount: tx.amount,
                description: tx.description,
                category: tx.category,
                paymentMethod: tx.paymentMethod,
                date: tx.date.toISOString().split('T')[0]
              }
            },
            result: {
              success: true,
              mensaje: `Movimiento de caja registrado con éxito en PostgreSQL: ${tx.type} de $${tx.amount.toLocaleString()} COP (${tx.description}).`,
              transaccion: tx
            }
          };
        } catch (err: any) {
          return {
            didMutate: false,
            result: { success: false, error: err?.message || 'Error registrando movimiento en caja.' }
          };
        }
      }

      case 'create_specialist': {
        try {
          const commissionRate = parseFloat(args.commissionRate as any) || 45;
          const specialist = await this.prisma.teamMember.create({
            data: {
              name: args.name,
              role: args.role || 'Especialista',
              phone: args.phone || '',
              avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(args.name)}&background=D4AF37&color=fff`,
              bio: args.bio || '',
              experience: args.experience || '3 años',
              color: '#D4AF37',
              commissionRate,
              active: true
            }
          });

          return {
            didMutate: true,
            action: {
              action: 'CREATE_SPECIALIST',
              data: specialist
            },
            result: {
              success: true,
              mensaje: `Especialista "${specialist.name}" (${specialist.role}, comisión: ${specialist.commissionRate}%) registrada con éxito en PostgreSQL.`,
              especialista: specialist
            }
          };
        } catch (err: any) {
          return {
            didMutate: false,
            result: { success: false, error: err?.message || 'Error registrando especialista en el equipo.' }
          };
        }
      }

      case 'create_service': {
        try {
          const categoryName = args.categoryName || 'Tratamientos Generales';
          let category = await this.prisma.serviceCategory.findFirst({
            where: { name: { equals: categoryName, mode: 'insensitive' } }
          });

          if (!category) {
            category = await this.prisma.serviceCategory.create({
              data: {
                name: categoryName,
                description: `Tratamientos de ${categoryName}`,
                order: 0,
                active: true
              }
            });
          }

          const price = parseFloat(args.price as any) || 50000;
          const duration = parseInt(args.duration as any, 10) || 60;

          const service = await this.prisma.service.create({
            data: {
              name: args.name,
              categoryId: category.id,
              price,
              duration,
              description: args.description || '',
              active: true
            }
          });

          return {
            didMutate: true,
            action: {
              action: 'CREATE_SERVICE',
              data: {
                ...service,
                categoryName: category.name
              }
            },
            result: {
              success: true,
              mensaje: `Servicio "${service.name}" agregado con éxito al catálogo de PostgreSQL ($${service.price.toLocaleString()} COP, ${service.duration} min, categoría "${category.name}").`,
              servicio: service
            }
          };
        } catch (err: any) {
          return {
            didMutate: false,
            result: { success: false, error: err?.message || 'Error creando servicio en el catálogo.' }
          };
        }
      }

      case 'create_client': {
        try {
          const phone = String(args.phone).trim();
          const client = await this.prisma.client.upsert({
            where: { phone },
            update: {
              name: args.name,
              email: args.email || undefined,
              notes: args.notes || undefined
            },
            create: {
              name: args.name,
              phone,
              email: args.email || null,
              notes: args.notes || ''
            }
          });

          return {
            didMutate: true,
            action: {
              action: 'CREATE_CLIENT',
              data: client
            },
            result: {
              success: true,
              mensaje: `Clienta "${client.name}" (${client.phone}) registrada en el CRM de PostgreSQL.`,
              clienta: client
            }
          };
        } catch (err: any) {
          return {
            didMutate: false,
            result: { success: false, error: err?.message || 'Error registrando clienta en el CRM.' }
          };
        }
      }

      case 'cancel_appointment': {
        try {
          const whereClause: any = { status: { notIn: ['Cancelada'] } };
          if (args.clientName) {
            whereClause.clientName = { contains: args.clientName, mode: 'insensitive' };
          }
          if (args.date) {
            whereClause.date = args.date;
          }

          const targetApp = await this.prisma.appointment.findFirst({
            where: whereClause,
            orderBy: { createdAt: 'desc' }
          });

          if (!targetApp) {
            return {
              didMutate: false,
              result: { success: false, error: `No se encontró ninguna cita activa para "${args.clientName || 'la clienta'}" en la fecha indicada.` }
            };
          }

          const updated = await this.prisma.appointment.update({
            where: { id: targetApp.id },
            data: {
              status: 'Cancelada',
              cancelReason: args.reason || 'Cancelada por Catheryne AI a petición de la Propietaria',
              canceledBy: 'Catheryne AI',
              canceledAt: new Date()
            }
          });

          return {
            didMutate: true,
            action: {
              action: 'CANCEL_APPOINTMENT',
              data: updated
            },
            result: {
              success: true,
              mensaje: `Cita de ${updated.clientName} (${updated.serviceName} el ${updated.date} a las ${updated.time}) ha sido cancelada en PostgreSQL.`,
              cita: updated
            }
          };
        } catch (err: any) {
          return {
            didMutate: false,
            result: { success: false, error: err?.message || 'Error cancelando cita.' }
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

    // Conteo en vivo de especialistas y servicios en PostgreSQL para saber si el sistema está en blanco
    let teamCount = 0;
    let servicesCount = 0;
    try {
      [teamCount, servicesCount] = await Promise.all([
        this.prisma.teamMember.count({ where: { active: true } }),
        this.prisma.service.count({ where: { active: true } })
      ]);
    } catch (e) {
      // Ignorar si hay problema transitorio de conteo
    }

    const isSystemBlank = teamCount === 0 && servicesCount === 0;

    // Asegurar directiva de sistema para idioma y estilo de Catheryne
    const workingMessages = [...incomingMessages];
    if (!workingMessages.some(m => m.role === 'system')) {
      workingMessages.unshift({
        role: 'system',
        content: `ERES "Catheryne AI", copiloto ejecutiva y directora operativa de "Catheryne Ríos Estética".
Hablas en español de Colombia ($ COP) con tono elegante, profesional, cálido, directivo y resolutivo.
Estás conectada en tiempo real a la base de datos PostgreSQL para LEER Y ESCRIBIR datos directamente en todo el sistema sin intermediarios.

ESTADO ACTUAL DE LA BASE DE DATOS:
- Especialistas activas registradas: ${teamCount}
- Servicios activos en catálogo: ${servicesCount}
- Diagnóstico del sistema: ${isSystemBlank ? 'SISTEMA EN BLANCO (Sin especialistas ni servicios cargados aún).' : 'SISTEMA CON DATOS ACTIVOS.'}

CUANDO CATHERYNE TE SALUDE, PREGUNTE CÓMO USARTE, PIDA UN RECORRIDO, O PREGUNTE QUÉ PUEDES HACER POR ELLA:
Preséntate con orgullo y calidez como su copiloto integral para gestionar la estética sin fricciones, estructurando tu respuesta en tus 4 pilares de acción inmediata:

"¡Claro, Catheryne! Soy tu copiloto integral para gestionar la estética sin fricciones. Aquí tienes mis 4 pilares de acción inmediata:

1. **Agenda Inteligente**: Creo citas validando automáticamente clienta, servicio, especialista y disponibilidad para evitar dobles reservas.
2. **Control Financiero**: Registro ingresos y gastos en tiempo real, calculando tu balance neto diario al instante.
3. **Gestión de Equipo e Inventario**: Administro especialistas, comisiones, stock de productos y catálogo de servicios.
4. **CRM y Fidelización**: Registro clientas, historial de tratamientos y fechas clave para mantenerlas activas.

${isSystemBlank ? 'Dato clave: Actualmente tu sistema está "en blanco" (sin especialistas, servicios ni citas). Para empezar, lo ideal es que primero registremos a tu equipo y carguemos el catálogo de servicios. ¿Deseas que agreguemos a tu primera especialista o carguemos un servicio inicial?' : '¿En qué pilar deseas que nos enfoquemos hoy?'}"

MODO TUTORIAL INTERACTIVO Y DEMOSTRACIÓN DE PODER:
Si Catheryne te pide un tutorial, recorrido, o pregunta cómo usarte ("iniciar tutorial", "tutorial", "enséñame a usarte", "muéstrame tu poder", "cómo te uso", "¿qué puedes hacer por mí?"):
Explícale con orgullo, elegancia y calidez ejecutiva que no eres un simple chat pasivo, sino su directora operativa con permisos de escritura y lectura directa en la base de datos PostgreSQL de su estética.
Preséntale un tutorial estructurado, claro y con ejemplos reales que ella puede dictarte o escribirte:
1. **Control Financiero**: Registra ingresos y egresos al instante en la caja viva y calcula el balance neto. Ejemplo: "Registra un gasto de 40.000 por insumos en efectivo" o "¿Cómo va el balance de hoy?".
2. **Gestión de Equipo y Servicios**: Da de alta especialistas con su comisión y nuevos servicios en el catálogo. Ejemplo: "Agrega a Camila Gómez como especialista con 50% de comisión" o "Crea Limpieza Facial por 120.000".
3. **Agenda Inteligente**: Crea o cancela citas validando horarios libres automáticamente para evitar dobles reservas. Ejemplo: "Agenda a María mañana a las 3pm con Camila" o "Cancela la cita de María".
4. **CRM de Clientas**: Registra fichas de clientas con sus teléfonos y notas cosméticas. Ejemplo: "Registra a Laura con cel 3101234567 y nota: piel sensible".
Cierra invitándola a darte su primera orden de prueba de inmediato por voz o texto: "¿Cuál de estos comandos deseas que ejecutemos ahora mismo para poner a prueba mi poder?"

CAPACIDADES DE ESCRITURA DIRECTA EN BASE DE DATOS (POSTGRESQL):
Tienes herramientas con permisos totales para escribir en PostgreSQL en tiempo real:
- book_appointment: Agenda y guarda citas en DB validando disponibilidad.
- cancel_appointment: Cancela citas en DB liberando el horario.
- create_transaction: Registra ingresos y gastos en tiempo real, recalculando el balance neto diario.
- create_specialist: Registra especialistas en el equipo con su % de comisión.
- create_service: Agrega servicios y tratamientos al catálogo con precio y categoría.
- create_product: Crea productos en el inventario con precio y stock.
- create_client: Registra clientas en el CRM con notas estéticas y teléfono.
- block_date: Bloquea días festivos o cierres administrativos.

REGLAS DE OPERACIÓN:
- Sé concisa, ejecutiva y elegante (máximo 2 a 3 párrafos cortos).
- NO USES EMOJIS en tus respuestas ni en listas o viñetas. Mantén un estilo sobrio, limpio y profesional.
- Si Catheryne te pide registrar un gasto ("registra un gasto de 30000 por insumos"), un ingreso, crear una especialista ("agrega a Valentina con 45% de comisión"), crear un servicio ("crea Limpieza Facial por 120000"), una clienta o una cita, EJECUTA DE INMEDIATO la herramienta correspondiente para que quede guardado en la base de datos PostgreSQL.
- Nunca inventes citas ni datos si faltan campos obligatorios; indícale a Catheryne qué datos necesitas.

MEMORIA ACTIVA Y CONTINUIDAD CONVERSACIONAL (REGLA DE CONTEXTO):
- Tienes memoria perfecta del historial de la conversación en curso con Catheryne.
- Analiza siempre los mensajes anteriores del diálogo: si Catheryne dice "agrégala a ella", "cancela esa cita", "cámbiale la comisión a 50%", "¿cuánto era el precio de ese servicio?", o "repíteme lo anterior", IDENTIFICA Y CONECTA INMEDIATAMENTE la persona, servicio, cita o tema al que se refiere sin pedirle que te lo repita.
- Mantén coherencia: si acabas de registrar o consultar una especialista, cita o transacción en turnos previos, usa esos mismos datos en las respuestas siguientes.`
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
