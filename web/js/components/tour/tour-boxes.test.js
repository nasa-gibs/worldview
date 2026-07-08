/* eslint-disable react/jsx-props-no-spreading */
/* eslint-disable react/prop-types */
import { render, screen, fireEvent, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import TourBoxes from './tour-boxes';

jest.mock('./tour-box', () => function MockTourBox({
  index, storyId, title, description, selectTour, className,
}) {
  return (
    <div
      data-testid={`tour-box-${storyId}`}
      data-index={index}
      data-classname={className}
    >
      <span data-testid={`title-${storyId}`}>{title}</span>
      <span data-testid={`desc-${storyId}`}>{description}</span>
      <button
        type="button"
        data-testid={`select-${storyId}`}
        onClick={() => selectTour({}, {}, index, storyId)}
      >
        Select
      </button>
    </div>
  );
});

const makeStories = (...ids) => Object.fromEntries(
  ids.map((id, i) => [id, {
    id,
    title: `Story ${i + 1}`,
    description: `Desc ${i + 1}`,
    type: `type-${i + 1}`,
    backgroundImage: `bg${i + 1}.jpg`,
    backgroundImageHover: `bg${i + 1}-hover.jpg`,
  }]),
);

const defaultProps = {
  stories: makeStories('s1', 's2', 's3'),
  storyOrder: ['s1', 's2', 's3'],
  selectTour: jest.fn(),
};

const renderComponent = (props = {}) => render(
  <TourBoxes {...defaultProps} {...props} />,
);

beforeEach(() => {
  jest.clearAllMocks();
});

describe('TourBoxes', () => {
  describe('container structure', () => {
    it('renders the tour-box-container div', () => {
      const { container } = renderComponent();
      expect(container.querySelector('.tour-box-container')).toBeInTheDocument();
    });

    it('renders the tour-box-row div inside the container', () => {
      const { container } = renderComponent();
      expect(container.querySelector('.tour-box-row')).toBeInTheDocument();
    });
  });

  describe('TourBox rendering', () => {
    it('renders one TourBox per storyOrder entry', () => {
      renderComponent();
      expect(screen.getAllByTestId(/^tour-box-/)).toHaveLength(3);
    });

    it('renders each story by its storyId', () => {
      renderComponent();
      expect(screen.getByTestId('tour-box-s1')).toBeInTheDocument();
      expect(screen.getByTestId('tour-box-s2')).toBeInTheDocument();
      expect(screen.getByTestId('tour-box-s3')).toBeInTheDocument();
    });

    it('passes the correct index to each TourBox', () => {
      renderComponent();
      expect(screen.getByTestId('tour-box-s1')).toHaveAttribute('data-index', '0');
      expect(screen.getByTestId('tour-box-s2')).toHaveAttribute('data-index', '1');
      expect(screen.getByTestId('tour-box-s3')).toHaveAttribute('data-index', '2');
    });

    it('passes the story title to each TourBox', () => {
      renderComponent();
      expect(screen.getByTestId('title-s1')).toHaveTextContent('Story 1');
      expect(screen.getByTestId('title-s2')).toHaveTextContent('Story 2');
    });

    it('passes the story description to each TourBox', () => {
      renderComponent();
      expect(screen.getByTestId('desc-s1')).toHaveTextContent('Desc 1');
    });

    it('passes className as "tour-box <story.type>" to each TourBox', () => {
      renderComponent();
      expect(screen.getByTestId('tour-box-s1')).toHaveAttribute('data-classname', 'tour-box type-1');
      expect(screen.getByTestId('tour-box-s2')).toHaveAttribute('data-classname', 'tour-box type-2');
    });

    it('renders no TourBoxes when storyOrder is empty', () => {
      renderComponent({ storyOrder: [] });
      expect(screen.queryAllByTestId(/^tour-box-/)).toHaveLength(0);
    });

    it('renders a single TourBox when storyOrder has one entry', () => {
      const stories = makeStories('only');
      renderComponent({ stories, storyOrder: ['only'] });
      expect(screen.getAllByTestId(/^tour-box-/)).toHaveLength(1);
    });
  });

  describe('selectTour propagation', () => {
    it('calls selectTour when a TourBox fires it', () => {
      const selectTour = jest.fn();
      renderComponent({ selectTour });
      act(() => { fireEvent.click(screen.getByTestId('select-s1')); });
      expect(selectTour).toHaveBeenCalledTimes(1);
      expect(selectTour).toHaveBeenCalledWith({}, {}, 0, 's1');
    });

    it('passes the correct index when the second box is selected', () => {
      const selectTour = jest.fn();
      renderComponent({ selectTour });
      act(() => { fireEvent.click(screen.getByTestId('select-s2')); });
      expect(selectTour).toHaveBeenCalledWith({}, {}, 1, 's2');
    });
  });
});
