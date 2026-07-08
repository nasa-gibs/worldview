import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import MonospaceDate from './monospace-date';

describe('MonospaceDate', () => {
  it('renders a span with className "monospace"', () => {
    const { container } = render(<MonospaceDate />);
    expect(container.querySelector('.monospace')).toBeInTheDocument();
  });

  it('renders the date string', () => {
    render(<MonospaceDate date="2024-01-15" />);
    expect(screen.getByText('2024-01-15')).toBeInTheDocument();
  });

  it('renders children alongside the date', () => {
    render(<MonospaceDate date="2024-01-15"><span data-testid="child">icon</span></MonospaceDate>);
    expect(screen.getByTestId('child')).toBeInTheDocument();
    expect(screen.getByText('2024-01-15')).toBeInTheDocument();
  });

  it('renders with no date and no children without throwing', () => {
    expect(() => render(<MonospaceDate />)).not.toThrow();
  });

  it('renders children without a date', () => {
    render(<MonospaceDate><span data-testid="only-child">child</span></MonospaceDate>);
    expect(screen.getByTestId('only-child')).toBeInTheDocument();
  });

  it('renders children before date text in DOM order', () => {
    render(<MonospaceDate date="2024-06-05"><span data-testid="prefix">T:</span></MonospaceDate>);
    const span = screen.getByText('2024-06-05').closest('.monospace');
    const children = Array.from(span.childNodes);
    const childIndex = children.findIndex((n) => n.dataset?.testid === 'prefix');
    const dateIndex = children.findIndex((n) => n.textContent === '2024-06-05');
    expect(childIndex).toBeLessThan(dateIndex);
  });
});
