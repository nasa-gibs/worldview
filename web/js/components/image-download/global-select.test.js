import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';

jest.mock('../util/checkbox', () => ({
  __esModule: true,
  default: ({ onCheck, checked, id, label }) => (
    <label htmlFor={id} data-testid="mock-checkbox">
      <input
        id={id}
        type="checkbox"
        checked={!!checked}
        onChange={() => onCheck && onCheck()}
        aria-label={label}
      />
      {label}
    </label>
  ),
}));

import GlobalSelectCheckbox from './global-select';

describe('GlobalSelectCheckbox', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
    jest.resetAllMocks();
  });

  test('returns null when proj is not geographic', () => {
    const { container } = render(
      <GlobalSelectCheckbox
        proj="fakeproj"
        geoLatLong={[[0, 0], [10, 10]]}
        onLatLongChange={jest.fn()}
        map={{ getView: () => ({ setCenter: jest.fn(), setZoom: jest.fn() }) }}
      />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  test('renders checkbox and reflects global selected state', () => {
    const global = [-180, -90, 180, 90];
    const geoLatLong = [[global[0], global[1]], [global[2], global[3]]];

    render(
      <GlobalSelectCheckbox
        proj="geographic"
        geoLatLong={geoLatLong}
        onLatLongChange={jest.fn()}
        map={{ getView: () => ({ setCenter: jest.fn(), setZoom: jest.fn() }) }}
      />,
    );

    const checkbox = screen.getByTestId('mock-checkbox').querySelector('input[type="checkbox"]');
    expect(checkbox).toBeInTheDocument();
    expect(checkbox).toBeChecked();
  });

  test('clicking checkbox toggles and calls onLatLongChange after timeout and recenters map', () => {
    const initial = [[10, 20], [30, 40]];
    const onLatLongChange = jest.fn();
    const setCenter = jest.fn();
    const setZoom = jest.fn();
    const map = { getView: () => ({ setCenter, setZoom }) };

    render(
      <GlobalSelectCheckbox
        proj="geographic"
        geoLatLong={initial}
        onLatLongChange={onLatLongChange}
        map={map}
      />,
    );

    const checkboxLabel = screen.getByTestId('mock-checkbox');
    const checkbox = checkboxLabel.querySelector('input[type="checkbox"]');
    expect(checkbox).not.toBeChecked();

    fireEvent.click(checkbox);

    expect(setCenter).toHaveBeenCalledWith([0, 0]);
    expect(setZoom).toHaveBeenCalledWith(0);

    expect(onLatLongChange).not.toHaveBeenCalled();
    jest.advanceTimersByTime(50);
    expect(onLatLongChange).toHaveBeenCalledWith([-180, -90, 180, 90]);
  });
});
