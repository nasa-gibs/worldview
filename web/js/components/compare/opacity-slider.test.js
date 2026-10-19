/* eslint-disable react/prop-types */
import { render, screen, fireEvent } from '@testing-library/react';
import OpacitySlider from './opacity-slider';

jest.mock('../util/monospace-date', () => {
  return function DummyMonospaceDate({ date }) {
    return <span data-testid="monospace-date">{date}</span>;
  };
});

describe('OpacitySlider', () => {
  it('renders correctly with same dates', () => {
    render(<OpacitySlider value={50} onSlide={jest.fn()} dateA="2023-01-01" dateB="2023-01-01" />);

    expect(screen.getByText('A')).toBeDefined();
    expect(screen.getByText('B')).toBeDefined();
    expect(screen.getByText('50 %')).toBeDefined();

    const dates = screen.getAllByTestId('monospace-date');
    expect(dates[0].textContent).toBe('');
    expect(dates[1].textContent).toBe('');
  });

  it('renders correctly with different dates', () => {
    render(<OpacitySlider value={75} onSlide={jest.fn()} dateA="2023-01-01" dateB="2023-01-02" />);

    const dates = screen.getAllByTestId('monospace-date');
    expect(dates[0].textContent).toBe(': 2023-01-01');
    expect(dates[1].textContent).toBe(': 2023-01-02');
  });

  it('calls onSlide and updates current value when slider is changed', () => {
    const onSlideMock = jest.fn();
    render(<OpacitySlider value={50} onSlide={onSlideMock} dateA="2023-01-01" dateB="2023-01-02" />);

    const slider = screen.getByRole('slider');
    fireEvent.change(slider, { target: { value: '80' } });

    expect(onSlideMock).toHaveBeenCalledWith(80);
    expect(screen.getByText('80 %')).toBeDefined();
  });
});
