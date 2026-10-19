/* eslint-disable react/prop-types */
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';

jest.mock('../../../util/util', () => ({
  events: { trigger: jest.fn() },
}));
jest.mock('../../../util/constants', () => ({ GRANULE_HOVERED: 'GRANULE_HOVERED' }));
jest.mock('@fortawesome/react-fontawesome', () => ({
  FontAwesomeIcon: () => <span data-testid="fa-icon" />,
}));
jest.mock('@fortawesome/free-solid-svg-icons', () => ({
  faArrowCircleUp: 'faArrowCircleUp',
  faArrowCircleDown: 'faArrowCircleDown',
}));
jest.mock('@dnd-kit/core', () => ({
  DndContext: ({ children }) => <div>{children}</div>,
  closestCenter: jest.fn(),
}));
jest.mock('@dnd-kit/sortable', () => ({
  SortableContext: ({ children }) => <div>{children}</div>,
  verticalListSortingStrategy: jest.fn(),
  arrayMove: jest.fn((arr, from, to) => {
    const next = [...arr];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    return next;
  }),
  useSortable: () => ({
    attributes: {},
    listeners: {},
    setNodeRef: jest.fn(),
    transform: null,
    transition: null,
    isDragging: false,
  }),
}));
jest.mock('@dnd-kit/utilities', () => ({
  CSS: { Transform: { toString: () => '' } },
}));

import GranuleDateList from './granule-date-list';
import util from '../../../util/util';

const dates = ['2023-01-05', '2023-01-04', '2023-01-03', '2023-01-02', '2023-01-01'];

const defaultProps = {
  def: { id: 'MODIS_Terra' },
  granuleCount: 5,
  granuleDates: dates,
  resetGranuleLayerDates: jest.fn(),
  granulePlatform: 'Terra',
  screenHeight: 800,
  updateGranuleLayerOptions: jest.fn(),
};

const renderList = (overrides = {}) => {
  const props = { ...defaultProps, ...overrides };
  return render(
    <GranuleDateList
      def={props.def}
      granuleCount={props.granuleCount}
      granuleDates={props.granuleDates}
      resetGranuleLayerDates={props.resetGranuleLayerDates}
      granulePlatform={props.granulePlatform}
      screenHeight={props.screenHeight}
      updateGranuleLayerOptions={props.updateGranuleLayerOptions}
    />,
  );
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe('GranuleDateList', () => {
  describe('layout', () => {
    it('renders the "Granule Layer Date Order" heading', () => {
      renderList();
      expect(screen.getByText('Granule Layer Date Order')).toBeInTheDocument();
    });

    it('renders a RESET button', () => {
      renderList();
      expect(screen.getByRole('button', { name: /reset/i })).toBeInTheDocument();
    });

    it('renders each date as a granule-date-item', () => {
      const { container } = renderList();
      expect(container.querySelectorAll('.granule-date-item')).toHaveLength(dates.length);
    });

    it('renders each date string in the list', () => {
      renderList();
      dates.forEach((d) => expect(screen.getByText(d)).toBeInTheDocument());
    });
  });

  describe('empty state', () => {
    it('shows "No granules available." when granuleDates is empty', () => {
      renderList({ granuleDates: [] });
      expect(screen.getByText('No granules available.')).toBeInTheDocument();
    });

    it('shows "No granules available." when granuleDates is null', () => {
      renderList({ granuleDates: null });
      expect(screen.getByText('No granules available.')).toBeInTheDocument();
    });

    it('renders no granule-date-item elements when list is empty', () => {
      const { container } = renderList({ granuleDates: [] });
      expect(container.querySelectorAll('.granule-date-item')).toHaveLength(0);
    });
  });

  describe('RESET button', () => {
    it('is disabled when dates are already sorted descending', () => {
      renderList({ granuleDates: ['2023-01-05', '2023-01-04', '2023-01-03'] });
      expect(screen.getByRole('button', { name: /reset/i })).toBeDisabled();
    });

    it('is enabled when dates are not sorted descending', () => {
      renderList({ granuleDates: ['2023-01-01', '2023-01-05', '2023-01-03'] });
      expect(screen.getByRole('button', { name: /reset/i })).not.toBeDisabled();
    });

    it('calls resetGranuleLayerDates with def.id when clicked', () => {
      const resetGranuleLayerDates = jest.fn();
      renderList({ granuleDates: ['2023-01-01', '2023-01-05'], resetGranuleLayerDates });
      fireEvent.click(screen.getByRole('button', { name: /reset/i }));
      expect(resetGranuleLayerDates).toHaveBeenCalledWith('MODIS_Terra');
    });
  });

  describe('up/down move buttons', () => {
    it('renders a down button for the first item', () => {
      const { container } = renderList();
      const firstItem = container.querySelectorAll('.granule-date-item')[0];
      expect(firstItem.querySelector('.granule-date-item-down-button')).toBeInTheDocument();
    });

    it('does not render an up button for the first item', () => {
      const { container } = renderList();
      const firstItem = container.querySelectorAll('.granule-date-item')[0];
      expect(firstItem.querySelector('.granule-date-item-up-button')).not.toBeInTheDocument();
    });

    it('renders an up button for the last item', () => {
      const { container } = renderList();
      const items = container.querySelectorAll('.granule-date-item');
      const lastItem = items[items.length - 1];
      expect(lastItem.querySelector('.granule-date-item-up-button')).toBeInTheDocument();
    });

    it('does not render a down button for the last item', () => {
      const { container } = renderList();
      const items = container.querySelectorAll('.granule-date-item');
      const lastItem = items[items.length - 1];
      expect(lastItem.querySelector('.granule-date-item-down-button')).not.toBeInTheDocument();
    });

    it('calls updateGranuleLayerOptions when a down button is clicked', () => {
      const updateGranuleLayerOptions = jest.fn();
      const { container } = renderList({ updateGranuleLayerOptions });
      const firstDown = container.querySelector('.granule-date-item-down-button');
      fireEvent.click(firstDown);
      expect(updateGranuleLayerOptions).toHaveBeenCalled();
    });

    it('calls updateGranuleLayerOptions when an up button is clicked', () => {
      const updateGranuleLayerOptions = jest.fn();
      const { container } = renderList({ updateGranuleLayerOptions });
      const firstUp = container.querySelector('.granule-date-item-up-button');
      fireEvent.click(firstUp);
      expect(updateGranuleLayerOptions).toHaveBeenCalled();
    });
  });

  describe('hover events', () => {
    it('triggers GRANULE_HOVERED with platform and date on mouseenter', () => {
      const { container } = renderList();
      const firstItem = container.querySelectorAll('.granule-date-item')[0];
      fireEvent.mouseEnter(firstItem);
      expect(util.events.trigger).toHaveBeenCalledWith('GRANULE_HOVERED', 'Terra', dates[0]);
    });

    it('triggers GRANULE_HOVERED with null on mouseleave', () => {
      const { container } = renderList();
      const firstItem = container.querySelectorAll('.granule-date-item')[0];
      fireEvent.mouseLeave(firstItem);
      expect(util.events.trigger).toHaveBeenCalledWith('GRANULE_HOVERED', 'Terra', null);
    });
  });
});
