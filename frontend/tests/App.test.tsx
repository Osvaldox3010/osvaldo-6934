import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import App from '../src/App';

describe('App', () => {
  it('muestra la página de registro', () => {
    render(<App />);

    expect(screen.getByRole('heading', { name: 'Crea tu cuenta' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Crear cuenta' })).toBeInTheDocument();
  });
});
