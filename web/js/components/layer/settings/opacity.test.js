import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import OpacitySelect from './opacity';

const layer = { id: 'test-layer' };

const renderOpacity = (overrides = {}) => {
  const props = { layer, start: 100, setOpacity: jest.fn(), ...overrides };
  return render(
    <OpacitySelect
      layer={props.layer}
      start={props.start}
      setOpacity={props.setOpacity}
    />,
  );
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe('OpacitySelect', () => {
  describe('layout', () => {
    it('renders the Opacity heading', () => {
      renderOpacity();
      expect(screen.getByText('Opacity')).toBeInTheDocument();
    });

    it('renders the range slider', () => {
      renderOpacity();
      expect(screen.getByRole('slider')).toBeInTheDocument();
    });

    it('renders the opacity label', () => {
      renderOpacity({ start: 75 });
      expect(screen.getByText('75%')).toBeInTheDocument();
    });

    it('defaults to 100% when start is not provided', () => {
      render(<OpacitySelect layer={layer} setOpacity={jest.fn()} />);
      expect(screen.getByText('100%')).toBeInTheDocument();
    });
  });

  describe('slider attributes', () => {
    it('sets slider defaultValue to the start prop', () => {
      renderOpacity({ start: 60 });
      expect(screen.getByRole('slider')).toHaveAttribute('value', '60');
    });
  });

  describe('onChange', () => {
    it('updates the displayed percentage when slider changes', () => {
      renderOpacity({ start: 100 });
      fireEvent.change(screen.getByRole('slider'), { target: { value: '50' } });
      expect(screen.getByText('50%')).toBeInTheDocument();
    });

    it('calls setOpacity with layer id and normalized value', () => {
      const setOpacity = jest.fn();
      jest.useFakeTimers();
      renderOpacity({ start: 100, setOpacity });
      fireEvent.change(screen.getByRole('slider'), { target: { value: '80' } });
      jest.runAllTimers();
      expect(setOpacity).toHaveBeenCalledWith('test-layer', '0.80');
      jest.useRealTimers();
    });

    it('passes opacity as 2 decimal string to setOpacity', () => {
      const setOpacity = jest.fn();
      jest.useFakeTimers();
      renderOpacity({ start: 100, setOpacity });
      fireEvent.change(screen.getByRole('slider'), { target: { value: '33' } });
      jest.runAllTimers();
      expect(setOpacity).toHaveBeenCalledWith('test-layer', '0.33');
      jest.useRealTimers();
    });
  });
});
