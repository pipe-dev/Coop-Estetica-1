import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'catheryne_rios_estetica_jwt_master_secret_key_2026',
    });
  }

  async validate(payload: { sub: string; email: string; role: string; teamMemberId?: string }) {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      include: { teamMember: true },
    });

    if (!user || !user.active) {
      throw new UnauthorizedException('Usuario inactivo o sesión no válida.');
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      teamMemberId: user.teamMemberId,
      teamMember: user.teamMember,
    };
  }
}
