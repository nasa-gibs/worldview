/* eslint-disable react/jsx-props-no-spreading */
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import ImageDownloadWarning from './image-download-warning';

describe('ImageDownloadWarning Component', () => {
  const defaultProps = {
    message: 'Test warning message',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders without crashing', () => {
    render(<ImageDownloadWarning {...defaultProps} />);
    expect(screen.getByText('Test warning message')).toBeInTheDocument();
  });

  test('displays the message prop', () => {
    const message = 'This is a test warning';
    render(<ImageDownloadWarning {...defaultProps} message={message} />);
    expect(screen.getByText(message)).toBeInTheDocument();
  });

  test('displays the message prop (info)', () => {
    const type = 'info';
    render(<ImageDownloadWarning {...defaultProps} type={type} />);
    const infoIconContainer = screen.getByTestId(`image-download-${type}-container`);
    expect(infoIconContainer).toBeInTheDocument();
  });

  test('displays the message prop (warning)', () => {
    const type = 'warning';
    render(<ImageDownloadWarning {...defaultProps} type={type} />);
    const infoIconContainer = screen.getByTestId(`image-download-${type}-container`);
    expect(infoIconContainer).toBeInTheDocument();
  });

  test('displays the message prop (error)', () => {
    const type = 'error';
    render(<ImageDownloadWarning {...defaultProps} type={type} />);
    const infoIconContainer = screen.getByTestId(`image-download-${type}-container`);
    expect(infoIconContainer).toBeInTheDocument();
  });
});
