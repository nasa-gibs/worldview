import {
  mapLocationToAnimationState,
  snapToIntervalDelta,
} from './util';
import { defaultState } from './reducers';

test('mapLocationToAnimationState updates state to have isPlaying bool true if playanim and ab keys are present [animation-location-state]', () => {
  const stateFromLocation = { animation: defaultState };
  const PERMALINK_STATE = { ab: true, playanim: true };
  const response = mapLocationToAnimationState(
    PERMALINK_STATE,
    stateFromLocation,
  );
  expect(stateFromLocation.animation.isPlaying).toBeFalsy();
  expect(response.animation.isPlaying).toBeTruthy();
});

test('snapToIntervalDelta snaps at the year interval [animation-year-interval]', () => {
  const currentDate = new Date('2010-06-23');
  const startDate = new Date('  2000-04-15');
  const endDate = new Date('    2019-08-24');
  const expected = new Date('   2010-04-15');
  const snappedDate = snapToIntervalDelta(currentDate, startDate, endDate, 'year', 1);
  expect(snappedDate.valueOf()).toBe(expected.valueOf());
});

test('snapToIntervalDelta snaps at the month interval [animation-month-interval]', () => {
  const currentDate = new Date('2018-6-23');
  const startDate = new Date('  2018-4-15');
  const endDate = new Date('    2019-8-24');
  const expected = new Date('   2018-6-15');
  const snappedDate = snapToIntervalDelta(currentDate, startDate, endDate, 'month', 1);
  expect(snappedDate.valueOf()).toBe(expected.valueOf());
});

test('snapToIntervalDelta snaps at the day interval [animation-day-interval]', () => {
  const currentDate = new Date('2018-07-04 12:34:00Z');
  const startDate = new Date('  2018-04-15 08:00:00Z');
  const endDate = new Date('    2018-08-24');
  const expected = new Date('   2018-07-04 08:00:00Z');
  const snappedDate = snapToIntervalDelta(currentDate, startDate, endDate, 'day', 1);
  expect(snappedDate.valueOf()).toBe(expected.valueOf());
});

test('snapToIntervalDelta snaps at the hour interval [animation-hour-interval]', () => {
  const currentDate = new Date('2018-07-04 12:34:00Z');
  const startDate = new Date('  2018-04-15 08:00:00Z');
  const endDate = new Date('    2018-08-24');
  const expected = new Date('   2018-07-04 12:00:00Z');
  const snappedDate = snapToIntervalDelta(currentDate, startDate, endDate, 'hour', 1);
  expect(snappedDate.valueOf()).toBe(expected.valueOf());
});

test('snapToIntervalDelta snaps at the minute interval [animation-minute-interval]', () => {
  const currentDate = new Date('2018-04-19 08:24:56Z');
  const startDate = new Date('  2018-04-19 08:15:30Z');
  const endDate = new Date('    2018-04-19 08:30:30Z');
  const expected = new Date('   2018-04-19 08:24:30Z');
  const snappedDate = snapToIntervalDelta(currentDate, startDate, endDate, 'minute', 1);
  expect(snappedDate.valueOf()).toBe(expected.valueOf());
});

test('snapToIntervalDelta snaps at a custom hour interval [animation-custom-hour-interval]', () => {
  const currentDate = new Date('2018-04-02 06:15:23Z');
  const startDate = new Date('  2018-04-01 00:00:00Z');
  const endDate = new Date('    2018-04-19 00:00:00Z');
  const expected = new Date('   2018-04-02 06:00:00Z');
  const snappedDate = snapToIntervalDelta(currentDate, startDate, endDate, 'hour', 5);
  expect(snappedDate.valueOf()).toBe(expected.valueOf());
});

test('snapToIntervalDelta snaps at custom 10 minute interval [animation-custom-minute-interval]', () => {
  const currentDate = new Date('2018-04-19 08:24:00Z');
  const startDate = new Date('  2018-04-19 08:00:00Z');
  const endDate = new Date('    2018-04-19 09:00:00Z');
  const expected = new Date('2018-04-19 08:20:00Z');
  const snappedDate = snapToIntervalDelta(currentDate, startDate, endDate, 'minute', 10);
  expect(snappedDate.valueOf()).toBe(expected.valueOf());
});

test('snapToIntervalDelta snaps to startDate if currentDate is after endDate [animation-current-greater-than-end]', () => {
  const currentDate = new Date('2019-05-15 08:00:00Z');
  const startDate = new Date('  2018-04-19 08:15:30Z');
  const endDate = new Date('    2018-04-19 08:30:30Z');
  const expected = new Date('   2018-04-19 08:15:30Z');
  const snappedDate = snapToIntervalDelta(currentDate, startDate, endDate, 'minute', 1);
  expect(snappedDate.valueOf()).toBe(expected.valueOf());
});

test('snapToIntervalDelta snaps to startDate if currentDate is before startDate [animation-current-less-than-start]', () => {
  const currentDate = new Date('2018-03-22 08:00:00');
  const startDate = new Date('  2018-04-19 08:15:30Z');
  const endDate = new Date('    2018-04-19 08:30:30Z');
  const expected = new Date('   2018-04-19 08:15:30Z');
  const snappedDate = snapToIntervalDelta(currentDate, startDate, endDate, 'minute', 1);
  expect(snappedDate.valueOf()).toBe(expected.valueOf());
});
