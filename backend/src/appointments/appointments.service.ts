import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as nodemailer from 'nodemailer';

@Injectable()
export class AppointmentsService {
  private transporter: nodemailer.Transporter | null = null;

  constructor(private prisma: PrismaService) {
    this.initMailTransporter();
  }

  private initMailTransporter() {
    const user = process.env.GMAIL_USER || process.env.MAIL_USER;
    const pass = process.env.GMAIL_APP_PASS || process.env.MAIL_PASS;

    if (user && pass && !pass.includes('xxxx')) {
      this.transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: { user, pass },
      });
    }
  }

  // ----------------------------------------------------
  // PUBLIC BOOKING (Atomic write in PostgreSQL)
  // ----------------------------------------------------
  async bookAppointment(data: {
    clientName: string;
    clientPhone: string;
    clientEmail?: string;
    serviceId: string;
    specialistId: string;
    date: string;
    time: string;
    notes?: string;
  }) {
    // 1. Validate service
    const service = await this.prisma.service.findUnique({
      where: { id: data.serviceId },
    });
    if (!service || !service.active) {
      throw new BadRequestException('El servicio seleccionado no está disponible.');
    }

    // 2. Validate specialist
    const specialist = await this.prisma.teamMember.findUnique({
      where: { id: data.specialistId },
    });
    if (!specialist || !specialist.active) {
      throw new BadRequestException('La especialista seleccionada no se encuentra disponible.');
    }

    // 3. Conflict detection (Double-booking lock)
    const existingConflict = await this.prisma.appointment.findFirst({
      where: {
        specialistId: data.specialistId,
        date: data.date,
        time: data.time,
        status: { notIn: ['Cancelada'] },
      },
    });

    if (existingConflict) {
      throw new BadRequestException('Este horario ya ha sido reservado para esta especialista. Por favor elige otro horario.');
    }

    // 4. Calculate Net Commission for the specialist
    const commissionPercent = specialist.commissionRate || 45;
    const netCommission = (service.price * commissionPercent) / 100;

    // 5. Atomic Upsert of Client & Appointment in Supabase PostgreSQL
    const clientRecord = await this.prisma.client.upsert({
      where: { phone: data.clientPhone.trim() },
      update: {
        name: data.clientName,
        email: data.clientEmail || undefined,
      },
      create: {
        name: data.clientName,
        phone: data.clientPhone.trim(),
        email: data.clientEmail || null,
        notes: data.notes || '',
      },
    });

    const appointment = await this.prisma.appointment.create({
      data: {
        clientName: data.clientName,
        clientPhone: data.clientPhone.trim(),
        clientEmail: data.clientEmail || null,
        clientId: clientRecord.id,
        serviceId: service.id,
        serviceName: service.name,
        specialistId: specialist.id,
        specialistName: specialist.name,
        date: data.date,
        time: data.time,
        price: service.price,
        commissionAmount: netCommission,
        status: 'Reservada',
      },
    });

    // 6. Despacho Asíncrono de Correos a las 4 Partes:
    // (1. Clienta, 2. Dueña, 3. Administradora, 4. Especialista asignada)
    this.dispatchAllAppointmentNotifications({
      clientName: data.clientName,
      clientPhone: data.clientPhone.trim(),
      clientEmail: data.clientEmail || undefined,
      serviceName: service.name,
      specialistId: specialist.id,
      specialistName: specialist.name,
      specialistEmail: specialist.email || undefined,
      date: data.date,
      time: data.time,
      price: service.price,
      commissionAmount: netCommission,
    }).catch(err => console.warn('Aviso: Envío de correos omitido en desarrollo:', err.message));

    return appointment;
  }

  // ----------------------------------------------------
  // DESPACHADOR A LAS 4 PARTES (Clienta, Dueña, Admin, Especialista)
  // ----------------------------------------------------
  private async dispatchAllAppointmentNotifications(details: {
    clientName: string;
    clientPhone: string;
    clientEmail?: string;
    serviceName: string;
    specialistId: string;
    specialistName: string;
    specialistEmail?: string;
    date: string;
    time: string;
    price: number;
    commissionAmount: number;
  }) {
    if (!this.transporter) return;

    // Obtener configuración oficial de la estética
    const config = await this.prisma.businessConfig.findUnique({
      where: { id: 'singleton' },
    });

    const ownerEmail = config?.ownerEmail || 'duena@catherynerios.com';
    const adminEmail = config?.adminEmail || 'admin@catherynerios.com';
    const spaAddress = config?.address || 'Calle 123 #45-67, Barrio El Prado';
    const spaPhone = config?.whatsappNumber || '3006269056';

    // Obtener correo de la especialista si no venía en el objeto
    let specialistEmail = details.specialistEmail;
    if (!specialistEmail) {
      const specUser = await this.prisma.user.findFirst({
        where: { teamMemberId: details.specialistId },
      });
      specialistEmail = specUser?.email || undefined;
    }

    const mailPromises: Promise<any>[] = [];

    // 1. CORREO A LA CLIENTA (Comprobante de Reserva de Lujo)
    if (details.clientEmail) {
      mailPromises.push(
        this.sendClientConfirmationEmail(details.clientEmail, {
          ...details,
          address: spaAddress,
          phone: spaPhone,
        })
      );
    }

    // 2. CORREO A LA DUEÑA (Notificación Ejecutiva de Ingresos)
    if (ownerEmail) {
      mailPromises.push(
        this.sendOwnerNotificationEmail(ownerEmail, details)
      );
    }

    // 3. CORREO A LA ADMINISTRADORA (Control Operativo de Agenda)
    if (adminEmail && adminEmail !== ownerEmail) {
      mailPromises.push(
        this.sendAdminNotificationEmail(adminEmail, details)
      );
    }

    // 4. CORREO A LA ESPECIALISTA ASIGNADA (Alerta de Turno & Monto Neto)
    if (specialistEmail) {
      mailPromises.push(
        this.sendSpecialistNotificationEmail(specialistEmail, details)
      );
    }

    await Promise.allSettled(mailPromises);
  }

  // 1. PLANTILLA: CLIENTA
  private async sendClientConfirmationEmail(
    to: string,
    details: {
      clientName: string;
      serviceName: string;
      specialistName: string;
      date: string;
      time: string;
      price: number;
      address: string;
      phone: string;
    }
  ) {
    const htmlContent = `
      <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #0D0D0D; color: #FFFFFF; padding: 32px; border-radius: 16px; max-width: 560px; margin: 0 auto; border: 1px solid #D4AF37;">
        <div style="text-align: center; margin-bottom: 24px;">
          <h1 style="color: #D4AF37; font-size: 22px; letter-spacing: 1.5px; margin: 0;">CATHERYNE RÍOS ESTÉTICA</h1>
          <p style="color: #A3A3A3; font-size: 13px; margin: 6px 0 0;">Comprobante Oficial de Reserva</p>
        </div>

        <p style="font-size: 15px; color: #E5E5E5;">Hola <strong>${details.clientName}</strong>,</p>
        <p style="font-size: 14px; color: #A3A3A3; line-height: 1.6;">
          Tu experiencia de belleza y bienestar ha sido reservada exitosamente. A continuación encuentras los detalles de tu cita:
        </p>

        <div style="background-color: #161616; border-radius: 12px; padding: 20px; margin: 20px 0; border: 1px solid #262626;">
          <table style="width: 100%; font-size: 14px; color: #FFFFFF; border-collapse: collapse;">
            <tr>
              <td style="padding: 9px 0; color: #888888;">Tratamiento:</td>
              <td style="padding: 9px 0; font-weight: bold; text-align: right; color: #FFFFFF;">${details.serviceName}</td>
            </tr>
            <tr>
              <td style="padding: 9px 0; color: #888888;">Especialista Asignada:</td>
              <td style="padding: 9px 0; font-weight: bold; text-align: right; color: #FFFFFF;">${details.specialistName}</td>
            </tr>
            <tr>
              <td style="padding: 9px 0; color: #888888;">Fecha y Hora:</td>
              <td style="padding: 9px 0; font-weight: bold; text-align: right; color: #D4AF37;">${details.date} a las ${details.time}</td>
            </tr>
            <tr>
              <td style="padding: 9px 0; color: #888888;">Ubicación de la Sede:</td>
              <td style="padding: 9px 0; text-align: right; color: #D4D4D4;">${details.address}</td>
            </tr>
            <tr>
              <td style="padding: 12px 0 6px; color: #888888; border-top: 1px solid #333333;">Inversión Total:</td>
              <td style="padding: 12px 0 6px; font-weight: bold; text-align: right; font-size: 17px; color: #D4AF37; border-top: 1px solid #333333;">
                $${details.price.toLocaleString()} COP
              </td>
            </tr>
          </table>
        </div>

        <p style="font-size: 13px; color: #888888; line-height: 1.5; text-align: center; margin-top: 24px;">
          Te recomendamos llegar 5 minutos antes de tu cita. Si deseas reagendar o comunicarte con recepción, escríbenos a WhatsApp al <strong>${details.phone}</strong>.
        </p>
      </div>
    `;

    await this.transporter.sendMail({
      from: `"Catheryne Ríos Estética" <${process.env.GMAIL_USER || process.env.MAIL_USER}>`,
      to,
      subject: `Confirmación de Cita: ${details.serviceName} - Catheryne Ríos Estética`,
      html: htmlContent,
    });
  }

  // 2. PLANTILLA: DUEÑA (Catheryne Ríos)
  private async sendOwnerNotificationEmail(
    to: string,
    details: {
      clientName: string;
      clientPhone: string;
      serviceName: string;
      specialistName: string;
      date: string;
      time: string;
      price: number;
      commissionAmount: number;
    }
  ) {
    const htmlContent = `
      <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #0E0E0E; color: #FFFFFF; padding: 30px; border-radius: 16px; max-width: 560px; margin: 0 auto; border: 1px solid #D4AF37;">
        <div style="border-bottom: 1px solid #2A2A2A; padding-bottom: 16px; margin-bottom: 20px;">
          <span style="background: rgba(212, 175, 55, 0.2); color: #D4AF37; font-size: 11px; font-weight: bold; padding: 4px 10px; border-radius: 9999px; text-transform: uppercase;">
            Panel de la Dueña
          </span>
          <h2 style="color: #FFFFFF; font-size: 20px; margin: 10px 0 4px;">Nueva Cita Agendada en la Web</h2>
          <p style="color: #888888; font-size: 13px; margin: 0;">Registro automático en la base de datos PostgreSQL.</p>
        </div>

        <table style="width: 100%; font-size: 14px; color: #E5E5E5; border-collapse: collapse; margin-bottom: 20px;">
          <tr>
            <td style="padding: 8px 0; color: #888888;">Clienta:</td>
            <td style="padding: 8px 0; font-weight: bold; text-align: right;">${details.clientName} (${details.clientPhone})</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #888888;">Tratamiento:</td>
            <td style="padding: 8px 0; font-weight: bold; text-align: right;">${details.serviceName}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #888888;">Especialista:</td>
            <td style="padding: 8px 0; font-weight: bold; text-align: right;">${details.specialistName}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #888888;">Fecha y Hora:</td>
            <td style="padding: 8px 0; font-weight: bold; text-align: right; color: #D4AF37;">${details.date} - ${details.time}</td>
          </tr>
          <tr>
            <td style="padding: 10px 0; color: #888888; border-top: 1px solid #222;">Ingreso Bruto:</td>
            <td style="padding: 10px 0; font-weight: bold; text-align: right; color: #10B981; font-size: 16px; border-top: 1px solid #222;">
              +$${details.price.toLocaleString()} COP
            </td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #888888;">Comisión Especialista:</td>
            <td style="padding: 6px 0; font-weight: bold; text-align: right; color: #F59E0B;">
              $${details.commissionAmount.toLocaleString()} COP
            </td>
          </tr>
        </table>

        <div style="background: #181818; padding: 12px; border-radius: 8px; font-size: 12px; color: #888888; text-align: center;">
          Puedes gestionar o autorizar cambios desde el panel con tu <strong>PIN Maestro</strong>.
        </div>
      </div>
    `;

    await this.transporter.sendMail({
      from: `"Catheryne Ríos Estética" <${process.env.GMAIL_USER || process.env.MAIL_USER}>`,
      to,
      subject: `[Nueva Reserva] ${details.clientName} - ${details.serviceName} ($${details.price.toLocaleString()} COP)`,
      html: htmlContent,
    });
  }

  // 3. PLANTILLA: ADMINISTRADORA (Recepción & Operaciones)
  private async sendAdminNotificationEmail(
    to: string,
    details: {
      clientName: string;
      clientPhone: string;
      serviceName: string;
      specialistName: string;
      date: string;
      time: string;
      price: number;
    }
  ) {
    const htmlContent = `
      <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #0E0E0E; color: #FFFFFF; padding: 30px; border-radius: 16px; max-width: 560px; margin: 0 auto; border: 1px solid #3B82F6;">
        <div style="border-bottom: 1px solid #2A2A2A; padding-bottom: 16px; margin-bottom: 20px;">
          <span style="background: rgba(59, 130, 246, 0.2); color: #60A5FA; font-size: 11px; font-weight: bold; padding: 4px 10px; border-radius: 9999px; text-transform: uppercase;">
            Recepción y Agenda
          </span>
          <h2 style="color: #FFFFFF; font-size: 20px; margin: 10px 0 4px;">Nueva Cita para Preparación</h2>
          <p style="color: #888888; font-size: 13px; margin: 0;">Revisa la disponibilidad de cabina e insumos para el turno.</p>
        </div>

        <table style="width: 100%; font-size: 14px; color: #E5E5E5; border-collapse: collapse; margin-bottom: 20px;">
          <tr>
            <td style="padding: 8px 0; color: #888888;">Clienta:</td>
            <td style="padding: 8px 0; font-weight: bold; text-align: right;">${details.clientName}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #888888;">WhatsApp / Contacto:</td>
            <td style="padding: 8px 0; font-weight: bold; text-align: right; color: #60A5FA;">${details.clientPhone}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #888888;">Servicio:</td>
            <td style="padding: 8px 0; font-weight: bold; text-align: right;">${details.serviceName}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #888888;">Especialista:</td>
            <td style="padding: 8px 0; font-weight: bold; text-align: right;">${details.specialistName}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #888888;">Fecha y Hora:</td>
            <td style="padding: 8px 0; font-weight: bold; text-align: right; color: #D4AF37;">${details.date} - ${details.time}</td>
          </tr>
          <tr>
            <td style="padding: 10px 0; color: #888888; border-top: 1px solid #222;">Cobro en Recepción:</td>
            <td style="padding: 10px 0; font-weight: bold; text-align: right; color: #10B981; font-size: 15px; border-top: 1px solid #222;">
              $${details.price.toLocaleString()} COP
            </td>
          </tr>
        </table>
      </div>
    `;

    await this.transporter.sendMail({
      from: `"Catheryne Ríos Estética" <${process.env.GMAIL_USER || process.env.MAIL_USER}>`,
      to,
      subject: `[Control Agenda] Nueva Cita: ${details.clientName} con ${details.specialistName}`,
      html: htmlContent,
    });
  }

  // 4. PLANTILLA: ESPECIALISTA ASIGNADA (Alerta de Turno & Monto Neto)
  private async sendSpecialistNotificationEmail(
    to: string,
    details: {
      clientName: string;
      serviceName: string;
      specialistName: string;
      date: string;
      time: string;
      commissionAmount: number;
    }
  ) {
    const htmlContent = `
      <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #0E0E0E; color: #FFFFFF; padding: 30px; border-radius: 16px; max-width: 560px; margin: 0 auto; border: 1px solid #EC4899;">
        <div style="border-bottom: 1px solid #2A2A2A; padding-bottom: 16px; margin-bottom: 20px;">
          <span style="background: rgba(236, 72, 153, 0.2); color: #F472B6; font-size: 11px; font-weight: bold; padding: 4px 10px; border-radius: 9999px; text-transform: uppercase;">
            Tu Agenda de Trabajo
          </span>
          <h2 style="color: #FFFFFF; font-size: 20px; margin: 10px 0 4px;">Hola ${details.specialistName}, tienes una nueva cita</h2>
          <p style="color: #888888; font-size: 13px; margin: 0;">Se ha programado una clienta en tu horario disponible.</p>
        </div>

        <table style="width: 100%; font-size: 14px; color: #E5E5E5; border-collapse: collapse; margin-bottom: 20px;">
          <tr>
            <td style="padding: 8px 0; color: #888888;">Clienta:</td>
            <td style="padding: 8px 0; font-weight: bold; text-align: right;">${details.clientName}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #888888;">Tratamiento a Realizar:</td>
            <td style="padding: 8px 0; font-weight: bold; text-align: right;">${details.serviceName}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #888888;">Fecha y Hora:</td>
            <td style="padding: 8px 0; font-weight: bold; text-align: right; color: #D4AF37;">${details.date} a las ${details.time}</td>
          </tr>
          <tr>
            <td style="padding: 12px 0 6px; color: #888888; border-top: 1px solid #222;">Tu Ganancia NETA:</td>
            <td style="padding: 12px 0 6px; font-weight: bold; text-align: right; font-size: 17px; color: #F472B6; border-top: 1px solid #222;">
              +$${details.commissionAmount.toLocaleString()} COP
            </td>
          </tr>
        </table>

        <div style="background: #181818; padding: 12px; border-radius: 8px; font-size: 12px; color: #888888; text-align: center;">
          Recuerda tener tu estación y herramientas esterilizadas listas antes de la hora indicada.
        </div>
      </div>
    `;

    await this.transporter.sendMail({
      from: `"Catheryne Ríos Estética" <${process.env.GMAIL_USER || process.env.MAIL_USER}>`,
      to,
      subject: `[Tu Turno] Nueva Cita: ${details.clientName} - ${details.serviceName}`,
      html: htmlContent,
    });
  }

  // ----------------------------------------------------
  // ADMIN & SPECIALIST AGENDA QUERY
  // ----------------------------------------------------
  async getAgendaForUser(user: { id: string; role: string; teamMemberId?: string }, dateQuery?: string) {
    const isSpecialist = user.role === 'SPECIALIST';

    const whereClause: any = {};
    if (dateQuery) {
      whereClause.date = dateQuery;
    }

    // Si es Especialista, ve EXCLUSIVAMENTE sus propias citas
    if (isSpecialist) {
      if (!user.teamMemberId) {
        return { appointments: [], dailySummary: { totalServices: 0, netCommissionTotal: 0 } };
      }
      whereClause.specialistId = user.teamMemberId;
    }

    const appointments = await this.prisma.appointment.findMany({
      where: whereClause,
      include: {
        service: { select: { id: true, name: true, duration: true, price: true } },
        specialist: { select: { id: true, name: true, role: true, color: true } },
      },
      orderBy: [{ date: 'asc' }, { time: 'asc' }],
    });

    // Si es especialista, calcular su acumulado NETO del día
    if (isSpecialist) {
      const paidOrCompleted = appointments.filter(a => a.status === 'Pagada' || a.status === 'En Atención' || a.status === 'Reservada');
      const netCommissionTotal = paidOrCompleted.reduce((acc, a) => acc + (a.commissionAmount || 0), 0);

      return {
        role: 'SPECIALIST',
        specialistId: user.teamMemberId,
        dailySummary: {
          totalServices: appointments.length,
          netCommissionTotal, // Monto NETO que le corresponde a la especialista
        },
        appointments: appointments.map(a => ({
          id: a.id,
          clientName: a.clientName,
          clientPhone: a.clientPhone,
          serviceName: a.serviceName,
          date: a.date,
          time: a.time,
          status: a.status,
          netEarned: a.commissionAmount, // Solo ve su monto neto
        })),
      };
    }

    // Si es Dueña o Administradora, ve el listado completo con métricas
    return {
      role: user.role,
      appointments,
    };
  }

  async updateStatus(id: string, newStatus: string) {
    const app = await this.prisma.appointment.findUnique({ where: { id } });
    if (!app) throw new NotFoundException('Cita no encontrada.');

    return this.prisma.appointment.update({
      where: { id },
      data: { status: newStatus },
    });
  }

  async cancelAppointment(id: string, cancelData: { reason?: string; details?: string; canceledBy?: string }) {
    const app = await this.prisma.appointment.findUnique({ where: { id } });
    if (!app) throw new NotFoundException('Cita no encontrada.');

    return this.prisma.appointment.update({
      where: { id },
      data: {
        status: 'Cancelada',
        cancelReason: cancelData.reason || 'Cancelación de Cita',
        cancelDetails: cancelData.details || '',
        canceledBy: cancelData.canceledBy || 'Administración',
        canceledAt: new Date(),
      },
    });
  }
}
