export interface EndorsementRequest {
  policyNumber: string;
  idEnvio: string;
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
  idEnvio: string;
  producto: string;
  tipoEndoso: string;
  translation: Record<string, unknown>;
}
