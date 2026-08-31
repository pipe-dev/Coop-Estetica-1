import { Controller, Get, Post, Body, Param, Request } from '@nestjs/common';
import { CashService } from './cash.service';

@Controller('api/cash')
export class CashController {
  constructor(private readonly cashService: CashService) {}

  @Get('active')
  async getActiveSession() {
    return this.cashService.getActiveSession();
  }

  @Get('sessions')
  async getAllSessions() {
    return this.cashService.getAllSessions();
  }

  @Post('open')
  async openSession(@Body() body: any, @Request() req) {
    return this.cashService.openSession({
      ...body,
      responsibleId: body.responsibleId || req.user?.id || '1',
      responsibleName: body.responsibleName || req.user?.name || 'Catheryne Ríos',
    });
  }

  @Post('close')
  async closeSession(@Body() body: any) {
    return this.cashService.closeSession(body);
  }

  @Post('reconcile/:id')
  async reconcileSession(@Param('id') id: string, @Body() body: any, @Request() req) {
    return this.cashService.reconcileSession(id, {
      ...body,
      resolvedBy: body.resolvedBy || req.user?.name || 'Catheryne Ríos (Dueña)',
    });
  }

  @Get('transactions')
  async getTransactions() {
    return this.cashService.getTransactions();
  }

  @Post('transactions')
  async createTransaction(@Body() body: any) {
    return this.cashService.createTransaction(body);
  }
}
