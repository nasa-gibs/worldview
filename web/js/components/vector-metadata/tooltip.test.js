/* eslint-disable react/prop-types */
/* eslint-disable react/jsx-props-no-spreading */
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import VectorMetaTooltip from './tooltip';

jest.mock('reactstrap', () => ({
  Tooltip: ({
    isOpen, target, dangerouslySetInnerHTML, id, toggle,
  }) => (
    <div data-testid="tooltip-wrapper" data-open={String(isOpen)} data-target={target} id={id}>
      { }
      <div data-testid="tooltip" dangerouslySetInnerHTML={dangerouslySetInnerHTML} />
      <button type="button" data-testid="tooltip-toggle-btn" onClick={toggle}>toggle</button>
    </div>
  ),
}));

jest.mock('@fortawesome/react-fontawesome', () => ({
  FontAwesomeIcon: ({ icon, className }) => (
    <span data-testid={`fa-${icon}`} className={className} />
  ),
}));

jest.mock('../../util/util', () => ({
  __esModule: true,
  default: { cleanId: (str) => str.replace(/\W/g, '_') },
}));

const defaultProps = {
  id: 'row-0',
  index: 0,
  description: 'Feature description text',
};

const renderComponent = (props = {}) => render(
  <VectorMetaTooltip {...defaultProps} {...props} />,
);

describe('VectorMetaTooltip', () => {
  describe('rendering', () => {
    it('renders the outer container div', () => {
      const { container } = renderComponent();
      expect(container.querySelector('.vector-info-tooltip-case')).toBeInTheDocument();
    });

    it('renders the info icon', () => {
      renderComponent();
      expect(screen.getByTestId('fa-info')).toBeInTheDocument();
    });

    it('info icon has vector-info-icon class', () => {
      renderComponent();
      expect(screen.getByTestId('fa-info')).toHaveClass('vector-info-icon');
    });

    it('info icon has cursor-pointer class', () => {
      renderComponent();
      expect(screen.getByTestId('fa-info')).toHaveClass('cursor-pointer');
    });

    it('computes the element id from util.cleanId', () => {
      renderComponent({ id: 'row-1', index: 2 });
      // cleanId("tooltiprow-12") → "tooltiprow_12"
      expect(document.getElementById('tooltiprow_12')).toBeInTheDocument();
    });

    it('renders the Tooltip with the description via dangerouslySetInnerHTML', () => {
      renderComponent({ description: '<b>Bold description</b>' });
      const tooltip = screen.getByTestId('tooltip');
      expect(tooltip.innerHTML).toContain('<b>Bold description</b>');
    });

    it('Tooltip target matches the sub-case element id', () => {
      renderComponent({ id: 'row-0', index: 0 });
      const elId = 'tooltiprow_00';
      expect(screen.getByTestId('tooltip-wrapper')).toHaveAttribute('data-target', elId);
    });
  });

  describe('initial state', () => {
    it('tooltip is closed by default', () => {
      renderComponent();
      expect(screen.getByTestId('tooltip-wrapper')).toHaveAttribute('data-open', 'false');
    });
  });

  describe('mouseEnter', () => {
    it('opens the tooltip on mouseEnter', () => {
      renderComponent();
      fireEvent.mouseEnter(document.querySelector('.vector-info-tooltip-case'));
      expect(screen.getByTestId('tooltip-wrapper')).toHaveAttribute('data-open', 'true');
    });
  });

  describe('mouseLeave', () => {
    it('closes the tooltip on mouseLeave', () => {
      renderComponent();
      fireEvent.mouseEnter(document.querySelector('.vector-info-tooltip-case'));
      expect(screen.getByTestId('tooltip-wrapper')).toHaveAttribute('data-open', 'true');
      fireEvent.mouseLeave(document.querySelector('.vector-info-tooltip-case'));
      expect(screen.getByTestId('tooltip-wrapper')).toHaveAttribute('data-open', 'false');
    });
  });

  describe('state transitions via mouse events', () => {
    it('full open/close cycle: enter → open, leave → closed, enter → open again', () => {
      renderComponent();
      const wrapper = document.querySelector('.vector-info-tooltip-case');
      fireEvent.mouseEnter(wrapper);
      expect(screen.getByTestId('tooltip-wrapper')).toHaveAttribute('data-open', 'true');
      fireEvent.mouseLeave(wrapper);
      expect(screen.getByTestId('tooltip-wrapper')).toHaveAttribute('data-open', 'false');
      fireEvent.mouseEnter(wrapper);
      expect(screen.getByTestId('tooltip-wrapper')).toHaveAttribute('data-open', 'true');
    });

    it('re-render with new description does not reset open state', () => {
      const { rerender } = renderComponent({ description: 'First' });
      const wrapper = document.querySelector('.vector-info-tooltip-case');
      fireEvent.mouseEnter(wrapper);
      expect(screen.getByTestId('tooltip-wrapper')).toHaveAttribute('data-open', 'true');
      rerender(<VectorMetaTooltip {...defaultProps} description="Second" />);
      expect(screen.getByTestId('tooltip-wrapper')).toHaveAttribute('data-open', 'true');
    });
  });
});
