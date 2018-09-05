import { parse } from './date';
import util from '../util/util';

afterEach(() => {
  util.resetNow();
});

test('parses valid date: 1.1', () => {
  let errors = [];
  let d = new Date(Date.UTC(2013, 0, 5));
  let state = {
    time: '2013-01-05'
  };
  parse(state, errors);
  expect(state.t).toEqual(d);
  expect(errors).toHaveLength(0);
});

test('parses valid date: 1.2', () => {
  let errors = [];
  let d = new Date(Date.UTC(2013, 0, 5));
  let state = {
    t: '2013-01-05'
  };
  parse(state, errors);
  expect(state.t).toEqual(d);
  expect(errors).toHaveLength(0);
});

test('error added if date is invalid', () => {
  let errors = [];
  let state = {
    time: 'X'
  };
  parse(state, errors);
  expect(state).not.toBe('X');
  expect(errors).toHaveLength(1);
});

test('overrides now', () => {
  let errors = [];
  let d = new Date(Date.UTC(2013, 0, 5));
  let state = {
    now: '2013-01-05'
  };
  parse(state, errors);
  expect(util.now()).toEqual(d);
  expect(errors).toHaveLength(0);
});

test('error added if now is invalid', () => {
  let errors = [];
  let state = {
    now: 'X'
  };
  parse(state, errors);
  expect(errors).toHaveLength(1);
  expect(state.now).not.toBe('X');
});
