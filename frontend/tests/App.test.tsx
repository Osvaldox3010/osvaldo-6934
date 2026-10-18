import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import App from '../src/App';

describe('App', () => {
  it('muestra el título de la aplicación', () => {
    render(<App />);

    expect(
      screen.getByRole('heading', { name: 'Carreras de caracoles' }),
    ).toBeInTheDocument();
  });
});
