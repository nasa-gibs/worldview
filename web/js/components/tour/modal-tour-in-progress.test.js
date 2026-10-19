/* eslint-disable react/jsx-props-no-spreading */
/* eslint-disable react/prop-types */
import { render, screen, fireEvent, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import ModalInProgress from './modal-tour-in-progress';

jest.mock('reactstrap', () => ({
  Modal: ({ children, isOpen, wrapClassName, className }) => (
    isOpen
      ? <div data-testid="modal" className={[wrapClassName, className].filter(Boolean).join(' ')}>{children}</div>
      : null
  ),
  ModalHeader: ({ children, close }) => (
    <div data-testid="modal-header">
      {children}
      {close}
    </div>
  ),
  ModalBody: ({ children }) => <div data-testid="modal-body">{children}</div>,
  ModalFooter: ({ children }) => <div data-testid="modal-footer">{children}</div>,
}));

jest.mock(
  '@edsc/earthdata-react-icons/horizon-design-system/hds/ui',
  () => ({ Close: ({ className, size }) => <svg data-testid="close-icon" className={className} data-size={size} /> }),
);

jest.mock('./widget-steps', () => function MockSteps({
  currentStep, totalSteps, decreaseStep, incrementStep, isKioskModeActive,
}) {
  return (
    <div data-testid="widget-steps">
      <button type="button" data-testid="steps-decrease" onClick={decreaseStep}>Prev</button>
      <span data-testid="steps-current">{currentStep}</span>
      <span data-testid="steps-total">{totalSteps}</span>
      <button type="button" data-testid="steps-increment" onClick={incrementStep}>Next</button>
      <span data-testid="steps-kiosk">{String(isKioskModeActive)}</span>
    </div>
  );
});

const defaultProps = {
  className: 'my-modal',
  currentStory: { title: 'Test Story', type: 'story-type' },
  description: '<p>Step description</p>',
  modalInProgress: true,
  endTour: jest.fn(),
  currentStep: 1,
  totalSteps: 3,
  decreaseStep: jest.fn(),
  incrementStep: jest.fn(),
  isKioskModeActive: false,
};

const renderComponent = (props = {}) => render(
  <ModalInProgress {...defaultProps} {...props} />,
);

beforeEach(() => {
  jest.clearAllMocks();
});

describe('ModalInProgress', () => {
  describe('modal open/closed state', () => {
    it('renders the modal when modalInProgress=true', () => {
      renderComponent();
      expect(screen.getByTestId('modal')).toBeInTheDocument();
    });

    it('does not render the modal when modalInProgress=false', () => {
      renderComponent({ modalInProgress: false });
      expect(screen.queryByTestId('modal')).not.toBeInTheDocument();
    });

    it('renders with the tour tour-in-progress wrapClassName', () => {
      renderComponent();
      const modal = screen.getByTestId('modal');
      expect(modal).toHaveClass('tour');
      expect(modal).toHaveClass('tour-in-progress');
    });

    it('applies className and currentStory.type to the modal className', () => {
      renderComponent();
      const modal = screen.getByTestId('modal');
      expect(modal).toHaveClass('my-modal');
      expect(modal).toHaveClass('story-type');
    });
  });

  describe('ModalHeader', () => {
    it('renders the story title in the header', () => {
      renderComponent();
      expect(screen.getByText('Test Story')).toBeInTheDocument();
    });

    it('renders the modal-icon element', () => {
      renderComponent();
      expect(screen.getByTestId('modal-header').querySelector('.modal-icon')).toBeInTheDocument();
    });

    it('renders the close button when isKioskModeActive=false', () => {
      renderComponent({ isKioskModeActive: false });
      const closeBtn = screen.getByTestId('modal-header').querySelector('.end-tour-close-btn');
      expect(closeBtn).toBeInTheDocument();
    });

    it('hides the close button (d-none) when isKioskModeActive=true', () => {
      renderComponent({ isKioskModeActive: true });
      const header = screen.getByTestId('modal-header');
      const btn = header.querySelector('button');
      expect(btn).toHaveClass('d-none');
      expect(btn).not.toHaveClass('end-tour-close-btn');
    });

    it('calls endTour when the close button is clicked', () => {
      const endTour = jest.fn();
      renderComponent({ endTour });
      act(() => {
        fireEvent.click(screen.getByTestId('modal-header').querySelector('.end-tour-close-btn'));
      });
      expect(endTour).toHaveBeenCalledTimes(1);
    });

    it('renders the Close icon inside the close button', () => {
      renderComponent();
      const btn = screen.getByTestId('modal-header').querySelector('.end-tour-close-btn');
      expect(btn.querySelector('[data-testid="close-icon"]')).toBeInTheDocument();
    });

    it('passes className="add-plus" and size="14px" to the Close icon', () => {
      renderComponent();
      const icon = screen.getByTestId('close-icon');
      expect(icon).toHaveClass('add-plus');
      expect(icon).toHaveAttribute('data-size', '14px');
    });
  });

  describe('ModalBody — description HTML', () => {
    it('renders description HTML via dangerouslySetInnerHTML', () => {
      renderComponent({ description: '<p>Hello World</p>' });
      const body = screen.getByTestId('modal-body');
      expect(body.querySelector('p')).toHaveTextContent('Hello World');
    });

    it('renders updated description when prop changes', () => {
      const { rerender } = renderComponent({ description: '<p>First</p>' });
      act(() => {
        rerender(<ModalInProgress {...defaultProps} description="<p>Second</p>" />);
      });
      expect(screen.getByTestId('modal-body').querySelector('p')).toHaveTextContent('Second');
    });

    it('renders empty body when description is undefined', () => {
      renderComponent({ description: undefined });
      const body = screen.getByTestId('modal-body');
      expect(body.querySelector('div')).toBeInTheDocument();
    });
  });

  describe('ModalFooter — Steps widget', () => {
    it('renders the Steps widget in the footer', () => {
      renderComponent();
      expect(screen.getByTestId('widget-steps')).toBeInTheDocument();
    });

    it('passes currentStep to Steps', () => {
      renderComponent({ currentStep: 2 });
      expect(screen.getByTestId('steps-current')).toHaveTextContent('2');
    });

    it('passes totalSteps to Steps', () => {
      renderComponent({ totalSteps: 5 });
      expect(screen.getByTestId('steps-total')).toHaveTextContent('5');
    });

    it('passes isKioskModeActive=false to Steps', () => {
      renderComponent({ isKioskModeActive: false });
      expect(screen.getByTestId('steps-kiosk')).toHaveTextContent('false');
    });

    it('passes isKioskModeActive=true to Steps', () => {
      renderComponent({ isKioskModeActive: true });
      expect(screen.getByTestId('steps-kiosk')).toHaveTextContent('true');
    });

    it('calls decreaseStep when Steps fires it', () => {
      const decreaseStep = jest.fn();
      renderComponent({ decreaseStep });
      act(() => { fireEvent.click(screen.getByTestId('steps-decrease')); });
      expect(decreaseStep).toHaveBeenCalledTimes(1);
    });

    it('calls incrementStep when Steps fires it', () => {
      const incrementStep = jest.fn();
      renderComponent({ incrementStep });
      act(() => { fireEvent.click(screen.getByTestId('steps-increment')); });
      expect(incrementStep).toHaveBeenCalledTimes(1);
    });
  });
});
