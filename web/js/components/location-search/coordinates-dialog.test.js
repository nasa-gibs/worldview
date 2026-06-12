/* eslint-disable react/jsx-props-no-spreading */
/* eslint-disable react/prop-types */
import { render, fireEvent, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import CoordinatesDialog from './coordinates-dialog';

jest.mock('copy-to-clipboard', () => jest.fn(() => Promise.resolve(true)));
jest.mock('@fortawesome/react-fontawesome', () => ({
  FontAwesomeIcon: ({ icon, onClick }) => (
    <span data-testid={`icon-${icon}`} onClick={onClick} />
  ),
}));
jest.mock('reactstrap', () => ({
  UncontrolledTooltip: ({ children }) => <div>{children}</div>,
}));
jest.mock('./copy-tooltip', () => function MockCopyTooltip({ tooltipToggleTime }) {
  return <div data-testid="copy-tooltip" data-toggle-time={tooltipToggleTime} />;
});
jest.mock('./util', () => ({
  getFormattedCoordinates: jest.fn(() => '34.0500, -118.2400'),
}));
jest.mock('../../util/util', () => ({
  events: {
    on: jest.fn(),
    off: jest.fn(),
  },
}));
jest.mock('../../util/constants', () => ({
  LOCATION_SEARCH_COORDINATE_FORMAT: 'location-search:coordinate-format',
}));

import copy from 'copy-to-clipboard';
import { getFormattedCoordinates } from './util';
import util from '../../util/util';

const defaultProps = {
  coordinates: [34.05, -118.24],
  title: 'Los Angeles, CA',
  removeMarker: jest.fn(),
  removeCoordinatesDialog: jest.fn(),
  isMobile: false,
  tooltipId: 'test-tooltip-id',
};

describe('CoordinatesDialog', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    getFormattedCoordinates.mockReturnValue('34.0500, -118.2400');
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('renders title and formatted coordinates', () => {
    const { getByText } = render(<CoordinatesDialog {...defaultProps} />);
    expect(getByText('Los Angeles, CA')).toBeInTheDocument();
    expect(getByText('34.0500, -118.2400')).toBeInTheDocument();
  });

  test('renders without title when title prop is undefined', () => {
    const { container } = render(<CoordinatesDialog {...defaultProps} title={undefined} />);
    const titleEl = container.querySelector('.tooltip-coordinates-title');
    expect(titleEl).toBeEmptyDOMElement();
  });

  test('registers and deregisters event listener for coordinate format changes', () => {
    const { unmount } = render(<CoordinatesDialog {...defaultProps} />);
    expect(util.events.on).toHaveBeenCalledWith(
      'location-search:coordinate-format',
      expect.any(Function),
    );
    unmount();
    expect(util.events.off).toHaveBeenCalledWith(
      'location-search:coordinate-format',
      expect.any(Function),
    );
  });

  test('calls getFormattedCoordinates on mount', () => {
    render(<CoordinatesDialog {...defaultProps} />);
    expect(getFormattedCoordinates).toHaveBeenCalledWith([34.05, -118.24]);
  });

  test('calls copy-to-clipboard and updates tooltipToggleTime when copy button is clicked', async () => {
    const { container } = render(<CoordinatesDialog {...defaultProps} />);
    act(() => {
      jest.advanceTimersByTime(200);
    });
    const copyBtn = container.querySelector('#copy-coordinates-to-clipboard-button');
    await act(async () => {
      fireEvent.click(copyBtn);
      await Promise.resolve();
    });
    expect(copy).toHaveBeenCalledWith('34.0500, -118.2400', { format: 'text/plain' });
  });

  test('calls removeMarker prop when close button icon is clicked', () => {
    const removeMarker = jest.fn();
    const { getByTestId } = render(
      <CoordinatesDialog {...defaultProps} removeMarker={removeMarker} />,
    );
    fireEvent.click(getByTestId('icon-times'));
    expect(removeMarker).toHaveBeenCalledTimes(1);
  });

  test('calls removeCoordinatesDialog when minimize button icon is clicked', () => {
    const removeCoordinatesDialog = jest.fn();
    const { getByTestId } = render(
      <CoordinatesDialog {...defaultProps} removeCoordinatesDialog={removeCoordinatesDialog} />,
    );
    fireEvent.click(getByTestId('icon-minus'));
    expect(removeCoordinatesDialog).toHaveBeenCalledTimes(1);
  });

  test('shows CopyClipboardTooltip after 200ms', () => {
    const { queryByTestId } = render(<CoordinatesDialog {...defaultProps} />);
    expect(queryByTestId('copy-tooltip')).not.toBeInTheDocument();
    act(() => {
      jest.advanceTimersByTime(200);
    });
    expect(queryByTestId('copy-tooltip')).toBeInTheDocument();
  });

  test('updateCoordinateFormat re-calls getFormattedCoordinates', () => {
    render(<CoordinatesDialog {...defaultProps} />);
    const formatEventHandler = util.events.on.mock.calls[0][1];
    getFormattedCoordinates.mockReturnValue('34°3\'0"N, 118°14\'24"W');
    act(() => { formatEventHandler(); });
    expect(getFormattedCoordinates).toHaveBeenCalledTimes(2);
  });
});
