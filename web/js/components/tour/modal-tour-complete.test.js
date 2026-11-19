/* eslint-disable react/jsx-props-no-spreading */
/* eslint-disable react/prop-types */
import { render, screen, fireEvent, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import ModalComplete from './modal-tour-complete';

jest.mock('reactstrap', () => ({
  Modal: ({ children, isOpen, wrapClassName }) => (isOpen ? <div data-testid="modal" className={wrapClassName}>{children}</div> : null),
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

const defaultProps = {
  currentStory: { readMoreLinks: [] },
  modalComplete: true,
  resetTour: jest.fn(),
  endTour: jest.fn(),
};

const renderComponent = (props = {}) => render(
  <ModalComplete {...defaultProps} {...props} />,
);

beforeEach(() => {
  jest.clearAllMocks();
});

describe('ModalComplete', () => {
  describe('modal open/closed state', () => {
    it('renders the modal when modalComplete=true', () => {
      renderComponent();
      expect(screen.getByTestId('modal')).toBeInTheDocument();
    });

    it('does not render the modal when modalComplete=false', () => {
      renderComponent({ modalComplete: false });
      expect(screen.queryByTestId('modal')).not.toBeInTheDocument();
    });

    it('renders with the correct wrapClassName', () => {
      renderComponent();
      expect(screen.getByTestId('modal')).toHaveClass('tour');
      expect(screen.getByTestId('modal')).toHaveClass('tour-complete');
    });
  });

  describe('ModalHeader', () => {
    it('renders "Story Complete" heading text', () => {
      renderComponent();
      expect(screen.getByText('Story Complete')).toBeInTheDocument();
    });

    it('renders the close button inside the header', () => {
      renderComponent();
      const header = screen.getByTestId('modal-header');
      expect(header.querySelector('.tour-close-btn')).toBeInTheDocument();
    });

    it('calls endTour when the close button is clicked', () => {
      const endTour = jest.fn();
      renderComponent({ endTour });
      act(() => { fireEvent.click(screen.getByTestId('modal-header').querySelector('.tour-close-btn')); });
      expect(endTour).toHaveBeenCalledTimes(1);
    });

    it('renders the Close icon inside the close button', () => {
      renderComponent();
      const closeBtn = screen.getByTestId('modal-header').querySelector('.tour-close-btn');
      expect(closeBtn.querySelector('[data-testid="close-icon"]')).toBeInTheDocument();
    });

    it('passes className="add-plus" and size="14px" to the Close icon', () => {
      renderComponent();
      const icon = screen.getByTestId('close-icon');
      expect(icon).toHaveClass('add-plus');
      expect(icon).toHaveAttribute('data-size', '14px');
    });
  });

  describe('ModalBody — static text', () => {
    it('renders the completion paragraph', () => {
      renderComponent();
      expect(screen.getByText(/You have now completed a story/)).toBeInTheDocument();
    });

    it('mentions the "More Stories" action in the body text', () => {
      renderComponent();
      expect(screen.getAllByText(/More Stories/).length).toBeGreaterThan(0);
    });

    it('mentions the "Exit Tutorial" action in the body text', () => {
      renderComponent();
      expect(screen.getAllByText(/Exit Tutorial/).length).toBeGreaterThan(0);
    });
  });

  describe('readMoreLinks list', () => {
    it('does not render the read-more section when readMoreLinks is empty', () => {
      renderComponent({ currentStory: { readMoreLinks: [] } });
      expect(screen.queryByText(/Read more about this story/)).not.toBeInTheDocument();
    });

    it('does not render the read-more section when readMoreLinks is absent', () => {
      renderComponent({ currentStory: {} });
      expect(screen.queryByText(/Read more about this story/)).not.toBeInTheDocument();
    });

    it('does not render the read-more section when readMoreLinks is null', () => {
      renderComponent({ currentStory: { readMoreLinks: null } });
      expect(screen.queryByText(/Read more about this story/)).not.toBeInTheDocument();
    });

    it('renders the read-more intro text when readMoreLinks has entries', () => {
      renderComponent({
        currentStory: {
          readMoreLinks: [{ link: 'https://example.com', title: 'Example Article' }],
        },
      });
      expect(screen.getByText('Read more about this story at the links below:')).toBeInTheDocument();
    });

    it('renders a link for each entry in readMoreLinks', () => {
      renderComponent({
        currentStory: {
          readMoreLinks: [
            { link: 'https://example.com/a', title: 'Article A' },
            { link: 'https://example.com/b', title: 'Article B' },
          ],
        },
      });
      expect(screen.getByText('Article A')).toBeInTheDocument();
      expect(screen.getByText('Article B')).toBeInTheDocument();
    });

    it('each link has the correct href, target="_blank", and rel attributes', () => {
      renderComponent({
        currentStory: {
          readMoreLinks: [{ link: 'https://nasa.gov/', title: 'NASA' }],
        },
      });
      const link = screen.getByText('NASA').closest('a');
      expect(link).toHaveAttribute('href', 'https://nasa.gov/');
      expect(link).toHaveAttribute('target', '_blank');
      expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    });

    it('renders the correct number of list items', () => {
      const { container } = renderComponent({
        currentStory: {
          readMoreLinks: [
            { link: 'https://a.com', title: 'A' },
            { link: 'https://b.com', title: 'B' },
            { link: 'https://c.com', title: 'C' },
          ],
        },
      });
      expect(container.querySelectorAll('li')).toHaveLength(3);
    });

    it('uses fallback key parts when link or title are missing', () => {
      expect(() => renderComponent({
        currentStory: {
          readMoreLinks: [{ link: undefined, title: undefined }],
        },
      })).not.toThrow();
    });
  });

  describe('ModalFooter — buttons', () => {
    it('renders the "More Stories" button', () => {
      renderComponent();
      expect(screen.getByRole('button', { name: 'More Stories' })).toBeInTheDocument();
    });

    it('renders the "Exit Tutorial" button', () => {
      renderComponent();
      expect(screen.getByRole('button', { name: 'Exit Tutorial' })).toBeInTheDocument();
    });

    it('calls resetTour when "More Stories" is clicked', () => {
      const resetTour = jest.fn();
      renderComponent({ resetTour });
      act(() => { fireEvent.click(screen.getByRole('button', { name: 'More Stories' })); });
      expect(resetTour).toHaveBeenCalledTimes(1);
    });

    it('calls endTour when "Exit Tutorial" is clicked', () => {
      const endTour = jest.fn();
      renderComponent({ endTour });
      act(() => { fireEvent.click(screen.getByRole('button', { name: 'Exit Tutorial' })); });
      expect(endTour).toHaveBeenCalledTimes(1);
    });

    it('"More Stories" button has btn-primary class', () => {
      renderComponent();
      expect(screen.getByRole('button', { name: 'More Stories' })).toHaveClass('btn-primary');
    });

    it('"Exit Tutorial" button has btn-secondary class', () => {
      renderComponent();
      expect(screen.getByRole('button', { name: 'Exit Tutorial' })).toHaveClass('btn-secondary');
    });
  });
});
