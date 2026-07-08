/* eslint-disable react/jsx-props-no-spreading */
import { render, screen, fireEvent, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import TourBox from './tour-box';

const defaultProps = {
  index: 0,
  story: { id: 'story-1', title: 'Test Story' },
  storyId: 'story-1',
  storyOrder: ['story-1', 'story-2', 'story-3'],
  title: 'Test Story Title',
  description: 'Test story description.',
  backgroundImage: 'bg.jpg',
  backgroundImageHover: 'bg-hover.jpg',
  selectTour: jest.fn(),
  className: 'tour-box story',
};

const renderComponent = (props = {}) => render(
  <TourBox {...defaultProps} {...props} />,
);

beforeEach(() => {
  jest.clearAllMocks();
});

describe('TourBox', () => {
  describe('initial render', () => {
    it('renders the anchor element', () => {
      const { container } = renderComponent();
      expect(container.querySelector('a[href="#"]')).toBeInTheDocument();
    });

    it('renders the title', () => {
      renderComponent();
      expect(screen.getByText('Test Story Title')).toBeInTheDocument();
    });

    it('renders the description', () => {
      renderComponent();
      expect(screen.getByText('Test story description.')).toBeInTheDocument();
    });

    it('renders the tour-box-icon element', () => {
      const { container } = renderComponent();
      expect(container.querySelector('.tour-box-icon')).toBeInTheDocument();
    });

    it('renders the tour-box-gradient element', () => {
      const { container } = renderComponent();
      expect(container.querySelector('.tour-box-gradient')).toBeInTheDocument();
    });

    it('applies the className prop to the anchor', () => {
      const { container } = renderComponent({ className: 'tour-box custom-type' });
      const anchor = container.querySelector('a');
      expect(anchor).toHaveClass('tour-box');
      expect(anchor).toHaveClass('custom-type');
    });
  });

  describe('backgroundImage — initial styles', () => {
    it('sets backgroundImage style when backgroundImage prop is provided', () => {
      const { container } = renderComponent({ backgroundImage: 'cover.jpg', storyId: 'story-1' });
      const anchor = container.querySelector('a');
      expect(anchor.style.backgroundImage).toContain(
        'config/metadata/stories/story-1/cover.jpg',
      );
    });

    it('has empty style object when backgroundImage is not provided', () => {
      const { container } = renderComponent({ backgroundImage: undefined });
      const anchor = container.querySelector('a');
      expect(anchor.style.backgroundImage).toBe('');
    });
  });

  describe('floatBox class — storyOrder positioning', () => {
    it('adds tour-box-float when index is the last item', () => {
      // storyOrder.length=3, index=2: length-(index+1)=0 → float
      const { container } = renderComponent({ index: 2, storyOrder: ['a', 'b', 'c'] });
      expect(container.querySelector('a')).toHaveClass('tour-box-float');
    });

    it('adds tour-box-float when index is second-to-last', () => {
      // storyOrder.length=3, index=1: length-(index+2)=0 → float
      const { container } = renderComponent({ index: 1, storyOrder: ['a', 'b', 'c'] });
      expect(container.querySelector('a')).toHaveClass('tour-box-float');
    });

    it('does not add tour-box-float for earlier items in a long list', () => {
      // storyOrder.length=4, index=0: length-(0+1)=3, length-(0+2)=2 → no float
      const { container } = renderComponent({ index: 0, storyOrder: ['a', 'b', 'c', 'd'] });
      expect(container.querySelector('a')).not.toHaveClass('tour-box-float');
    });
  });

  describe('onMouseOver', () => {
    it('updates backgroundImage to hover image on mouse over', () => {
      const { container } = renderComponent({
        backgroundImageHover: 'hover.jpg',
        storyId: 'story-1',
      });
      const anchor = container.querySelector('a');
      act(() => { fireEvent.mouseOver(anchor); });
      expect(anchor.style.backgroundImage).toContain(
        'config/metadata/stories/story-1/hover.jpg',
      );
    });

    it('does not change style on mouse over when backgroundImageHover is absent', () => {
      const { container } = renderComponent({
        backgroundImage: 'cover.jpg',
        backgroundImageHover: undefined,
        storyId: 'story-1',
      });
      const anchor = container.querySelector('a');
      const originalBg = anchor.style.backgroundImage;
      act(() => { fireEvent.mouseOver(anchor); });
      expect(anchor.style.backgroundImage).toBe(originalBg);
    });
  });

  describe('onMouseOut', () => {
    it('restores original backgroundImage on mouse out after hover', () => {
      const { container } = renderComponent({
        backgroundImage: 'cover.jpg',
        backgroundImageHover: 'hover.jpg',
        storyId: 'story-1',
      });
      const anchor = container.querySelector('a');
      act(() => { fireEvent.mouseOver(anchor); });
      expect(anchor.style.backgroundImage).toContain('hover.jpg');
      act(() => { fireEvent.mouseOut(anchor); });
      expect(anchor.style.backgroundImage).toContain(
        'config/metadata/stories/story-1/cover.jpg',
      );
    });

    it('does not change style on mouse out when backgroundImage is absent', () => {
      const { container } = renderComponent({
        backgroundImage: undefined,
        backgroundImageHover: undefined,
      });
      const anchor = container.querySelector('a');
      act(() => { fireEvent.mouseOut(anchor); });
      expect(anchor.style.backgroundImage).toBe('');
    });
  });

  describe('onClick — selectTour', () => {
    it('calls selectTour with event, story, index, storyId when clicked', () => {
      const selectTour = jest.fn();
      const story = { id: 'story-1', title: 'S' };
      const { container } = renderComponent({ selectTour, story, index: 2, storyId: 'story-1' });
      act(() => { fireEvent.click(container.querySelector('a')); });
      expect(selectTour).toHaveBeenCalledTimes(1);
      expect(selectTour).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'click' }),
        story,
        2,
        'story-1',
      );
    });
  });
});
