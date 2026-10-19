/* eslint-disable react/prop-types */
/* eslint-disable react/jsx-props-no-spreading */
import { render, screen, fireEvent, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import Steps from './widget-steps';

jest.mock('@fortawesome/react-fontawesome', () => ({
  FontAwesomeIcon: ({ icon }) => <span data-testid={`fa-${icon}`} />,
}));

const defaultProps = {
  currentStep: 1,
  totalSteps: 3,
  decreaseStep: jest.fn(),
  incrementStep: jest.fn(),
  isKioskModeActive: false,
};

const renderComponent = (props = {}) => render(
  <Steps {...defaultProps} {...props} />,
);

beforeEach(() => {
  jest.clearAllMocks();
});

describe('Steps (widget-steps)', () => {
  describe('structure', () => {
    it('renders the step-container div', () => {
      const { container } = renderComponent();
      expect(container.querySelector('.step-container')).toBeInTheDocument();
    });

    it('renders the step counter', () => {
      const { container } = renderComponent();
      expect(container.querySelector('.step-counter')).toBeInTheDocument();
    });

    it('displays the current step number', () => {
      const { container } = renderComponent({ currentStep: 2 });
      expect(container.querySelector('.step-current')).toHaveTextContent('2');
    });

    it('displays the total steps number', () => {
      const { container } = renderComponent({ totalSteps: 5 });
      expect(container.querySelector('.step-total')).toHaveTextContent('5');
    });
  });

  describe('button classes — isKioskModeActive=false', () => {
    it('Previous button has class "step-previous" when not in kiosk mode', () => {
      renderComponent({ isKioskModeActive: false });
      expect(screen.getByRole('button', { name: 'Previous' })).toHaveClass('step-previous');
    });

    it('Next button has class "step-next" when not in kiosk mode', () => {
      renderComponent({ isKioskModeActive: false });
      expect(screen.getByRole('button', { name: 'Next' })).toHaveClass('step-next');
    });
  });

  describe('button classes — isKioskModeActive=true', () => {
    it('Previous button has class "d-none" in kiosk mode', () => {
      renderComponent({ isKioskModeActive: true });
      expect(screen.getByRole('button', { name: 'Previous' })).toHaveClass('d-none');
    });

    it('Next button has class "d-none" in kiosk mode', () => {
      renderComponent({ isKioskModeActive: true });
      expect(screen.getByRole('button', { name: 'Next' })).toHaveClass('d-none');
    });
  });

  describe('Next button icon — currentStep vs totalSteps', () => {
    it('shows arrow-circle-right icon when currentStep < totalSteps', () => {
      renderComponent({ currentStep: 1, totalSteps: 3 });
      expect(screen.getByTestId('fa-arrow-circle-right')).toBeInTheDocument();
      expect(screen.queryByTestId('fa-check-circle')).not.toBeInTheDocument();
    });

    it('shows check-circle icon when currentStep === totalSteps', () => {
      renderComponent({ currentStep: 3, totalSteps: 3 });
      expect(screen.getByTestId('fa-check-circle')).toBeInTheDocument();
      expect(screen.queryByTestId('fa-arrow-circle-right')).not.toBeInTheDocument();
    });
  });

  describe('button clicks', () => {
    it('calls decreaseStep when Previous is clicked', () => {
      const decreaseStep = jest.fn();
      renderComponent({ decreaseStep });
      act(() => { fireEvent.click(screen.getByRole('button', { name: 'Previous' })); });
      expect(decreaseStep).toHaveBeenCalledTimes(1);
    });

    it('calls incrementStep when Next is clicked', () => {
      const incrementStep = jest.fn();
      renderComponent({ incrementStep });
      act(() => { fireEvent.click(screen.getByRole('button', { name: 'Next' })); });
      expect(incrementStep).toHaveBeenCalledTimes(1);
    });
  });

  describe('keyboard listener — isKioskModeActive=true', () => {
    it('calls decreaseStep when "q" key is pressed in kiosk mode', () => {
      const decreaseStep = jest.fn();
      renderComponent({ isKioskModeActive: true, decreaseStep });
      act(() => { fireEvent.keyDown(document, { key: 'q' }); });
      expect(decreaseStep).toHaveBeenCalledTimes(1);
    });

    it('calls incrementStep when "w" key is pressed in kiosk mode', () => {
      const incrementStep = jest.fn();
      renderComponent({ isKioskModeActive: true, incrementStep });
      act(() => { fireEvent.keyDown(document, { key: 'w' }); });
      expect(incrementStep).toHaveBeenCalledTimes(1);
    });

    it('does not call decreaseStep or incrementStep for other keys in kiosk mode', () => {
      const decreaseStep = jest.fn();
      const incrementStep = jest.fn();
      renderComponent({ isKioskModeActive: true, decreaseStep, incrementStep });
      act(() => { fireEvent.keyDown(document, { key: 'Enter' }); });
      expect(decreaseStep).not.toHaveBeenCalled();
      expect(incrementStep).not.toHaveBeenCalled();
    });

    it('does not attach keyboard listener when isKioskModeActive=false', () => {
      const decreaseStep = jest.fn();
      renderComponent({ isKioskModeActive: false, decreaseStep });
      act(() => { fireEvent.keyDown(document, { key: 'q' }); });
      expect(decreaseStep).not.toHaveBeenCalled();
    });

    it('removes keyboard listener on unmount', () => {
      const decreaseStep = jest.fn();
      const { unmount } = renderComponent({ isKioskModeActive: true, decreaseStep });
      act(() => { unmount(); });
      act(() => { fireEvent.keyDown(document, { key: 'q' }); });
      expect(decreaseStep).not.toHaveBeenCalled();
    });
  });
});
