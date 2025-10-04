import { BadRequestException, Injectable } from '@nestjs/common';

import * as soap from 'soap'
import * as xml2js from 'xml2js'
import { fechaUTC } from 'src/common/utils/formato-fechas';

@Injectable()
export class FacturacionService {

  private readonly wsdlUrl = process.env.FACTURA || '';
  private readonly wsdlUrlConsultaNIT = process.env.CONSULTA_NIT || '';
  private readonly wsdUrlAnulacion = process.env.ANULACION || '';

  // Estos datos te los da tu certificador
  private readonly cliente = process.env.FEL_CLIENTE
  private readonly usuario = process.env.FEL_USUARIO
  private readonly clave = process.env.FEL_CLAVE
  private readonly nitEmisor = process.env.FEL_NIT_EMISOR

  async consultarNIT(documento: string) {
    try {
      const soapClient = await soap.createClientAsync(this.wsdlUrlConsultaNIT!)

      const args = {
        Cliente: this.cliente,
        Usuario: this.usuario,
        Clave: this.clave,
        Receptorid: documento,
      }
      // console.log(args)
      const resultado: any = await new Promise((resolve, reject) => {
        soapClient.ReceptorInfo.ReceptorInfoSoapPort.Execute(args, (err: any, result: any) => {
          if (err) {
            reject(err)
          } else {
            resolve(result)
          }
        })
      })

      // Extraer la cadena XML contenida en el resultado
      const xml = resultado?.Informacion

      if (!xml) {
        throw new BadRequestException({
          success: false,
          message: 'No se recibió información válida desde el servicio SOAP',
        })
      }

      // Usar xml2js para convertir el XML a JSON
      const parser = new xml2js.Parser()
      const parsedResult = await parser.parseStringPromise(xml)

      // Extraer los campos NIT, NOMBRE y DIRECCION
      const receptorInfo = parsedResult?.RECEPTOR
      if (!receptorInfo) {
        const errores = parsedResult?.Errores
        const error = errores?.Error?.[0]
        return ({
          success: false,
          error: error['_'],
          codigoError: error['$']['Codigo'],
        })
      }
      const nit = receptorInfo?.NIT?.[0] || ''
      const nombre = receptorInfo?.NOMBRE?.[0] || ''
      const direccion = receptorInfo?.DIRECCION?.[0] || ' '

      // Retornar la respuesta con los datos extraídos
      return ({
        success: true,
        data: {
          nit,
          nombre,
          direccion,
        },
      })
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error
      } else {
        return ({
          success: false,
          message: 'Error al consumir el servicio SOAP',
          error: error.message,
        })
      }
    }
  }

  async facturar(cliente: string, usuario: string, clave: string, nitemisor: string, xmldoc: any) {
    try {
      // Crear el cliente SOAP para la facturación
      const soapClient = await soap.createClientAsync(this.wsdlUrl)

      // Definir los parámetros que se enviarán en la petición
      const args = {
        Cliente: cliente,
        Usuario: usuario,
        Clave: clave,
        Nitemisor: nitemisor,
        Xmldoc: xmldoc,
      }
      console.log('Error al crear el cliente soap', soapClient)

      // Ejecutar la función SOAP usando Promesas
      const resultado: any = await new Promise((resolve, reject) => {
        soapClient.Documento.DocumentoSoapPort.Execute(args, (err: any, result: any) => {
          if (err) {
            reject(err)
          } else {
            resolve(result)
          }
        })
      })

      // Extraer la cadena XML contenida en el resultado
      const xml = resultado?.Respuesta

      if (!xml) {
        return ({
          success: false,
          message: 'No se recibió información válida desde el servicio SOAP',
        })
      }

      // Usar xml2js para convertir el XML a JSON
      const parser = new xml2js.Parser()
      const parsedResult = await parser.parseStringPromise(xml)

      // Manejo de error basado en el ejemplo de XML de error
      const errores = parsedResult?.Errores
      if (errores) {
        const error = errores?.Error?.[0]
        return ({
          success: false,
          error: error['_'],
          codigoError: error['$']['Codigo'],
        })
      }

      // Manejo de respuesta correcta basado en el ejemplo de XML exitoso
      const DTE = parsedResult?.DTE
      if (!DTE) {
        return ({
          success: false,
          error: 'Formato de respuesta no esperado',
        })
      }

      const fechaEmision = DTE['$']['FechaEmision']
      const fechaCertificacion = DTE['$']['FechaCertificacion']
      const numeroAutorizacion = DTE['$']['NumeroAutorizacion']
      const serie = DTE['$']['Serie']
      const numero = DTE['$']['Numero']
      const xmlDTE = DTE?.Xml?.[0] || ''
      const pdfDTE = DTE?.Pdf?.[0] || ''

      // Retornar la respuesta con los datos extraídos
      return ({
        success: true,
        data: {
          fechaEmision,
          fechaCertificacion,
          numeroAutorizacion,
          serie,
          numero,
          xmlDTE,
          pdfDTE,
        },
      })
    } catch (error) {
      return ({
        success: false,
        message: 'Error al consumir el servicio SOAP',
        error: error.message,
      })
    }
  }

  async facturarVenta(xmldoc: string, nit: string, total: number) {
    try {
      const soapClient = await soap.createClientAsync(this.wsdlUrl)

      // Definir los parámetros que se enviarán en la petición
      const args = {
        Cliente: this.cliente,
        Usuario: this.usuario,
        Clave: this.clave,
        Nitemisor: this.nitEmisor,
        Xmldoc: xmldoc,
      }
      // console.log('ARGS:', args)
      // Ejecutar la función SOAP usando Promesas
      const resultado: any = await new Promise((resolve, reject) => {
        soapClient.Documento.DocumentoSoapPort.Execute(args, (err: any, result: any) => {
          if (err) {
            reject(err)
          } else {
            resolve(result)
          }
        })
      })
      // Extraer la cadena XML contenida en el resultado
      const xml = resultado?.Respuesta
      // console.log('XML RESPUESA:', xml)
      if (!xml) {
        return {
          success: false,
          message: 'No se recibió información válida desde el servicio SOAP',
        }
      }
      const parser = new xml2js.Parser()
      const parsedResult = await parser.parseStringPromise(xml)

      const DTE = parsedResult?.DTE
      if (!DTE) {
        return {
          success: false,
          message: 'Formato de respuesta no esperado',
        }
      }

      const fechaEmision = DTE['$']['FechaEmision']
      const fechaCertificacion = DTE['$']['FechaCertificacion']
      const numeroAutorizacion = DTE['$']['NumeroAutorizacion']
      const serie = DTE['$']['Serie']
      const numero = DTE['$']['Numero']
      const QR = `https://felpub.c.sat.gob.gt/verificador-web/publico/vistas/verificacionDte.jsf?tipo=autorizacion&numero=${numeroAutorizacion}&emisor=${this.nitEmisor}&receptor=${nit}&monto=${total}`

      return {
        fechaEmision,
        fechaCertificacion,
        numeroAutorizacion,
        serie,
        numero,
        QR,
        success: true,
        message: 'Venta facturado correctamente'
      }
    } catch (error) {
      console.log('Error al consumir el servicio SOAP:', error)
      console.error('Error al facturar venta:', error)
    }
  }

  async certificarVenta(factura: any, detalles: any[], nit: string, nombre: string, direccion: string, total: number) {
    try {
      const fecha = fechaUTC().toISOString().split('T')[0];

      const datosGenerales = {
        TrnEstNum: 1,
        TipTrnCod: 'FACT',
        TrnNum: factura.Nfactura,
        TrnFec: fecha,
        MonCod: 'GTQ',
        TrnBenConNIT: nit,
        TrnExp: 0,
        TrnExento: 0,
        TrnFraseTipo: 0,
        TrnEscCod: 0,
        TrnEFACECliNom: nombre,
        TrnEFACECliDir: direccion ? direccion.trim() : '',
      }

      const items: any[] = detalles.map((detalle, index) => ({
        TrnLiNum: index + 1,
        TrnArtCod: detalle.CodArticulo,
        TrnArtNom: detalle.Descripcion.toString(),
        TrnCan: detalle.Cantidad,
        TrnVUn: detalle.PrecioVenta,
        TrnUniMed: 'UNI',
        TrnVDes: detalle.PorcDescuento,
        TrnArtBienSer: 'S',
        TrnArtImpAdiCod: 0,
        TrnArtImpAdiUniGrav: 0,
      }))

      const builder = new xml2js.Builder({ headless: true })
      const xmlDoc = builder.buildObject({
        stdTWS: {
          $: { xmlns: 'FEL' },
          TrnEstNum: datosGenerales.TrnEstNum,
          TipTrnCod: datosGenerales.TipTrnCod,
          TrnNum: datosGenerales.TrnNum,
          TrnFec: datosGenerales.TrnFec,
          MonCod: datosGenerales.MonCod,
          TrnBenConNIT: datosGenerales.TrnBenConNIT,
          TrnExp: datosGenerales.TrnExp,
          TrnExento: datosGenerales.TrnExento,
          TrnFraseTipo: datosGenerales.TrnFraseTipo,
          TrnEscCod: datosGenerales.TrnEscCod,
          TrnEFACECliNom: datosGenerales.TrnEFACECliNom,
          TrnEFACECliDir: datosGenerales.TrnEFACECliDir,
          stdTWSD: {
            'stdTWS.stdTWSCIt.stdTWSDIt': items.map((item) => ({
              TrnLiNum: item.TrnLiNum,
              TrnArtCod: item.TrnArtCod,
              TrnArtNom: item.TrnArtNom,
              TrnCan: item.TrnCan,
              TrnVUn: item.TrnVUn,
              TrnUniMed: item.TrnUniMed,
              TrnVDes: item.TrnVDes,
              TrnArtBienSer: item.TrnArtBienSer,
              TrnArtImpAdiCod: item.TrnArtImpAdiCod,
              TrnArtImpAdiUniGrav: item.TrnArtImpAdiUniGrav,
            })),
          },
        },
      })

      // Registrar la facturación
      const certificar = await this.facturarVenta(xmlDoc, nit, total)
      if (certificar) {
        return {
          QR: certificar.QR,
          fechaEmision: certificar.fechaEmision,
          fechaCertificacion: certificar.fechaCertificacion,
          numeroAutorizacion: certificar.numeroAutorizacion,
          serieDTE: certificar.serie,
          numeroDTE: certificar.numero,
          success: true,
          numFactura: factura.Nfactura
        }
      }
    } catch (error) {
      console.log('Error al certificar la venta:', error)
      return {
        success: false,
        message: 'Error al registrar la facturación',
        error: error.message,
      }
    }
  }

  async anularFactura(numAutorizacion: string, motivoAnulacion: string) {
    try {
      const soapClient = await soap.createClientAsync(this.wsdUrlAnulacion!)

      const args = {
        Cliente: this.cliente,
        Usuario: this.usuario,
        Clave: this.clave,
        Nitemisor: this.nitEmisor,
        Numautorizacionuuid: numAutorizacion,
        Motivoanulacion: motivoAnulacion,
      }
      const resultado: any = await new Promise((resolve, reject) => {
        soapClient.Anulacion.AnulacionSoapPort.Execute(args, (err: any, result: any) => {
          if (err) {
            reject(err)
          } else {
            resolve(result)
          }
        })
      })
      // Extraer la cadena XML contenida en el resultado
      const xml = resultado?.Respuesta

      if (!xml) {
        return ({
          success: false,
          message: 'No se recibió información válida desde el servicio SOAP',
        })
      }

      // Usar xml2js para convertir el XML a JSON
      const parser = new xml2js.Parser()
      const parsedResult = await parser.parseStringPromise(xml)

      // Extraer los campos NIT, NOMBRE y DIRECCION
      const receptorInfo = parsedResult?.DTE
      if (!receptorInfo) {
        const errores = parsedResult?.Errores
        const error = errores?.Error?.[0]
        return ({
          success: false,
          error: error['_'],
          codigoError: error['$']['Codigo'],
        })
      }

      // Retornar la respuesta con los datos extraídos
      return ({
        success: true,
        data: {
          mensaje: 'Factura anulada',
        },
      })
    } catch (error) {
      return ({
        success: false,
        message: 'Error al consumir el servicio SOAP',
        error: error.message,
      })
    }
  }


}
