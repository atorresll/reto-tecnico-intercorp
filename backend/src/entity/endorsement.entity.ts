export interface EndorsementRequest {
  policyNumber: string;
  idEnvio: number;
  frecuencia: string;
  tipoEndoso: string;
  producto: string;
  plan: string;
  moneda: string;
  usuario: string;
  fechaSolicitud: string;
  fechaCliente: string;
  fechaEfectiva: string;
}

export interface EndorsementTranslation {
  id: string;
  status: 'translated';
  policyNumber: string;
  idEnvio: number;
  producto: string;
  tipoEndoso: string;
  translation: Record<string, unknown>;
}
