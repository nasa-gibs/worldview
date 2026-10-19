/* eslint-disable react/prop-types */
/* eslint-disable react/jsx-props-no-spreading */
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import GifPanelGrid from './gif-panel-grid'; // adjust the import path if necessary

// Mock the child components to isolate the testing to GifPanelGrid
jest.mock('../util/monospace-date', () => {
  return function MockMonospaceDate({ date }) {
    return <span data-testid="monospace-date">{date}</span>;
  };
});

jest.mock('@fortawesome/react-fontawesome', () => ({
  FontAwesomeIcon: () => <svg data-testid="fa-icon" />,
}));

describe('GifPanelGrid Component', () => {
  const defaultProps = {
    startDate: '2026-05-01',
    endDate: '2026-05-20',
    speed: 10,
    increment: '1 Day',
    valid: true,
    height: 1080,
    width: 1920,
    maxImageDimensionSize: 4096,
    maxGifSize: 250,
    requestSize: 125.556,
  };

  it('renders correctly with valid props', () => {
    render(<GifPanelGrid {...defaultProps} />);

    // Check basic text rendering
    expect(screen.getByText('Start Date:')).toBeInTheDocument();
    expect(screen.getByText('End Date:')).toBeInTheDocument();
    expect(screen.getByText('10 Frames Per Second')).toBeInTheDocument();
    expect(screen.getByText('1 Day')).toBeInTheDocument();
    expect(screen.getByText('4096px')).toBeInTheDocument();
    expect(screen.getByText('1920px x 1080px')).toBeInTheDocument();

    // Check mocked MonospaceDate components
    const dates = screen.getAllByTestId('monospace-date');
    expect(dates[0]).toHaveTextContent('2026-05-01');
    expect(dates[1]).toHaveTextContent('2026-05-20');

    // Check renderImageSize output for valid state
    expect(screen.getByText('250 MB / ~125.56 MB')).toBeInTheDocument();

    // Ensure the invalid icon is NOT rendered
    expect(screen.queryByTestId('fa-icon')).not.toBeInTheDocument();

    // Ensure the dimension container does NOT have the invalid class
    const dimensionContainer = screen.getByText('4096px').parentElement;
    expect(dimensionContainer).toHaveClass('grid-child gif-max-size');
    expect(dimensionContainer).not.toHaveClass('gif-size-invalid');
  });

  it('renders correctly with invalid props (exceeds size/dimensions)', () => {
    const invalidProps = {
      ...defaultProps,
      valid: false,
      requestSize: 300.123, // Larger than maxGifSize
    };

    render(<GifPanelGrid {...invalidProps} />);

    // Check renderImageSize output for invalid state
    // Note the tilde string differences: "~300.12 MB" vs "/ ~125.56 MB"
    expect(screen.getByText('250 MB ~300.12 MB')).toBeInTheDocument();

    // The 'times' icon should now be rendered
    expect(screen.getByTestId('fa-icon')).toBeInTheDocument();

    // The size container should have the invalid class
    const sizeContainer = screen.getByText('250 MB ~300.12 MB').parentElement;
    expect(sizeContainer).toHaveClass('gif-size-invalid');

    // Ensure the max dimension container has the invalid class
    const dimensionContainer = screen.getByText('4096px').parentElement;
    expect(dimensionContainer).toHaveClass('gif-size-invalid');
  });
});
