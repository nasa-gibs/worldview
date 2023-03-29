import { SET_SELECTED_VECTORS } from './constants';
import { selectVectorFeatures } from './actions';

test(
  `selectVectorFeature action returns ${SET_SELECTED_VECTORS} action type [vectorstyles-actions-set-selected]`,
  () => {
    const payload = 'test';
    const expectedAction = {
      type: SET_SELECTED_VECTORS,
      payload,
    };
    expect(selectVectorFeatures(payload)).toEqual(expectedAction);
  },
);
