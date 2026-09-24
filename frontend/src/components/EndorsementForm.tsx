import type { EndorsementFormInput } from '../domain/endorsementSchema';
import { useEndorsement } from '../hooks/useEndorsement';
import type { EndorsementService } from '../services/endorsementService';
import './EndorsementForm.css';

const fields: Array<{
  name: keyof EndorsementFormInput;
  label: string;
  type?: 'text' | 'number' | 'email' | 'date';
}> = [
  { name: 'policyNumber', label: 'Número de póliza' },
  { name: 'idEnvio', label: 'ID de envío', type: 'number' },
  { name: 'frecuencia', label: 'Frecuencia' },
  { name: 'tipoEndoso', label: 'Tipo de endoso' },
  { name: 'producto', label: 'Producto' },
  { name: 'plan', label: 'Plan' },
  { name: 'moneda', label: 'Moneda' },
  { name: 'usuario', label: 'Usuario / correo', type: 'email' },
  { name: 'fechaSolicitud', label: 'Fecha de solicitud', type: 'date' },
  { name: 'fechaCliente', label: 'Fecha del cliente', type: 'date' },
  { name: 'fechaEfectiva', label: 'Fecha efectiva', type: 'date' },
];

export function EndorsementForm({ service }: { service: EndorsementService }) {
  const {
    register,
    submit,
    formState: { errors, isSubmitting },
    response,
    apiError,
  } = useEndorsement(service);

  return (
    <main className="endorsement-page">
      <section className="endorsement-card" aria-labelledby="endorsement-title">
        <header className="endorsement-header">
          <span className="eyebrow">Operaciones / Endosos</span>
          <h1 id="endorsement-title">Solicitud de endoso</h1>
          <p>Completa los datos para traducir y registrar la solicitud.</p>
        </header>

        <form className="endorsement-form" onSubmit={submit} noValidate>
          <div className="form-grid">
            {fields.map(({ name, label, type = 'text' }) => {
              const error = errors[name];
              return (
                <div className="field" key={name}>
                  <label htmlFor={name}>{label}<span aria-hidden="true"> *</span></label>
                  <input
                    id={name}
                    type={type}
                    aria-invalid={Boolean(error)}
                    aria-describedby={error ? `${name}-error` : undefined}
                    {...register(name, type === 'number' ? { valueAsNumber: true } : undefined)}
                  />
                  {error && <span className="field-error" id={`${name}-error`} role="alert">{error.message}</span>}
                </div>
              );
            })}
          </div>

          <button className="submit-button" type="submit" disabled={isSubmitting}>
            {isSubmitting && <span className="spinner" aria-hidden="true" />}
            {isSubmitting ? 'Cargando...' : 'Enviar solicitud'}
          </button>
        </form>

        {apiError && <div className="api-alert" role="alert">{apiError}</div>}
        {response !== null && (
          <section className="response-panel" aria-labelledby="response-title">
            <h2 id="response-title">Respuesta del servicio</h2>
            <pre><code>{JSON.stringify(response, null, 2)}</code></pre>
          </section>
        )}
      </section>
    </main>
  );
}
