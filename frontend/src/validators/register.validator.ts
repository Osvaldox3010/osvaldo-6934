import { LoginInput, RegisterFormErrors, RegisterFormValues, LoginFormErrors } from "../types/auth";

export function isValidFullName(value: unknown): boolean {
    if (typeof value !== 'string') {
        return false;
    }

    const name = value.trim();

    return name.length >= 3 && name.length <= 80 && /^\p{L}[\p{L} .'-]*$/u.test(name);
}

export function isValidEmail(value: unknown): boolean {
    return typeof value === 'string' && value.length < 255 && /^[^\s@]+@[^\s@.]+(?:\.[^\s@.]+)+$/.test(value);
}

export function isValidPassword(value: unknown): boolean {
    return typeof value === 'string' && value.length >= 8 && value.length <= 128 &&
                            /[A-Z]/.test(value) &&
                            /[a-z]/.test(value) &&
                            /[0-9]/.test(value);
}

export function doPasswordsMatch(password: unknown, confirmation: unknown): boolean{
    return typeof password === 'string' && typeof confirmation === 'string' && password === confirmation;
}

export function validateRegisterForm(values: RegisterFormValues): RegisterFormErrors {

    const errors: RegisterFormErrors = {};

    if(!isValidFullName(values.fullName)) {
        errors.fullName = 'Escribe tu nombre completo. Entre 3 y 80 caracteres';
    }
    
    if (!isValidEmail(values.email)) {
        errors.email = 'Escribe un correo válido';
    }

    if(!isValidPassword(values.password)) {
        errors.password = 'Contraseña inválida. La contraseña debe contener 8 caracteres o más, con una minúscula, mayúscula y un número';
    }

    if(!doPasswordsMatch(values.password, values.confirmation)) {
        errors.confirmation = 'Las contraseñas no coinciden';
    }

    return errors;
}

export function validateLoginForm(values: LoginInput): LoginFormErrors {
    const errors: LoginFormErrors = {};

    if(values.email.trim() === '' || values.email === null) {
        errors.email = 'Escribe tu correo';
    }

    if(values.password.trim() === '' || values.password === null) {
        errors.password = 'Escribe tu contraseña';
    }

    return errors;
}