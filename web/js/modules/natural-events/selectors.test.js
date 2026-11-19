import { getFilteredEvents } from './selectors';

jest.mock('./util', () => ({
  validateGeometryCoords: jest.fn(),
}));

import { validateGeometryCoords } from './util';

const buildState = ({ selectedCategories, response, proj } = {}) => ({
  events: {
    selectedCategories: selectedCategories || [],
  },
  requestedEvents: {
    response: response !== undefined ? response : [],
  },
  proj: {
    selected: proj || 'geographic',
  },
});

describe('getFilteredEvents', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns an empty array when response is null', () => {
    const state = buildState({ response: null });
    const result = getFilteredEvents(state);
    expect(result).toEqual([]);
  });

  it('returns an empty array when response is undefined', () => {
    const state = buildState({ response: undefined });
    const result = getFilteredEvents(state);
    expect(result).toEqual([]);
  });

  it('returns an empty array when response is an empty array', () => {
    validateGeometryCoords.mockReturnValue(true);
    const state = buildState({ response: [] });
    const result = getFilteredEvents(state);
    expect(result).toEqual([]);
  });

  it('filters out events where all geometries fail validation', () => {
    validateGeometryCoords.mockReturnValue(false);
    const state = buildState({
      selectedCategories: [{ id: 'wildfires' }],
      response: [
        {
          id: 'e1',
          categories: [{ id: 'wildfires' }],
          geometry: [{ coordinates: [0, 0] }],
        },
      ],
    });
    const result = getFilteredEvents(state);
    expect(result).toEqual([]);
  });

  it('includes events where at least one geometry passes validation', () => {
    validateGeometryCoords
      .mockReturnValueOnce(false)
      .mockReturnValueOnce(true);
    const state = buildState({
      selectedCategories: [{ id: 'wildfires' }],
      response: [
        {
          id: 'e1',
          categories: [{ id: 'wildfires' }],
          geometry: [{ coordinates: [0, 0] }, { coordinates: [10, 10] }],
        },
      ],
    });
    const result = getFilteredEvents(state);
    expect(result).toHaveLength(1);
    expect(result[0].geometry).toHaveLength(1);
  });

  it('only keeps geometries that pass validation', () => {
    validateGeometryCoords
      .mockReturnValueOnce(true)
      .mockReturnValueOnce(false)
      .mockReturnValueOnce(true);
    const state = buildState({
      selectedCategories: [{ id: 'wildfires' }],
      response: [
        {
          id: 'e1',
          categories: [{ id: 'wildfires' }],
          geometry: [
            { coordinates: [0, 0] },
            { coordinates: [10, 10] },
            { coordinates: [20, 20] },
          ],
        },
      ],
    });
    const result = getFilteredEvents(state);
    expect(result[0].geometry).toHaveLength(2);
  });

  it('filters out categories not present in activeCategories', () => {
    validateGeometryCoords.mockReturnValue(true);
    const state = buildState({
      selectedCategories: [{ id: 'wildfires' }],
      response: [
        {
          id: 'e1',
          categories: [{ id: 'wildfires' }, { id: 'floods' }],
          geometry: [{ coordinates: [0, 0] }],
        },
      ],
    });
    const result = getFilteredEvents(state);
    expect(result[0].categories).toEqual([{ id: 'wildfires' }]);
  });

  it('keeps all categories that match activeCategories', () => {
    validateGeometryCoords.mockReturnValue(true);
    const state = buildState({
      selectedCategories: [{ id: 'wildfires' }, { id: 'floods' }],
      response: [
        {
          id: 'e1',
          categories: [{ id: 'wildfires' }, { id: 'floods' }],
          geometry: [{ coordinates: [0, 0] }],
        },
      ],
    });
    const result = getFilteredEvents(state);
    expect(result[0].categories).toHaveLength(2);
  });

  it('returns an empty categories array when no categories match', () => {
    validateGeometryCoords.mockReturnValue(true);
    const state = buildState({
      selectedCategories: [{ id: 'volcanoes' }],
      response: [
        {
          id: 'e1',
          categories: [{ id: 'wildfires' }, { id: 'floods' }],
          geometry: [{ coordinates: [0, 0] }],
        },
      ],
    });
    const result = getFilteredEvents(state);
    expect(result[0].categories).toEqual([]);
  });

  it('processes multiple events correctly', () => {
    validateGeometryCoords
      .mockReturnValueOnce(true)
      .mockReturnValueOnce(false)
      .mockReturnValueOnce(true);
    const state = buildState({
      selectedCategories: [{ id: 'wildfires' }],
      response: [
        {
          id: 'e1',
          categories: [{ id: 'wildfires' }],
          geometry: [{ coordinates: [0, 0] }],
        },
        {
          id: 'e2',
          categories: [{ id: 'wildfires' }],
          geometry: [{ coordinates: [10, 10] }],
        },
        {
          id: 'e3',
          categories: [{ id: 'wildfires' }],
          geometry: [{ coordinates: [20, 20] }],
        },
      ],
    });
    const result = getFilteredEvents(state);
    expect(result).toHaveLength(2);
    expect(result.map((e) => e.id)).toEqual(['e1', 'e3']);
  });

  it('does not mutate the original event objects', () => {
    validateGeometryCoords.mockReturnValue(true);
    const originalEvent = {
      id: 'e1',
      categories: [{ id: 'wildfires' }],
      geometry: [{ coordinates: [0, 0] }],
    };
    const state = buildState({
      selectedCategories: [{ id: 'wildfires' }],
      response: [originalEvent],
    });
    getFilteredEvents(state);
    expect(originalEvent.categories).toHaveLength(1);
    expect(originalEvent.geometry).toHaveLength(1);
  });

  it('passes the correct projection to validateGeometryCoords', () => {
    validateGeometryCoords.mockReturnValue(true);
    const state = buildState({
      selectedCategories: [{ id: 'wildfires' }],
      response: [
        {
          id: 'e1',
          categories: [{ id: 'wildfires' }],
          geometry: [{ coordinates: [0, 0] }],
        },
      ],
      proj: 'arctic',
    });
    getFilteredEvents(state);
    expect(validateGeometryCoords).toHaveBeenCalledWith({ coordinates: [0, 0] }, 'arctic');
  });

  it('returns a memoized result when called with the same state', () => {
    validateGeometryCoords.mockReturnValue(true);
    const state = buildState({
      selectedCategories: [{ id: 'wildfires' }],
      response: [
        {
          id: 'e1',
          categories: [{ id: 'wildfires' }],
          geometry: [{ coordinates: [0, 0] }],
        },
      ],
    });
    const result1 = getFilteredEvents(state);
    const result2 = getFilteredEvents(state);
    expect(result1).toBe(result2);
  });
});
