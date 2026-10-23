import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthProvider } from '../src/hooks/AuthProvider';
import { DashboardPage } from '../src/pages/DahsboardPage';
import { chargeCard } from '../src/services/snailpayClient';
import { STORAGE_KEYS } from '../src/services/storage.service';
import type { ChargeRequest, ChargeResponse, RechargeResult } from '../src/types/snailpay';

vi.mock('../src/services/snailpayClient', async (importOriginal) => {
    const original = await importOriginal<typeof import('../src/services/snailpayClient')>();

    return { ...original, chargeCard: vi.fn() };
});

const PROFILE = {
    id: 'user-1',
    fullName: 'Ana Pérez',
    email: 'ana@example.com',
    passwordHash: 'hash',
    dateCreated: '2026-10-22T00:00:00.000Z',
};

function seedLegacyUser() {
    localStorage.setItem(STORAGE_KEYS.user, JSON.stringify({
        ...PROFILE,
        balance: 0,
    }));
    localStorage.setItem(STORAGE_KEYS.balance, JSON.stringify(0));
    localStorage.setItem(STORAGE_KEYS.session, JSON.stringify({
        userId: PROFILE.id,
        startedAt: '2026-10-22T00:00:00.000Z',
    }));
}

function buildResponse(request: ChargeRequest, id: string): ChargeResponse {
    return {
        id,
        status: 'approved',
        status_detail: 'accredited',
        transaction_amount: request.amount,
        date_created: '2026-10-22T00:00:00.000Z',
        authorization_code: 'ABC123',
        reference: `SP-${id}`,
        payer_id: request.payer_id,
        payer_email: request.payer_email,
        card_number: request.card_number,
        cvv: request.cvv,
    };
}

function renderDashboard() {
    return render(
        <AuthProvider>
            <DashboardPage />
        </AuthProvider>,
    );
}

async function enterRecharge(amount: string, cardNumber = '1234 1234 1234 1234') {
    const user = userEvent.setup();
    const openButton = screen.getByRole('button', { name: 'Recargar saldo' });

    if (openButton.getAttribute('aria-expanded') !== 'true') {
        await user.click(openButton);
    }

    await user.clear(screen.getByLabelText(/Número de tarjeta/));
    await user.type(screen.getByLabelText(/Número de tarjeta/), cardNumber);
    await user.clear(screen.getByLabelText(/Vencimiento/));
    await user.type(screen.getByLabelText(/Vencimiento/), '12/26');
    await user.clear(screen.getByLabelText(/CVV/));
    await user.type(screen.getByLabelText(/CVV/), '543');
    await user.clear(screen.getByLabelText(/Nombre del titular/));
    await user.type(screen.getByLabelText(/Nombre del titular/), 'Ana Pérez');
    await user.clear(screen.getByLabelText(/Monto/));
    await user.type(screen.getByLabelText(/Monto/), amount);
    await user.click(screen.getByRole('button', { name: 'Enviar' }));
}

describe('recarga conectada al dashboard y al almacenamiento', () => {
    beforeEach(() => {
        localStorage.clear();
        vi.mocked(chargeCard).mockReset();
    });

    it('actualiza el saldo al instante, lo guarda y lo conserva al volver a montar', async () => {
        seedLegacyUser();
        vi.mocked(chargeCard).mockImplementation(async (request) => ({
            kind: 'approved',
            response: buildResponse(request, 'charge-1'),
        }));
        const firstRender = renderDashboard();

        expect(screen.getByText('$0.00')).toBeInTheDocument();
        await enterRecharge('100');

        expect(await screen.findByRole('status')).toHaveTextContent('La recarga de $100.00 fue aprobada.');
        await waitFor(() => expect(screen.getByText('$100.00')).toBeInTheDocument());

        const savedProfile = JSON.parse(localStorage.getItem(STORAGE_KEYS.user) ?? '{}');
        expect(savedProfile.balance).toBe(100);
        expect(savedProfile.appliedChargeIds).toEqual(['charge-1']);
        expect(savedProfile.lastPayment).toEqual({
            cardNumber: '1234123412341234',
            cvv: '543',
        });

        firstRender.unmount();
        renderDashboard();

        expect(screen.getByText('$100.00')).toBeInTheDocument();
        expect(JSON.parse(localStorage.getItem(STORAGE_KEYS.user) ?? '{}').balance).toBe(100);
    });

    it('suma dos cobros aprobados diferentes', async () => {
        seedLegacyUser();
        let nextChargeId = 1;
        vi.mocked(chargeCard).mockImplementation(async (request) => ({
            kind: 'approved',
            response: buildResponse(request, `charge-${nextChargeId++}`),
        }));
        renderDashboard();

        await enterRecharge('100');
        await screen.findByRole('status');
        await enterRecharge('50');
        await screen.findByRole('status');

        expect(screen.getByText('$150.00')).toBeInTheDocument();
    });

    it('no cambia el saldo tras un rechazo', async () => {
        seedLegacyUser();
        vi.mocked(chargeCard).mockResolvedValue({
            kind: 'rejected',
            message: 'La tarjeta fue rechazada. Prueba con otra.',
        });
        renderDashboard();

        await enterRecharge('100');

        expect(await screen.findByRole('alert')).toHaveTextContent('La tarjeta fue rechazada.');
        expect(screen.getByText('$0.00')).toBeInTheDocument();
    });

    it('no suma dos veces una respuesta aprobada con el mismo identificador', async () => {
        seedLegacyUser();
        vi.mocked(chargeCard).mockImplementation(async (request) => ({
            kind: 'approved',
            response: buildResponse(request, 'same-charge'),
        }));
        renderDashboard();

        await enterRecharge('100');
        await screen.findByRole('status');
        await enterRecharge('100');

        expect(await screen.findByRole('alert')).toHaveTextContent('ya se había aplicado');
        expect(screen.getByText('$100.00')).toBeInTheDocument();
    });

    it.each([
        ['servicio no disponible', { kind: 'unavailable', message: 'SnailPay no está disponible.' }],
        ['timeout', { kind: 'timeout', message: 'SnailPay tardó demasiado en responder.' }],
        ['error de red', { kind: 'network', message: 'No se pudo conectar con SnailPay.' }],
    ] as const)('no cambia el saldo con %s', async (_name, response) => {
        seedLegacyUser();
        vi.mocked(chargeCard).mockResolvedValue(response as RechargeResult);
        renderDashboard();

        await enterRecharge('100');

        expect(await screen.findByRole('alert')).toHaveTextContent(response.message);
        expect(screen.getByText('$0.00')).toBeInTheDocument();
    });
});
