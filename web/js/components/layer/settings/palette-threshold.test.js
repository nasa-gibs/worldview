/* eslint-disable react/prop-types */
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';

jest.mock('../../util/checkbox', () => {
  function MockCheckbox({
    id, checked, onCheck, label,
  }) {
    return (
      <label htmlFor={id}>
        <input
          id={id}
          type="checkbox"
          checked={checked}
          onChange={onCheck}
          data-testid={`checkbox-${id}`}
        />
        {label}
      </label>
    );
  }
  return MockCheckbox;
});
jest.mock('../../../modules/settings/util', () => ({
  checkTemperatureUnitConversion: jest.fn(() => ({
    needsConversion: false,
    legendTempUnit: null,
  })),
  convertPaletteValue: jest.fn((v) => v),
}));

import PaletteThreshold from './palette-threshold';

const legend = {
  refs: ['ref0', 'ref1', 'ref2', 'ref3', 'ref4'],
  tooltips: ['0°C', '25°C', '50°C', '75°C', '100°C'],
  units: 'K',
  minLabel: null,
  maxLabel: null,
};

const palette = {
  entries: { refs: ['ref0', 'ref1', 'ref2', 'ref3', 'ref4'] },
  squash: false,
  noclip: false,
};

const defaultProps = {
  legend,
  palette,
  setRange: jest.fn(),
  min: 0,
  max: 4,
  start: 0,
  end: 4,
  squashed: false,
  noclipped: false,
  index: 0,
  groupName: 'active',
  layerId: 'test-layer',
  globalTemperatureUnit: '',
};

const renderThreshold = (overrides = {}) => {
  const props = { ...defaultProps, ...overrides };
  return render(
    <PaletteThreshold
      legend={props.legend}
      palette={props.palette}
      setRange={props.setRange}
      min={props.min}
      max={props.max}
      start={props.start}
      end={props.end}
      squashed={props.squashed}
      noclipped={props.noclipped}
      index={props.index}
      groupName={props.groupName}
      layerId={props.layerId}
      globalTemperatureUnit={props.globalTemperatureUnit}
    />,
  );
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe('PaletteThreshold', () => {
  describe('layout', () => {
    it('renders the Thresholds heading', () => {
      renderThreshold();
      expect(screen.getByText('Thresholds')).toBeInTheDocument();
    });

    it('renders Squash Palette checkbox', () => {
      renderThreshold();
      expect(screen.getByText('Squash Palette')).toBeInTheDocument();
    });

    it('renders Clip Palette checkbox', () => {
      renderThreshold();
      expect(screen.getByText('Clip Palette')).toBeInTheDocument();
    });

    it('renders two range inputs (min and max sliders)', () => {
      renderThreshold();
      expect(screen.getAllByRole('slider')).toHaveLength(2);
    });
  });

  describe('squash checkbox', () => {
    it('renders unchecked when squashed is false', () => {
      renderThreshold({ squashed: false });
      expect(screen.getByTestId('checkbox-wv-squash-button-check0')).not.toBeChecked();
    });

    it('renders checked when squashed is true', () => {
      renderThreshold({ squashed: true });
      expect(screen.getByTestId('checkbox-wv-squash-button-check0')).toBeChecked();
    });

    it('calls setRange when squash checkbox is toggled', () => {
      const setRange = jest.fn();
      renderThreshold({ setRange });
      fireEvent.click(screen.getByTestId('checkbox-wv-squash-button-check0'));
      expect(setRange).toHaveBeenCalled();
    });
  });

  describe('clip (noclip) checkbox', () => {
    it('renders checked (Clip active) when noclipped is false', () => {
      renderThreshold({ noclipped: false });
      expect(screen.getByTestId('checkbox-wv-clip-button-check0')).toBeChecked();
    });

    it('renders unchecked when noclipped is true', () => {
      renderThreshold({ noclipped: true });
      expect(screen.getByTestId('checkbox-wv-clip-button-check0')).not.toBeChecked();
    });

    it('calls setRange when clip checkbox is toggled', () => {
      const setRange = jest.fn();
      renderThreshold({ setRange });
      fireEvent.click(screen.getByTestId('checkbox-wv-clip-button-check0'));
      expect(setRange).toHaveBeenCalled();
    });
  });

  describe('threshold sliders', () => {
    it('start slider has name="min"', () => {
      renderThreshold();
      const sliders = screen.getAllByRole('slider');
      expect(sliders[0]).toHaveAttribute('name', 'min');
    });

    it('end slider has name="max"', () => {
      renderThreshold();
      const sliders = screen.getAllByRole('slider');
      expect(sliders[1]).toHaveAttribute('name', 'max');
    });

    it('calls debounced setRange when start slider changes to a new value', () => {
      jest.useFakeTimers();
      const setRange = jest.fn();
      renderThreshold({ setRange, start: 0, end: 4 });
      const sliders = screen.getAllByRole('slider');
      fireEvent.change(sliders[0], { target: { value: '1' } });
      jest.runAllTimers();
      expect(setRange).toHaveBeenCalled();
      jest.useRealTimers();
    });

    it('calls debounced setRange when end slider changes to a new value', () => {
      jest.useFakeTimers();
      const setRange = jest.fn();
      renderThreshold({ setRange, start: 0, end: 4 });
      const sliders = screen.getAllByRole('slider');
      fireEvent.change(sliders[1], { target: { value: '3' } });
      jest.runAllTimers();
      expect(setRange).toHaveBeenCalled();
      jest.useRealTimers();
    });
  });

  describe('label display', () => {
    it('renders the start tooltip label with units appended', () => {
      renderThreshold({ start: 0, end: 4 });
      expect(screen.getByText('0°C K')).toBeInTheDocument();
    });

    it('renders the end tooltip label with units appended', () => {
      renderThreshold({ start: 0, end: 4 });
      expect(screen.getByText('100°C K')).toBeInTheDocument();
    });

    it('appends units to non-zero start label', () => {
      renderThreshold({ start: 1, end: 4 });
      expect(screen.getByText('25°C K')).toBeInTheDocument();
    });
  });
});
