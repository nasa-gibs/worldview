import { startTour, selectStory, endTour } from './actions';
import { START, UPDATE_SELECTED, END_TOUR } from './constants';

describe('startTour', () => {
  it('returns an action with type START', () => {
    const result = startTour();
    expect(result).toEqual({ type: START });
  });

  it('returns an object', () => {
    expect(typeof startTour()).toBe('object');
  });
});

describe('selectStory', () => {
  it('returns an action with type UPDATE_SELECTED and the given id', () => {
    const result = selectStory(42);
    expect(result).toEqual({ type: UPDATE_SELECTED, id: 42 });
  });

  it('handles string ids', () => {
    const result = selectStory('story-1');
    expect(result).toEqual({ type: UPDATE_SELECTED, id: 'story-1' });
  });

  it('handles undefined id', () => {
    const result = selectStory(undefined);
    expect(result).toEqual({ type: UPDATE_SELECTED, id: undefined });
  });

  it('handles null id', () => {
    const result = selectStory(null);
    expect(result).toEqual({ type: UPDATE_SELECTED, id: null });
  });
});

describe('endTour', () => {
  it('returns an action with type END_TOUR', () => {
    const result = endTour();
    expect(result).toEqual({ type: END_TOUR });
  });

  it('returns an object', () => {
    expect(typeof endTour()).toBe('object');
  });
});
