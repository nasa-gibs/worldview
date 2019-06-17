import {
  SET_FILTER_RANGE,
  CLEAR_VECTORSTYLE,
  SET_VECTORSTYLE,
  LOADED_CUSTOM_VECTORSTYLES
} from './constants';
import {
  setRange as setRangeSelector,
  setCustomSelector,
  clearCustomSelector
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
export function setStyle(layerId, vectorStyleId, index, groupName) {
  return (dispatch, getState) => {
    const state = getState();
    const newActiveVectorStylesObj = setCustomSelector(
      layerId,
      vectorStyleId,
      index,
      groupName,
      state
    );
    dispatch({
      type: SET_VECTORSTYLE,
      layerId: layerId,
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
export function clearStyle(layerId, index, groupName) {
  return (dispatch, getState) => {
    const { vectorStyles } = getState();
    const newActiveVectorStylesObj = clearCustomSelector(
      layerId,
      index,
      vectorStyles[groupName]
    );

    dispatch({
      type: CLEAR_VECTORSTYLE,
      groupName: groupName,
      vectorStyles: newActiveVectorStylesObj
    });
  };
}
/**
 * Action signifying custom vectorStyles have been loaded
 *
 * @param {Object} customs | Custom VectorStyles from Config
 */
export function loadedDefaultVectorStyles(customs) {
  return {
    type: LOADED_CUSTOM_VECTORSTYLES,
    custom: customs
  };
}
