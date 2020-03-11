import { defaultVectorStyleState, vectorStyleReducer } from './reducers';
import { SET_SELECTED_VECTORS } from './constants';

test('Set a selected Vector', () => {
  const response = vectorStyleReducer(defaultVectorStyleState, {
    type: SET_SELECTED_VECTORS,
    payload: { some_layer_id: ['some_feature_id'] }
  });

  expect(response.selected.some_layer_id[0]).toEqual('some_feature_id');
});
