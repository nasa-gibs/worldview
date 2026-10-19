/* eslint-disable react/prop-types */
/* eslint-disable react/jsx-props-no-spreading */
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import Checkbox from './checkbox';

jest.mock('@edsc/earthdata-react-icons/horizon-design-system/hds/ui', () => ({
  Check: ({ className, size }) => (
    <span data-testid="check-icon" className={className} data-size={size} />
  ),
}));

jest.mock('./hover-tooltip', () => function HoverTooltip({ target, labelText, placement }) {
  return (
    <div
      data-testid="hover-tooltip"
      data-target={target}
      data-label={labelText}
      data-placement={placement}
    />
  );
});

const defaultProps = {
  id: 'test-cb',
  checked: false,
  onCheck: jest.fn(),
};

const renderComponent = (props = {}) => render(
  <Checkbox {...defaultProps} {...props} />,
);

describe('Checkbox', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('input element', () => {
    it('renders a checkbox input', () => {
      renderComponent();
      expect(screen.getByRole('checkbox')).toBeInTheDocument();
    });

    it('has type="checkbox"', () => {
      renderComponent();
      expect(screen.getByRole('checkbox')).toHaveAttribute('type', 'checkbox');
    });

    it('sets id on the input', () => {
      renderComponent({ id: 'my-cb' });
      expect(screen.getByRole('checkbox')).toHaveAttribute('id', 'my-cb');
    });

    it('sets name on the input', () => {
      renderComponent({ name: 'my-name' });
      expect(screen.getByRole('checkbox')).toHaveAttribute('name', 'my-name');
    });

    it('reflects checked=true', () => {
      renderComponent({ checked: true });
      expect(screen.getByRole('checkbox')).toBeChecked();
    });

    it('reflects checked=false', () => {
      renderComponent({ checked: false });
      expect(screen.getByRole('checkbox')).not.toBeChecked();
    });

    it('applies classNames prop to input', () => {
      renderComponent({ classNames: 'extra-class' });
      expect(screen.getByRole('checkbox')).toHaveClass('extra-class');
    });
  });

  describe('wrapper div', () => {
    it('renders wrapper div with id "{id}-case"', () => {
      renderComponent({ id: 'cb1' });
      expect(document.getElementById('cb1-case')).toBeInTheDocument();
    });

    it('includes "wv-checkbox" in wrapper className', () => {
      renderComponent();
      expect(document.getElementById('test-cb-case')).toHaveClass('wv-checkbox');
    });

    it('adds "wv-checkbox-round" when isRound is true', () => {
      renderComponent({ isRound: true });
      expect(document.getElementById('test-cb-case').className).toContain('wv-checkbox-round');
    });

    it('omits "wv-checkbox-round" when isRound is false', () => {
      renderComponent({ isRound: false });
      expect(document.getElementById('test-cb-case').className).not.toContain('wv-checkbox-round');
    });

    it('adds "checked" class when checked is true', () => {
      renderComponent({ checked: true });
      expect(document.getElementById('test-cb-case').className).toContain('checked');
    });

    it('omits "checked" class when checked is false', () => {
      renderComponent({ checked: false });
      expect(document.getElementById('test-cb-case').className).not.toContain('checked');
    });

    it('adds "disabled" class when disabled is true', () => {
      renderComponent({ disabled: true });
      expect(document.getElementById('test-cb-case').className).toContain('disabled');
    });

    it('omits "disabled" class when disabled is false', () => {
      renderComponent({ disabled: false });
      expect(document.getElementById('test-cb-case').className).not.toContain('disabled');
    });

    it('includes color in wrapper className', () => {
      renderComponent({ color: 'blue' });
      expect(document.getElementById('test-cb-case').className).toContain('blue');
    });
  });

  describe('label', () => {
    it('renders a label pointing to the input id', () => {
      renderComponent({ id: 'cb-x', label: 'My Label' });
      const lbl = screen.getByText('My Label').closest('label');
      expect(lbl).toHaveAttribute('for', 'cb-x');
    });

    it('renders label text inside a span', () => {
      renderComponent({ label: 'Hello' });
      expect(screen.getByText('Hello').tagName).toBe('SPAN');
    });
  });

  describe('children', () => {
    it('renders children inside the wrapper', () => {
      renderComponent({ children: <span data-testid="child-node">child</span> });
      expect(screen.getByTestId('child-node')).toBeInTheDocument();
    });
  });

  describe('Check icon', () => {
    it('renders the Check icon when checked is true', () => {
      renderComponent({ checked: true });
      expect(screen.getByTestId('check-icon')).toBeInTheDocument();
    });

    it('does not render the Check icon when checked is false', () => {
      renderComponent({ checked: false });
      expect(screen.queryByTestId('check-icon')).not.toBeInTheDocument();
    });

    it('Check icon has class "check"', () => {
      renderComponent({ checked: true });
      expect(screen.getByTestId('check-icon')).toHaveClass('check');
    });
  });

  describe('onCheck handler', () => {
    it('calls onCheck when the checkbox changes', () => {
      const onCheck = jest.fn();
      renderComponent({ onCheck, disabled: false });
      fireEvent.click(screen.getByRole('checkbox'));
      expect(onCheck).toHaveBeenCalledTimes(1);
    });
  });

  describe('disabled tooltip behaviour', () => {
    it('does not render HoverTooltip when disabled is false', () => {
      renderComponent({ disabled: false, title: 'tip' });
      expect(screen.queryByTestId('hover-tooltip')).not.toBeInTheDocument();
    });

    it('does not render HoverTooltip when disabled but id is missing', () => {
      renderComponent({ disabled: true, title: 'tip', id: undefined });
      expect(screen.queryByTestId('hover-tooltip')).not.toBeInTheDocument();
    });

    it('does not render HoverTooltip when disabled and id present but title is missing', () => {
      renderComponent({ disabled: true, title: undefined });
      expect(screen.queryByTestId('hover-tooltip')).not.toBeInTheDocument();
    });

    it('renders HoverTooltip when disabled, id, and title are all set', () => {
      renderComponent({ disabled: true, id: 'cb2', title: 'my tip' });
      expect(screen.getByTestId('hover-tooltip')).toBeInTheDocument();
    });

    it('passes target="#<id>-case" to HoverTooltip', () => {
      renderComponent({ disabled: true, id: 'cb3', title: 'tip' });
      expect(screen.getByTestId('hover-tooltip')).toHaveAttribute('data-target', '#cb3-case');
    });

    it('passes title as labelText to HoverTooltip', () => {
      renderComponent({ disabled: true, id: 'cb4', title: 'my tooltip text' });
      expect(screen.getByTestId('hover-tooltip')).toHaveAttribute('data-label', 'my tooltip text');
    });

    it('passes tooltipPlacement to HoverTooltip', () => {
      renderComponent({
        disabled: true, id: 'cb5', title: 'tip', tooltipPlacement: 'top',
      });
      expect(screen.getByTestId('hover-tooltip')).toHaveAttribute('data-placement', 'top');
    });

    it('sets input title to empty string when showDisabledToolTip is true', () => {
      renderComponent({ disabled: true, id: 'cb6', title: 'my tip' });
      expect(screen.getByRole('checkbox')).toHaveAttribute('title', '');
    });

    it('sets input title to the title prop when showDisabledToolTip is false', () => {
      renderComponent({ disabled: false, id: 'cb7', title: 'my tip' });
      expect(screen.getByRole('checkbox')).toHaveAttribute('title', 'my tip');
    });

    it('onChange is a no-op when showDisabledToolTip is true', () => {
      const onCheck = jest.fn();
      renderComponent({
        disabled: true, id: 'cb8', title: 'tip', onCheck,
      });
      fireEvent.click(screen.getByRole('checkbox'));
      expect(onCheck).not.toHaveBeenCalled();
    });
  });
});
