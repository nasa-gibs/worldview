/* eslint-disable react/jsx-props-no-spreading */
/* eslint-disable react/prop-types */
import { render, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import LocationMarker from './location-marker';

jest.mock('./coordinates-dialog', () => function MockCoordinatesDialog({
  title, coordinates, removeMarker, removeCoordinatesDialog,
}) {
  return (
    <div data-testid="coordinates-dialog">
      <span data-testid="dialog-title">{title}</span>
      <span data-testid="dialog-coords">{coordinates.join(',')}</span>
      <button data-testid="remove-marker-btn" onClick={removeMarker}>remove</button>
      <button data-testid="minimize-btn" onClick={removeCoordinatesDialog}>minimize</button>
    </div>
  );
});

jest.mock('../../util/util', () => ({
  encodeId: jest.fn((str) => str.replace(/[.:,]/g, '_')),
}));

const baseProps = {
  coordinatesObject: { latitude: 34.05, longitude: -118.24 },
  reverseGeocodeResults: { address: null, error: null },
  removeMarker: jest.fn(),
  isMobile: false,
  dialogVisible: true,
};

describe('LocationMarker', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders dialog and pin image by default', () => {
    const { getByTestId } = render(<LocationMarker {...baseProps} />);
    expect(getByTestId('coordinates-dialog')).toBeInTheDocument();
    expect(document.querySelector('#marker-pin')).toBeInTheDocument();
  });

  test('passes latitude and longitude as coordinates to CoordinatesDialog', () => {
    const { getByTestId } = render(<LocationMarker {...baseProps} />);
    expect(getByTestId('dialog-coords')).toHaveTextContent('34.05,-118.24');
  });

  test('does not show dialog when dialogVisible is false', () => {
    const { queryByTestId } = render(
      <LocationMarker {...baseProps} dialogVisible={false} />,
    );
    expect(queryByTestId('coordinates-dialog')).not.toBeInTheDocument();
  });

  test('clicking pin image shows dialog after it was minimized', () => {
    const { getByTestId, queryByTestId } = render(
      <LocationMarker {...baseProps} dialogVisible={false} />,
    );
    expect(queryByTestId('coordinates-dialog')).not.toBeInTheDocument();
    fireEvent.click(document.querySelector('#marker-pin'));
    expect(getByTestId('coordinates-dialog')).toBeInTheDocument();
  });

  test('minimize button hides the dialog', () => {
    const { getByTestId, queryByTestId } = render(<LocationMarker {...baseProps} />);
    fireEvent.click(getByTestId('minimize-btn'));
    expect(queryByTestId('coordinates-dialog')).not.toBeInTheDocument();
  });

  test('remove marker button calls removeMarker prop', () => {
    const removeMarker = jest.fn();
    const { getByTestId } = render(
      <LocationMarker {...baseProps} removeMarker={removeMarker} />,
    );
    fireEvent.click(getByTestId('remove-marker-btn'));
    expect(removeMarker).toHaveBeenCalledTimes(1);
  });

  test('derives title from City and Region when both are present', () => {
    const props = {
      ...baseProps,
      reverseGeocodeResults: {
        address: {
          Match_addr: '123 Main St, Los Angeles, CA', City: 'Los Angeles', Region: 'CA', Subregion: null,
        },
        error: null,
      },
    };
    const { getByTestId } = render(<LocationMarker {...props} />);
    expect(getByTestId('dialog-title')).toHaveTextContent('Los Angeles, CA');
  });

  test('derives title from Subregion and Region when City is absent', () => {
    const props = {
      ...baseProps,
      reverseGeocodeResults: {
        address: {
          Match_addr: '123 Main St', City: null, Region: 'CA', Subregion: 'Los Angeles County',
        },
        error: null,
      },
    };
    const { getByTestId } = render(<LocationMarker {...props} />);
    expect(getByTestId('dialog-title')).toHaveTextContent('Los Angeles County, CA');
  });

  test('falls back to Match_addr when City and Subregion are absent', () => {
    const props = {
      ...baseProps,
      reverseGeocodeResults: {
        address: {
          Match_addr: 'Pacific Ocean', City: null, Region: null, Subregion: null,
        },
        error: null,
      },
    };
    const { getByTestId } = render(<LocationMarker {...props} />);
    expect(getByTestId('dialog-title')).toHaveTextContent('Pacific Ocean');
  });

  test('passes undefined title when there is an error in geocode results', () => {
    const props = {
      ...baseProps,
      reverseGeocodeResults: {
        address: { Match_addr: 'Somewhere', City: 'City', Region: 'Region' },
        error: 'some error',
      },
    };
    const { getByTestId } = render(<LocationMarker {...props} />);
    expect(getByTestId('dialog-title')).toBeEmptyDOMElement();
  });
});
