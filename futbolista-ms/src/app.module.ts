import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { JugadoresModule } from './jugadores/jugadores.module';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), JugadoresModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
