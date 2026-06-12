import { render } from '@testing-library/react';
import TileText from './tile-text';

// SVG fragments need to be rendered inside an <svg> for the DOM to be valid
function renderText(item, index = 2, gridWidth = 12) {
  return render(<svg><TileText item={item} index={index} gridWidth={gridWidth} /></svg>);
}

describe('TileText', () => {
  it('renders a day tile with separate date and year text', () => {
    const { container } = renderText({
      timeScale: 'day',
      date: '01 2023',
      dateObject: { date: 1 },
    });
    const dayText = container.querySelector('.axis-grid-text-day');
    const yearText = container.querySelector('.axis-grid-text-year');
    expect(dayText.textContent).toBe('01');
    expect(yearText.textContent).toBe('2023');
    // index(2) * gridWidth(12) + xOffset(8) = 32
    expect(container.querySelector('g').getAttribute('transform')).toBe('translate(32)');
  });

  it('renders an hour tile with a formatted time label at 6/12/18', () => {
    const { container } = renderText({
      timeScale: 'hour',
      date: 'fallback',
      dateObject: { hours: 12 },
    });
    expect(container.querySelector('.axis-grid-text-hour').textContent).toBe('12:00');
  });

  it('falls back to item.date for other hours', () => {
    const { container } = renderText({
      timeScale: 'hour',
      date: '3 AM',
      dateObject: { hours: 3 },
    });
    expect(container.querySelector('.axis-grid-text-hour').textContent).toBe('3 AM');
  });

  it('uses a smaller x offset for month tiles', () => {
    const { container } = renderText({
      timeScale: 'month',
      date: 'May',
      dateObject: { months: 4 },
    }, 1, 10);
    // index(1) * gridWidth(10) + xOffset(5) = 15
    expect(container.querySelector('g').getAttribute('transform')).toBe('translate(15)');
    expect(container.querySelector('.axis-grid-text-month').textContent).toBe('May');
  });

  it('uses a smaller x offset for year tiles', () => {
    const { container } = renderText({
      timeScale: 'year',
      date: '2020',
      dateObject: { years: 2020 },
    }, 0, 10);
    expect(container.querySelector('g').getAttribute('transform')).toBe('translate(5)');
  });

  it('renders a minute tile with the default offset and no year text', () => {
    const { container } = renderText({
      timeScale: 'minute',
      date: ':30',
      dateObject: { minutes: 30 },
    });
    expect(container.querySelector('.axis-grid-text-minute').textContent).toBe(':30');
    expect(container.querySelector('.axis-grid-text-year')).toBeNull();
  });
});
