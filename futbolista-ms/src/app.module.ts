import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ObservabilityModule } from './observability/observability.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { JugadoresModule } from './jugadores/jugadores.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ObservabilityModule.forRoot('jugadores-ms'),
    JugadoresModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
