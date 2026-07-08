/* eslint-disable react/prop-types */
/* eslint-disable react/jsx-props-no-spreading */
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import LoadingIndicator from './loading-indicator';

jest.mock('reactstrap', () => ({
  Modal: ({ children, isOpen }) => (isOpen ? <div data-testid="modal">{children}</div> : null),
  ModalHeader: ({ children, close }) => (
    <div data-testid="modal-header">
      {children}
      {close}
    </div>
  ),
  ModalBody: ({ children }) => <div data-testid="modal-body">{children}</div>,
  Progress: ({ value }) => <div data-testid="progress-bar" data-value={value} />,
}));

describe('LoadingIndicator Component', () => {
  let defaultProps;

  beforeEach(() => {
    jest.clearAllMocks();
    defaultProps = {
      onClose: jest.fn(),
      title: 'Loading Data',
      bodyMsg: 'Please wait while we load your data...',
      loadedItems: 25,
      totalItems: 100,
      isKioskModeActive: false,
    };
  });

  it('renders correctly with title, body message, and calculates progress', () => {
    render(<LoadingIndicator {...defaultProps} />);

    expect(screen.getByTestId('modal')).toBeInTheDocument();
    expect(screen.getByText('Loading Data')).toBeInTheDocument();
    expect(screen.getByText('Please wait while we load your data...')).toBeInTheDocument();

    const progressBar = screen.getByTestId('progress-bar');
    expect(progressBar).toBeInTheDocument();
    expect(progressBar).toHaveAttribute('data-value', '25');
  });

  it('calculates complex progress values correctly', () => {
    render(<LoadingIndicator {...defaultProps} loadedItems={3} totalItems={7} />);

    const progressBar = screen.getByTestId('progress-bar');
    expect(progressBar).toHaveAttribute('data-value', '43');
  });

  it('does not render if isKioskModeActive is true', () => {
    const { container } = render(<LoadingIndicator {...defaultProps} isKioskModeActive />);

    expect(screen.queryByTestId('modal')).not.toBeInTheDocument();
    expect(container).toBeEmptyDOMElement();
  });

  it('calls onClose when the close button is clicked', () => {
    render(<LoadingIndicator {...defaultProps} />);

    const closeBtn = screen.getByRole('button');
    fireEvent.click(closeBtn);

    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
  });

  it('does not render the body message if bodyMsg is not provided', () => {
    render(<LoadingIndicator {...defaultProps} bodyMsg={undefined} />);

    expect(screen.queryByText('Please wait while we load your data...')).not.toBeInTheDocument();
  });

  it('does not render the progress bar if totalItems is not provided', () => {
    render(<LoadingIndicator {...defaultProps} totalItems={undefined} />);

    expect(screen.queryByTestId('progress-bar')).not.toBeInTheDocument();
  });
});
