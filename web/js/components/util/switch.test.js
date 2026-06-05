/* eslint-disable react/prop-types */
/* eslint-disable react/jsx-props-no-spreading */
import { render, screen, fireEvent, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import Switch from './switch';

jest.mock('reactstrap', () => ({
  Tooltip: ({
    children, isOpen, target, toggle, id,
  }) => (
    <div data-testid="tooltip-wrapper" id={id} aria-describedby={target}>
      {isOpen && <div data-testid="tooltip-content">{children}</div>}
      <button type="button" data-testid="tooltip-toggle" onClick={toggle}>toggle</button>
    </div>
  ),
}));

jest.mock('@fortawesome/react-fontawesome', () => ({
  FontAwesomeIcon: ({ icon, id, tabIndex }) => (
    <span data-testid={`fa-${icon}`} id={id} tabIndex={tabIndex} />
  ),
}));

const defaultProps = {
  id: 'test-switch',
  active: false,
  toggle: jest.fn(),
  label: 'Test Label',
};

const renderComponent = (props = {}) => render(
  <Switch {...defaultProps} {...props} />,
);

beforeEach(() => {
  jest.useFakeTimers();
  jest.clearAllMocks();
});

afterEach(() => {
  jest.runAllTimers();
  jest.useRealTimers();
});

describe('Switch', () => {
  describe('rendering', () => {
    it('renders the container div with react-switch class', () => {
      const { container } = renderComponent();
      expect(container.querySelector('.react-switch')).toBeInTheDocument();
    });

    it('renders the checkbox input', () => {
      renderComponent();
      expect(screen.getByRole('checkbox')).toBeInTheDocument();
    });

    it('applies the id prop to the checkbox input', () => {
      renderComponent({ id: 'my-switch' });
      expect(document.getElementById('my-switch')).toBeInTheDocument();
    });

    it('renders the label text', () => {
      renderComponent({ label: 'My Label' });
      expect(screen.getByText('My Label')).toBeInTheDocument();
    });

    it('checkbox is unchecked when active=false', () => {
      renderComponent({ active: false });
      expect(screen.getByRole('checkbox')).not.toBeChecked();
    });

    it('checkbox is checked when active=true', () => {
      renderComponent({ active: true });
      expect(screen.getByRole('checkbox')).toBeChecked();
    });

    it('span has aria-checked=false when active=false', () => {
      renderComponent({ active: false });
      expect(screen.getByRole('switch')).toHaveAttribute('aria-checked', 'false');
    });

    it('span has aria-checked=true when active=true', () => {
      renderComponent({ active: true });
      expect(screen.getByRole('switch')).toHaveAttribute('aria-checked', 'true');
    });
  });

  describe('containerClass', () => {
    it('includes react-switch by default', () => {
      const { container } = renderComponent();
      expect(container.querySelector('.react-switch')).toBeInTheDocument();
    });

    it('appends containerClassAddition when provided', () => {
      const { container } = renderComponent({ containerClassAddition: 'extra-class' });
      expect(container.querySelector('.extra-class')).toBeInTheDocument();
    });

    it('adds switch-thin-border class when border=true', () => {
      const { container } = renderComponent({ border: true });
      expect(container.querySelector('.switch-thin-border')).toBeInTheDocument();
    });

    it('does not add switch-thin-border class when border=false', () => {
      const { container } = renderComponent({ border: false });
      expect(container.querySelector('.switch-thin-border')).not.toBeInTheDocument();
    });
  });

  describe('color / style', () => {
    it('applies background color style when active=true and color is set', () => {
      renderComponent({ active: true, color: 'FF0000' });
      const label = document.querySelector('label.react-switch-label');
      expect(label).toHaveStyle({ backgroundColor: '#FF0000' });
    });

    it('applies default color #007BFF when active=true and no color prop', () => {
      renderComponent({ active: true });
      const label = document.querySelector('label.react-switch-label');
      expect(label).toHaveStyle({ backgroundColor: '#007BFF' });
    });

    it('does not apply background color style when active=false', () => {
      renderComponent({ active: false, color: 'FF0000' });
      const label = document.querySelector('label.react-switch-label');
      expect(label).not.toHaveStyle({ backgroundColor: '#FF0000' });
    });
  });

  describe('toggleSwitch via checkbox', () => {
    it('calls toggle prop after 200ms when checkbox changes', () => {
      const toggle = jest.fn();
      renderComponent({ toggle });
      act(() => { fireEvent.click(screen.getByRole('checkbox')); });
      expect(toggle).not.toHaveBeenCalled();
      act(() => { jest.advanceTimersByTime(200); });
      expect(toggle).toHaveBeenCalledTimes(1);
    });

    it('does not call toggle before 200ms', () => {
      const toggle = jest.fn();
      renderComponent({ toggle });
      act(() => { fireEvent.click(screen.getByRole('checkbox')); });
      act(() => { jest.advanceTimersByTime(199); });
      expect(toggle).not.toHaveBeenCalled();
    });

    it('flips the checked state immediately when checkbox changes', () => {
      renderComponent({ active: false });
      act(() => { fireEvent.click(screen.getByRole('checkbox')); });
      expect(screen.getByRole('checkbox')).toBeChecked();
    });

    it('flips checked state from true to false', () => {
      renderComponent({ active: true });
      act(() => { fireEvent.click(screen.getByRole('checkbox')); });
      expect(screen.getByRole('checkbox')).not.toBeChecked();
    });
  });

  describe('toggleSwitch via label span', () => {
    it('calls toggle prop after 200ms when label text span is clicked', () => {
      const toggle = jest.fn();
      renderComponent({ toggle });
      act(() => { fireEvent.click(screen.getByRole('switch')); });
      expect(toggle).not.toHaveBeenCalled();
      act(() => { jest.advanceTimersByTime(200); });
      expect(toggle).toHaveBeenCalledTimes(1);
    });

    it('flips checked state when label text span is clicked', () => {
      renderComponent({ active: true });
      act(() => { fireEvent.click(screen.getByRole('switch')); });
      expect(screen.getByRole('checkbox')).not.toBeChecked();
    });
  });

  describe('onKeyDown', () => {
    it('calls toggleSwitch on Enter key (keyCode 13)', () => {
      const toggle = jest.fn();
      renderComponent({ toggle });
      const label = document.querySelector('label.react-switch-label');
      act(() => { fireEvent.keyDown(label, { keyCode: 13 }); });
      act(() => { jest.advanceTimersByTime(200); });
      expect(toggle).toHaveBeenCalledTimes(1);
    });

    it('does not call toggleSwitch on other keys', () => {
      const toggle = jest.fn();
      renderComponent({ toggle });
      const label = document.querySelector('label.react-switch-label');
      act(() => { fireEvent.keyDown(label, { keyCode: 32 }); });
      act(() => { jest.advanceTimersByTime(200); });
      expect(toggle).not.toHaveBeenCalled();
    });

    it('flips checked state on Enter key press', () => {
      renderComponent({ active: false });
      const label = document.querySelector('label.react-switch-label');
      act(() => { fireEvent.keyDown(label, { keyCode: 13 }); });
      expect(screen.getByRole('checkbox')).toBeChecked();
    });
  });

  describe('useEffect — active prop sync', () => {
    it('updates checkbox to checked when active prop changes to true', () => {
      const { rerender } = renderComponent({ active: false });
      expect(screen.getByRole('checkbox')).not.toBeChecked();
      act(() => { rerender(<Switch {...defaultProps} active />); });
      expect(screen.getByRole('checkbox')).toBeChecked();
    });

    it('updates checkbox to unchecked when active prop changes to false', () => {
      const { rerender } = renderComponent({ active: true });
      expect(screen.getByRole('checkbox')).toBeChecked();
      act(() => { rerender(<Switch {...defaultProps} active={false} />); });
      expect(screen.getByRole('checkbox')).not.toBeChecked();
    });
  });

  describe('tooltip', () => {
    it('does not render the info-circle icon when tooltip prop is absent', () => {
      renderComponent();
      expect(screen.queryByTestId('fa-info-circle')).not.toBeInTheDocument();
    });

    it('renders the info-circle icon when tooltip prop is provided', () => {
      renderComponent({ tooltip: 'Helpful hint' });
      expect(screen.getByTestId('fa-info-circle')).toBeInTheDocument();
    });

    it('info-circle icon id is "<id>-switch-tooltip"', () => {
      renderComponent({ id: 'my-switch', tooltip: 'Hint' });
      expect(document.getElementById('my-switch-switch-tooltip')).toBeInTheDocument();
    });

    it('tooltip content is not visible by default', () => {
      renderComponent({ tooltip: 'Helpful hint' });
      expect(screen.queryByTestId('tooltip-content')).not.toBeInTheDocument();
    });

    it('tooltip content becomes visible after its toggle button is clicked', () => {
      renderComponent({ tooltip: 'Helpful hint' });
      act(() => { fireEvent.click(screen.getByTestId('tooltip-toggle')); });
      expect(screen.getByTestId('tooltip-content')).toBeInTheDocument();
    });

    it('tooltip content text is rendered when tooltip is open', () => {
      renderComponent({ tooltip: 'My tooltip text' });
      act(() => { fireEvent.click(screen.getByTestId('tooltip-toggle')); });
      expect(screen.getByText('My tooltip text')).toBeInTheDocument();
    });

    it('tooltip closes again after a second toggle click', () => {
      renderComponent({ tooltip: 'Helpful hint' });
      act(() => { fireEvent.click(screen.getByTestId('tooltip-toggle')); });
      expect(screen.getByTestId('tooltip-content')).toBeInTheDocument();
      act(() => { fireEvent.click(screen.getByTestId('tooltip-toggle')); });
      expect(screen.queryByTestId('tooltip-content')).not.toBeInTheDocument();
    });
  });
});
