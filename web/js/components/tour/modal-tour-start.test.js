/* eslint-disable react/jsx-props-no-spreading */
/* eslint-disable react/prop-types */
import { render, screen, fireEvent, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import ModalStart from './modal-tour-start';

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
  InputGroup: ({ children }) => <div data-testid="input-group">{children}</div>,
  InputGroupText: ({ children, className }) => <div data-testid="input-group-text" className={className}>{children}</div>,
}));

jest.mock(
  '@edsc/earthdata-react-icons/horizon-design-system/hds/ui',
  () => ({ Close: ({ className, size }) => <svg data-testid="close-icon" className={className} data-size={size} /> }),
);

jest.mock('./content-intro', () => function MockTourIntro({ toggleModalStart }) {
  return <div data-testid="tour-intro"><button type="button" data-testid="tour-intro-btn" onClick={toggleModalStart}>Start</button></div>;
});

jest.mock('./tour-boxes', () => function MockTourBoxes({ stories, storyOrder, selectTour }) {
  return (
    <div data-testid="tour-boxes">
      <button type="button" data-testid="tour-boxes-select" onClick={() => selectTour('story-1')}>Select</button>
      <span data-testid="tour-boxes-order">{storyOrder ? storyOrder.join(',') : ''}</span>
    </div>
  );
});

jest.mock('../util/checkbox', () => function MockCheckbox({
  id, checked, onCheck, label,
}) {
  return (
    <div data-testid="checkbox-wrapper">
      <button
        type="button"
        id={id}
        data-testid="checkbox-input"
        data-checked={String(checked)}
        onClick={onCheck}
      >
        {label}
      </button>
    </div>
  );
});

jest.mock('../util/scrollbar', () => function MockScrollbars({ children, style }) {
  return <div data-testid="scrollbars" style={style}>{children}</div>;
});

// localStorageMock controls whether safeLocalStorage.enabled is truthy
const localStorageMock = {
  enabled: true,
};
jest.mock('../../util/local-storage', () => localStorageMock);

const defaultProps = {
  checked: false,
  endTour: jest.fn(),
  hideTour: jest.fn(),
  showTour: jest.fn(),
  modalStart: true,
  selectTour: jest.fn(),
  stories: { story1: {} },
  storyOrder: ['story1'],
  toggleModalStart: jest.fn(),
  className: 'test-class',
  height: 800,
};

const renderComponent = (props = {}) => render(
  <ModalStart {...defaultProps} {...props} />,
);

beforeEach(() => {
  jest.clearAllMocks();
  localStorageMock.enabled = true;
});

describe('ModalStart', () => {
  describe('modal open/closed state', () => {
    it('renders the modal when modalStart=true', () => {
      renderComponent();
      expect(screen.getByTestId('modal')).toBeInTheDocument();
    });

    it('does not render the modal when modalStart=false', () => {
      renderComponent({ modalStart: false });
      expect(screen.queryByTestId('modal')).not.toBeInTheDocument();
    });

    it('applies wrapClassName "tour tour-start"', () => {
      renderComponent();
      const modal = screen.getByTestId('modal');
      expect(modal).toHaveClass('tour');
      expect(modal).toHaveClass('tour-start');
    });

    it('applies className prop to the modal', () => {
      renderComponent({ className: 'custom-class' });
      expect(screen.getByTestId('modal')).toHaveClass('custom-class');
    });
  });

  describe('ModalHeader', () => {
    it('renders the welcome heading text', () => {
      renderComponent();
      expect(screen.getByText(/Welcome to NASA/)).toBeInTheDocument();
    });

    it('renders the close button', () => {
      renderComponent();
      const header = screen.getByTestId('modal-header');
      expect(header.querySelector('.tour-close-btn')).toBeInTheDocument();
    });

    it('calls endTour when the close button is clicked', () => {
      const endTour = jest.fn();
      renderComponent({ endTour });
      act(() => {
        fireEvent.click(screen.getByTestId('modal-header').querySelector('.tour-close-btn'));
      });
      expect(endTour).toHaveBeenCalledTimes(1);
    });

    it('renders the Close icon with correct props', () => {
      renderComponent();
      const icon = screen.getByTestId('close-icon');
      expect(icon).toHaveClass('add-plus');
      expect(icon).toHaveAttribute('data-size', '14px');
    });
  });

  describe('Scrollbars', () => {
    it('renders Scrollbars with height-based maxHeight style', () => {
      renderComponent({ height: 600 });
      const sb = screen.getByTestId('scrollbars');
      expect(sb).toHaveStyle({ maxHeight: '400px' });
    });

    it('wraps ModalBody inside Scrollbars', () => {
      renderComponent();
      const sb = screen.getByTestId('scrollbars');
      expect(sb.querySelector('[data-testid="modal-body"]')).toBeInTheDocument();
    });
  });

  describe('ModalBody — child components', () => {
    it('renders TourIntro inside the body', () => {
      renderComponent();
      expect(screen.getByTestId('tour-intro')).toBeInTheDocument();
    });

    it('passes toggleModalStart to TourIntro', () => {
      const toggleModalStart = jest.fn();
      renderComponent({ toggleModalStart });
      act(() => { fireEvent.click(screen.getByTestId('tour-intro-btn')); });
      expect(toggleModalStart).toHaveBeenCalledTimes(1);
    });

    it('renders TourBoxes inside the body', () => {
      renderComponent();
      expect(screen.getByTestId('tour-boxes')).toBeInTheDocument();
    });

    it('passes storyOrder to TourBoxes', () => {
      renderComponent({ storyOrder: ['a', 'b'] });
      expect(screen.getByTestId('tour-boxes-order')).toHaveTextContent('a,b');
    });

    it('passes selectTour to TourBoxes', () => {
      const selectTour = jest.fn();
      renderComponent({ selectTour });
      act(() => { fireEvent.click(screen.getByTestId('tour-boxes-select')); });
      expect(selectTour).toHaveBeenCalledWith('story-1');
    });
  });

  describe('ModalFooter — localStorage enabled', () => {
    it('renders the footer when safeLocalStorage.enabled is truthy', () => {
      localStorageMock.enabled = true;
      renderComponent();
      expect(screen.getByTestId('modal-footer')).toBeInTheDocument();
    });

    it('does not render the footer when safeLocalStorage.enabled is falsy', () => {
      localStorageMock.enabled = false;
      renderComponent();
      expect(screen.queryByTestId('modal-footer')).not.toBeInTheDocument();
    });

    it('renders the checkbox inside the footer', () => {
      renderComponent();
      expect(screen.getByTestId('checkbox-input')).toBeInTheDocument();
    });

    it('renders the checkbox label text', () => {
      renderComponent();
      expect(screen.getByText('Do not show until a new story has been added.')).toBeInTheDocument();
    });

    it('renders checkbox with data-checked="false" when checked prop is false', () => {
      renderComponent({ checked: false });
      expect(screen.getByTestId('checkbox-input')).toHaveAttribute('data-checked', 'false');
    });

    it('renders checkbox with data-checked="true" when checked prop is true', () => {
      renderComponent({ checked: true });
      expect(screen.getByTestId('checkbox-input')).toHaveAttribute('data-checked', 'true');
    });
  });

  describe('handleCheck', () => {
    it('calls hideTour when state.checked is false (unchecked → checked)', () => {
      const hideTour = jest.fn();
      renderComponent({ checked: false, hideTour });
      act(() => { fireEvent.click(screen.getByTestId('checkbox-input')); });
      expect(hideTour).toHaveBeenCalledTimes(1);
    });

    it('calls showTour when state.checked is true (checked → unchecked)', () => {
      const showTour = jest.fn();
      renderComponent({ checked: true, showTour });
      act(() => { fireEvent.click(screen.getByTestId('checkbox-input')); });
      expect(showTour).toHaveBeenCalledTimes(1);
    });

    it('toggles data-checked from false to true after one click', () => {
      renderComponent({ checked: false });
      expect(screen.getByTestId('checkbox-input')).toHaveAttribute('data-checked', 'false');
      act(() => { fireEvent.click(screen.getByTestId('checkbox-input')); });
      expect(screen.getByTestId('checkbox-input')).toHaveAttribute('data-checked', 'true');
    });

    it('toggles back to false on second click', () => {
      renderComponent({ checked: false });
      act(() => { fireEvent.click(screen.getByTestId('checkbox-input')); });
      act(() => { fireEvent.click(screen.getByTestId('checkbox-input')); });
      expect(screen.getByTestId('checkbox-input')).toHaveAttribute('data-checked', 'false');
    });

    it('does not call showTour when state.checked is false', () => {
      const showTour = jest.fn();
      renderComponent({ checked: false, showTour });
      act(() => { fireEvent.click(screen.getByTestId('checkbox-input')); });
      expect(showTour).not.toHaveBeenCalled();
    });

    it('does not call hideTour when state.checked is true', () => {
      const hideTour = jest.fn();
      renderComponent({ checked: true, hideTour });
      act(() => { fireEvent.click(screen.getByTestId('checkbox-input')); });
      expect(hideTour).not.toHaveBeenCalled();
    });
  });
});
