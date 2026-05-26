import {
  clearRotate,
  refreshRotation,
  changeCursor,
  updateMapExtent,
  updateRenderedState,
  updateMapUI,
  fitToLeadingExtent,
} from './actions';
import {
  CLEAR_ROTATE,
  CHANGE_CURSOR,
  REFRESH_ROTATE,
  UPDATE_MAP_EXTENT,
  RENDERED,
  UPDATE_MAP_UI,
  FITTED_TO_LEADING_EXTENT,
} from './constants';

describe('clearRotate', () => {
  test(`returns action with type ${CLEAR_ROTATE} [map-actions-clear-rotate]`, () => {
    expect(clearRotate()).toEqual({ type: CLEAR_ROTATE });
  });

  test('returns no extra properties [map-actions-clear-rotate-no-extra-props]', () => {
    const action = clearRotate();
    expect(Object.keys(action)).toEqual(['type']);
  });
});

describe('refreshRotation', () => {
  test(`returns action with type ${REFRESH_ROTATE} and rotation value [map-actions-refresh-rotation]`, () => {
    expect(refreshRotation(45)).toEqual({ type: REFRESH_ROTATE, rotation: 45 });
  });

  test('returns rotation of 0 [map-actions-refresh-rotation-zero]', () => {
    expect(refreshRotation(0)).toEqual({ type: REFRESH_ROTATE, rotation: 0 });
  });

  test('returns negative rotation value [map-actions-refresh-rotation-negative]', () => {
    expect(refreshRotation(-90)).toEqual({ type: REFRESH_ROTATE, rotation: -90 });
  });

  test('returns decimal rotation value [map-actions-refresh-rotation-decimal]', () => {
    expect(refreshRotation(22.5)).toEqual({ type: REFRESH_ROTATE, rotation: 22.5 });
  });

  test('returns rotation of 360 [map-actions-refresh-rotation-full]', () => {
    expect(refreshRotation(360)).toEqual({ type: REFRESH_ROTATE, rotation: 360 });
  });
});

describe('changeCursor', () => {
  test(`returns action with type ${CHANGE_CURSOR} and bool true [map-actions-change-cursor-true]`, () => {
    expect(changeCursor(true)).toEqual({ type: CHANGE_CURSOR, bool: true });
  });

  test(`returns action with type ${CHANGE_CURSOR} and bool false [map-actions-change-cursor-false]`, () => {
    expect(changeCursor(false)).toEqual({ type: CHANGE_CURSOR, bool: false });
  });
});

describe('updateMapExtent', () => {
  test(`returns action with type ${UPDATE_MAP_EXTENT} and extent value [map-actions-update-map-extent]`, () => {
    const extent = [-180, -90, 180, 90];
    expect(updateMapExtent(extent)).toEqual({ type: UPDATE_MAP_EXTENT, extent });
  });

  test('returns action with empty array extent [map-actions-update-map-extent-empty]', () => {
    expect(updateMapExtent([])).toEqual({ type: UPDATE_MAP_EXTENT, extent: [] });
  });

  test('returns action with undefined extent [map-actions-update-map-extent-undefined]', () => {
    expect(updateMapExtent(undefined)).toEqual({ type: UPDATE_MAP_EXTENT, extent: undefined });
  });

  test('returns action with null extent [map-actions-update-map-extent-null]', () => {
    expect(updateMapExtent(null)).toEqual({ type: UPDATE_MAP_EXTENT, extent: null });
  });
});

describe('updateRenderedState', () => {
  test(`returns action with type ${RENDERED} [map-actions-update-rendered-state]`, () => {
    expect(updateRenderedState()).toEqual({ type: RENDERED });
  });

  test('returns no extra properties [map-actions-update-rendered-state-no-extra-props]', () => {
    const action = updateRenderedState();
    expect(Object.keys(action)).toEqual(['type']);
  });
});

describe('updateMapUI', () => {
  test(`returns action with type ${UPDATE_MAP_UI}, ui and rotation [map-actions-update-map-ui]`, () => {
    const ui = { selected: true };
    const rotation = 90;
    expect(updateMapUI(ui, rotation)).toEqual({ type: UPDATE_MAP_UI, ui, rotation });
  });

  test('returns action with rotation of 0 [map-actions-update-map-ui-zero-rotation]', () => {
    const ui = { selected: false };
    expect(updateMapUI(ui, 0)).toEqual({ type: UPDATE_MAP_UI, ui, rotation: 0 });
  });

  test('returns action with null ui [map-actions-update-map-ui-null-ui]', () => {
    expect(updateMapUI(null, 45)).toEqual({ type: UPDATE_MAP_UI, ui: null, rotation: 45 });
  });

  test('returns action with undefined rotation [map-actions-update-map-ui-undefined-rotation]', () => {
    const ui = { selected: true };
    expect(updateMapUI(ui, undefined)).toEqual({ type: UPDATE_MAP_UI, ui, rotation: undefined });
  });

  test('returns action with negative rotation [map-actions-update-map-ui-negative-rotation]', () => {
    const ui = { selected: true };
    expect(updateMapUI(ui, -45)).toEqual({ type: UPDATE_MAP_UI, ui, rotation: -45 });
  });
});

describe('fitToLeadingExtent', () => {
  test(`returns action with type ${FITTED_TO_LEADING_EXTENT} and extent [map-actions-fit-to-leading-extent]`, () => {
    const extent = [-100, -50, 100, 50];
    expect(fitToLeadingExtent(extent)).toEqual({ type: FITTED_TO_LEADING_EXTENT, extent });
  });

  test('returns action with empty array extent [map-actions-fit-to-leading-extent-empty]', () => {
    expect(fitToLeadingExtent([])).toEqual({ type: FITTED_TO_LEADING_EXTENT, extent: [] });
  });

  test('returns action with null extent [map-actions-fit-to-leading-extent-null]', () => {
    expect(fitToLeadingExtent(null)).toEqual({ type: FITTED_TO_LEADING_EXTENT, extent: null });
  });

  test('returns action with undefined extent [map-actions-fit-to-leading-extent-undefined]', () => {
    expect(fitToLeadingExtent(undefined)).toEqual(
      { type: FITTED_TO_LEADING_EXTENT, extent: undefined },
    );
  });
});
