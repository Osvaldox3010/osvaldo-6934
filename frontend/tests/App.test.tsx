import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import App from '../src/App';

describe('App', () => {
  it('muestra la página de registro', () => {
    render(<App />);

    expect(screen.getByRole('heading', { name: 'Crea tu cuenta' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Crear cuenta' })).toBeInTheDocument();
  });

  it('permite mostrar y ocultar cada contraseña del registro por separado', () => {
    render(<App />);

    const password = screen.getByLabelText('Contraseña');
    const confirmation = screen.getByLabelText('Confirmar contraseña');
    const showPasswordButton = screen.getByRole('button', { name: 'Mostrar contraseña' });
    const showConfirmationButton = screen.getByRole('button', { name: 'Mostrar confirmar contraseña' });

    fireEvent.click(showPasswordButton);

    expect(password).toHaveAttribute('type', 'text');
    expect(confirmation).toHaveAttribute('type', 'password');

    fireEvent.click(showPasswordButton);
    fireEvent.click(showConfirmationButton);

    expect(password).toHaveAttribute('type', 'password');
    expect(confirmation).toHaveAttribute('type', 'text');
  });

  it('permite mostrar y ocultar la contraseña al iniciar sesión', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole('link', { name: 'Inicia sesión' }));
    const password = screen.getByLabelText('Contraseña');

    await user.click(screen.getByRole('button', { name: 'Mostrar contraseña' }));
    expect(password).toHaveAttribute('type', 'text');

    await user.click(screen.getByRole('button', { name: 'Ocultar contraseña' }));
    expect(password).toHaveAttribute('type', 'password');
  });
});
