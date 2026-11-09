import { AuthService } from '../src/auth/auth.service';

async function testAuth() {
  console.log('--- TEST: Verificación de PINs y Roles Diferenciados ---');

  const mockPrisma: any = {
    businessConfig: {
      findUnique: async () => ({
        id: 'singleton',
        masterPin: '202626',
        servicesAdminPin: '111111',
        productsAdminPin: '222222',
        specialistPin: '777777',
      }),
    },
  };

  const mockJwt: any = {
    sign: (payload: any) => `token-${payload.role}-${Date.now()}`,
  };

  const service = new AuthService(mockPrisma, mockJwt);

  const resServicios = await service.verifyPin('111111');
  console.log('PIN 111111 Rol:', resServicios.role);
  if (resServicios.role !== 'ADMIN_SERVICIOS') {
    throw new Error('FAIL: Esperado ADMIN_SERVICIOS');
  }

  const resProductos = await service.verifyPin('222222');
  console.log('PIN 222222 Rol:', resProductos.role);
  if (resProductos.role !== 'ADMIN_PRODUCTOS') {
    throw new Error('FAIL: Esperado ADMIN_PRODUCTOS');
  }

  const resOwner = await service.verifyPin('202626');
  console.log('PIN 202626 Rol:', resOwner.role);
  if (resOwner.role !== 'OWNER') {
    throw new Error('FAIL: Esperado OWNER');
  }

  console.log('SUCCESS: Autenticación de roles diferenciados funciona correctamente!');
}

testAuth().catch(err => {
  console.error(err.message);
  process.exit(1);
});
