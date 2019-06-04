import { requestAction } from '../core/actions';
import {
  REQUEST_VECTORSTYLE,
  SET_RANGE_AND_SQUASH,
  CLEAR_CUSTOM,
  SET_CUSTOM,
  LOADED_CUSTOM_VECTORSTYLES
} from './constants';
import {
  setRange as setRangeSelector,
  setCustom as setCustomSelector,
  clearCustom as clearCustomSelector
} from './selectors';

/**
 * Request vectorStyle using core request utility
 *
 * @param {String} id | Layer Id
 */
export function requestVectorStyle(id) {
  return (dispatch, getState) => {
    const config = getState().config;
    var layer = config.layers[id];
    const vectorStyleID = layer.vectorStyle.id;
    const location = 'config/vectorStyles/' + vectorStyleID + '.json';
    return requestAction(
      dispatch,
      REQUEST_VECTORSTYLE,
      location,
      'application/json',
      vectorStyleID
    );
  };
}

/**
 * @param {String} layerId
 * @param {Object} props | contains min max and squash attributes
 * @param {Number} index | VectorStyle index value for multi-vectorStyled layers
 * @param {String} groupName | layer group string
 */
export function setRangeAndSquash(layerId, props, index, groupName) {
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
      type: SET_RANGE_AND_SQUASH,
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
export function setCustom(layerId, vectorStyleId, index, groupName) {
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
      type: SET_CUSTOM,
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
export function clearCustom(layerId, index, groupName) {
  return (dispatch, getState) => {
    const { vectorStyles } = getState();
    const newActiveVectorStylesObj = clearCustomSelector(
      layerId,
      index,
      vectorStyles[groupName]
    );

    dispatch({
      type: CLEAR_CUSTOM,
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
export function loadedDefaultVectorStyles(defaults) {
  return {
    type: LOADED_CUSTOM_VECTORSTYLES,
    default: defaults
  };
}
