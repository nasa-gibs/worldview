/* eslint-disable react/prop-types */
/* eslint-disable react/jsx-props-no-spreading */
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import GifResults from './gif-post-creation';
import FileSaver from 'file-saver';
import googleTagManager from 'googleTagManager';

jest.mock('file-saver', () => ({
  saveAs: jest.fn(),
}));

jest.mock('googleTagManager', () => ({
  pushEvent: jest.fn(),
}));

jest.mock('util', () => ({
  format: jest.fn().mockImplementation((fmt, start, end) => `nasa-worldview-${start}-to-${end}.gif`),
}));

jest.mock('lodash/capitalize', () => jest.fn((str) => str.charAt(0).toUpperCase() + str.slice(1)));

jest.mock('../util/monospace-date', () => {
  return function MockMonospaceDate({ date }) {
    return <span data-testid={`date-${date}`}>{date}</span>;
  };
});

jest.mock('../util/button', () => {
  return function MockButton({ text, onClick }) {
    return (
      <button data-testid="download-button" onClick={onClick}>
        {text}
      </button>
    );
  };
});

jest.mock('reactstrap', () => ({
  Modal: ({ children, style, className }) => <div data-testid="modal" className={className} style={style}>{children}</div>,
  ModalHeader: ({ children }) => <div data-testid="modal-header">{children}</div>,
  ModalBody: ({ children }) => <div data-testid="modal-body">{children}</div>,
}));

describe('GifResults Component', () => {
  let defaultProps;

  beforeAll(() => {
    global.URL.createObjectURL = jest.fn(() => 'mock-blob-url');
  });

  afterAll(() => {
    global.URL.createObjectURL.mockRestore();
  });

  beforeEach(() => {
    jest.clearAllMocks();

    defaultProps = {
      speed: 10,
      startDate: '2026-05-01',
      endDate: '2026-05-20',
      increment: 'days',
      gifObject: { blob: new Blob(['mock-data'], { type: 'image/gif' }), size: 15 },
      boundaries: { x: 0, y: 0, x2: 1000, y2: 800 },
      screenWidth: 1920,
      screenHeight: 1080,
      onClose: jest.fn(),
      closeBtn: <button>Close</button>,
    };
  });

  it('renders correctly with calculated styles and dimensions', () => {
    const { container } = render(<GifResults {...defaultProps} />);

    expect(screen.getByTestId('modal')).toBeInTheDocument();
    expect(screen.getByTestId('modal-header')).toBeInTheDocument();

    const img = container.querySelector('img');
    expect(img).toHaveAttribute('src', 'mock-blob-url');
    expect(img).toHaveAttribute('width', '1000');
    expect(img).toHaveAttribute('height', '800');

    expect(screen.getByText('15 MB')).toBeInTheDocument();
    expect(screen.getByText('10 fps')).toBeInTheDocument();
    expect(screen.getByText('Days')).toBeInTheDocument();

    expect(screen.getByTestId('date-2026-05-01')).toBeInTheDocument();
    expect(screen.getByTestId('date-2026-05-20')).toBeInTheDocument();
  });

  it('restricts image dimensions based on screen size', () => {
    const smallScreenProps = {
      ...defaultProps,
      screenWidth: 1000,
      screenHeight: 800,
    };

    const { container } = render(<GifResults {...smallScreenProps} />);

    const img = container.querySelector('img');
    expect(img).toHaveAttribute('width', '802');
    expect(img).toHaveAttribute('height', '680');
  });

  it('triggers download and pushes googleTagManager event for medium size', () => {
    render(<GifResults {...defaultProps} />);

    const downloadBtn = screen.getByTestId('download-button');
    fireEvent.click(downloadBtn);

    expect(FileSaver.saveAs).toHaveBeenCalledWith(defaultProps.gifObject.blob, 'nasa-worldview-2026-05-01-to-2026-05-20.gif');

    expect(googleTagManager.pushEvent).toHaveBeenCalledWith({
      event: 'GIF_download',
      GIF: {
        downloadSize: '5MB-25MB',
        increments: 'days',
        frameSpeed: 10,
      },
    });
  });

  it('pushes googleTagManager event with size range <5MB', () => {
    const smallGifProps = {
      ...defaultProps,
      gifObject: { blob: new Blob(), size: 3 },
    };

    render(<GifResults {...smallGifProps} />);

    fireEvent.click(screen.getByTestId('download-button'));

    expect(googleTagManager.pushEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        GIF: expect.objectContaining({ downloadSize: '<5MB' }),
      }),
    );
  });

  it('pushes googleTagManager event with size range >25MB', () => {
    const largeGifProps = {
      ...defaultProps,
      gifObject: { blob: new Blob(), size: 30 },
    };

    render(<GifResults {...largeGifProps} />);

    fireEvent.click(screen.getByTestId('download-button'));

    expect(googleTagManager.pushEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        GIF: expect.objectContaining({ downloadSize: '>25MB' }),
      }),
    );
  });
});
