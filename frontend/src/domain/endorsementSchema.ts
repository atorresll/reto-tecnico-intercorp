import { z } from 'zod';

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use el formato YYYY-MM-DD')
  .refine((value) => !Number.isNaN(Date.parse(`${value}T00:00:00.000Z`)), 'Fecha inválida')
  .transform((value) => new Date(`${value}T00:00:00.000Z`));

export const endorsementSchema = z.object({
  policyNumber: z.string().min(10).regex(/^[a-zA-Z0-9]+$/, 'Solo se permiten caracteres alfanuméricos'),
  idEnvio: z.coerce.number().int().positive(),
  frecuencia: z.string().min(1),
  tipoEndoso: z.string().min(1),
  producto: z.string().min(1),
  plan: z.string().min(1),
  moneda: z.string().min(1),
  usuario: z.string().min(1).email('Ingrese un correo válido'),
  fechaSolicitud: isoDate,
  fechaCliente: isoDate,
  fechaEfectiva: isoDate,
}).superRefine((value, context) => {
  if (value.fechaEfectiva < value.fechaSolicitud) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['fechaEfectiva'],
      message: 'Debe ser mayor o igual a la fecha de solicitud',
    });
  }
});

export type EndorsementFormInput = z.input<typeof endorsementSchema>;
export type Endorsement = z.output<typeof endorsementSchema>;
