import { AuthService } from '../src/auth/auth.service';
import { ConfigNegocioService } from '../src/config-negocio/config-negocio.service';

async function runE2ETests() {
  console.log('=== E2E TEST: Roles Diferenciados (Servicios y Productos) ===');

  let currentConfig: any = {
    id: 'singleton',
    masterPin: '202626',
    adminPin: '111111',
    servicesAdminPin: '111111',
    productsAdminPin: '222222',
    specialistPin: '777777',
    businessName: 'Catheryne Ríos Estética',
    phone: '+57 300 000 0000',
  };

  const mockPrisma: any = {
    businessConfig: {
      findUnique: async () => currentConfig,
      upsert: async ({ create, update }: any) => {
        currentConfig = { ...currentConfig, ...update };
        return currentConfig;
      },
      update: async ({ data }: any) => {
        currentConfig = { ...currentConfig, ...data };
        return currentConfig;
      },
    },
  };

  const mockJwt: any = {
    sign: (payload: any) => `token-${payload.role}`,
  };

  const authService = new AuthService(mockPrisma, mockJwt);
  const configService = new ConfigNegocioService(mockPrisma);

  // 1. Verificación inicial de los 4 roles
  console.log('1. Verificando roles con PINs predeterminados...');
  const ownerRes = await authService.verifyPin('202626');
  if (ownerRes.role !== 'OWNER' || !ownerRes.valid) throw new Error('FAIL: Dueña debe ser OWNER');

  const serviciosRes = await authService.verifyPin('111111');
  if (serviciosRes.role !== 'ADMIN_SERVICIOS' || !serviciosRes.valid) throw new Error('FAIL: 111111 debe ser ADMIN_SERVICIOS');

  const productosRes = await authService.verifyPin('222222');
  if (productosRes.role !== 'ADMIN_PRODUCTOS' || !productosRes.valid) throw new Error('FAIL: 222222 debe ser ADMIN_PRODUCTOS');

  const specialistRes = await authService.verifyPin('777777');
  if (specialistRes.role !== 'SPECIALIST' || !specialistRes.valid) throw new Error('FAIL: 777777 debe ser SPECIALIST');

  const invalidRes = await authService.verifyPin('999999');
  if (invalidRes.valid !== false) throw new Error('FAIL: 999999 debe ser inválido');

  console.log('✓ Verificación inicial de 4 roles y PIN inválido: PASÓ');

  // 2. Modificación de PINs mediante ConfigNegocioService
  console.log('2. Actualizando PINs de Servicios y Productos...');
  await configService.updateConfig({
    servicesAdminPin: '333333',
    productsAdminPin: '444444',
  });

  if (currentConfig.servicesAdminPin !== '333333' || currentConfig.adminPin !== '333333') {
    throw new Error('FAIL: servicesAdminPin y adminPin deben sincronizarse en 333333');
  }
  if (currentConfig.productsAdminPin !== '444444') {
    throw new Error('FAIL: productsAdminPin debe ser 444444');
  }
  console.log('✓ Sincronización de PINs en base de datos: PASÓ');

  // 3. Verificación de los nuevos PINs
  console.log('3. Verificando autenticación con los nuevos PINs...');
  const newServiciosRes = await authService.verifyPin('333333');
  if (newServiciosRes.role !== 'ADMIN_SERVICIOS') throw new Error('FAIL: 333333 debe ser ADMIN_SERVICIOS');

  const oldServiciosRes = await authService.verifyPin('111111');
  if (oldServiciosRes.valid) throw new Error('FAIL: El PIN anterior 111111 no debe ser válido tras el cambio');

  const newProductosRes = await authService.verifyPin('444444');
  if (newProductosRes.role !== 'ADMIN_PRODUCTOS') throw new Error('FAIL: 444444 debe ser ADMIN_PRODUCTOS');

  const oldProductosRes = await authService.verifyPin('222222');
  if (oldProductosRes.valid) throw new Error('FAIL: El PIN anterior 222222 no debe ser válido tras el cambio');

  console.log('✓ Nuevos PINs verificados correctamente y PINs viejos invalidados: PASÓ');
  console.log('🎉 TODOS LOS TESTS E2E PASARON SATISFACTORIAMENTE.');
}

runE2ETests().catch(err => {
  console.error('ERROR EN E2E TEST:', err);
  process.exit(1);
});
