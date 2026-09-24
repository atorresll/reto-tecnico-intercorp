import { useState } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { endorsementSchema, type Endorsement, type EndorsementFormInput } from '../domain/endorsementSchema';
import type { EndorsementService } from '../services/endorsementService';

export function useEndorsement(service: EndorsementService) {
  const [response, setResponse] = useState<unknown>(null);
  const [apiError, setApiError] = useState('');
  const form = useForm<EndorsementFormInput, undefined, Endorsement>({
    resolver: zodResolver(endorsementSchema),
    defaultValues: {
      policyNumber: '', idEnvio: undefined, frecuencia: '', tipoEndoso: '', producto: '',
      plan: '', moneda: '', usuario: '', fechaSolicitud: '', fechaCliente: '', fechaEfectiva: '',
    },
    mode: 'onTouched',
  });

  const submit: SubmitHandler<Endorsement> = async (data) => {
    setResponse(null);
    setApiError('');
    try {
      setResponse(await service.translate(data));
    } catch (error) {
      setApiError(error instanceof Error ? error.message : 'No se pudo enviar la solicitud.');
    }
  };

  return {
    ...form,
    submit: form.handleSubmit(submit),
    response,
    apiError,
  };
}
