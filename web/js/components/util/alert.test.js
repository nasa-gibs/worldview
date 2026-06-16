/* eslint-disable react/jsx-props-no-spreading */
/* eslint-disable react/prop-types */
import { render, screen, fireEvent, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import AlertUtil from './alert';

jest.mock('reactstrap', () => ({
  Alert: ({ children, isOpen, id, className }) => (
    isOpen
      ? <div data-testid="alert" id={id} className={className}>{children}</div>
      : null
  ),
}));

jest.mock('@fortawesome/react-fontawesome', () => ({
  FontAwesomeIcon: ({ icon, className }) => (
    <span data-testid={`fa-${icon}`} className={className} />
  ),
}));

const defaultProps = {
  id: 'test-alert',
  isOpen: true,
  message: 'Test message',
  messageTitle: 'Test title',
  noPortal: true,
};

const renderComponent = (props = {}) => render(
  <AlertUtil {...defaultProps} {...props} />,
);

beforeEach(() => {
  jest.useFakeTimers();
  // Ensure no portal container exists unless the test creates one
  const existing = document.getElementById('wv-alert-container');
  if (existing) existing.remove();
});

afterEach(() => {
  jest.runAllTimers();
  jest.useRealTimers();
  const container = document.getElementById('wv-alert-container');
  if (container) container.remove();
});

describe('AlertUtil', () => {
  describe('render — noPortal=true', () => {
    it('renders the Alert when isOpen=true', () => {
      renderComponent();
      expect(screen.getByTestId('alert')).toBeInTheDocument();
    });

    it('does not render the Alert when isOpen=false', () => {
      renderComponent({ isOpen: false });
      expect(screen.queryByTestId('alert')).not.toBeInTheDocument();
    });

    it('renders the alert-content div', () => {
      renderComponent();
      expect(screen.getByRole('alertdialog')).toBeInTheDocument();
    });

    it('renders messageTitle', () => {
      renderComponent({ messageTitle: 'Warning!' });
      expect(screen.getByText('Warning!')).toBeInTheDocument();
    });

    it('renders message', () => {
      renderComponent({ message: 'Something went wrong.' });
      expect(screen.getByText('Something went wrong.')).toBeInTheDocument();
    });

    it('applies wv-alert className to the Alert', () => {
      renderComponent();
      expect(screen.getByTestId('alert')).toHaveClass('wv-alert');
    });

    it('passes the id prop to the Alert', () => {
      renderComponent({ id: 'my-alert' });
      expect(document.getElementById('my-alert')).toBeInTheDocument();
    });

    it('passes the title prop to the alert-content div', () => {
      renderComponent({ title: 'Hover tip' });
      expect(screen.getByRole('alertdialog')).toHaveAttribute('title', 'Hover tip');
    });
  });

  describe('icon', () => {
    it('renders the default exclamation-triangle icon when icon prop is empty', () => {
      renderComponent({ icon: '' });
      expect(screen.getByTestId('fa-exclamation-triangle')).toBeInTheDocument();
    });

    it('renders the supplied icon when icon prop is set', () => {
      renderComponent({ icon: 'info-circle' });
      expect(screen.getByTestId('fa-info-circle')).toBeInTheDocument();
      expect(screen.queryByTestId('fa-exclamation-triangle')).not.toBeInTheDocument();
    });

    it('icon has wv-alert-icon class', () => {
      renderComponent();
      expect(screen.getByTestId('fa-exclamation-triangle')).toHaveClass('wv-alert-icon');
    });
  });

  describe('paddingRight — onDismiss presence', () => {
    it('sets paddingRight=8 when onDismiss is not provided', () => {
      renderComponent({ onDismiss: undefined });
      expect(screen.getByRole('alertdialog')).toHaveStyle({ paddingRight: '8px' });
    });

    it('sets paddingRight=5 when onDismiss is provided', () => {
      renderComponent({ onDismiss: jest.fn() });
      expect(screen.getByRole('alertdialog')).toHaveStyle({ paddingRight: '5px' });
    });
  });

  describe('close button — onDismiss', () => {
    it('does not render the close button when onDismiss is absent', () => {
      renderComponent({ onDismiss: undefined });
      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });

    it('renders the close button when onDismiss is provided', () => {
      renderComponent({ onDismiss: jest.fn() });
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('close button id is "<id>-close"', () => {
      renderComponent({ id: 'my-alert', onDismiss: jest.fn() });
      expect(document.getElementById('my-alert-close')).toBeInTheDocument();
    });

    it('close button has close-alert class', () => {
      renderComponent({ onDismiss: jest.fn() });
      expect(screen.getByRole('button')).toHaveClass('close-alert');
    });

    it('renders the times icon inside the close button', () => {
      renderComponent({ onDismiss: jest.fn() });
      expect(screen.getByTestId('fa-times')).toBeInTheDocument();
    });
  });

  describe('closeAlert()', () => {
    it('calls onDismiss when close button is clicked', () => {
      const onDismiss = jest.fn();
      renderComponent({ onDismiss });
      act(() => { fireEvent.click(screen.getByRole('button')); });
      expect(onDismiss).toHaveBeenCalledTimes(1);
    });

    it('hides the alert after close button is clicked', () => {
      const onDismiss = jest.fn();
      renderComponent({ onDismiss });
      act(() => { fireEvent.click(screen.getByRole('button')); });
      expect(screen.queryByTestId('alert')).not.toBeInTheDocument();
    });
  });

  describe('onClick on alertdialog', () => {
    it('calls onClick prop when the alert-content area is clicked', () => {
      const onClick = jest.fn();
      renderComponent({ onClick });
      act(() => { fireEvent.click(screen.getByRole('alertdialog')); });
      expect(onClick).toHaveBeenCalledTimes(1);
    });
  });

  describe('timeout auto-dismiss', () => {
    it('calls onDismiss after the timeout elapses', () => {
      const onDismiss = jest.fn();
      renderComponent({ timeout: 3000, onDismiss });
      expect(onDismiss).not.toHaveBeenCalled();
      act(() => { jest.advanceTimersByTime(3000); });
      expect(onDismiss).toHaveBeenCalledTimes(1);
    });

    it('does not call onDismiss before timeout elapses', () => {
      const onDismiss = jest.fn();
      renderComponent({ timeout: 3000, onDismiss });
      act(() => { jest.advanceTimersByTime(2999); });
      expect(onDismiss).not.toHaveBeenCalled();
    });

    it('does not set a timeout when timeout prop is absent', () => {
      const onDismiss = jest.fn();
      renderComponent({ onDismiss });
      act(() => { jest.advanceTimersByTime(99999); });
      expect(onDismiss).not.toHaveBeenCalled();
    });

    it('does not set a timeout when onDismiss is absent', () => {
      // Should not throw even with a timeout value but no onDismiss
      expect(() => renderComponent({ timeout: 1000 })).not.toThrow();
      act(() => { jest.advanceTimersByTime(1000); });
    });
  });

  describe('componentWillUnmount — clears timeout', () => {
    it('clears pending timeout on unmount without errors', () => {
      const onDismiss = jest.fn();
      const { unmount } = renderComponent({ timeout: 5000, onDismiss });
      act(() => { unmount(); });
      act(() => { jest.runAllTimers(); });
      expect(onDismiss).not.toHaveBeenCalled();
    });

    it('unmounts cleanly when no timeout was set', () => {
      const { unmount } = renderComponent();
      expect(() => act(() => { unmount(); })).not.toThrow();
    });
  });

  describe('portal rendering', () => {
    it('renders into the wv-alert-container portal when noPortal=false and container exists', () => {
      const portalContainer = document.createElement('div');
      portalContainer.id = 'wv-alert-container';
      document.body.appendChild(portalContainer);

      renderComponent({ noPortal: false });

      expect(portalContainer.querySelector('[data-testid="alert"]')).toBeInTheDocument();
    });

    it('falls back to inline render when noPortal=false but container is absent', () => {
      // No portal container in DOM
      const { container } = renderComponent({ noPortal: false });
      expect(container.querySelector('[data-testid="alert"]')).toBeInTheDocument();
    });

    it('renders inline (noPortal=true) regardless of portal container presence', () => {
      const portalContainer = document.createElement('div');
      portalContainer.id = 'wv-alert-container';
      document.body.appendChild(portalContainer);

      const { container } = renderComponent({ noPortal: true });
      expect(container.querySelector('[data-testid="alert"]')).toBeInTheDocument();
      expect(portalContainer.querySelector('[data-testid="alert"]')).not.toBeInTheDocument();
    });
  });
});
