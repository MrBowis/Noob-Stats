import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EquipoDelJugador } from '../domain/entities/equipo-jugador.entity';
import { EquiposGatewayError } from '../domain/exceptions/jugadores.errors';
import { EquiposGateway } from '../domain/repositories/equipos.gateway';

/** Adaptador HTTP hacia `equipos-ms`. */
@Injectable()
export class HttpEquiposGateway extends EquiposGateway {
  private readonly baseUrl: string;

  constructor(private readonly config: ConfigService) {
    super();
    this.baseUrl = (
      this.config.get<string>('EQUIPOS_API_URL') ?? 'http://localhost:3002'
    ).replace(/\/$/, '');
  }

  async listEquiposDelUsuario(
    accessToken: string,
  ): Promise<EquipoDelJugador[]> {
    let response: Response;
    try {
      response = await fetch(`${this.baseUrl}/equipos`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
    } catch {
      throw new EquiposGatewayError('No se pudo contactar a equipos-ms');
    }

    if (!response.ok) {
      throw new EquiposGatewayError(`equipos-ms respondió ${response.status}`);
    }

    return (await response.json()) as EquipoDelJugador[];
  }
}
