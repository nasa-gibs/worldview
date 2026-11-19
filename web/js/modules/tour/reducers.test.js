import tourReducer from './reducers';
import {
  START, UPDATE_SELECTED, END_TOUR, TOUR_KEY_PRESS_CLOSE,
} from './constants';

const INITIAL_STATE = {
  selected: '',
  active: false,
};

describe('tourReducer', () => {
  it('returns the initial state when no state is provided', () => {
    const result = tourReducer(undefined, {});
    expect(result).toEqual(INITIAL_STATE);
  });

  it('returns the current state for an unknown action type', () => {
    const state = { selected: 'story-1', active: true };
    const result = tourReducer(state, { type: 'UNKNOWN_ACTION' });
    expect(result).toBe(state);
  });

  describe('END_TOUR', () => {
    it('sets selected to empty string and active to false', () => {
      const state = { selected: 'story-1', active: true };
      const result = tourReducer(state, { type: END_TOUR });
      expect(result).toEqual({ selected: '', active: false });
    });

    it('does not mutate the original state', () => {
      const state = { selected: 'story-1', active: true };
      tourReducer(state, { type: END_TOUR });
      expect(state).toEqual({ selected: 'story-1', active: true });
    });
  });

  describe('TOUR_KEY_PRESS_CLOSE', () => {
    it('sets selected to empty string and active to false', () => {
      const state = { selected: 'story-2', active: true };
      const result = tourReducer(state, { type: TOUR_KEY_PRESS_CLOSE });
      expect(result).toEqual({ selected: '', active: false });
    });

    it('does not mutate the original state', () => {
      const state = { selected: 'story-2', active: true };
      tourReducer(state, { type: TOUR_KEY_PRESS_CLOSE });
      expect(state).toEqual({ selected: 'story-2', active: true });
    });
  });

  describe('START', () => {
    it('sets selected to empty string and active to true', () => {
      const state = { selected: 'story-3', active: false };
      const result = tourReducer(state, { type: START });
      expect(result).toEqual({ selected: '', active: true });
    });

    it('does not mutate the original state', () => {
      const state = { selected: 'story-3', active: false };
      tourReducer(state, { type: START });
      expect(state).toEqual({ selected: 'story-3', active: false });
    });
  });

  describe('UPDATE_SELECTED', () => {
    it('sets selected to the action id and active to true', () => {
      const state = { selected: '', active: false };
      const result = tourReducer(state, { type: UPDATE_SELECTED, id: 'story-4' });
      expect(result).toEqual({ selected: 'story-4', active: true });
    });

    it('handles numeric ids', () => {
      const state = { selected: '', active: false };
      const result = tourReducer(state, { type: UPDATE_SELECTED, id: 99 });
      expect(result).toEqual({ selected: 99, active: true });
    });

    it('handles undefined id', () => {
      const state = { selected: 'story-1', active: true };
      const result = tourReducer(state, { type: UPDATE_SELECTED, id: undefined });
      expect(result).toEqual({ selected: undefined, active: true });
    });

    it('does not mutate the original state', () => {
      const state = { selected: '', active: false };
      tourReducer(state, { type: UPDATE_SELECTED, id: 'story-4' });
      expect(state).toEqual({ selected: '', active: false });
    });
  });
});
