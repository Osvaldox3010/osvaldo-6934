import { useState } from 'react';
import { Link } from 'react-router-dom';
import { TextField } from './TextField';
import { useAuth } from '../hooks/useAuth';
import { validateLoginForm } from '../validators/register.validator';
import type { LoginFormErrors, LoginFormValues } from '../types/auth';

const initialValues: LoginFormValues = {
    email: '',
    password: '',
};

export function LoginPage() {
    const { login } = useAuth();
    const [values, setValues] = useState<LoginFormValues>(initialValues);
    const [errors, setErrors] = useState<LoginFormErrors>({});
    const [formError, setFormError] = useState('');
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    function updateValue(field: keyof LoginFormValues, value: string) {
        setValues((currentValues) => ({ ...currentValues, [field]: value }));
        setErrors((currentErrors) => ({ ...currentErrors, [field]: undefined }));
        setFormError('');
        setIsLoggedIn(false);
    }

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();

        const validationErrors = validateLoginForm(values);
        if (!values.email.trim()) {
            validationErrors.email = 'Escribe tu correo';
        }
        if (!values.password.trim()) {
            validationErrors.password = 'Escribe tu contraseña';
        }
        setErrors(validationErrors);
        setFormError('');
        setIsLoggedIn(false);

        if (Object.keys(validationErrors).length > 0) {
            return;
        }

        setIsSubmitting(true);

        try {
            const result = await login({
                email: values.email,
                password: values.password,
            });

            if (result.ok) {
                setIsLoggedIn(true);
                return;
            }

            switch (result.reason) {
                case 'storage_failed':
                    setFormError('No se pudo iniciar sesión. Inténtalo de nuevo.');
                    break;
                case 'invalid_credentials':
                    setFormError('Revisa los datos ingresados e inténtalo de nuevo.');
                    break;
            }
        } catch {
            setFormError('No se pudo completar el inicio de sesión. Inténtalo de nuevo.');
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <main>
            <h1>Inicia sesión</h1>
            <form onSubmit={handleSubmit} noValidate>
                <TextField
                    id="email"
                    label="Correo electrónico"
                    type="email"
                    value={values.email}
                    error={errors.email}
                    onChange={(value) => updateValue('email', value)}
                />
                <TextField
                    id="password"
                    label="Contraseña"
                    type="password"
                    value={values.password}
                    error={errors.password}
                    onChange={(value) => updateValue('password', value)}
                />
                {formError && <p role="alert">{formError}</p>}
                {isLoggedIn && <p role="status">Has iniciado sesión correctamente.</p>}
                <button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? 'Entrando…' : 'Entrar'}
                </button>
                <Link to="/register">¿No tienes cuenta? Regístrate</Link>
            </form>
        </main>
    );
}
