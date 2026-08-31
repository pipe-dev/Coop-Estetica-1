import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Res } from '@nestjs/common';
import { Response } from 'express';
import { ConfigNegocioService } from './config-negocio.service';

@Controller('api')
export class ConfigNegocioController {
  constructor(private readonly configService: ConfigNegocioService) {}

  // ----------------------------------------------------
  // CONFIGURACIÓN GENERAL
  // ----------------------------------------------------
  @Get('config')
  async getPublicConfig(@Res({ passthrough: true }) res: Response) {
    res.setHeader('Cache-Control', 'public, s-maxage=86400, stale-while-revalidate=604800');
    return this.configService.getPublicConfig();
  }

  @Put('config')
  async updateConfig(@Body() body: any) {
    return this.configService.updateConfig(body);
  }

  @Put('admin/config')
  async updateAdminConfig(@Body() body: any) {
    return this.configService.updateConfig(body);
  }

  // ----------------------------------------------------
  // PLANES DE MEMBRESÍA VIP
  // ----------------------------------------------------
  @Get('memberships')
  async getMemberships(@Res({ passthrough: true }) res: Response) {
    res.setHeader('Cache-Control', 'public, s-maxage=86400, stale-while-revalidate=604800');
    return this.configService.getAllMemberships(false);
  }

  @Post('admin/memberships')
  async createMembership(@Body() body: any) {
    return this.configService.createMembership(body);
  }

  @Put('admin/memberships/:id')
  async updateMembership(@Param('id') id: string, @Body() body: any) {
    return this.configService.updateMembership(id, body);
  }

  @Delete('admin/memberships/:id')
  async deleteMembership(@Param('id') id: string) {
    return this.configService.deleteMembership(id);
  }

  // ----------------------------------------------------
  // DÍAS DE CIERRE, FESTIVOS & VACACIONES
  // ----------------------------------------------------
  @Get('closed-dates')
  async getClosedDates(@Res({ passthrough: true }) res: Response) {
    res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
    return this.configService.getAllClosedDates();
  }

  @Post('admin/closed-dates')
  async createClosedDate(@Body() body: any) {
    return this.configService.createClosedDate(body);
  }

  @Delete('admin/closed-dates/:id')
  async deleteClosedDate(@Param('id') id: string) {
    return this.configService.deleteClosedDate(id);
  }
}
