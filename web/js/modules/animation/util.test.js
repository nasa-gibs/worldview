import {
  mapLocationToAnimationState,
  snapToIntervalDelta,
  getStampProps,
  getNumberOfSteps,
} from './util';
import { defaultState } from './reducers';

// mapLocationToAnimationState tests

test('mapLocationToAnimationState updates state to have isPlaying bool true if playanim and ab keys are present [animation-location-state]', () => {
  const stateFromLocation = { animation: defaultState };
  const PERMALINK_STATE = { ab: true, playanim: true };
  const response = mapLocationToAnimationState(
    PERMALINK_STATE,
    stateFromLocation,
  );
  expect(stateFromLocation.animation.isPlaying).toBeFalsy();
  expect(response.animation.isActive).toBeTruthy();
  expect(response.animation.isPlaying).toBeTruthy();
});

test('mapLocationToAnimationState closes animation if ab is not present [animation-location-state]', () => {
  const stateFromLocation = {
    animation: {
      ...defaultState,
      isActive: true,
      isPlaying: true,
      startDate: new Date('2020-01-01T00:00:00Z'),
      endDate: new Date('2020-01-02T00:00:00Z'),
    },
  };
  const PERMALINK_STATE = {};
  const response = mapLocationToAnimationState(
    PERMALINK_STATE,
    stateFromLocation,
  );
  expect(response.animation.isActive).toBeFalsy();
  expect(response.animation.isPlaying).toBeFalsy();
});

test('mapLocationToAnimationState sets isActive true when ab is "on" [animation-ab-on-string]', () => {
  const stateFromLocation = { animation: defaultState };
  const PERMALINK_STATE = { ab: 'on' };
  const response = mapLocationToAnimationState(PERMALINK_STATE, stateFromLocation);
  expect(response.animation.isActive).toBeTruthy();
  expect(response.animation.isPlaying).toBeFalsy();
});

test('mapLocationToAnimationState does not wipe dates when ae param is present [animation-ae-param]', () => {
  const startDate = new Date('2020-01-01T00:00:00Z');
  const endDate = new Date('2020-01-02T00:00:00Z');
  const stateFromLocation = {
    animation: {
      ...defaultState,
      startDate,
      endDate,
    },
  };
  const PERMALINK_STATE = { ae: '2020-01-02' };
  const response = mapLocationToAnimationState(PERMALINK_STATE, stateFromLocation);
  expect(response.animation.endDate).toBeUndefined();
  expect(response.animation.startDate).toBeUndefined();
});

test('mapLocationToAnimationState preserves dates when ab is active and ae/as params are present [animation-dates-preserved]', () => {
  const startDate = new Date('2020-01-01T00:00:00Z');
  const endDate = new Date('2020-01-02T00:00:00Z');
  const stateFromLocation = {
    animation: {
      ...defaultState,
      startDate,
      endDate,
    },
  };
  const PERMALINK_STATE = { ab: true, as: '2020-01-01', ae: '2020-01-02' };
  const response = mapLocationToAnimationState(PERMALINK_STATE, stateFromLocation);
  expect(response.animation.isActive).toBeTruthy();
});

test('mapLocationToAnimationState does not set isPlaying if ab is absent but playanim is present [animation-playanim-no-ab]', () => {
  const stateFromLocation = { animation: defaultState };
  const PERMALINK_STATE = { playanim: true };
  const response = mapLocationToAnimationState(PERMALINK_STATE, stateFromLocation);
  expect(response.animation.isPlaying).toBeFalsy();
  expect(response.animation.isActive).toBeFalsy();
});

test('mapLocationToAnimationState wipes start and end dates when ab is absent and no ae param [animation-wipe-dates]', () => {
  const stateFromLocation = {
    animation: {
      ...defaultState,
      startDate: new Date('2020-01-01T00:00:00Z'),
      endDate: new Date('2020-01-02T00:00:00Z'),
    },
  };
  const PERMALINK_STATE = {};
  const response = mapLocationToAnimationState(PERMALINK_STATE, stateFromLocation);
  expect(response.animation.startDate).toBeUndefined();
  expect(response.animation.endDate).toBeUndefined();
});

// snapToIntervalDelta tests

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

test('snapToIntervalDelta returns startDate when currDate exactly equals startDate [animation-snap-exact-start]', () => {
  const currentDate = new Date('2018-04-19 08:15:30Z');
  const startDate = new Date('  2018-04-19 08:15:30Z');
  const endDate = new Date('    2018-04-19 09:00:00Z');
  const snappedDate = snapToIntervalDelta(currentDate, startDate, endDate, 'minute', 1);
  expect(snappedDate.valueOf()).toBe(startDate.valueOf());
});

// getStampProps tests

test('getStampProps returns correct stamp height and dateStamp when dimensions.w < breakPoint and stampHeight < 60 [stamp-small-width-small-height]', () => {
  const result = getStampProps(5, 300, 100, { w: 200, h: 200 }, 100, 500);
  expect(result).toHaveProperty('stampHeight');
  expect(result).toHaveProperty('dateStamp');
  expect(result.stampHeight).toBeLessThan(60);
  expect(result.dateStamp.align).toBe('left');
  expect(result.dateStamp.x).toBe(1);
});

test('getStampProps caps stampHeight at 60 when computed value exceeds 60 and dimensions.w < breakPoint [stamp-small-width-capped-height]', () => {
  const result = getStampProps(1, 300, 100, { w: 200, h: 500 }, 400, 600);
  expect(result.stampHeight).toBe(60);
});

test('getStampProps sets fontSize > 0 when dimensions.h > stampHeight * 1.5 and dimensions.w < breakPoint [stamp-small-width-fontsize]', () => {
  const result = getStampProps(5, 300, 100, { w: 200, h: 500 }, 100, 500);
  expect(result.dateStamp.fontSize).toBeGreaterThan(0);
});

test('getStampProps sets fontSize to 0 when dimensions.h <= stampHeight * 1.5 and dimensions.w < breakPoint [stamp-small-width-no-fontsize]', () => {
  const result = getStampProps(5, 300, 100, { w: 200, h: 10 }, 100, 500);
  expect(result.dateStamp.fontSize).toBe(0);
});

test('getStampProps returns correct props when dimensions.w >= breakPoint and stampHeightByImageWidth > 60 [stamp-large-width-capped]', () => {
  const result = getStampProps(1, 300, 100, { w: 400, h: 800 }, 1000, 1000);
  expect(result.stampHeight).toBe(60);
  expect(result.dateStamp.align).toBe('left');
});

test('getStampProps returns stampHeight of 20 when stampHeightByImageWidth < 20 and dimensions.w >= breakPoint [stamp-large-width-min-height]', () => {
  const result = getStampProps(200, 300, 100, { w: 400, h: 800 }, 1000, 1000);
  expect(result.stampHeight).toBe(20);
});

test('getStampProps sets fontSize > 0 when dimensions.h > stampHeight * 1.5 and dimensions.w >= breakPoint [stamp-large-width-fontsize]', () => {
  const result = getStampProps(5, 300, 100, { w: 400, h: 800 }, 1000, 1000);
  expect(result.dateStamp.fontSize).toBeGreaterThan(0);
});

test('getStampProps sets fontSize to 0 when dimensions.h <= stampHeight * 1.5 and dimensions.w >= breakPoint [stamp-large-width-no-fontsize]', () => {
  const result = getStampProps(5, 300, 100, { w: 400, h: 10 }, 1000, 1000);
  expect(result.dateStamp.fontSize).toBe(0);
});

// getNumberOfSteps tests

test('getNumberOfSteps returns 1 when nextDate is after end [animation-steps-single-frame]', () => {
  const start = new Date('2018-01-01');
  const end = new Date('2018-01-01');
  const steps = getNumberOfSteps(start, end, 'day', null, false, [], 1);
  expect(steps).toBe(1);
});

test('getNumberOfSteps returns correct count for day interval [animation-steps-day]', () => {
  const start = new Date('2018-01-01');
  const end = new Date('2018-01-05');
  const steps = getNumberOfSteps(start, end, 'day', null, false, [], 1);
  expect(steps).toBe(5);
});

test('getNumberOfSteps respects maxToCheck limit [animation-steps-max]', () => {
  const start = new Date('2018-01-01');
  const end = new Date('2018-12-31');
  const steps = getNumberOfSteps(start, end, 'day', 10, false, [], 1);
  expect(steps).toBe(10);
});

test('getNumberOfSteps returns correct count for month interval [animation-steps-month]', () => {
  const start = new Date('2018-01-01');
  const end = new Date('2018-06-01');
  const steps = getNumberOfSteps(start, end, 'month', null, false, [], 1);
  expect(steps).toBe(6);
});
