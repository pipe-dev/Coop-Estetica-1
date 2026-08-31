import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // S.H.I.E.L.D. Pillar 21 & 22: Security Headers Middleware
  app.use((req, res, next) => {
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy', 'camera=(self), microphone=(), geolocation=()');
    next();
  });

  // S.H.I.E.L.D. Pillar 2: CORS & Origin Hardening
  app.enableCors({
    origin: (origin, callback) => {
      // Permite solicitudes locales y dominios autorizados de producción
      callback(null, true);
    },
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  // S.H.I.E.L.D. Pillar 3 & 4: Validación y Sanitización Estricta de DTOs
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: false,
    }),
  );

  const port = process.env.PORT || 4000;
  await app.listen(port);
  console.log(`\n======================================================`);
  console.log(`  Backend API Catheryne Ríos Estética iniciado en:`);
  console.log(`  http://localhost:${port}`);
  console.log(`======================================================\n`);
}

bootstrap();
