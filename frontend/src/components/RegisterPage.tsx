import { useState } from 'react';
import { Link } from 'react-router-dom';
import { TextField } from './TextField';
import { useAuth } from '../hooks/useAuth';
import { validateRegisterForm } from '../validators/register.validator';
import type { RegisterFormErrors, RegisterFormValues } from '../types/auth';

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
        <main>
            <h1>Crea tu cuenta</h1>
            <form onSubmit={handleSubmit} noValidate>
                <TextField
                    id="fullName"
                    label="Nombre completo"
                    value={values.fullName}
                    error={errors.fullName}
                    onChange={(value) => updateValue('fullName', value)}
                />
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
                <TextField
                    id="confirmation"
                    label="Confirmar contraseña"
                    type="password"
                    value={values.confirmation}
                    error={errors.confirmation}
                    onChange={(value) => updateValue('confirmation', value)}
                />
                {formError && <p role="alert">{formError}</p>}
                {isRegistered && <p role="status">Tu cuenta se creó correctamente.</p>}
                <button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? 'Creando cuenta…' : 'Crear cuenta'}
                </button>
                <Link to="/login">¿Ya tienes tu cuenta? Inicia sesión</Link>
            </form>
        </main>
    );
}
