import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Request, ForbiddenException } from '@nestjs/common';
import { ClientsService } from './clients.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('api')
export class ClientsController {
  constructor(private readonly clientsService: ClientsService) {}

  @Get('clients')
  async getAllClients() {
    return this.clientsService.getAllClients();
  }

  @Get('clients/:id')
  async getClientById(@Param('id') id: string) {
    return this.clientsService.getClientById(id);
  }

  @Post('clients')
  async createClient(@Body() body: any) {
    return this.clientsService.createClient(body);
  }

  @Put('clients/:id')
  async updateClient(@Param('id') id: string, @Body() body: any) {
    return this.clientsService.updateClient(id, body);
  }

  @Delete('clients/:id')
  async deleteClient(@Param('id') id: string, @Request() req: any) {
    if (req.user?.role === 'SPECIALIST') {
      throw new ForbiddenException('Acceso denegado: Las especialistas no tienen autorización para eliminar fichas de clientas.');
    }
    return this.clientsService.deleteClient(id);
  }
}
