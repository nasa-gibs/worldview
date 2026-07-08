/* eslint-disable react/jsx-props-no-spreading */
import { render, act, fireEvent, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import Tooltip from './tooltip';

const defaultProps = {
  text: 'Hover me',
  dataArray: ['Option A', 'Option B', 'Option C'],
  onClick: jest.fn(),
};

const renderComponent = (props = {}) => render(
  <Tooltip {...defaultProps} {...props} />,
);

beforeEach(() => {
  jest.clearAllMocks();
});

describe('Tooltip', () => {
  describe('initial render', () => {
    it('renders the text span', () => {
      renderComponent();
      expect(screen.getByText('Hover me')).toBeInTheDocument();
    });

    it('renders the wv-tooltip-case container', () => {
      const { container } = renderComponent();
      expect(container.querySelector('.wv-tooltip-case')).toBeInTheDocument();
    });

    it('renders the wv-tooltip div', () => {
      const { container } = renderComponent();
      expect(container.querySelector('.wv-tooltip')).toBeInTheDocument();
    });

    it('tooltip is not visible initially (no inline visibility style)', () => {
      const { container } = renderComponent();
      const tooltip = container.querySelector('.wv-tooltip');
      expect(tooltip.style.visibility).toBe('');
    });

    it('renders a list item for each dataArray element', () => {
      renderComponent();
      expect(screen.getByText('Option A')).toBeInTheDocument();
      expect(screen.getByText('Option B')).toBeInTheDocument();
      expect(screen.getByText('Option C')).toBeInTheDocument();
    });

    it('renders the correct number of list items', () => {
      const { container } = renderComponent();
      expect(container.querySelectorAll('li')).toHaveLength(3);
    });

    it('each list item has the correct id from dataArray', () => {
      const { container } = renderComponent();
      const items = container.querySelectorAll('li');
      expect(items[0].id).toBe('Option A');
      expect(items[1].id).toBe('Option B');
      expect(items[2].id).toBe('Option C');
    });

    it('each list item has a unique key derived from value and index', () => {
      const { container } = renderComponent({ dataArray: ['X', 'X'] });
      const items = container.querySelectorAll('li');
      // Both items render — duplicate value is disambiguated by index in key
      expect(items).toHaveLength(2);
    });

    it('renders an empty list when dataArray is empty', () => {
      const { container } = renderComponent({ dataArray: [] });
      expect(container.querySelectorAll('li')).toHaveLength(0);
    });
  });

  describe('mouseOver / mouseOut — hover state', () => {
    it('sets visibility:visible on the tooltip when mouse enters', () => {
      const { container } = renderComponent();
      act(() => {
        fireEvent.mouseEnter(container.querySelector('.wv-tooltip-case'));
      });
      expect(container.querySelector('.wv-tooltip').style.visibility).toBe('visible');
    });

    it('clears visibility after mouse leaves', () => {
      const { container } = renderComponent();
      const wrapper = container.querySelector('.wv-tooltip-case');
      act(() => { fireEvent.mouseEnter(wrapper); });
      act(() => { fireEvent.mouseLeave(wrapper); });
      expect(container.querySelector('.wv-tooltip').style.visibility).toBe('');
    });

    it('toggling hover on and off multiple times works correctly', () => {
      const { container } = renderComponent();
      const wrapper = container.querySelector('.wv-tooltip-case');
      act(() => { fireEvent.mouseEnter(wrapper); });
      expect(container.querySelector('.wv-tooltip').style.visibility).toBe('visible');
      act(() => { fireEvent.mouseLeave(wrapper); });
      expect(container.querySelector('.wv-tooltip').style.visibility).toBe('');
      act(() => { fireEvent.mouseEnter(wrapper); });
      expect(container.querySelector('.wv-tooltip').style.visibility).toBe('visible');
    });
  });

  describe('onClick', () => {
    it('calls the onClick prop when a list item is clicked', () => {
      const onClick = jest.fn();
      renderComponent({ onClick });
      act(() => { fireEvent.click(screen.getByText('Option A')); });
      expect(onClick).toHaveBeenCalledTimes(1);
    });

    it('calls onClick for each clicked item', () => {
      const onClick = jest.fn();
      renderComponent({ onClick });
      act(() => { fireEvent.click(screen.getByText('Option A')); });
      act(() => { fireEvent.click(screen.getByText('Option B')); });
      expect(onClick).toHaveBeenCalledTimes(2);
    });

    it('passes the synthetic event object to onClick', () => {
      const onClick = jest.fn();
      renderComponent({ onClick });
      act(() => { fireEvent.click(screen.getByText('Option C')); });
      // The onClick handler receives the SyntheticEvent (dataEl in the inline arrow)
      expect(onClick).toHaveBeenCalledWith(expect.objectContaining({ type: 'click' }));
    });
  });
});
