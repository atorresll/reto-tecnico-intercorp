import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { EndorsementForm } from '../components/EndorsementForm';
import type { EndorsementService } from '../services/endorsementService';

describe('EndorsementForm', () => {
  it('precarga los valores por defecto', () => {
    const service: EndorsementService = { translate: vi.fn() };
    render(<EndorsementForm service={service} />);

    expect(screen.getByLabelText(/Número de póliza/)).toHaveValue('08200000049');
    expect(screen.getByLabelText(/ID de envío/)).toHaveValue('5984');
    expect(screen.getByLabelText(/Usuario/)).toHaveValue('interface.servicios');
    expect(screen.getByLabelText(/Fecha efectiva/)).toHaveValue('2025-09-01');
  });

  it('envía la estructura completa al hacer submit', async () => {
    const user = userEvent.setup();
    const translate = vi.fn().mockResolvedValue({ ok: true });
    const service: EndorsementService = { translate };
    render(<EndorsementForm service={service} />);

    await user.click(screen.getByRole('button', { name: 'Enviar solicitud' }));

    expect(translate).toHaveBeenCalledWith({
      policyNumber: '08200000049',
      idEnvio: '5984',
      frecuencia: 'Semestral',
      tipoEndoso: 'CambioFrecuencia',
      producto: 'Rumbo',
      plan: 'PlanRumbo',
      moneda: 'Nuevo Sol',
      usuario: 'interface.servicios',
      fechaSolicitud: '2025-08-27',
      fechaCliente: '2025-08-27',
      fechaEfectiva: '2025-09-01',
    });
  });
});
