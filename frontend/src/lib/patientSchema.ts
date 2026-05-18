import * as z from 'zod'

export const TIPOS_AFILIACION_FAMILIAR = [
  'Padre/Madre',
  'Hijo/Hija',
  'Cónyuge/Concubino',
] as const

export type TipoAfiliacionFamiliar = (typeof TIPOS_AFILIACION_FAMILIAR)[number]

export const TIPO_AFILIACION_NINGUNA = 'Ninguna' as const

export const affiliationFields = {
  es_afiliado: z.boolean(),
  tipo_afiliacion: z.string().optional(),
  titular_nombre: z.string().optional(),
}

export function withMilitaryAffiliationValidation<T extends z.ZodObject<z.ZodRawShape>>(schema: T) {
  return schema.superRefine((data, ctx) => {
    const esAfiliado = Boolean(data.es_afiliado)

    if (esAfiliado) {
      const tipo = data.tipo_afiliacion as string | undefined
      if (!tipo || !(TIPOS_AFILIACION_FAMILIAR as readonly string[]).includes(tipo)) {
        ctx.addIssue({
          code: 'custom',
          message: 'Seleccione el parentesco con el titular militar',
          path: ['tipo_afiliacion'],
        })
      }

      const titular = (data.titular_nombre as string | undefined)?.trim() ?? ''
      if (titular.length < 3) {
        ctx.addIssue({
          code: 'custom',
          message: 'Ingrese el nombre completo del titular militar (mín. 3 caracteres)',
          path: ['titular_nombre'],
        })
      }
    }
  })
}

export function mapAffiliationPayload<
  T extends { es_afiliado: boolean; tipo_afiliacion?: string; titular_nombre?: string | null },
>(data: T): T & { tipo_afiliacion: string; titular_nombre: string | null } {
  if (data.es_afiliado) {
    return {
      ...data,
      tipo_afiliacion: data.tipo_afiliacion ?? TIPO_AFILIACION_NINGUNA,
      titular_nombre: data.titular_nombre?.trim() ?? '',
    }
  }

  return {
    ...data,
    tipo_afiliacion: TIPO_AFILIACION_NINGUNA,
    titular_nombre: null,
  }
}
