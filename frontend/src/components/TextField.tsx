import { useState } from 'react';

type TextFieldProps = {
    id: string;
    label: string;
    type?: 'text' | 'email' | 'password';
    name?: string;
    inputMode?: 'none' | 'text' | 'tel' | 'url' | 'email' | 'numeric' | 'decimal' | 'search';
    maxLength?: number;
    className?: string;
    showPasswordToggle?: boolean;
    placeholder?: string;
    value: string;
    error?: string;
    autoComplete?: string;
    onChange: (value: string) => void;
};

export function TextField({
    id,
    label,
    type = 'text',
    name,
    inputMode,
    maxLength,
    className,
    showPasswordToggle = false,
    placeholder,
    value,
    error,
    autoComplete,
    onChange,
}: TextFieldProps) {
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);
    const inputType = showPasswordToggle && isPasswordVisible ? 'text' : type;

    return (
        <div className="auth-field">
            <label htmlFor={id}>{label}</label>
            <div className={`auth-field__input-wrapper${showPasswordToggle ? ' auth-field__input-wrapper--with-toggle' : ''}`}>
                <input
                    id={id}
                    name={name}
                    type={inputType}
                    inputMode={inputMode}
                    placeholder={placeholder}
                    autoComplete={autoComplete}
                    maxLength={maxLength}
                    className={className}
                    value={value}
                    onChange={(event) => onChange(event.target.value)}
                    aria-invalid={error !== undefined}
                    aria-describedby={error !== undefined ? `${id}-error` : undefined}
                />
                {showPasswordToggle && (
                    <button
                        className="auth-field__password-toggle"
                        type="button"
                        aria-label={`${isPasswordVisible ? 'Ocultar' : 'Mostrar'} ${label.toLowerCase()}`}
                        aria-pressed={isPasswordVisible}
                        onClick={() => setIsPasswordVisible((visible) => !visible)}
                    >
                        <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                            {isPasswordVisible ? (
                                <>
                                    <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z" />
                                    <circle cx="12" cy="12" r="3" />
                                    <path d="m3 3 18 18" />
                                </>
                            ) : (
                                <>
                                    <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z" />
                                    <circle cx="12" cy="12" r="3" />
                                </>
                            )}
                        </svg>
                    </button>
                )}
            </div>
            {error !== undefined && (
                <p id={`${id}-error`} role="alert">
                    {error}
                </p>
            )}
        </div>
    );
}