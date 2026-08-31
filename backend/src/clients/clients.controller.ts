import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Res } from '@nestjs/common';
import { Response } from 'express';
import { ClientsService } from './clients.service';

@Controller('api')
export class ClientsController {
  constructor(private readonly clientsService: ClientsService) {}

  @Get('clients')
  async getAllClients(@Res({ passthrough: true }) res: Response) {
    res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300');
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
  async deleteClient(@Param('id') id: string) {
    return this.clientsService.deleteClient(id);
  }
}
