import { render } from '@testing-library/react';
import GridRange from './grid-range';

jest.mock('./tile-rect', () => () => <g data-testid="tile-rect" />);
jest.mock('./tile-text', () => () => <g data-testid="tile-text" />);

function item(overrides = {}) {
  return {
    withinRange: true,
    dateObject: {},
    ...overrides,
  };
}

function renderGrid(props = {}) {
  return render(
    <svg>
      <GridRange
        gridWidth={props.gridWidth ?? 12}
        transformX={props.transformX ?? 50}
        timeScale={props.timeScale || 'day'}
        timeRange={props.timeRange || []}
        showHover={props.showHover || jest.fn()}
      />
    </svg>,
  );
}

describe('GridRange', () => {
  it('applies the horizontal transform to the container group', () => {
    const { container } = renderGrid({ transformX: 75 });
    expect(container.querySelector('.axis-grid-container').getAttribute('transform'))
      .toBe('translate(75)');
  });

  it('skips items that are not within range', () => {
    const { queryAllByTestId } = renderGrid({
      timeScale: 'day',
      timeRange: [
        item({ withinRange: false, dateObject: { date: 1 } }),
        item({ withinRange: false, dateObject: { date: 2 } }),
      ],
    });
    expect(queryAllByTestId('tile-rect').length).toBe(0);
  });

  it('renders a tile rect for each in-range item and text only when the condition is met', () => {
    const { queryAllByTestId } = renderGrid({
      timeScale: 'day',
      timeRange: [
        item({ dateObject: { date: 1 } }), // text condition met (day === 1)
        item({ dateObject: { date: 2 } }), // no text
        item({ withinRange: false, dateObject: { date: 3 } }), // skipped
      ],
    });
    expect(queryAllByTestId('tile-rect').length).toBe(2);
    expect(queryAllByTestId('tile-text').length).toBe(1);
  });

  it('uses the minute text condition (0/15/30/45)', () => {
    const { queryAllByTestId } = renderGrid({
      timeScale: 'minute',
      timeRange: [item({ dateObject: { minutes: 15 } }), item({ dateObject: { minutes: 7 } })],
    });
    expect(queryAllByTestId('tile-text').length).toBe(1);
  });

  it('uses the hour text condition (0/6/12/18)', () => {
    const { queryAllByTestId } = renderGrid({
      timeScale: 'hour',
      timeRange: [item({ dateObject: { hours: 6 } }), item({ dateObject: { hours: 5 } })],
    });
    expect(queryAllByTestId('tile-text').length).toBe(1);
  });

  it('uses the month text condition (January only)', () => {
    const { queryAllByTestId } = renderGrid({
      timeScale: 'month',
      timeRange: [item({ dateObject: { months: 0 } }), item({ dateObject: { months: 3 } })],
    });
    expect(queryAllByTestId('tile-text').length).toBe(1);
  });

  it('uses the year text condition (decades only)', () => {
    const { queryAllByTestId } = renderGrid({
      timeScale: 'year',
      timeRange: [item({ dateObject: { years: 2020 } }), item({ dateObject: { years: 2021 } })],
    });
    expect(queryAllByTestId('tile-text').length).toBe(1);
  });
});
