import update from 'immutability-helper';

const legacyState = {
  loaded: false,
  map: { selectedMap: null, rotation: 0 },
  initComplete: false
};

export default function legacyReducer(state = legacyState, action) {
  switch (action.type) {
    case 'MAP/UPDATE_MAP_EXTENT':
      return update(state, { map: { extent: { $set: action.extent } } });
    case 'MAP/UPDATE_MAP_UI':
      return update(state, { map: { selectedMap: { $set: action.ui } } });
    case 'MAP/UPDATE_ROTATION':
      return update(state, { map: { rotation: { $set: action.rotation } } });
    default:
      return state;
  }
}
