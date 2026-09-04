import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  async onModuleInit() {
    try {
      await this.$connect();
      this.logger.log('Conexión exitosa a la base de datos PostgreSQL.');
    } catch (err: any) {
      this.logger.warn('No se pudo conectar de inmediato a PostgreSQL: ' + (err?.message || err) + '. El backend continuará activo para IA y servicios.');
    }
  }

  async onModuleDestroy() {
    try {
      await this.$disconnect();
    } catch (e) {}
  }
}

