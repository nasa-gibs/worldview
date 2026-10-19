import { render } from '@testing-library/react';
import ChartingError from './charting-error';

describe('ChartingError', () => {
  it('renders without crashing when no props are provided', () => {
    const { container } = render(<ChartingError />);
    expect(container.querySelector('.charting-error-container')).toBeTruthy();
    expect(container.querySelector('.charting-error-text')).toBeTruthy();
  });

  it('renders the provided msg prop correctly', () => {
    const testMessage = 'An unexpected error occurred during charting.';
    const { getByText } = render(<ChartingError msg={testMessage} />);
    expect(getByText(testMessage)).toBeTruthy();
  });
});
