import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { FacturacionModule } from './modules/facturacion/facturacion.module';

@Module({
  imports: [FacturacionModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
