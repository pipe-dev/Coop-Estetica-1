import { Controller, Get, Post, Put, Patch, Delete, Body, Param, Query, UseGuards, Res } from '@nestjs/common';
import { Response } from 'express';
import { ServicesService } from './services.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('api')
export class ServicesController {
  constructor(private readonly servicesService: ServicesService) {}

  // ----------------------------------------------------
  // PUBLIC GET (Edge Cached)
  // ----------------------------------------------------
  @Get('categories')
  async getCategories(@Res({ passthrough: true }) res: Response) {
    // Header para que el Edge de Vercel/Cloudflare almacene en caché por 24 horas
    res.setHeader('Cache-Control', 'public, s-maxage=86400, stale-while-revalidate=604800');
    return this.servicesService.getAllCategories(false);
  }

  @Get('services')
  async getServices(@Res({ passthrough: true }) res: Response) {
    res.setHeader('Cache-Control', 'public, s-maxage=86400, stale-while-revalidate=604800');
    return this.servicesService.getAllServices(false);
  }

  // ----------------------------------------------------
  // ADMIN CATEGORIES (Protected)
  // ----------------------------------------------------
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('OWNER', 'ADMIN')
  @Get('admin/categories')
  async getAdminCategories() {
    return this.servicesService.getAllCategories(true);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('OWNER', 'ADMIN')
  @Post('admin/categories')
  async createCategory(@Body() body: { name: string; description?: string; image?: string; order?: number }) {
    return this.servicesService.createCategory(body);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('OWNER', 'ADMIN')
  @Put('admin/categories/:id')
  async updateCategory(@Param('id') id: string, @Body() body: any) {
    return this.servicesService.updateCategory(id, body);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('OWNER', 'ADMIN')
  @Delete('admin/categories/:id')
  async deleteCategory(@Param('id') id: string) {
    return this.servicesService.deleteCategory(id);
  }

  // ----------------------------------------------------
  // ADMIN SERVICES (Protected)
  // ----------------------------------------------------
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('OWNER', 'ADMIN')
  @Get('admin/services')
  async getAdminServices() {
    return this.servicesService.getAllServices(true);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('OWNER', 'ADMIN')
  @Post('admin/services')
  async createService(@Body() body: any) {
    return this.servicesService.createService(body);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('OWNER', 'ADMIN')
  @Put('admin/services/:id')
  async updateService(@Param('id') id: string, @Body() body: any) {
    return this.servicesService.updateService(id, body);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('OWNER', 'ADMIN')
  @Patch('admin/services/:id/toggle')
  async toggleService(@Param('id') id: string) {
    return this.servicesService.toggleServiceActive(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('OWNER', 'ADMIN')
  @Delete('admin/services/:id')
  async deleteService(@Param('id') id: string) {
    return this.servicesService.deleteService(id);
  }
}
