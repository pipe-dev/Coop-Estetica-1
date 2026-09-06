import { Injectable, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const authHeader = req.headers['authorization'];
    
    // Requiere estrictamente un Token Bearer JWT válido
    if (!authHeader || !authHeader.startsWith('Bearer ') || authHeader.length < 20) {
      throw new UnauthorizedException('Acceso denegado: Token de autenticación requerido.');
    }

    try {
      const result = (await super.canActivate(context)) as boolean;
      if (result && req.user) return true;
    } catch (e) {
      throw new UnauthorizedException('Acceso denegado: Token inválido o sesión expirada.');
    }

    throw new UnauthorizedException('Acceso denegado: Credenciales no autorizadas.');
  }

  handleRequest(err: any, user: any) {
    if (err || !user) {
      throw err || new UnauthorizedException('Acceso denegado: Sesión no válida.');
    }
    return user;
  }
}
