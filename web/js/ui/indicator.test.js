import jQuery from 'jquery';
import indicator from './indicator';

const unmocked = {};

beforeAll(() => {
  unmocked._show = indicator._show;
  unmocked._hide = indicator._hide;
  unmocked.hide = indicator.hide;
});

beforeEach(() => { indicator.active = []; });

afterEach(() => {
  indicator._show = unmocked._show;
  indicator._hide = unmocked._hide;
  indicator.hide = unmocked.hide;
});

test('delayed indicator shown', (done) => {
  indicator._show = jest.fn();
  indicator.hide = jest.fn();
  const promise = jQuery.Deferred();
  indicator.delayed(promise, 10);
  setTimeout(() => {
    promise.resolve();
    expect(indicator._show).toBeCalled();
    expect(indicator.hide).toBeCalled();
    done();
  }, 50);
});

test('delayed indicator not shown', (done) => {
  indicator._show = jest.fn();
  indicator.hide = jest.fn();
  const promise = jQuery.Deferred();
  indicator.delayed(promise, 1000);
  setTimeout(() => {
    promise.resolve();
    expect(indicator._show).not.toBeCalled();
    expect(indicator.hide).not.toBeCalled();
    done();
  }, 50);
});

test('pop message', () => {
  indicator._show = jest.fn();
  indicator._hide = jest.fn();

  indicator.show('Bottom');
  const id = indicator.show('Top');
  indicator.hide(id);

  expect(indicator.active).toHaveLength(1);
  expect(indicator.active[0].message).toBe('Bottom');
});

test('remove bottom message', () => {
  indicator._show = jest.fn();
  indicator._hide = jest.fn();

  const id = indicator.show('Bottom');
  indicator.show('Top');
  indicator.hide(id);

  expect(indicator.active).toHaveLength(1);
  expect(indicator.active[0].message).toBe('Top');
});

test('hide group', () => {
  indicator._show = jest.fn();
  indicator._hide = jest.fn();

  const indicators = {
    two: null,
    three: null,
  };
  indicator.show('One');
  indicators.two = indicator.show('Two');
  indicators.three = indicator.show('Three');
  indicator.hide(indicators);

  expect(indicator.active).toHaveLength(1);
  expect(indicator.active[0].message).toBe('One');
});
