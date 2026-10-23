import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { RechargeForm } from '../src/components/RechargeForm';
import { chargeCard } from '../src/services/snailpayClient';
import type { RechargeResult } from '../src/types/snailpay';

vi.mock('../src/services/snailpayClient', async (importOriginal) => {
    const original = await importOriginal<typeof import('../src/services/snailpayClient')>();

    return { ...original, chargeCard: vi.fn() };
});

const USER = {
    id: 'user-1',
    fullName: 'Ana Pérez',
    email: 'ana@example.com',
    balance: 0,
};

function buildApprovedResult(): Extract<RechargeResult, { kind: 'approved' }> {
    return {
        kind: 'approved',
        response: {
            id: 'charge-1',
            status: 'approved',
            status_detail: 'accredited',
            transaction_amount: 100,
            date_created: '2026-10-22T00:00:00.000Z',
            authorization_code: 'ABC123',
            reference: 'SP-CHARGE1',
            payer_id: USER.id,
            payer_email: USER.email,
            card_number: '1234123412341234',
            cvv: '543',
        },
    };
}

async function fillValidValues() {
    const user = userEvent.setup();

    await user.type(screen.getByLabelText(/Número de tarjeta/), '1234 1234 1234 1234');
    await user.type(screen.getByLabelText(/Vencimiento/), '12/26');
    await user.type(screen.getByLabelText(/CVV/), '543');
    await user.clear(screen.getByLabelText(/Nombre del titular/));
    await user.type(screen.getByLabelText(/Nombre del titular/), 'Ana Pérez');
    await user.type(screen.getByLabelText(/Monto/), '100');

    return user;
}

describe('RechargeForm', () => {
    beforeEach(() => {
        vi.mocked(chargeCard).mockReset();
    });

    it('muestra los cinco campos y prellena el nombre del usuario', () => {
        render(<RechargeForm user={USER} creditBalance={vi.fn()} />);

        expect(screen.getByLabelText(/Número de tarjeta/)).toBeInTheDocument();
        expect(screen.getByLabelText(/Vencimiento/)).toBeInTheDocument();
        expect(screen.getByLabelText(/CVV/)).toBeInTheDocument();
        expect(screen.getByLabelText(/Nombre del titular/)).toHaveValue('Ana Pérez');
        expect(screen.getByLabelText(/Monto/)).toBeInTheDocument();
        expect(screen.getByText(/Solo datos ficticios/)).toBeInTheDocument();
        expect(screen.getByText(/1234 1234 1234 1234/)).toBeInTheDocument();
    });

    it('valida el formulario vacío antes de llamar al cliente', async () => {
        const user = userEvent.setup();
        render(<RechargeForm user={USER} creditBalance={vi.fn()} />);

        await user.click(screen.getByRole('button', { name: 'Enviar' }));

        expect(screen.getAllByRole('alert')).toHaveLength(4);
        expect(chargeCard).not.toHaveBeenCalled();
    });

    it('marca la tarjeta inválida y enlaza su error al campo', async () => {
        const user = userEvent.setup();
        render(<RechargeForm user={USER} creditBalance={vi.fn()} />);
        await user.type(screen.getByLabelText(/Número de tarjeta/), '123');

        await user.click(screen.getByRole('button', { name: 'Enviar' }));

        expect(screen.getByLabelText(/Número de tarjeta/)).toHaveAttribute('aria-invalid', 'true');
        expect(screen.getByLabelText(/Número de tarjeta/)).toHaveAttribute(
            'aria-describedby',
            'recharge-card-number-error',
        );
        expect(screen.getByText('Revisa el número de tarjeta.')).toBeInTheDocument();
    });

    it('envía los datos normalizados del formulario', async () => {
        const creditBalance = vi.fn().mockReturnValue(100);
        vi.mocked(chargeCard).mockResolvedValue(buildApprovedResult());
        render(<RechargeForm user={USER} creditBalance={creditBalance} />);
        const user = await fillValidValues();

        await user.click(screen.getByRole('button', { name: 'Enviar' }));

        expect(chargeCard).toHaveBeenCalledTimes(1);
        expect(chargeCard).toHaveBeenCalledWith({
            card_number: '1234123412341234',
            expiration_date: '12/26',
            cvv: '543',
            full_name: 'Ana Pérez',
            amount: 100,
            payer_id: USER.id,
            payer_email: USER.email,
        });
        expect(creditBalance).toHaveBeenCalledWith(buildApprovedResult().response);
        expect(await screen.findByRole('status')).toHaveTextContent('La recarga de $100.00 fue aprobada.');
        await waitFor(() => {
            expect(screen.getByLabelText(/Número de tarjeta/)).toHaveValue('');
            expect(screen.getByLabelText(/Vencimiento/)).toHaveValue('');
            expect(screen.getByLabelText(/CVV/)).toHaveValue('');
        });
    });

    it.each([
        ['rechazado', { kind: 'rejected', message: 'La tarjeta fue rechazada.' }],
        ['no disponible', { kind: 'unavailable', message: 'SnailPay no está disponible.' }],
        ['tiempo agotado', { kind: 'timeout', message: 'SnailPay tardó demasiado.' }],
        ['error de red', { kind: 'network', message: 'No se pudo conectar.' }],
    ] as const)('muestra el mensaje de cobro %s', async (_name, response) => {
        vi.mocked(chargeCard).mockResolvedValue(response as RechargeResult);
        const creditBalance = vi.fn();
        render(<RechargeForm user={USER} creditBalance={creditBalance} />);
        const user = await fillValidValues();

        await user.click(screen.getByRole('button', { name: 'Enviar' }));

        expect(await screen.findByRole('alert')).toHaveTextContent(response.message);
        expect(creditBalance).not.toHaveBeenCalled();
    });

    it('desactiva el botón mientras procesa y no inicia dos cobros', async () => {
        let finishCharge: (result: RechargeResult) => void = () => undefined;
        vi.mocked(chargeCard).mockReturnValue(new Promise((resolve) => {
            finishCharge = resolve;
        }));
        render(<RechargeForm user={USER} creditBalance={vi.fn().mockReturnValue(100)} />);
        const user = await fillValidValues();

        await user.dblClick(screen.getByRole('button', { name: 'Enviar' }));

        expect(screen.getByRole('button', { name: 'Procesando...' })).toBeDisabled();
        expect(chargeCard).toHaveBeenCalledTimes(1);

        finishCharge(buildApprovedResult());
        await screen.findByRole('status');
        expect(screen.getByRole('button', { name: 'Enviar' })).toBeEnabled();
    });
});
