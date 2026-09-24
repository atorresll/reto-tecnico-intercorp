import { useState } from 'react';
import { endorsementSchema, type EndorsementFormInput } from '../domain/endorsementSchema';
import type { EndorsementService } from '../services/endorsementService';

const initialValues: EndorsementFormInput = {
  policyNumber: '', idEnvio: 0, frecuencia: '', tipoEndoso: '', producto: '',
  plan: '', moneda: '', usuario: '', fechaSolicitud: '', fechaCliente: '', fechaEfectiva: '',
};

export function useEndorsement(service: EndorsementService) {
  const [values, setValues] = useState<EndorsementFormInput>(initialValues);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  function updateField(field: keyof EndorsementFormInput, value: string) {
    setValues((current) => ({ ...current, [field]: field === 'idEnvio' ? Number(value) : value }));
    setErrors((current) => ({ ...current, [field]: '' }));
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const result = endorsementSchema.safeParse(values);
    if (!result.success) {
      setErrors(Object.fromEntries(result.error.issues.map((issue) => [String(issue.path[0]), issue.message])));
      return;
    }
    setStatus('submitting');
    setMessage('');
    try {
      await service.translate(result.data);
      setStatus('success');
      setMessage('Solicitud enviada correctamente.');
    } catch (error) {
      setStatus('error');
      setMessage(error instanceof Error ? error.message : 'No se pudo enviar la solicitud.');
    }
  }

  return { values, errors, status, message, updateField, submit };
}
