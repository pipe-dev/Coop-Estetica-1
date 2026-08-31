import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Res } from '@nestjs/common';
import { Response } from 'express';
import { TeamService } from './team.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('api')
export class TeamController {
  constructor(private readonly teamService: TeamService) {}

  @Get('team')
  async getPublicTeam(@Res({ passthrough: true }) res: Response) {
    res.setHeader('Cache-Control', 'public, s-maxage=86400, stale-while-revalidate=604800');
    return this.teamService.getAllPublic();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('OWNER', 'ADMIN')
  @Get('admin/team')
  async getAdminTeam() {
    return this.teamService.getAllAdmin();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('OWNER', 'ADMIN')
  @Post('admin/team')
  async createTeamMember(@Body() body: any) {
    return this.teamService.create(body);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('OWNER', 'ADMIN')
  @Put('admin/team/:id')
  async updateTeamMember(@Param('id') id: string, @Body() body: any) {
    return this.teamService.update(id, body);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('OWNER', 'ADMIN')
  @Delete('admin/team/:id')
  async deleteTeamMember(@Param('id') id: string) {
    return this.teamService.delete(id);
  }
}
