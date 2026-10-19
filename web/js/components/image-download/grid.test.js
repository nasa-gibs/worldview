/* eslint-disable react/jsx-props-no-spreading */
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import ResolutionTable from './grid';

describe('ResolutionTable', () => {
  const defaultProps = {
    fileSize: '2',
    width: 100,
    height: 200,
    maxImageSize: '4096',
    onClick: jest.fn(),
    validLayers: true,
    validSize: true,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders valid image size and maximum size when validSize is true', () => {
    render(<ResolutionTable {...defaultProps} />);

    expect(screen.getByText('Raw Size')).toBeInTheDocument();
    expect(screen.getByText('Maximum')).toBeInTheDocument();
    expect(screen.getByText('~2 MB')).toBeInTheDocument();

    const imageSizeContainer = screen.getByText('~2 MB').closest('#wv-image-size');
    expect(imageSizeContainer).toHaveClass('wv-image-size');
    expect(imageSizeContainer).not.toHaveClass('wv-image-size-invalid');

    const maxSizeContainer = screen.getByText('4096').closest('.wv-image-max-size');
    expect(maxSizeContainer).toHaveClass('wv-image-max-size');
    expect(maxSizeContainer).not.toHaveClass('wv-image-size-invalid');

    expect(screen.getByText('100 x 200px')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Download' })).toBeEnabled();
  });

  it('renders invalid image size and marks maximum size invalid when validSize is false', () => {
    render(
      <ResolutionTable
        {...defaultProps}
        validSize={false}
        fileSize="3"
        width={5}
        height={10}
        maxImageSize="1024"
      />,
    );

    const invalidSizeContainer = screen.getByText('~3MB').closest('#wv-image-size');
    expect(invalidSizeContainer).toHaveClass('wv-image-size-invalid');

    const maxSizeContainer = screen.getByText('1024').closest('.wv-image-max-size');
    expect(maxSizeContainer).toHaveClass('wv-image-max-size');
    expect(maxSizeContainer).toHaveClass('wv-image-size-invalid');

    expect(screen.getByText('5 x 10px')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Download' })).toBeDisabled();
  });

  it('calls onClick with width and height when the Download button is clicked', async () => {
    const onClick = jest.fn();
    render(<ResolutionTable {...defaultProps} onClick={onClick} />);

    fireEvent.click(screen.getByRole('button', { name: 'Download' }));

    expect(onClick).toHaveBeenCalledTimes(1);
    expect(onClick).toHaveBeenCalledWith(100, 200);
  });
});
