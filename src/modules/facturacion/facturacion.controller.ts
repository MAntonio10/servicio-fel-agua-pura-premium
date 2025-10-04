import { Controller, Post, Body, HttpException, HttpStatus } from '@nestjs/common';
import { FacturacionService } from './facturacion.service';

@Controller('facturacion')
export class FacturacionController {
  constructor(private readonly facturacionService: FacturacionService) { }

  @Post('consultar-nit')
  async consultarNIT(@Body() body: { documento: string }) {
    try {
      const { documento } = body;

      if (!documento) {
        throw new HttpException(
          { success: false, message: 'El documento es requerido' },
          HttpStatus.BAD_REQUEST
        );
      }

      const resultado = await this.facturacionService.consultarNIT(documento);
      return resultado;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        { success: false, message: 'Error interno del servidor', error: error.message },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post('certificar-venta')
  async certificarVenta(@Body() body: {
    factura: { Nfactura: string },
    detalles: Array<{
      CodArticulo: string,
      Descripcion: string,
      Cantidad: number,
      PrecioVenta: number,
      PorcDescuento: number
    }>,
    nit: string,
    nombre: string,
    direccion: string,
    total: number
  }) {
    try {
      const { factura, detalles, nit, nombre, direccion, total } = body;

      // Validaciones básicas
      if (!factura?.Nfactura) {
        throw new HttpException(
          { success: false, message: 'El número de factura es requerido' },
          HttpStatus.BAD_REQUEST
        );
      }

      if (!detalles || detalles.length === 0) {
        throw new HttpException(
          { success: false, message: 'Los detalles de la factura son requeridos' },
          HttpStatus.BAD_REQUEST
        );
      }

      if (!nit || !nombre || total <= 0) {
        throw new HttpException(
          { success: false, message: 'NIT, nombre y total son requeridos y válidos' },
          HttpStatus.BAD_REQUEST
        );
      }

      // Validar estructura de detalles
      for (const detalle of detalles) {
        if (!detalle.CodArticulo || !detalle.Descripcion || detalle.Cantidad <= 0 || detalle.PrecioVenta <= 0) {
          throw new HttpException(
            { success: false, message: 'Todos los detalles deben tener código, descripción, cantidad y precio válidos' },
            HttpStatus.BAD_REQUEST
          );
        }
      }

      const resultado = await this.facturacionService.certificarVenta(
        factura,
        detalles,
        nit,
        nombre,
        direccion,
        total
      );

      return resultado;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        { success: false, message: 'Error interno del servidor', error: error.message },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post('facturar-venta')
  async facturarVenta(@Body() body: {
    xmldoc: string,
    nit: string,
    total: number
  }) {
    try {
      const { xmldoc, nit, total } = body;

      if (!xmldoc || !nit || total <= 0) {
        throw new HttpException(
          { success: false, message: 'XML documento, NIT y total son requeridos' },
          HttpStatus.BAD_REQUEST
        );
      }

      const resultado = await this.facturacionService.facturarVenta(xmldoc, nit, total);
      return resultado;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        { success: false, message: 'Error interno del servidor', error: error.message },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post('anular-factura')
  anularFactura(@Body() numAutorizacion: string, motivoAnulacion: string) {
    return this.facturacionService.anularFactura(numAutorizacion, motivoAnulacion);
  }
}
