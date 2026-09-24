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
  policyNumber: string;
  idEnvio: number;
  financialPlansEntity: { description: string };
  currency: { description: string };
  productEntity: { description: string };
  eventEntity: {
    description: string;
    dynamicData: Array<{ etiqueta: string; value: string }>;
  };
  eventAppliedEntities: Array<{ description: string; orderEvent: number }>;
  riskUnitEntities: Array<{
    insuranceObjectEntities: Array<{
      insuranceObjectNumber: string;
      coverageEntities: unknown[];
      participationEntities: unknown[];
    }>;
    plansEntity: { description: string };
    riskUnitNumber: string;
  }>;
  participationEntities: unknown[];
}
