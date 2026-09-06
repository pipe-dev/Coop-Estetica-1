import { Controller, Get, Post, Body, Param, Request, UseGuards, ForbiddenException } from '@nestjs/common';
import { CashService } from './cash.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('api/cash')
export class CashController {
  constructor(private readonly cashService: CashService) {}

  private ensureNotSpecialist(req: any) {
    if (req.user?.role === 'SPECIALIST') {
      throw new ForbiddenException('Acceso denegado: Las especialistas no tienen autorización para el módulo de caja financiera.');
    }
  }

  @Get('active')
  async getActiveSession(@Request() req: any) {
    this.ensureNotSpecialist(req);
    return this.cashService.getActiveSession();
  }

  @Get('sessions')
  async getAllSessions(@Request() req: any) {
    this.ensureNotSpecialist(req);
    return this.cashService.getAllSessions();
  }

  @Post('open')
  async openSession(@Body() body: any, @Request() req: any) {
    this.ensureNotSpecialist(req);
    return this.cashService.openSession({
      ...body,
      responsibleId: body.responsibleId || req.user?.id || '1',
      responsibleName: body.responsibleName || req.user?.name || 'Catheryne Ríos',
    });
  }

  @Post('close')
  async closeSession(@Body() body: any, @Request() req: any) {
    this.ensureNotSpecialist(req);
    return this.cashService.closeSession(body);
  }

  @Post('reconcile/:id')
  async reconcileSession(@Param('id') id: string, @Body() body: any, @Request() req: any) {
    if (req.user?.role !== 'OWNER') {
      throw new ForbiddenException('Acceso denegado: Solo la Propietaria (CEO) tiene autorización para reconciliar arqueos de caja.');
    }
    return this.cashService.reconcileSession(id, {
      ...body,
      resolvedBy: body.resolvedBy || req.user?.name || 'Catheryne Ríos (Propietaria)',
    });
  }

  @Get('transactions')
  async getTransactions(@Request() req: any) {
    this.ensureNotSpecialist(req);
    return this.cashService.getTransactions();
  }

  @Post('transactions')
  async createTransaction(@Body() body: any, @Request() req: any) {
    this.ensureNotSpecialist(req);
    return this.cashService.createTransaction(body);
  }
}
