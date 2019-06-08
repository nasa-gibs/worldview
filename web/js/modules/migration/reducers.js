import update from 'immutability-helper';

const legacyState = {
  loaded: false,
  map: { ui: { selected: null }, rotation: 0, extent: [] },
  initComplete: false
};

export default function legacyReducer(state = legacyState, action) {
  switch (action.type) {
    case 'MAP/UPDATE_MAP_EXTENT':
      return update(state, { map: { extent: { $set: action.extent } } });
    case 'MAP/UPDATE_MAP_UI':
      return update(state, { map: { ui: { $set: action.ui } } });
    case 'MAP/UPDATE_ROTATION':
      return update(state, { map: { rotation: { $set: action.rotation } } });
    default:
      return state;
  }
}
