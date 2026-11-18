import { diasHasta } from '../../utilidades/formato'

export function estadoStock(stock, umbral) {
  if (stock <= 0) return { clase: 'critico', texto: 'Agotado' }
  if (stock <= umbral) return { clase: 'alerta', texto: 'Stock bajo' }
  return { clase: 'normal', texto: 'Disponible' }
}

export function estadoVencimiento(fecha) {
  const dias = diasHasta(fecha)
  if (dias === null) return null
  if (dias < 0) return { clase: 'critico', texto: 'Vencido' }
  if (dias === 0) return { clase: 'critico', texto: 'Vence hoy' }
  if (dias <= 60) return { clase: 'alerta', texto: `Vence en ${dias} ${dias === 1 ? 'día' : 'días'}` }
  return null
}

export function porcentajeStock(stock, umbral) {
  const referencia = Math.max(umbral * 3, 1)
  return Math.min(100, Math.round((stock / referencia) * 100))
}
