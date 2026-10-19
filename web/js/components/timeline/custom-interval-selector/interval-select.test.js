/* eslint-disable react/prop-types */
import { render, fireEvent } from '@testing-library/react';
import IntervalSelect from './interval-select';

// Mock reactstrap dropdown so the menu items always render and toggle is reachable
jest.mock('reactstrap', () => ({
  Dropdown: ({ children, toggle }) => (
    <div>
      <button type="button" data-testid="dropdown-toggle-trigger" onClick={toggle}>toggle</button>
      {children}
    </div>
  ),
  DropdownToggle: ({ children }) => <div className="dd-toggle">{children}</div>,
  DropdownMenu: ({ children }) => <div className="dd-menu">{children}</div>,
  DropdownItem: ({ children }) => <div className="dd-item">{children}</div>,
}));

describe('IntervalSelect (desktop)', () => {
  it('renders the base timescale options', () => {
    const { container } = render(
      <IntervalSelect zoomLevel="day" hasSubdailyLayers={false} changeZoomLevel={jest.fn()} />,
    );
    const options = container.querySelectorAll('option');
    expect(options.length).toBe(3);
    expect([...options].map((o) => o.value)).toEqual(['year', 'month', 'day']);
  });

  it('includes hour and minute options when subdaily layers are present', () => {
    const { container } = render(
      <IntervalSelect zoomLevel="day" hasSubdailyLayers changeZoomLevel={jest.fn()} />,
    );
    expect(container.querySelectorAll('option').length).toBe(5);
  });

  it('calls changeZoomLevel when a new option is selected', () => {
    const changeZoomLevel = jest.fn();
    const { container } = render(
      <IntervalSelect zoomLevel="day" hasSubdailyLayers changeZoomLevel={changeZoomLevel} />,
    );
    fireEvent.change(container.querySelector('select'), { target: { value: 'month' } });
    expect(changeZoomLevel).toHaveBeenCalledWith('month');
  });

  it('prevents default form submission', () => {
    const { container } = render(
      <IntervalSelect zoomLevel="day" hasSubdailyLayers={false} changeZoomLevel={jest.fn()} />,
    );
    const form = container.querySelector('form');
    const submitEvent = new Event('submit', { bubbles: true, cancelable: true });
    const prevented = !form.dispatchEvent(submitEvent);
    expect(prevented).toBe(true);
  });
});

describe('IntervalSelect (mobile)', () => {
  const renderMobile = (props = {}) => render(
    <IntervalSelect
      isMobile
      interval={3}
      zoomLevel="day"
      hasSubdailyLayers={props.hasSubdailyLayers || false}
      changeZoomLevel={props.changeZoomLevel || jest.fn()}
    />,
  );

  it('renders the mobile dropdown with the current interval label', () => {
    const { container } = renderMobile();
    expect(container.querySelector('.mobile-timescale-dropdown')).toBeTruthy();
    expect(container.querySelector('.dd-toggle').textContent).toBe('DAY');
  });

  it('renders only year/month/day items without subdaily layers', () => {
    const { getByText, queryByText } = renderMobile();
    expect(getByText('Year')).toBeTruthy();
    expect(getByText('Month')).toBeTruthy();
    expect(getByText('Day')).toBeTruthy();
    expect(queryByText('Hour')).toBeNull();
    expect(queryByText('Minute')).toBeNull();
  });

  it('renders hour/minute items with subdaily layers', () => {
    const { getByText } = renderMobile({ hasSubdailyLayers: true });
    expect(getByText('Hour')).toBeTruthy();
    expect(getByText('Minute')).toBeTruthy();
  });

  it('calls changeZoomLevel with the chosen increment on mobile', () => {
    const changeZoomLevel = jest.fn();
    const { getByText } = renderMobile({ hasSubdailyLayers: true, changeZoomLevel });
    fireEvent.click(getByText('Year'));
    expect(changeZoomLevel).toHaveBeenCalledWith('year');
    fireEvent.click(getByText('Month'));
    expect(changeZoomLevel).toHaveBeenCalledWith('month');
    fireEvent.click(getByText('Day'));
    expect(changeZoomLevel).toHaveBeenCalledWith('day');
    fireEvent.click(getByText('Hour'));
    expect(changeZoomLevel).toHaveBeenCalledWith('hour');
    fireEvent.click(getByText('Minute'));
    expect(changeZoomLevel).toHaveBeenCalledWith('minute');
  });

  it('toggles the dropdown open state', () => {
    const { getByTestId } = renderMobile();
    // exercising the toggle handler should not throw
    expect(() => fireEvent.click(getByTestId('dropdown-toggle-trigger'))).not.toThrow();
  });
});
