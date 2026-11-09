import { Controller, Get, Post, Body, Param, Query, Request, UseGuards, ForbiddenException } from '@nestjs/common';
import { CashService } from './cash.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('api/cash')
export class CashController {
  constructor(private readonly cashService: CashService) {}

  private ensureFinancialAccess(req: any) {
    if (req.user?.role === 'SPECIALIST' || req.user?.role === 'ADMIN_PRODUCTOS') {
      throw new ForbiddenException('Acceso denegado: No tienes autorización para el módulo de caja financiera.');
    }
  }

  @Get('active')
  async getActiveSession(@Request() req: any) {
    this.ensureFinancialAccess(req);
    return this.cashService.getActiveSession();
  }

  @Get('sessions')
  async getAllSessions(@Request() req: any) {
    this.ensureFinancialAccess(req);
    return this.cashService.getAllSessions();
  }

  @Post('open')
  async openSession(@Body() body: any, @Request() req: any) {
    this.ensureFinancialAccess(req);
    return this.cashService.openSession({
      ...body,
      responsibleId: body.responsibleId || req.user?.id || '1',
      responsibleName: body.responsibleName || req.user?.name || 'Catheryne Ríos',
    });
  }

  @Post('close')
  async closeSession(@Body() body: any, @Request() req: any) {
    this.ensureFinancialAccess(req);
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
    this.ensureFinancialAccess(req);
    return this.cashService.getTransactions();
  }

  @Post('transactions')
  async createTransaction(@Body() body: any, @Request() req: any) {
    this.ensureFinancialAccess(req);
    return this.cashService.createTransaction(body);
  }

  // ----------------------------------------------------
  // SUITE FINANCIERA (EXCEL A WEB) ENDPOINTS
  // ----------------------------------------------------
  @Get('daily-matrix')
  async getDailyMatrix(@Query('date') date: string, @Request() req: any) {
    this.ensureFinancialAccess(req);
    return this.cashService.getDailyMatrix(date);
  }

  @Get('monthly-ledger')
  async getMonthlyLedger(
    @Query('year') year: string,
    @Query('month') month: string,
    @Request() req: any
  ) {
    this.ensureFinancialAccess(req);
    return this.cashService.getMonthlyLedger(
      year ? parseInt(year, 10) : undefined,
      month ? parseInt(month, 10) : undefined
    );
  }

  @Get('category-flow')
  async getCategoryFlow(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Request() req: any
  ) {
    this.ensureFinancialAccess(req);
    return this.cashService.getCategoryFlow(startDate, endDate);
  }

  @Post('expenses')
  async createExpense(@Body() body: any, @Request() req: any) {
    this.ensureFinancialAccess(req);
    return this.cashService.createExpense(body);
  }

  @Post('advances')
  async createAdvance(@Body() body: any, @Request() req: any) {
    this.ensureFinancialAccess(req);
    return this.cashService.createAdvance(body);
  }
}
