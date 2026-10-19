import { render, fireEvent } from '@testing-library/react';
import TileRect from './tile-rect';

function renderRect(props = {}) {
  const showHover = props.showHover || jest.fn();
  const item = {
    rawDate: '2023-05-01',
    rawNextDate: '2023-05-02',
    dayOfWeek: props.dayOfWeek ?? 1,
    dateObject: props.dateObject || {},
    ...props.item,
  };
  const utils = render(
    <svg>
      <TileRect
        item={item}
        index={props.index ?? 2}
        gridWidth={props.gridWidth ?? 12}
        timeScale={props.timeScale}
        showHover={showHover}
      />
    </svg>,
  );
  return { showHover, ...utils };
}

const getWhiteLine = (container) => container.querySelectorAll('line.axis-grid-line')[2];

describe('TileRect rendering', () => {
  it('renders the rect and grid lines', () => {
    const { container } = renderRect({ timeScale: 'day', dateObject: { date: 5 }, dayOfWeek: 1 });
    expect(container.querySelector('rect.axis-grid-rect')).toBeTruthy();
    expect(container.querySelectorAll('line.axis-grid-line').length).toBe(3);
  });

  it('positions the rect using index * gridWidth', () => {
    const { container } = renderRect({
      timeScale: 'day', index: 3, gridWidth: 10, dateObject: { date: 5 },
    });
    expect(container.querySelector('rect.axis-grid-rect').getAttribute('x')).toBe('30');
  });

  it('calls showHover with raw dates and index on mouse move', () => {
    const { container, showHover } = renderRect({ timeScale: 'day', dateObject: { date: 5 }, index: 4 });
    fireEvent.mouseMove(container.querySelector('g'));
    expect(showHover).toHaveBeenCalledWith(expect.anything(), '2023-05-01', '2023-05-02', 4);
  });
});

describe('TileRect lineLengthY by timeScale', () => {
  it('minute: full length (62) at quarter-hour marks', () => {
    const { container } = renderRect({ timeScale: 'minute', dateObject: { minutes: 30 } });
    expect(getWhiteLine(container).getAttribute('y2')).toBe('62');
  });

  it('minute: 20 on multiples of 5, 10 otherwise', () => {
    const { container: c1 } = renderRect({ timeScale: 'minute', dateObject: { minutes: 5 } });
    expect(getWhiteLine(c1).getAttribute('y2')).toBe('20');
    const { container: c2 } = renderRect({ timeScale: 'minute', dateObject: { minutes: 7 } });
    expect(getWhiteLine(c2).getAttribute('y2')).toBe('10');
  });

  it('hour: full length at 0, 22 at 6/12/18, 10 otherwise', () => {
    expect(getWhiteLine(renderRect({ timeScale: 'hour', dateObject: { hours: 0 } }).container).getAttribute('y2')).toBe('62');
    expect(getWhiteLine(renderRect({ timeScale: 'hour', dateObject: { hours: 12 } }).container).getAttribute('y2')).toBe('22');
    expect(getWhiteLine(renderRect({ timeScale: 'hour', dateObject: { hours: 3 } }).container).getAttribute('y2')).toBe('10');
  });

  it('day: full length on the 1st, 22 on Sundays, 10 otherwise', () => {
    expect(getWhiteLine(renderRect({ timeScale: 'day', dateObject: { date: 1 }, dayOfWeek: 3 }).container).getAttribute('y2')).toBe('62');
    expect(getWhiteLine(renderRect({ timeScale: 'day', dateObject: { date: 5 }, dayOfWeek: 0 }).container).getAttribute('y2')).toBe('22');
    expect(getWhiteLine(renderRect({ timeScale: 'day', dateObject: { date: 5 }, dayOfWeek: 3 }).container).getAttribute('y2')).toBe('10');
  });

  it('month: full length in January, 22 on quarters, 10 otherwise', () => {
    expect(getWhiteLine(renderRect({ timeScale: 'month', dateObject: { months: 0 } }).container).getAttribute('y2')).toBe('62');
    expect(getWhiteLine(renderRect({ timeScale: 'month', dateObject: { months: 3 } }).container).getAttribute('y2')).toBe('22');
    expect(getWhiteLine(renderRect({ timeScale: 'month', dateObject: { months: 4 } }).container).getAttribute('y2')).toBe('10');
  });

  it('year: full length each decade, 22 on multiples of 5, 10 otherwise', () => {
    expect(getWhiteLine(renderRect({ timeScale: 'year', dateObject: { years: 2020 } }).container).getAttribute('y2')).toBe('62');
    expect(getWhiteLine(renderRect({ timeScale: 'year', dateObject: { years: 2015 } }).container).getAttribute('y2')).toBe('22');
    expect(getWhiteLine(renderRect({ timeScale: 'year', dateObject: { years: 2017 } }).container).getAttribute('y2')).toBe('10');
  });

  it('uses a thinner stroke (1) only when the line length is 10', () => {
    const { container: thin } = renderRect({ timeScale: 'year', dateObject: { years: 2017 } });
    expect(getWhiteLine(thin).getAttribute('stroke-width')).toBe('1');
    const { container: thick } = renderRect({ timeScale: 'year', dateObject: { years: 2020 } });
    expect(getWhiteLine(thick).getAttribute('stroke-width')).toBe('2');
  });
});
