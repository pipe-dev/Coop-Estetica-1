import { Controller, Get, Post, Put, Patch, Delete, Body, Param, UseGuards, Res } from '@nestjs/common';
import { Response } from 'express';
import { ProductsService } from './products.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('api')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  // Public (Edge Cache)
  @Get('products')
  async getProducts(@Res({ passthrough: true }) res: Response) {
    res.setHeader('Cache-Control', 'public, s-maxage=86400, stale-while-revalidate=604800');
    return this.productsService.getAllPublic();
  }

  // Admin Protected
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('OWNER', 'ADMIN')
  @Get('admin/products')
  async getAdminProducts() {
    return this.productsService.getAllAdmin();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('OWNER', 'ADMIN')
  @Post('admin/products')
  async createProduct(@Body() body: any) {
    return this.productsService.create(body);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('OWNER', 'ADMIN')
  @Put('admin/products/:id')
  async updateProduct(@Param('id') id: string, @Body() body: any) {
    return this.productsService.update(id, body);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('OWNER', 'ADMIN')
  @Patch('admin/products/:id/toggle')
  async toggleProduct(@Param('id') id: string) {
    return this.productsService.toggleAvailability(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('OWNER', 'ADMIN')
  @Delete('admin/products/:id')
  async deleteProduct(@Param('id') id: string) {
    return this.productsService.delete(id);
  }
}
