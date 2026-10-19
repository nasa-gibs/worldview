/* eslint-disable react/prop-types */
/* eslint-disable react/jsx-props-no-spreading */
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import LoopButton from './loop-button';

jest.mock('@fortawesome/react-fontawesome', () => ({
  FontAwesomeIcon: () => <svg data-testid="fa-icon" />,
}));

jest.mock('reactstrap', () => ({
  UncontrolledTooltip: ({ children, target }) => (
    <div data-testid="tooltip" data-target={target}>{children}</div>
  ),
}));

describe('LoopButton Component', () => {
  let defaultProps;

  beforeEach(() => {
    defaultProps = {
      looping: false,
      onLoop: jest.fn(),
      isMobile: false,
    };
  });

  it('renders correctly in desktop mode when not looping', () => {
    render(<LoopButton {...defaultProps} />);

    const button = screen.getByRole('button', { name: 'Enable animation loop' });
    expect(button).toBeInTheDocument();
    expect(button).toHaveClass('wv-loop-icon-case wv-icon-case no-drag');
    expect(button).not.toHaveClass('active');

    expect(screen.getByTestId('tooltip')).toHaveTextContent('Enable animation loop');
    expect(screen.getByTestId('tooltip')).toHaveAttribute('data-target', 'loop-button');
    expect(screen.getByTestId('fa-icon')).toBeInTheDocument();
  });

  it('renders correctly when looping is true', () => {
    render(<LoopButton {...defaultProps} looping />);

    const button = screen.getByRole('button', { name: 'Disable animation loop' });
    expect(button).toHaveClass('wv-loop-icon-case wv-icon-case no-drag active');

    expect(screen.getByTestId('tooltip')).toHaveTextContent('Disable animation loop');
  });

  it('does not render tooltip when in mobile mode', () => {
    render(<LoopButton {...defaultProps} isMobile />);

    expect(screen.queryByTestId('tooltip')).not.toBeInTheDocument();
  });

  it('calls onLoop when button is clicked', () => {
    render(<LoopButton {...defaultProps} />);

    const button = screen.getByRole('button');
    fireEvent.click(button);

    expect(defaultProps.onLoop).toHaveBeenCalledTimes(1);
  });
});
