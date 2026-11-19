import mapReducer from './reducers';
import {
  UPDATE_MAP_EXTENT,
  UPDATE_MAP_UI,
  UPDATE_MAP_ROTATION,
  RENDERED,
  FITTED_TO_LEADING_EXTENT,
  CHANGE_CURSOR,
  REFRESH_ROTATE,
} from './constants';

const INITIAL_STATE = {
  ui: { selected: null },
  rotation: 0,
  extent: [],
  rendered: false,
  leadingExtent: [],
  isClickable: false,
};

describe('mapReducer', () => {
  describe('initial state', () => {
    test('returns initial state when called with undefined state and empty action [map-reducer-initial-state]', () => {
      expect(mapReducer(undefined, {})).toEqual(INITIAL_STATE);
    });

    test('initial state has rotation of 0 [map-reducer-initial-state-rotation]', () => {
      expect(mapReducer(undefined, {}).rotation).toBe(0);
    });

    test('initial state has empty extent [map-reducer-initial-state-extent]', () => {
      expect(mapReducer(undefined, {}).extent).toEqual([]);
    });

    test('initial state has rendered false [map-reducer-initial-state-rendered]', () => {
      expect(mapReducer(undefined, {}).rendered).toBe(false);
    });

    test('initial state has empty leadingExtent [map-reducer-initial-state-leading-extent]', () => {
      expect(mapReducer(undefined, {}).leadingExtent).toEqual([]);
    });

    test('initial state has isClickable false [map-reducer-initial-state-is-clickable]', () => {
      expect(mapReducer(undefined, {}).isClickable).toBe(false);
    });

    test('initial state has ui with selected null [map-reducer-initial-state-ui]', () => {
      expect(mapReducer(undefined, {}).ui).toEqual({ selected: null });
    });
  });

  describe(`${UPDATE_MAP_EXTENT}`, () => {
    test('sets extent to provided value [map-reducer-update-map-extent]', () => {
      const extent = [-180, -90, 180, 90];
      expect(mapReducer(INITIAL_STATE, { type: UPDATE_MAP_EXTENT, extent })).toEqual({
        ...INITIAL_STATE,
        extent,
      });
    });

    test('sets extent to empty array [map-reducer-update-map-extent-empty]', () => {
      const state = { ...INITIAL_STATE, extent: [-180, -90, 180, 90] };
      expect(mapReducer(state, { type: UPDATE_MAP_EXTENT, extent: [] })).toEqual({
        ...INITIAL_STATE,
        extent: [],
      });
    });

    test('does not mutate other state properties [map-reducer-update-map-extent-no-mutation]', () => {
      const extent = [-100, -50, 100, 50];
      const result = mapReducer(INITIAL_STATE, { type: UPDATE_MAP_EXTENT, extent });
      expect(result.rotation).toBe(INITIAL_STATE.rotation);
      expect(result.rendered).toBe(INITIAL_STATE.rendered);
      expect(result.isClickable).toBe(INITIAL_STATE.isClickable);
    });
  });

  describe(`${UPDATE_MAP_UI}`, () => {
    test('sets ui and rotation from action [map-reducer-update-map-ui]', () => {
      const ui = { selected: true };
      const rotation = 90;
      expect(mapReducer(INITIAL_STATE, { type: UPDATE_MAP_UI, ui, rotation })).toEqual({
        ...INITIAL_STATE,
        ui,
        rotation,
      });
    });

    test('sets rotation to 0 [map-reducer-update-map-ui-zero-rotation]', () => {
      const ui = { selected: false };
      const result = mapReducer(INITIAL_STATE, { type: UPDATE_MAP_UI, ui, rotation: 0 });
      expect(result.rotation).toBe(0);
      expect(result.ui).toEqual(ui);
    });

    test('sets rotation to negative value [map-reducer-update-map-ui-negative-rotation]', () => {
      const ui = { selected: true };
      const result = mapReducer(INITIAL_STATE, { type: UPDATE_MAP_UI, ui, rotation: -45 });
      expect(result.rotation).toBe(-45);
    });

    test('does not mutate other state properties [map-reducer-update-map-ui-no-mutation]', () => {
      const ui = { selected: true };
      const result = mapReducer(INITIAL_STATE, { type: UPDATE_MAP_UI, ui, rotation: 90 });
      expect(result.extent).toEqual(INITIAL_STATE.extent);
      expect(result.rendered).toBe(INITIAL_STATE.rendered);
      expect(result.isClickable).toBe(INITIAL_STATE.isClickable);
    });
  });

  describe(`${UPDATE_MAP_ROTATION}`, () => {
    test('sets rotation from action [map-reducer-update-map-rotation]', () => {
      expect(mapReducer(INITIAL_STATE, { type: UPDATE_MAP_ROTATION, rotation: 45 })).toEqual({
        ...INITIAL_STATE,
        rotation: 45,
      });
    });

    test('sets rotation to 0 [map-reducer-update-map-rotation-zero]', () => {
      const state = { ...INITIAL_STATE, rotation: 90 };
      expect(mapReducer(state, { type: UPDATE_MAP_ROTATION, rotation: 0 })).toEqual({
        ...INITIAL_STATE,
        rotation: 0,
      });
    });

    test('sets rotation to negative value [map-reducer-update-map-rotation-negative]', () => {
      expect(mapReducer(
        INITIAL_STATE, { type: UPDATE_MAP_ROTATION, rotation: -90 },
      ).rotation).toBe(-90);
    });

    test('does not mutate other state properties [map-reducer-update-map-rotation-no-mutation]', () => {
      const result = mapReducer(INITIAL_STATE, { type: UPDATE_MAP_ROTATION, rotation: 45 });
      expect(result.extent).toEqual(INITIAL_STATE.extent);
      expect(result.rendered).toBe(INITIAL_STATE.rendered);
      expect(result.ui).toEqual(INITIAL_STATE.ui);
    });
  });

  describe(`${REFRESH_ROTATE}`, () => {
    test('sets rotation from action identically to UPDATE_MAP_ROTATION [map-reducer-refresh-rotate]', () => {
      expect(mapReducer(INITIAL_STATE, { type: REFRESH_ROTATE, rotation: 180 })).toEqual({
        ...INITIAL_STATE,
        rotation: 180,
      });
    });

    test('sets rotation to 0 [map-reducer-refresh-rotate-zero]', () => {
      const state = { ...INITIAL_STATE, rotation: 270 };
      expect(mapReducer(state, { type: REFRESH_ROTATE, rotation: 0 }).rotation).toBe(0);
    });

    test('sets rotation to decimal value [map-reducer-refresh-rotate-decimal]', () => {
      expect(mapReducer(
        INITIAL_STATE, { type: REFRESH_ROTATE, rotation: 22.5 },
      ).rotation).toBe(22.5);
    });

    test('does not mutate other state properties [map-reducer-refresh-rotate-no-mutation]', () => {
      const result = mapReducer(INITIAL_STATE, { type: REFRESH_ROTATE, rotation: 180 });
      expect(result.isClickable).toBe(INITIAL_STATE.isClickable);
      expect(result.rendered).toBe(INITIAL_STATE.rendered);
      expect(result.leadingExtent).toEqual(INITIAL_STATE.leadingExtent);
    });
  });

  describe(`${RENDERED}`, () => {
    test('sets rendered to true [map-reducer-rendered]', () => {
      expect(mapReducer(INITIAL_STATE, { type: RENDERED })).toEqual({
        ...INITIAL_STATE,
        rendered: true,
      });
    });

    test('rendered stays true when already true [map-reducer-rendered-already-true]', () => {
      const state = { ...INITIAL_STATE, rendered: true };
      expect(mapReducer(state, { type: RENDERED }).rendered).toBe(true);
    });

    test('does not mutate other state properties [map-reducer-rendered-no-mutation]', () => {
      const result = mapReducer(INITIAL_STATE, { type: RENDERED });
      expect(result.rotation).toBe(INITIAL_STATE.rotation);
      expect(result.extent).toEqual(INITIAL_STATE.extent);
      expect(result.isClickable).toBe(INITIAL_STATE.isClickable);
      expect(result.ui).toEqual(INITIAL_STATE.ui);
    });
  });

  describe(`${FITTED_TO_LEADING_EXTENT}`, () => {
    test('sets leadingExtent to provided value [map-reducer-fitted-to-leading-extent]', () => {
      const extent = [-100, -50, 100, 50];
      expect(mapReducer(INITIAL_STATE, { type: FITTED_TO_LEADING_EXTENT, extent })).toEqual({
        ...INITIAL_STATE,
        leadingExtent: extent,
      });
    });

    test('sets leadingExtent to empty array [map-reducer-fitted-to-leading-extent-empty]', () => {
      const state = { ...INITIAL_STATE, leadingExtent: [-100, -50, 100, 50] };
      expect(mapReducer(state, { type: FITTED_TO_LEADING_EXTENT, extent: [] })).toEqual({
        ...INITIAL_STATE,
        leadingExtent: [],
      });
    });

    test('does not mutate other state properties [map-reducer-fitted-to-leading-extent-no-mutation]', () => {
      const extent = [-100, -50, 100, 50];
      const result = mapReducer(INITIAL_STATE, { type: FITTED_TO_LEADING_EXTENT, extent });
      expect(result.rotation).toBe(INITIAL_STATE.rotation);
      expect(result.rendered).toBe(INITIAL_STATE.rendered);
      expect(result.isClickable).toBe(INITIAL_STATE.isClickable);
      expect(result.ui).toEqual(INITIAL_STATE.ui);
    });
  });

  describe(`${CHANGE_CURSOR}`, () => {
    test('sets isClickable to true [map-reducer-change-cursor-true]', () => {
      expect(mapReducer(INITIAL_STATE, { type: CHANGE_CURSOR, bool: true })).toEqual({
        ...INITIAL_STATE,
        isClickable: true,
      });
    });

    test('sets isClickable to false [map-reducer-change-cursor-false]', () => {
      const state = { ...INITIAL_STATE, isClickable: true };
      expect(mapReducer(state, { type: CHANGE_CURSOR, bool: false })).toEqual({
        ...INITIAL_STATE,
        isClickable: false,
      });
    });

    test('does not mutate other state properties [map-reducer-change-cursor-no-mutation]', () => {
      const result = mapReducer(INITIAL_STATE, { type: CHANGE_CURSOR, bool: true });
      expect(result.rotation).toBe(INITIAL_STATE.rotation);
      expect(result.rendered).toBe(INITIAL_STATE.rendered);
      expect(result.extent).toEqual(INITIAL_STATE.extent);
      expect(result.leadingExtent).toEqual(INITIAL_STATE.leadingExtent);
      expect(result.ui).toEqual(INITIAL_STATE.ui);
    });
  });

  describe('default', () => {
    test('returns current state for unknown action type [map-reducer-default]', () => {
      expect(mapReducer(INITIAL_STATE, { type: 'UNKNOWN_ACTION' })).toEqual(INITIAL_STATE);
    });

    test('returns custom state unchanged for unknown action type [map-reducer-default-custom-state]', () => {
      const customState = {
        ui: { selected: true },
        rotation: 45,
        extent: [-180, -90, 180, 90],
        rendered: true,
        leadingExtent: [-100, -50, 100, 50],
        isClickable: true,
      };
      expect(mapReducer(customState, { type: 'UNKNOWN_ACTION' })).toEqual(customState);
    });

    test('returns same state reference for unknown action type [map-reducer-default-same-reference]', () => {
      const result = mapReducer(INITIAL_STATE, { type: 'UNKNOWN_ACTION' });
      expect(result).toBe(INITIAL_STATE);
    });
  });
});
