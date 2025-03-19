import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';

test('renders chat interface', () => {
  render(<App />);
  const inputElement = screen.getByPlaceholderText(/napisz wiadomość/i);
  expect(inputElement).toBeInTheDocument();
});
