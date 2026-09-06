import { Controller, Get, Post, Patch, Body, Param, Query, Request, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AppointmentsService } from './appointments.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('api/appointments')
export class AppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  // ----------------------------------------------------
  // PUBLIC BOOKING ENDPOINT (S.H.I.E.L.D. Anti-Spam / Rate-Limited)
  // ----------------------------------------------------
  @Throttle({ short: { limit: 3, ttl: 60000 }, medium: { limit: 6, ttl: 300000 } })
  @Post('book')
  async bookAppointment(@Body() body: any) {
    return this.appointmentsService.bookAppointment(body);
  }

  // ----------------------------------------------------
  // AGENDA QUERY (Protegido para Personal Autorizado)
  // ----------------------------------------------------
  @UseGuards(JwtAuthGuard)
  @Get()
  async getAgenda(
    @Request() req,
    @Query('date') dateQuery?: string,
    @Query('role') role?: string,
    @Query('specialistId') specialistId?: string,
  ) {
    const userRole = req.user?.role || role || 'OWNER';
    const effectiveSpecialistId = req.user?.teamMemberId || specialistId;
    return this.appointmentsService.getAgendaForUser(
      { id: req.user?.id || '1', role: userRole, teamMemberId: effectiveSpecialistId },
      dateQuery
    );
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id/status')
  async updateStatus(@Param('id') id: string, @Body() body: { status: string }, @Request() req: any) {
    return this.appointmentsService.updateStatus(id, body.status, req.user);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/cancel')
  async cancelAppointment(@Param('id') id: string, @Body() body: any, @Request() req: any) {
    return this.appointmentsService.cancelAppointment(
      id,
      {
        ...body,
        canceledBy: body.canceledBy || req.user?.name || 'Administración',
      },
      req.user
    );
  }
}
