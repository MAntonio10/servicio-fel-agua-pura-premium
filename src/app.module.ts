import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { FacturacionModule } from './modules/facturacion/facturacion.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [FacturacionModule, ConfigModule.forRoot({ isGlobal: true })],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
