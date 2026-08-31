import { Controller, Get, Post, Patch, Body, Param, Query, Request } from '@nestjs/common';
import { AppointmentsService } from './appointments.service';

@Controller('api/appointments')
export class AppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  // ----------------------------------------------------
  // PUBLIC BOOKING ENDPOINT (Agendamiento Atómico)
  // ----------------------------------------------------
  @Post('book')
  async bookAppointment(@Body() body: any) {
    return this.appointmentsService.bookAppointment(body);
  }

  // ----------------------------------------------------
  // AGENDA QUERY
  // ----------------------------------------------------
  @Get()
  async getAgenda(@Query('date') dateQuery?: string, @Query('role') role?: string, @Query('specialistId') specialistId?: string) {
    const userRole = role || 'OWNER';
    return this.appointmentsService.getAgendaForUser(
      { id: '1', role: userRole, teamMemberId: specialistId },
      dateQuery
    );
  }

  @Patch(':id/status')
  async updateStatus(@Param('id') id: string, @Body() body: { status: string }) {
    return this.appointmentsService.updateStatus(id, body.status);
  }

  @Post(':id/cancel')
  async cancelAppointment(@Param('id') id: string, @Body() body: any, @Request() req) {
    return this.appointmentsService.cancelAppointment(id, {
      ...body,
      canceledBy: body.canceledBy || req.user?.name || 'Administración',
    });
  }
}
