/* eslint-disable react/prop-types */
/* eslint-disable react/jsx-props-no-spreading */
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import PlayButton from './play-button';

jest.mock('@fortawesome/react-fontawesome', () => ({
  FontAwesomeIcon: ({ icon }) => <svg data-testid={`fa-icon-${icon}`} />,
}));

jest.mock('reactstrap', () => ({
  UncontrolledTooltip: ({ children, target }) => (
    <div data-testid="tooltip" data-target={target}>{children}</div>
  ),
}));

describe('PlayButton Component', () => {
  let defaultProps;

  beforeEach(() => {
    defaultProps = {
      playing: false,
      pause: jest.fn(),
      play: jest.fn(),
      isDisabled: false,
      isMobile: false,
    };
  });

  it('renders correctly when not playing and not disabled', () => {
    render(<PlayButton {...defaultProps} />);

    const button = screen.getByRole('button', { name: 'Play animation' });
    expect(button).toBeInTheDocument();
    expect(button).toHaveClass('wv-anim-play-case wv-icon-case no-drag');
    expect(button).not.toHaveClass('disabled');

    expect(screen.getByTestId('tooltip')).toHaveTextContent('Play animation');
    expect(screen.getByTestId('fa-icon-play')).toBeInTheDocument();

    fireEvent.click(button);
    expect(defaultProps.play).toHaveBeenCalledTimes(1);
    expect(defaultProps.pause).not.toHaveBeenCalled();
  });

  it('renders correctly when playing is true', () => {
    render(<PlayButton {...defaultProps} playing />);

    const button = screen.getByRole('button', { name: 'Pause animation' });
    expect(button).toBeInTheDocument();

    expect(screen.getByTestId('tooltip')).toHaveTextContent('Pause animation');
    expect(screen.getByTestId('fa-icon-pause')).toBeInTheDocument();

    fireEvent.click(button);
    expect(defaultProps.pause).toHaveBeenCalledTimes(1);
    expect(defaultProps.play).not.toHaveBeenCalled();
  });

  it('renders correctly when disabled is true', () => {
    render(<PlayButton {...defaultProps} isDisabled />);

    const expectedLabel = 'Too many animation frames. Reduce time range or increase increment size.';
    const button = screen.getByRole('button', { name: expectedLabel });

    expect(button).toHaveClass('disabled');
    expect(screen.getByTestId('tooltip')).toHaveTextContent(expectedLabel);

    fireEvent.click(button);
    expect(defaultProps.play).not.toHaveBeenCalled();
    expect(defaultProps.pause).not.toHaveBeenCalled();
  });

  it('does not render tooltip when isMobile is true', () => {
    render(<PlayButton {...defaultProps} isMobile />);

    expect(screen.queryByTestId('tooltip')).not.toBeInTheDocument();
  });
});
