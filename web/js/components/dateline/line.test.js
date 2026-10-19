/* eslint-disable react/jsx-props-no-spreading */
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import Line from './line';
import OlOverlay from 'ol/Overlay';

jest.mock('ol/Overlay');
jest.mock('./text', () => {
  return function MockLineText() {
    return <div data-testid="line-text">LineText</div>;
  };
});
jest.mock('../../util/customHooks', () => ({
  __esModule: true,
  default: jest.fn(() => undefined),
}));

describe('Line Component', () => {
  const mockMap = {
    addOverlay: jest.fn(),
    getCoordinateFromPixel: jest.fn(() => [100, 200]),
  };

  const defaultProps = {
    id: 'test-line',
    alwaysShow: false,
    date: new Date('2023-01-01'),
    lineX: 50,
    lineY: 100,
    isCompareActive: false,
    style: null,
    map: mockMap,
    height: 500,
    setTextCoords: jest.fn(),
    textCoords: null,
    hideText: false,
    isMobilePhone: false,
    isMobileTablet: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    OlOverlay.mockClear();
  });

  test('renders SVG element with correct id', () => {
    render(<Line {...defaultProps} />);
    const svg = document.querySelector('#test-line');
    expect(svg).toBeInTheDocument();
    expect(svg).toHaveClass('dateline-case');
  });

  test('renders two line elements within SVG', () => {
    const { container } = render(<Line {...defaultProps} />);
    const lines = container.querySelectorAll('line');
    expect(lines).toHaveLength(2);
  });

  test('creates and adds OlOverlay on mount', () => {
    render(<Line {...defaultProps} />);
    expect(OlOverlay).toHaveBeenCalledWith({
      element: expect.any(Object),
      stopEvent: false,
    });
    expect(mockMap.addOverlay).toHaveBeenCalled();
  });

  test('sets overlay position on mount', () => {
    const mockOverlay = { setPosition: jest.fn() };
    OlOverlay.mockImplementation(() => mockOverlay);
    render(<Line {...defaultProps} />);
    expect(mockOverlay.setPosition).toHaveBeenCalledWith([50, 90]);
  });

  test('updates overlay position when lineX or lineY changes', () => {
    const mockOverlay = { setPosition: jest.fn() };
    OlOverlay.mockImplementation(() => mockOverlay);

    const { rerender } = render(<Line {...defaultProps} />);
    mockOverlay.setPosition.mockClear();

    rerender(<Line {...defaultProps} lineX={75} lineY={150} />);
    expect(mockOverlay.setPosition).toHaveBeenCalledWith([75, 150]);
  });

  test('toggles text active state on mouse over', () => {
    const { container } = render(<Line {...defaultProps} />);
    const svg = container.querySelector('svg');

    fireEvent.mouseOver(svg);
    const lineText = screen.getByTestId('line-text');
    expect(lineText).toBeInTheDocument();
  });

  test('toggles text active state on mouse out', () => {
    const { container } = render(<Line {...defaultProps} />);
    const svg = container.querySelector('svg');

    fireEvent.mouseOver(svg);
    fireEvent.mouseOut(svg);
    expect(screen.getByTestId('line-text')).toBeInTheDocument();
  });

  test('shows text when alwaysShow is true', () => {
    render(<Line {...defaultProps} alwaysShow />);
    expect(screen.getByTestId('line-text')).toBeInTheDocument();
  });

  test('shows text when isMobilePhone is true', () => {
    render(<Line {...defaultProps} isMobilePhone />);
    expect(screen.getByTestId('line-text')).toBeInTheDocument();
  });

  test('shows text when isMobileTablet is true', () => {
    render(<Line {...defaultProps} isMobileTablet />);
    expect(screen.getByTestId('line-text')).toBeInTheDocument();
  });

  test('hides text when hideText is true', () => {
    const { container } = render(<Line {...defaultProps} hideText alwaysShow />);
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });

  test('handles mouseOverHidden event', () => {
    const mockSetTextCoords = jest.fn();
    const { container } = render(
      <Line {...defaultProps} setTextCoords={mockSetTextCoords} />,
    );
    const hiddenLine = container.querySelector('.dateline-hidden');

    fireEvent.mouseOver(hiddenLine, { clientX: 100, clientY: 200 });
    expect(mockMap.getCoordinateFromPixel).toHaveBeenCalledWith([100, 200]);
  });

  test('calls setTextCoords after mouseOverHidden timeout', async () => {
    const mockSetTextCoords = jest.fn();
    const { container } = render(
      <Line {...defaultProps} setTextCoords={mockSetTextCoords} />,
    );
    const hiddenLine = container.querySelector('.dateline-hidden');

    fireEvent.mouseOver(hiddenLine, { clientX: 100, clientY: 200 });

    await waitFor(() => {
      expect(mockSetTextCoords).toHaveBeenCalledWith([100, 200]);
    }, { timeout: 500 });
  });

  test('clears timeout on mouseLeaveHidden', () => {
    const { container } = render(<Line {...defaultProps} />);
    const hiddenLine = container.querySelector('.dateline-hidden');

    fireEvent.mouseOver(hiddenLine, { clientX: 100, clientY: 200 });
    jest.useFakeTimers();
    fireEvent.mouseLeave(hiddenLine);
    jest.useRealTimers();
    expect(mockMap.getCoordinateFromPixel).toHaveBeenCalled();
  });

  test('disables text when alwaysShow changes from true to false', () => {
    const { rerender } = render(<Line {...defaultProps} alwaysShow />);
    rerender(<Line {...defaultProps} alwaysShow={false} />);
    expect(screen.getByTestId('line-text')).toBeInTheDocument();
  });

  test('applies correct opacity based on alwaysShow', () => {
    const { container, rerender } = render(<Line {...defaultProps} alwaysShow={false} />);
    let line = container.querySelector('line');
    expect(line).toHaveAttribute('opacity', '0');

    rerender(<Line {...defaultProps} alwaysShow />);
    line = container.querySelector('line');
    expect(line).toHaveAttribute('opacity', '0.5');
  });

  test('applies correct opacity on hover', () => {
    const { container } = render(<Line {...defaultProps} />);
    const svg = container.querySelector('svg');
    let line = container.querySelector('line');

    expect(line).toHaveAttribute('opacity', '0');
    fireEvent.mouseOver(svg);
    line = container.querySelector('line');
    expect(line).toHaveAttribute('opacity', '0.5');
  });

  test('renders LineText component with correct props', () => {
    render(<Line {...defaultProps} />);
    expect(screen.getByTestId('line-text')).toBeInTheDocument();
  });

  test('passes isLeft prop correctly to LineText when lineX is negative', () => {
    render(<Line {...defaultProps} lineX={-50} />);
    expect(screen.getByTestId('line-text')).toBeInTheDocument();
  });

  test('passes isLeft prop correctly to LineText when lineX is positive', () => {
    render(<Line {...defaultProps} lineX={50} />);
    expect(screen.getByTestId('line-text')).toBeInTheDocument();
  });

  test('has correct SVG attributes', () => {
    const { container } = render(<Line {...defaultProps} height={600} />);
    const svg = container.querySelector('svg');
    expect(svg).toHaveAttribute('height', '600');
    expect(svg).toHaveAttribute('width', '10');
  });

  test('renders with style prop applied to hidden line', () => {
    const customStyle = { pointerEvents: 'auto' };
    const { container } = render(
      <Line {...defaultProps} style={customStyle} />,
    );
    const hiddenLine = container.querySelector('.dateline-hidden');
    expect(hiddenLine).toBeInTheDocument();
  });

  test('line has correct dash array pattern', () => {
    const { container } = render(<Line {...defaultProps} />);
    const lines = container.querySelectorAll('line');
    expect(lines[0]).toHaveAttribute('stroke-dasharray', '5, 10');
  });

  test('hidden line has correct stroke width', () => {
    const { container } = render(<Line {...defaultProps} />);
    const hiddenLine = container.querySelector('.dateline-hidden');
    expect(hiddenLine).toHaveAttribute('stroke-width', '6');
  });

  test('maintains text active state across re-renders', () => {
    const { rerender, container } = render(<Line {...defaultProps} />);
    const svg = container.querySelector('svg');
    fireEvent.mouseOver(svg);

    rerender(<Line {...defaultProps} lineY={200} />);
    expect(screen.getByTestId('line-text')).toBeInTheDocument();
  });
});
