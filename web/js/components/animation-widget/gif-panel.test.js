/* eslint-disable react/prop-types */
/* eslint-disable react/jsx-props-no-spreading */
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import GifPanel from './gif-panel';
import { getDimensions } from '../../modules/gif-download/util';

jest.mock('../../modules/gif-download/util', () => ({
  getDimensions: jest.fn(),
}));

jest.mock('../util/selector', () => {
  return function MockSelectionList(props) {
    return (
      <select
        data-testid="selection-list"
        value={props.value}
        onChange={(e) => props.onChange(props.optionName, e.target.value)}
      >
        <option value="1km">1km</option>
        <option value="2km">2km</option>
      </select>
    );
  };
});

jest.mock('./gif-panel-grid', () => {
  return function MockGifPanelGrid(props) {
    return (
      <div data-testid="gif-panel-grid">
        <span data-testid="grid-valid">{props.valid.toString()}</span>
        <span data-testid="grid-request-size">{props.requestSize}</span>
        <button data-testid="grid-download-click" onClick={props.onClick}>Grid Download</button>
      </div>
    );
  };
});

jest.mock('../util/button', () => {
  return function MockButton(props) {
    return (
      <button
        data-testid={props.text ? `button-${props.text.replace(/\s+/g, '-')}` : 'button-default'}
        onClick={props.onClick}
        disabled={props.valid === false}
      >
        {props.text || 'Default Button'}
      </button>
    );
  };
});

jest.mock('../util/checkbox', () => {
  return function MockCheckbox(props) {
    return (
      <input
        type="checkbox"
        data-testid="checkbox-dates"
        checked={props.checked}
        onChange={props.onCheck}
      />
    );
  };
});

describe('GifPanel Component', () => {
  let defaultProps;

  beforeEach(() => {
    jest.clearAllMocks();

    defaultProps = {
      projId: 'geographic',
      lonlats: [0, 0, 10, 10],
      startDate: '2026-05-01',
      endDate: '2026-05-20',
      onCheck: jest.fn(),
      showDates: true,
      numberOfFrames: 10,
      firstLabel: 'Resolution (per pixel):',
      onClick: jest.fn(),
      onDownloadClick: jest.fn(),
      speed: 5,
      resolutions: { '1km': '1km', '2km': '2km' },
      resolution: '1km',
      increment: '1 Day',
    };

    getDimensions.mockReturnValue({ width: 1000, height: 1000 });
  });

  it('renders correctly with valid dimensions and calculates request size', () => {
    render(<GifPanel {...defaultProps} />);

    expect(screen.getByText('Resolution (per pixel):')).toBeInTheDocument();

    expect(screen.getByTestId('grid-request-size')).toHaveTextContent('28.59');
    expect(screen.getByTestId('grid-valid')).toHaveTextContent('true');
  });

  it('handles resolution change which updates state', () => {
    render(<GifPanel {...defaultProps} />);

    const selector = screen.getByTestId('selection-list');
    fireEvent.change(selector, { target: { value: '2km' } });

    expect(getDimensions).toHaveBeenLastCalledWith('geographic', [0, 0, 10, 10], '2km');
  });

  it('triggers onClick handler with width and height for Create GIF button', () => {
    render(<GifPanel {...defaultProps} />);

    const createBtn = screen.getByTestId('button-Create-GIF');
    fireEvent.click(createBtn);

    expect(defaultProps.onClick).toHaveBeenCalledWith(1000, 1000);
  });

  it('triggers onCheck handler for checkbox', () => {
    render(<GifPanel {...defaultProps} />);

    const checkbox = screen.getByTestId('checkbox-dates');
    fireEvent.click(checkbox);

    expect(defaultProps.onCheck).toHaveBeenCalled();
  });

  it('evaluates valid=false if request size exceeds MAX_GIF_SIZE', () => {
    getDimensions.mockReturnValue({ width: 8000, height: 8000 });

    render(<GifPanel {...defaultProps} />);

    expect(screen.getByTestId('grid-valid')).toHaveTextContent('false');
  });

  it('evaluates valid=false if width or height is 0', () => {
    getDimensions.mockReturnValue({ width: 0, height: 1000 });
    render(<GifPanel {...defaultProps} />);
    expect(screen.getByTestId('grid-valid')).toHaveTextContent('false');

    getDimensions.mockReturnValue({ width: 1000, height: 0 });
    render(<GifPanel {...defaultProps} />);
    expect(screen.getAllByTestId('grid-valid')[1]).toHaveTextContent('false');
  });

  it('evaluates valid=false if width or height exceeds MAX_IMAGE_DIMENSION_SIZE (8200)', () => {
    getDimensions.mockReturnValue({ width: 8201, height: 100 });
    render(<GifPanel {...defaultProps} numberOfFrames={1} />);
    expect(screen.getByTestId('grid-valid')).toHaveTextContent('false');

    getDimensions.mockReturnValue({ width: 100, height: 8201 });
    render(<GifPanel {...defaultProps} numberOfFrames={1} />);
    expect(screen.getAllByTestId('grid-valid')[1]).toHaveTextContent('false');
  });

  it('passes onDownloadClick to GifPanelGrid', () => {
    render(<GifPanel {...defaultProps} />);
    const gridDownloadBtn = screen.getByTestId('grid-download-click');
    fireEvent.click(gridDownloadBtn);

    expect(defaultProps.onDownloadClick).toHaveBeenCalled();
  });
});
