import React from 'react';
import { render } from '@testing-library/react';
import App from '../components/App/App';

test('renders learn react link', () => {
  const { getByText } = render(<App />);
  const linkElement = getByText(/select a data source/i);
  expect(linkElement).toBeInTheDocument();
});