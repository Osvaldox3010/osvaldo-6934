import { useEffect, useRef, useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { RechargeForm } from "./RechargeForm";
import { formatCurrency } from "../services/dashboardStats";

type DashboardHeaderProps = {
    fullName: string;
    balance: number;
    onLogout: () => void;
};

export function DashboardHeader({ fullName, balance, onLogout }: DashboardHeaderProps) {
    const [isRechargeOpen, setIsRechargeOpen] = useState(false);
    const dialogRef = useRef<HTMLDialogElement>(null);
    const { user, creditBalance } = useAuth();

    useEffect(() => {
        const dialog = dialogRef.current;
        if (!dialog) {
            return;
        }
        if (isRechargeOpen && !dialog.open) dialog.showModal();
        if (!isRechargeOpen && dialog.open) dialog.close();
    }, [isRechargeOpen]);

    return (
        <>
            <header className="dashboard-header">
                <div className="dashboard-header__copy">
                    <p className="dashboard-header__eyebrow">Panel de control</p>
                    <h1>Hola, {fullName}</h1>
                    <div className="dashboard-header__balance">
                        <span>Saldo actual</span>
                        <div className="dashboard-header__balance-amount">
                            <strong>{formatCurrency(balance)}</strong>
                            <button
                                className="dashboard-header__recharge-button"
                                type="button"
                                aria-expanded={isRechargeOpen}
                                aria-controls="recharge-form"
                                onClick={() => setIsRechargeOpen(true)}
                            >
                                Recargar saldo
                            </button>
                        </div>
                        <span className="dashboard-header__balance-hint">
                            Agrega saldo a tu cuenta para seguir participando.
                        </span>
                    </div>
                </div>
                <div className="dashboard-header__actions">
                    <button className="dashboard-logout" type="button" onClick={onLogout}>
                        Cerrar sesión
                    </button>
                </div>
            </header>
            <dialog
                ref={dialogRef}
                id="recharge-form"
                className="recharge-modal"
                aria-labelledby="recharge-modal-title"
                onClose={() => setIsRechargeOpen(false)}
            >
                <div className="recharge-modal__content">
                    <header className="recharge-modal__header">
                        <h2 id="recharge-modal-title">Recargar saldo</h2>
                        <button
                            className="recharge-modal__close-button"
                            type="button"
                            aria-label="Cerrar"
                            onClick={() => setIsRechargeOpen(false)}
                        >
                            ×
                        </button>
                    </header>
                    {user !== null && (
                        <RechargeForm user={user} creditBalance={creditBalance} />
                    )}
                </div>
            </dialog>
        </>
    );
}
