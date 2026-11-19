import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import VectorFilter from './vector-filter';

const defaultProps = {
  start: 0,
  end: 100,
  min: 0,
  max: 100,
  index: 0,
  layerId: 'test-vector-layer',
  groupName: 'active',
  setFilterRange: jest.fn(),
};

const renderFilter = (overrides = {}) => {
  const props = { ...defaultProps, ...overrides };
  return render(
    <VectorFilter
      start={props.start}
      end={props.end}
      min={props.min}
      max={props.max}
      index={props.index}
      layerId={props.layerId}
      groupName={props.groupName}
      setFilterRange={props.setFilterRange}
    />,
  );
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe('VectorFilter', () => {
  describe('layout', () => {
    it('renders the Filters heading', () => {
      renderFilter();
      expect(screen.getByText('Filters')).toBeInTheDocument();
    });

    it('renders the range slider', () => {
      renderFilter();
      expect(screen.getByRole('slider')).toBeInTheDocument();
    });

    it('renders min and max placeholder labels', () => {
      renderFilter();
      expect(screen.getByText('0')).toBeInTheDocument();
      expect(screen.getByText('100')).toBeInTheDocument();
    });

    it('renders the outer container with correct class', () => {
      const { container } = renderFilter();
      expect(container.querySelector('.layer-threshold-select')).toBeInTheDocument();
    });
  });

  describe('slider attributes', () => {
    it('sets slider min attribute', () => {
      renderFilter({ min: 10 });
      expect(screen.getByRole('slider')).toHaveAttribute('min', '10');
    });

    it('sets slider max attribute', () => {
      renderFilter({ max: 200 });
      expect(screen.getByRole('slider')).toHaveAttribute('max', '200');
    });

    it('sets slider defaultValue to end prop', () => {
      renderFilter({ end: 75 });
      expect(screen.getByRole('slider')).toHaveAttribute('value', '75');
    });
  });

  describe('onChange / updateFilter', () => {
    it('calls debounced setFilterRange when end slider changes', () => {
      jest.useFakeTimers();
      const setFilterRange = jest.fn();
      renderFilter({ setFilterRange, start: 10, end: 90 });
      fireEvent.change(screen.getByRole('slider'), { target: { value: '60' } });
      jest.runAllTimers();
      expect(setFilterRange).toHaveBeenCalledWith('test-vector-layer', 10, 60, 0, 'active');
      jest.useRealTimers();
    });

    it('does not call setFilterRange when value is unchanged from current end', () => {
      jest.useFakeTimers();
      const setFilterRange = jest.fn();
      renderFilter({ setFilterRange, start: 0, end: 100 });
      fireEvent.change(screen.getByRole('slider'), { target: { value: '100' } });
      jest.runAllTimers();
      expect(setFilterRange).not.toHaveBeenCalled();
      jest.useRealTimers();
    });

    it('passes parsed integer values to setFilterRange', () => {
      jest.useFakeTimers();
      const setFilterRange = jest.fn();
      renderFilter({ setFilterRange, start: 0, end: 100 });
      fireEvent.change(screen.getByRole('slider'), { target: { value: '50' } });
      jest.runAllTimers();
      expect(setFilterRange).toHaveBeenCalledWith('test-vector-layer', 0, 50, 0, 'active');
      jest.useRealTimers();
    });
  });
});
