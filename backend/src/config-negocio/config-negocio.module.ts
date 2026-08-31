import { Module } from '@nestjs/common';
import { ConfigNegocioService } from './config-negocio.service';
import { ConfigNegocioController } from './config-negocio.controller';

@Module({
  controllers: [ConfigNegocioController],
  providers: [ConfigNegocioService],
  exports: [ConfigNegocioService],
})
export class ConfigNegocioModule {}
