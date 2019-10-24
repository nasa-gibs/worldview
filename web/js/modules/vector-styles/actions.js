import {
  SET_FILTER_RANGE,
  CLEAR_VECTORSTYLE,
  SET_VECTORSTYLE,
  SET_SELECTED_VECTORS,

} from './constants';
import {
  setRange as setRangeSelector,
  setStyleFunction
} from './selectors';

/**
 * @param {String} layerId
 * @param {Object} props | contains min max and squash attributes
 * @param {Number} index | VectorStyle index value for multi-vectorStyled layers
 * @param {String} groupName | layer group string
 */
export function setFilterRange(layerId, props, index, groupName) {
  return (dispatch, getState) => {
    const state = getState();
    const newActiveVectorStylesObj = setRangeSelector(
      layerId,
      props,
      index,
      state.vectorStyles[groupName],
      state
    );
    dispatch({
      type: SET_FILTER_RANGE,
      groupName: groupName,
      activeString: groupName,
      layerId,
      vectorStyles: newActiveVectorStylesObj,
      props
    });
  };
}

/**
 * Action to set custom vectorStyle
 *
 * @param {String} layerId
 * @param {String} vectorStyleId
 * @param {Number} index | VectorStyle index value for multi-vectorStyled layers
 * @param {String} groupName | layer group string
 */
export function setStyle(layer, vectorStyleId, groupName) {
  return (dispatch, getState) => {
    const state = getState();
    const newActiveVectorStylesObj = setStyleFunction(
      layer,
      vectorStyleId,
      state.vectorStyles.custom,
      null,
      state
    );
    dispatch({
      type: SET_VECTORSTYLE,
      layerId: layer.id,
      vectorStyleId: vectorStyleId,
      groupName: groupName,
      activeString: groupName,
      vectorStyles: newActiveVectorStylesObj
    });
  };
}
/**
 * Action to remove custom vectorStyle
 *
 * @param {String} layerId
 * @param {Number} index | VectorStyle index value for multi-vectorStyled layers
 * @param {String} groupName | layer group string
 */
export function clearStyle(layer, vectorStyleId, groupName) {
  return (dispatch, getState) => {
    const state = getState();
    const newActiveVectorStylesObj = setStyleFunction(
      layer,
      vectorStyleId,
      state.vectorStyles.custom,
      null,
      state
    );
    dispatch({
      type: CLEAR_VECTORSTYLE,
      layerId: layer.id,
      vectorStyleId: vectorStyleId,
      groupName: groupName,
      activeString: groupName,
      vectorStyles: newActiveVectorStylesObj
    });
  };
}
/**
 * Action to select Vectors
 *
 * @param {Object} payload Keys are layer ids that contain arrays of feature ids
 */
export function selectVectorFeatures(payload) {
  return {
    type: SET_SELECTED_VECTORS,
    payload
  }
}