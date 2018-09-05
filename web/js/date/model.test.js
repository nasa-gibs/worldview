import { dateModel } from './model';
import util from '../util/util';
import fixtures from '../fixtures';

let unmocked = {};
let now = new Date(Date.UTC(2013, 0, 15));

beforeAll(() => {
  unmocked.now = util.now;
});

beforeEach(() => {
  util.now = () => now;
});

afterEach(() => {
  util.now = unmocked.now;
});

function testData() {
  let config = fixtures.config();
  let models = fixtures.models(config);
  return { config, models };
};

test('initializes to today', () => {
  let { models } = testData();
  expect(models.date.selected.getUTCFullYear()).toBe(2013);
  expect(models.date.selected.getUTCMonth()).toBe(0);
  expect(models.date.selected.getUTCDate()).toBe(15);
  expect(models.date.selected.getUTCHours()).toBe(0);
  expect(models.date.selected.getUTCMinutes()).toBe(0);
  expect(models.date.selected.getUTCSeconds()).toBe(0);
});

test('initializes with a specified date', () => {
  let { models, config } = testData();
  let initial = new Date(Date.UTC(2013, 0, 5));
  let date = dateModel(models, config, {
    initial: initial
  });
  expect(date.selected).toEqual(initial);
});

test('select new date', () => {
  let { models } = testData();
  let d = new Date(Date.UTC(2013, 0, 5));
  let listener = jest.fn();
  models.date.events.on('select', listener);
  models.date.select(d);
  expect(models.date.selected).toEqual(d);
  expect(listener).toBeCalledWith(d, 'selected');
});

test('Saves state', () => {
  let { models } = testData();
  let d = new Date(Date.UTC(2013, 0, 5));
  models.date.select(d);
  let state = {};
  models.date.save(state);
  expect(state.t).toBe('2013-01-05-T00:00:00Z');
});

test('loads state', () => {
  let { models } = testData();
  let date = new Date(Date.UTC(2013, 0, 5));
  let state = { t: date };
  models.date.load(state);
  expect(models.date.selected).toEqual(date);
});

test('nothing selected when missing in state', () => {
  let { models } = testData();
  models.date.load({});
  expect(models.date.selected).toEqual(now);
});

test('date and time is unchanged when selecting', () => {
  let { models } = testData();
  let date = new Date(Date.UTC(2012, 1, 2, 3, 4, 5));
  models.date.select(date);
  let selected = models.date.selected;
  expect(selected.getUTCFullYear()).toBe(2012);
  expect(selected.getUTCMonth()).toBe(1);
  expect(selected.getUTCDate()).toBe(2);
  expect(selected.getUTCHours()).toBe(3);
  expect(selected.getUTCMinutes()).toBe(4);
  expect(selected.getUTCSeconds()).toBe(5);
});
