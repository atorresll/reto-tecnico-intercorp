import type { EndorsementFormInput } from '../domain/endorsementSchema';
import { useEndorsement } from '../hooks/useEndorsement';
import type { EndorsementService } from '../services/endorsementService';

const fields: Array<{ name: keyof EndorsementFormInput; label: string; type?: string }> = [
  { name: 'policyNumber', label: 'Número de póliza' }, { name: 'idEnvio', label: 'ID envío', type: 'number' },
  { name: 'frecuencia', label: 'Frecuencia' }, { name: 'tipoEndoso', label: 'Tipo de endoso' },
  { name: 'producto', label: 'Producto' }, { name: 'plan', label: 'Plan' }, { name: 'moneda', label: 'Moneda' },
  { name: 'usuario', label: 'Usuario / correo', type: 'email' }, { name: 'fechaSolicitud', label: 'Fecha de solicitud', type: 'date' },
  { name: 'fechaCliente', label: 'Fecha del cliente', type: 'date' }, { name: 'fechaEfectiva', label: 'Fecha efectiva', type: 'date' },
];

export function EndorsementForm({ service }: { service: EndorsementService }) {
  const form = useEndorsement(service);
  return (
    <main>
      <h1>Solicitud de Endoso</h1>
      <form onSubmit={form.submit} noValidate>
        {fields.map(({ name, label, type = 'text' }) => (
          <label key={name}>
            {label}
            <input type={type} value={String(form.values[name])} onChange={(event) => form.updateField(name, event.target.value)} required />
            {form.errors[name] && <span role="alert">{form.errors[name]}</span>}
          </label>
        ))}
        <button type="submit" disabled={form.status === 'submitting'}>Enviar solicitud</button>
        {form.message && <p role="status">{form.message}</p>}
      </form>
    </main>
  );
}
