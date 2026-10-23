import { useState } from 'react';
import { Link } from 'react-router-dom';
import { TextField } from './TextField';
import { useAuth } from '../hooks/useAuth';
import { validateRegisterForm } from '../validators/register.validator';
import type { RegisterFormErrors, RegisterFormValues } from '../types/auth';
import '../styles/RegisterPage.css';

const initialValues: RegisterFormValues = {
    fullName: '',
    email: '',
    password: '',
    confirmation: '',
};

export function RegisterPage() {
    const { register } = useAuth();
    const [values, setValues] = useState<RegisterFormValues>(initialValues);
    const [errors, setErrors] = useState<RegisterFormErrors>({});
    const [formError, setFormError] = useState('');
    const [isRegistered, setIsRegistered] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    function updateValue(field: keyof RegisterFormValues, value: string) {
        setValues((currentValues) => ({ ...currentValues, [field]: value }));
        setErrors((currentErrors) => ({ ...currentErrors, [field]: undefined }));
        setFormError('');
        setIsRegistered(false);
    }

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();

        const validationErrors = validateRegisterForm(values);
        setErrors(validationErrors);
        setFormError('');
        setIsRegistered(false);

        if (Object.keys(validationErrors).length > 0) {
            return;
        }

        setIsSubmitting(true);

        try {
            const result = await register({
                fullName: values.fullName,
                email: values.email,
                password: values.password,
            });

            if (result.ok) {
                setIsRegistered(true);
                return;
            }

            switch (result.reason) {
                case 'account_exists':
                    setFormError('Ya existe una cuenta registrada.');
                    break;
                case 'storage_failed':
                    setFormError('No se pudo guardar la cuenta. Inténtalo de nuevo.');
                    break;
                case 'invalid_input':
                    setFormError('Revisa los datos ingresados e inténtalo de nuevo.');
                    break;
            }
        } catch {
            setFormError('No se pudo completar el registro. Inténtalo de nuevo.');
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <main className="auth-page auth-page--register">
            <section className="auth-card" aria-labelledby="register-title">
                <div className="auth-content">
                    <header className="auth-header">
                        <h1 id="register-title">Crea tu cuenta</h1>
                        <p>¿Ya tienes una cuenta? <Link to="/login">Inicia sesión</Link></p>
                    </header>
                    <form className="auth-form" onSubmit={handleSubmit} noValidate>
                        <TextField
                            id="fullName"
                            label="Nombre completo"
                            placeholder="Nombre completo"
                            autoComplete="name"
                            value={values.fullName}
                            error={errors.fullName}
                            onChange={(value) => updateValue('fullName', value)}
                        />
                        <TextField
                            id="email"
                            label="Correo electrónico"
                            placeholder="Correo electrónico"
                            type="email"
                            autoComplete="email"
                            value={values.email}
                            error={errors.email}
                            onChange={(value) => updateValue('email', value)}
                        />
                        <TextField
                            id="password"
                            label="Contraseña"
                            placeholder="Contraseña"
                            type="password"
                            showPasswordToggle
                            autoComplete="new-password"
                            value={values.password}
                            error={errors.password}
                            onChange={(value) => updateValue('password', value)}
                        />
                        <TextField
                            id="confirmation"
                            label="Confirmar contraseña"
                            placeholder="Confirmar contraseña"
                            type="password"
                            showPasswordToggle
                            autoComplete="new-password"
                            value={values.confirmation}
                            error={errors.confirmation}
                            onChange={(value) => updateValue('confirmation', value)}
                        />
                        {formError && <p role="alert">{formError}</p>}
                        {isRegistered && <p role="status">Tu cuenta se creó correctamente.</p>}
                        <button className="auth-submit" type="submit" disabled={isSubmitting}>
                            {isSubmitting ? 'Creando cuenta…' : 'Crear cuenta'}
                        </button>
                    </form>
                </div>
                <figure className="auth-illustration">
                    <img src="/images/snail.png" alt="Ilustración de un caracol morado" />
                </figure>
            </section>
        </main>
    );
}
