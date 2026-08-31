import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';

import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { ServicesModule } from './services/services.module';
import { ProductsModule } from './products/products.module';
import { AppointmentsModule } from './appointments/appointments.module';
import { TeamModule } from './team/team.module';
import { CashModule } from './cash/cash.module';
import { ConfigNegocioModule } from './config-negocio/config-negocio.module';
import { ClientsModule } from './clients/clients.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([
      {
        name: 'short',
        ttl: 1000,
        limit: 20, // 20 requests per second per IP max
      },
      {
        name: 'medium',
        ttl: 60000,
        limit: 150, // 150 requests per minute per IP
      },
    ]),
    PrismaModule,
    AuthModule,
    ServicesModule,
    ProductsModule,
    AppointmentsModule,
    TeamModule,
    CashModule,
    ConfigNegocioModule,
    ClientsModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
