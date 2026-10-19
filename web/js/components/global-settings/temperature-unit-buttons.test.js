/* eslint-disable react/prop-types */
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import TemperatureUnitButtons from './temperature-unit-buttons';

jest.mock('../../modules/settings/constants', () => ({
  TEMPERATURE_UNITS: ['Celsius', 'Fahrenheit', 'Kelvin'],
}));

jest.mock('@fortawesome/react-fontawesome', () => ({
  FontAwesomeIcon: () => <svg data-testid="fa-icon" />,
}));

jest.mock('reactstrap', () => {
  const originalModule = jest.requireActual('reactstrap');
  return {
    ...originalModule,
    UncontrolledTooltip: ({ children }) => <div data-testid="tooltip">{children}</div>,
  };
});

describe('TemperatureUnitButtons Component', () => {
  const mockChangeTemperatureUnit = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders all temperature unit buttons and the Defaults button', () => {
    render(
      <TemperatureUnitButtons
        changeTemperatureUnit={mockChangeTemperatureUnit}
        globalTemperatureUnit="Celsius"
      />,
    );

    expect(screen.getByText('Temperature Unit')).toBeInTheDocument();
    expect(screen.getByText('Celsius')).toBeInTheDocument();
    expect(screen.getByText('Fahrenheit')).toBeInTheDocument();
    expect(screen.getByText('Kelvin')).toBeInTheDocument();
    expect(screen.getByText('Defaults')).toBeInTheDocument();
    expect(screen.getByTestId('tooltip')).toHaveTextContent('Applied to relevant temperature layers');
  });

  it('calls changeTemperatureUnit with the correct unit when a button is clicked', () => {
    render(
      <TemperatureUnitButtons
        changeTemperatureUnit={mockChangeTemperatureUnit}
        globalTemperatureUnit="Celsius"
      />,
    );

    fireEvent.click(screen.getByText('Fahrenheit'));
    expect(mockChangeTemperatureUnit).toHaveBeenCalledWith('Fahrenheit');
    expect(mockChangeTemperatureUnit).toHaveBeenCalledTimes(1);
  });

  it('calls changeTemperatureUnit with an empty string when the Defaults button is clicked', () => {
    render(
      <TemperatureUnitButtons
        changeTemperatureUnit={mockChangeTemperatureUnit}
        globalTemperatureUnit="Celsius"
      />,
    );

    fireEvent.click(screen.getByText('Defaults'));
    expect(mockChangeTemperatureUnit).toHaveBeenCalledWith('');
    expect(mockChangeTemperatureUnit).toHaveBeenCalledTimes(1);
  });

  it('sets the active state correctly based on globalTemperatureUnit prop', () => {
    const { rerender } = render(
      <TemperatureUnitButtons
        changeTemperatureUnit={mockChangeTemperatureUnit}
        globalTemperatureUnit="Fahrenheit"
      />,
    );

    expect(screen.getByText('Fahrenheit')).toHaveClass('active');
    expect(screen.getByText('Celsius')).not.toHaveClass('active');
    expect(screen.getByText('Defaults')).not.toHaveClass('active');

    rerender(
      <TemperatureUnitButtons
        changeTemperatureUnit={mockChangeTemperatureUnit}
        globalTemperatureUnit=""
      />,
    );

    expect(screen.getByText('Defaults')).toHaveClass('active');
    expect(screen.getByText('Fahrenheit')).not.toHaveClass('active');
  });
});
