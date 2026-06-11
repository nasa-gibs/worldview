/* eslint-disable react/jsx-props-no-spreading */
/* eslint-disable react/prop-types */
import { render, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import CopyClipboardTooltip from './copy-tooltip';

jest.mock('reactstrap', () => ({
  Tooltip: ({ children, isOpen }) => (
    <div data-testid="tooltip" data-is-open={String(isOpen)}>{children}</div>
  ),
}));

const defaultProps = {
  clearCopyToClipboardTooltip: jest.fn(),
  tooltipToggleTime: 0,
  placement: 'bottom',
};

describe('CopyClipboardTooltip', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('renders tooltip closed by default', () => {
    const { getByTestId } = render(<CopyClipboardTooltip {...defaultProps} />);
    expect(getByTestId('tooltip')).toHaveAttribute('data-is-open', 'false');
  });

  test('shows tooltip when tooltipToggleTime changes', () => {
    const { getByTestId, rerender } = render(<CopyClipboardTooltip {...defaultProps} />);
    rerender(<CopyClipboardTooltip {...defaultProps} tooltipToggleTime={1000} />);
    expect(getByTestId('tooltip')).toHaveAttribute('data-is-open', 'true');
  });

  test('displays "Copied to clipboard!" text', () => {
    const { getByTestId, rerender } = render(<CopyClipboardTooltip {...defaultProps} />);
    rerender(<CopyClipboardTooltip {...defaultProps} tooltipToggleTime={1000} />);
    expect(getByTestId('tooltip')).toHaveTextContent('Copied to clipboard!');
  });

  test('hides tooltip after 2 seconds and calls clearCopyToClipboardTooltip', () => {
    const clearMock = jest.fn();
    const { getByTestId, rerender } = render(
      <CopyClipboardTooltip {...defaultProps} clearCopyToClipboardTooltip={clearMock} />,
    );
    rerender(
      <CopyClipboardTooltip
        {...defaultProps}
        clearCopyToClipboardTooltip={clearMock}
        tooltipToggleTime={1000}
      />,
    );
    expect(getByTestId('tooltip')).toHaveAttribute('data-is-open', 'true');

    act(() => {
      jest.advanceTimersByTime(2000);
    });

    expect(clearMock).toHaveBeenCalledTimes(1);
    expect(getByTestId('tooltip')).toHaveAttribute('data-is-open', 'false');
  });

  test('does not show tooltip when tooltipToggleTime does not change', () => {
    const { getByTestId, rerender } = render(<CopyClipboardTooltip {...defaultProps} />);
    rerender(<CopyClipboardTooltip {...defaultProps} placement="top" />);
    expect(getByTestId('tooltip')).toHaveAttribute('data-is-open', 'false');
  });

  test('clears timeout on unmount', () => {
    const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout');
    const { rerender, unmount } = render(<CopyClipboardTooltip {...defaultProps} />);
    rerender(<CopyClipboardTooltip {...defaultProps} tooltipToggleTime={1000} />);
    unmount();
    expect(clearTimeoutSpy).toHaveBeenCalled();
    clearTimeoutSpy.mockRestore();
  });

  test('resets tooltip visibility when tooltipToggleTime changes a second time', () => {
    const clearMock = jest.fn();
    const { getByTestId, rerender } = render(
      <CopyClipboardTooltip {...defaultProps} clearCopyToClipboardTooltip={clearMock} />,
    );
    rerender(
      <CopyClipboardTooltip
        {...defaultProps}
        clearCopyToClipboardTooltip={clearMock}
        tooltipToggleTime={1000}
      />,
    );
    act(() => { jest.advanceTimersByTime(1000); });

    rerender(
      <CopyClipboardTooltip
        {...defaultProps}
        clearCopyToClipboardTooltip={clearMock}
        tooltipToggleTime={2000}
      />,
    );
    expect(getByTestId('tooltip')).toHaveAttribute('data-is-open', 'true');
  });
});
