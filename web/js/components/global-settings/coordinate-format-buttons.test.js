/* eslint-disable react/jsx-props-no-spreading */
/* eslint-disable react/prop-types */
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import CoordinateFormatButtons from './coordinate-format-buttons';

jest.mock('@fortawesome/react-fontawesome', () => ({
  FontAwesomeIcon: () => <span data-testid="font-awesome-icon" />,
}));

jest.mock('reactstrap', () => ({
  Button: ({ children, onClick, id, ...props }) => (
    <button onClick={onClick} id={id} data-testid={`button-${id}`} {...props}>
      {children}
    </button>
  ),
  ButtonGroup: ({ children }) => <div data-testid="button-group">{children}</div>,
  UncontrolledTooltip: ({ children, id, target }) => (
    <div data-testid={`tooltip-${id}`} data-target={target}>
      {children}
    </div>
  ),
}));

describe('CoordinateFormatButtons', () => {
  it('should render the component with heading', () => {
    const mockChangeCoordinateFormat = jest.fn();
    render(
      <CoordinateFormatButtons
        changeCoordinateFormat={mockChangeCoordinateFormat}
        coordinateFormat="latlon-dd"
      />,
    );

    expect(
      screen.getByText(/Coordinate Format \(latitude, longitude\)/i),
    ).toBeInTheDocument();
  });

  it('should render tooltip with correct text', () => {
    const mockChangeCoordinateFormat = jest.fn();
    render(
      <CoordinateFormatButtons
        changeCoordinateFormat={mockChangeCoordinateFormat}
        coordinateFormat="latlon-dd"
      />,
    );

    expect(
      screen.getByText('Applied to all on screen coordinates'),
    ).toBeInTheDocument();
  });

  it('should render info icon', () => {
    const mockChangeCoordinateFormat = jest.fn();
    render(
      <CoordinateFormatButtons
        changeCoordinateFormat={mockChangeCoordinateFormat}
        coordinateFormat="latlon-dd"
      />,
    );

    expect(screen.getByTestId('font-awesome-icon')).toBeInTheDocument();
  });

  it('should render three buttons for each coordinate format', () => {
    const mockChangeCoordinateFormat = jest.fn();
    render(
      <CoordinateFormatButtons
        changeCoordinateFormat={mockChangeCoordinateFormat}
        coordinateFormat="latlon-dd"
      />,
    );

    expect(screen.getByTestId('button-group')).toBeInTheDocument();
    expect(screen.getByTestId('button-latlon-dd-btn')).toBeInTheDocument();
    expect(screen.getByTestId('button-latlon-dm-btn')).toBeInTheDocument();
    expect(screen.getByTestId('button-latlon-dms-btn')).toBeInTheDocument();
  });

  it('should display correct label text on buttons', () => {
    const mockChangeCoordinateFormat = jest.fn();
    render(
      <CoordinateFormatButtons
        changeCoordinateFormat={mockChangeCoordinateFormat}
        coordinateFormat="latlon-dd"
      />,
    );

    expect(screen.getByText('DD')).toBeInTheDocument();
    expect(screen.getByText('DDM')).toBeInTheDocument();
    expect(screen.getByText('DMS')).toBeInTheDocument();
  });

  it('should call changeCoordinateFormat when DD button is clicked', () => {
    const mockChangeCoordinateFormat = jest.fn();
    render(
      <CoordinateFormatButtons
        changeCoordinateFormat={mockChangeCoordinateFormat}
        coordinateFormat="latlon-dm"
      />,
    );

    fireEvent.click(screen.getByTestId('button-latlon-dd-btn'));
    expect(mockChangeCoordinateFormat).toHaveBeenCalledWith('latlon-dd');
    expect(mockChangeCoordinateFormat).toHaveBeenCalledTimes(1);
  });

  it('should call changeCoordinateFormat when DDM button is clicked', () => {
    const mockChangeCoordinateFormat = jest.fn();
    render(
      <CoordinateFormatButtons
        changeCoordinateFormat={mockChangeCoordinateFormat}
        coordinateFormat="latlon-dd"
      />,
    );

    fireEvent.click(screen.getByTestId('button-latlon-dm-btn'));
    expect(mockChangeCoordinateFormat).toHaveBeenCalledWith('latlon-dm');
    expect(mockChangeCoordinateFormat).toHaveBeenCalledTimes(1);
  });

  it('should call changeCoordinateFormat when DMS button is clicked', () => {
    const mockChangeCoordinateFormat = jest.fn();
    render(
      <CoordinateFormatButtons
        changeCoordinateFormat={mockChangeCoordinateFormat}
        coordinateFormat="latlon-dd"
      />,
    );

    fireEvent.click(screen.getByTestId('button-latlon-dms-btn'));
    expect(mockChangeCoordinateFormat).toHaveBeenCalledWith('latlon-dms');
    expect(mockChangeCoordinateFormat).toHaveBeenCalledTimes(1);
  });

  it('should have correct aria labels on buttons', () => {
    const mockChangeCoordinateFormat = jest.fn();
    render(
      <CoordinateFormatButtons
        changeCoordinateFormat={mockChangeCoordinateFormat}
        coordinateFormat="latlon-dd"
      />,
    );

    expect(screen.getByLabelText('Set latlon-dd Format')).toBeInTheDocument();
    expect(screen.getByLabelText('Set latlon-dm Format')).toBeInTheDocument();
    expect(screen.getByLabelText('Set latlon-dms Format')).toBeInTheDocument();
  });

  it('should have settings-component className on root div', () => {
    const mockChangeCoordinateFormat = jest.fn();
    const { container } = render(
      <CoordinateFormatButtons
        changeCoordinateFormat={mockChangeCoordinateFormat}
        coordinateFormat="latlon-dd"
      />,
    );

    expect(container.querySelector('.settings-component')).toBeInTheDocument();
  });

  it('should have correct wv-header className on h3', () => {
    const mockChangeCoordinateFormat = jest.fn();
    const { container } = render(
      <CoordinateFormatButtons
        changeCoordinateFormat={mockChangeCoordinateFormat}
        coordinateFormat="latlon-dd"
      />,
    );

    expect(container.querySelector('.wv-header')).toBeInTheDocument();
  });

  it('should render tooltip with correct id and target', () => {
    const mockChangeCoordinateFormat = jest.fn();
    render(
      <CoordinateFormatButtons
        changeCoordinateFormat={mockChangeCoordinateFormat}
        coordinateFormat="latlon-dd"
      />,
    );

    const tooltip = screen.getByTestId('tooltip-coordinate-setting-tooltip');
    expect(tooltip).toHaveAttribute('data-target', 'coordinate-format-buttons-info-icon');
  });
});
