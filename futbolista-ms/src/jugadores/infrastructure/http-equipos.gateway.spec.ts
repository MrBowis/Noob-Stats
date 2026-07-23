import { ConfigService } from '@nestjs/config';
import { EquiposGatewayError } from '../domain/exceptions/jugadores.errors';
import { HttpEquiposGateway } from './http-equipos.gateway';

function configWith(equiposApiUrl?: string): ConfigService {
  return { get: () => equiposApiUrl } as unknown as ConfigService;
}

describe('HttpEquiposGateway', () => {
  const fetchOriginal = global.fetch;

  afterEach(() => {
    global.fetch = fetchOriginal;
    jest.restoreAllMocks();
  });

  it('usa EQUIPOS_API_URL sin barra final y reenvía el Bearer token', async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve([{ id: 'eq-1', nombre: 'Noob FC' }]),
    });
    global.fetch = fetchMock;

    const gateway = new HttpEquiposGateway(
      configWith('http://equipos-ms:3002/'),
    );
    const equipos = await gateway.listEquiposDelUsuario('token-123');

    expect(fetchMock).toHaveBeenCalledWith(
      'http://equipos-ms:3002/equipos',
      expect.objectContaining({
        headers: { Authorization: 'Bearer token-123' },
      }),
    );
    expect(equipos).toEqual([{ id: 'eq-1', nombre: 'Noob FC' }]);
  });

  it('usa localhost:3002 por defecto si falta la variable de entorno', async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve([]),
    });
    global.fetch = fetchMock;

    const gateway = new HttpEquiposGateway(configWith(undefined));
    await gateway.listEquiposDelUsuario('token-123');

    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:3002/equipos',
      expect.anything(),
    );
  });

  it('lanza EquiposGatewayError si equipos-ms responde con error HTTP', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 500 });

    const gateway = new HttpEquiposGateway(
      configWith('http://equipos-ms:3002'),
    );
    await expect(
      gateway.listEquiposDelUsuario('token-123'),
    ).rejects.toBeInstanceOf(EquiposGatewayError);
  });

  it('lanza EquiposGatewayError si no se puede contactar a equipos-ms', async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error('network down'));

    const gateway = new HttpEquiposGateway(
      configWith('http://equipos-ms:3002'),
    );
    await expect(
      gateway.listEquiposDelUsuario('token-123'),
    ).rejects.toBeInstanceOf(EquiposGatewayError);
  });
});
