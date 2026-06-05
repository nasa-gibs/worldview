import { render, screen, fireEvent, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import TourIntro from './content-intro';

jest.mock(
  '@edsc/earthdata-react-icons/horizon-design-system/earthdata/ui',
  () => ({ ArrowLineRightCircleFill: ({ className, size }) => <svg data-testid="arrow-icon" className={className} data-size={size} /> }),
);

const renderComponent = (toggleModalStart = jest.fn()) => render(
  <TourIntro toggleModalStart={toggleModalStart} />,
);

describe('TourIntro', () => {
  describe('structure', () => {
    it('renders the tour-intro container', () => {
      const { container } = renderComponent();
      expect(container.querySelector('.tour-intro')).toBeInTheDocument();
    });

    it('renders the intro paragraph', () => {
      const { container } = renderComponent();
      expect(container.querySelector('p.intro')).toBeInTheDocument();
    });

    it('renders the NASA Earthdata external link', () => {
      const link = renderComponent().container.querySelector('a[href="https://earthdata.nasa.gov/"]');
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute('target', '_blank');
      expect(link).toHaveAttribute('rel', 'noreferrer');
      expect(link).toHaveTextContent('NASA Earthdata');
    });

    it('renders the start link with correct attributes', () => {
      const { container } = renderComponent();
      const startLink = container.querySelector('a.start-link');
      expect(startLink).toBeInTheDocument();
      expect(startLink).toHaveAttribute('href', '#');
      expect(startLink).toHaveAttribute('title', 'Start using @NAME@');
    });

    it('renders the ArrowLineRightCircleFill icon inside the start link', () => {
      const { container } = renderComponent();
      const startLink = container.querySelector('a.start-link');
      expect(startLink.querySelector('[data-testid="arrow-icon"]')).toBeInTheDocument();
    });

    it('passes className="intro-arrow" and size="16px" to the arrow icon', () => {
      const { container } = renderComponent();
      const icon = container.querySelector('[data-testid="arrow-icon"]');
      expect(icon).toHaveClass('intro-arrow');
      expect(icon).toHaveAttribute('data-size', '16px');
    });
  });

  describe('toggleModalStart', () => {
    it('calls toggleModalStart when the start link is clicked', () => {
      const toggleModalStart = jest.fn();
      const { container } = renderComponent(toggleModalStart);
      act(() => { fireEvent.click(container.querySelector('a.start-link')); });
      expect(toggleModalStart).toHaveBeenCalledTimes(1);
    });

    it('does not call toggleModalStart when the NASA Earthdata link is clicked', () => {
      const toggleModalStart = jest.fn();
      const { container } = renderComponent(toggleModalStart);
      act(() => { fireEvent.click(container.querySelector('a[href="https://earthdata.nasa.gov/"]')); });
      expect(toggleModalStart).not.toHaveBeenCalled();
    });
  });
});
