import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Res, Request, ForbiddenException } from '@nestjs/common';
import { Response } from 'express';
import { ConfigNegocioService } from './config-negocio.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('api')
export class ConfigNegocioController {
  constructor(private readonly configService: ConfigNegocioService) {}

  // ----------------------------------------------------
  // CONFIGURACIÓN GENERAL (Pública - Zero Leakage)
  // ----------------------------------------------------
  @Get('config')
  async getPublicConfig(@Res({ passthrough: true }) res: Response) {
    res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
    return this.configService.getPublicConfig();
  }

  // ----------------------------------------------------
  // CONFIGURACIÓN ADMINISTRATIVA (Protegida por RBAC)
  // ----------------------------------------------------
  @UseGuards(JwtAuthGuard)
  @Get('admin/config')
  async getAdminConfig(@Request() req: any) {
    if (req.user?.role === 'SPECIALIST') {
      throw new ForbiddenException('Acceso denegado: Las especialistas no tienen permiso para consultar la configuración interna del negocio.');
    }
    return this.configService.getAdminConfig();
  }

  @UseGuards(JwtAuthGuard)
  @Put('config')
  async updateConfig(@Body() body: any, @Request() req: any) {
    if (req.user?.role !== 'OWNER') {
      throw new ForbiddenException('Acceso denegado: Solo la Propietaria (CEO) tiene autorización para modificar la configuración del negocio.');
    }
    return this.configService.updateConfig(body);
  }

  @UseGuards(JwtAuthGuard)
  @Put('admin/config')
  async updateAdminConfig(@Body() body: any, @Request() req: any) {
    if (req.user?.role !== 'OWNER') {
      throw new ForbiddenException('Acceso denegado: Solo la Propietaria (CEO) tiene autorización para modificar la configuración del negocio.');
    }
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

  @UseGuards(JwtAuthGuard)
  @Post('admin/memberships')
  async createMembership(@Body() body: any, @Request() req: any) {
    if (req.user?.role === 'SPECIALIST') {
      throw new ForbiddenException('Acceso denegado: Las especialistas no tienen permiso para modificar membresías.');
    }
    return this.configService.createMembership(body);
  }

  @UseGuards(JwtAuthGuard)
  @Put('admin/memberships/:id')
  async updateMembership(@Param('id') id: string, @Body() body: any, @Request() req: any) {
    if (req.user?.role === 'SPECIALIST') {
      throw new ForbiddenException('Acceso denegado: Las especialistas no tienen permiso para modificar membresías.');
    }
    return this.configService.updateMembership(id, body);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('admin/memberships/:id')
  async deleteMembership(@Param('id') id: string, @Request() req: any) {
    if (req.user?.role === 'SPECIALIST') {
      throw new ForbiddenException('Acceso denegado: Las especialistas no tienen permiso para eliminar membresías.');
    }
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

  @UseGuards(JwtAuthGuard)
  @Post('admin/closed-dates')
  async createClosedDate(@Body() body: any, @Request() req: any) {
    if (req.user?.role === 'SPECIALIST') {
      throw new ForbiddenException('Acceso denegado: Las especialistas no tienen permiso para definir días de cierre.');
    }
    return this.configService.createClosedDate(body);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('admin/closed-dates/:id')
  async deleteClosedDate(@Param('id') id: string, @Request() req: any) {
    if (req.user?.role === 'SPECIALIST') {
      throw new ForbiddenException('Acceso denegado: Las especialistas no tienen permiso para eliminar días de cierre.');
    }
    return this.configService.deleteClosedDate(id);
  }
}
