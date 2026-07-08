/* eslint-disable react/prop-types */
/* eslint-disable react/jsx-props-no-spreading */
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import HoverTooltip from './hover-tooltip';

jest.mock('reactstrap', () => ({
  UncontrolledTooltip: ({
    id, trigger, target, placement, delay, fade, innerClassName, children,
  }) => (
    <div
      data-testid="uncontrolled-tooltip"
      data-id={id}
      data-trigger={trigger}
      data-target={target}
      data-placement={placement}
      data-delay={JSON.stringify(delay)}
      data-fade={String(fade)}
      data-inner-classname={innerClassName}
    >
      {children}
    </div>
  ),
}));

const defaultProps = {
  target: 'some-element',
  labelText: 'Helpful hint',
};

const renderComponent = (props = {}) => render(
  <HoverTooltip {...defaultProps} {...props} />,
);

describe('HoverTooltip', () => {
  describe('when isMobile is falsy (default)', () => {
    it('renders the UncontrolledTooltip', () => {
      renderComponent();
      expect(screen.getByTestId('uncontrolled-tooltip')).toBeInTheDocument();
    });

    it('passes target prop to UncontrolledTooltip', () => {
      renderComponent({ target: 'my-target' });
      expect(screen.getByTestId('uncontrolled-tooltip')).toHaveAttribute('data-target', 'my-target');
    });

    it('passes labelText as children to UncontrolledTooltip', () => {
      renderComponent({ labelText: 'Some label' });
      expect(screen.getByText('Some label')).toBeInTheDocument();
    });

    it('passes placement "bottom" when provided', () => {
      renderComponent({ placement: 'bottom' });
      expect(screen.getByTestId('uncontrolled-tooltip')).toHaveAttribute('data-placement', 'bottom');
    });

    it('passes custom placement when provided', () => {
      renderComponent({ placement: 'top' });
      expect(screen.getByTestId('uncontrolled-tooltip')).toHaveAttribute('data-placement', 'top');
    });

    it('passes delay { show: 50, hide: 0 } when provided', () => {
      renderComponent({ delay: { show: 50, hide: 0 } });
      expect(screen.getByTestId('uncontrolled-tooltip')).toHaveAttribute(
        'data-delay',
        JSON.stringify({ show: 50, hide: 0 }),
      );
    });

    it('passes custom delay when provided', () => {
      renderComponent({ delay: { show: 200, hide: 100 } });
      expect(screen.getByTestId('uncontrolled-tooltip')).toHaveAttribute(
        'data-delay',
        JSON.stringify({ show: 200, hide: 100 }),
      );
    });

    it('passes fade=true when provided', () => {
      renderComponent({ fade: true });
      expect(screen.getByTestId('uncontrolled-tooltip')).toHaveAttribute('data-fade', 'true');
    });

    it('passes fade=false when provided', () => {
      renderComponent({ fade: false });
      expect(screen.getByTestId('uncontrolled-tooltip')).toHaveAttribute('data-fade', 'false');
    });

    it('passes empty innerClassName when provided', () => {
      renderComponent({ innerClassName: '' });
      expect(screen.getByTestId('uncontrolled-tooltip')).toHaveAttribute('data-inner-classname', '');
    });

    it('passes custom innerClassName when provided', () => {
      renderComponent({ innerClassName: 'my-inner' });
      expect(screen.getByTestId('uncontrolled-tooltip')).toHaveAttribute('data-inner-classname', 'my-inner');
    });

    it('sets trigger to "hover"', () => {
      renderComponent();
      expect(screen.getByTestId('uncontrolled-tooltip')).toHaveAttribute('data-trigger', 'hover');
    });

    it('sets id to "center-align-tooltip"', () => {
      renderComponent();
      expect(screen.getByTestId('uncontrolled-tooltip')).toHaveAttribute('data-id', 'center-align-tooltip');
    });
  });

  describe('when isMobile is true', () => {
    it('renders nothing', () => {
      const { container } = renderComponent({ isMobile: true });
      expect(container).toBeEmptyDOMElement();
    });

    it('does not render UncontrolledTooltip', () => {
      renderComponent({ isMobile: true });
      expect(screen.queryByTestId('uncontrolled-tooltip')).not.toBeInTheDocument();
    });
  });
});
