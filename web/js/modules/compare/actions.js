import { initSecondLayerGroup, syncSecondLayerGroup } from '../layers/actions';
import { initSecondDate, clearPreload } from '../date/actions';
import {
  CHANGE_STATE,
  TOGGLE_ON_OFF,
  CHANGE_VALUE,
  CHANGE_MODE,
} from './constants';

export function toggleActiveCompareState() {
  return (dispatch, getState) => {
    dispatch(clearPreload());
    dispatch({ type: CHANGE_STATE });
  };
}
export function toggleCompareOnOff() {
  return (dispatch, getState) => {
    const state = getState();
    const { active, bStatesInitiated, lastExitALayerIds } = state.compare;
    // Only sync/init layers when entering compare mode, not when exiting.
    if (!active) {
      if (!bStatesInitiated) {
        // First compare entry — full clone of A → B.
        dispatch(initSecondLayerGroup());
        dispatch(initSecondDate());
      } else {
        // Re-entry — only sync layers added to A since last exit,
        // not layers the user intentionally removed from B.
        dispatch(syncSecondLayerGroup(lastExitALayerIds));
      }
    }
    // When exiting, snapshot A's layer IDs so the next re-entry knows
    // which layers are truly new vs. already existed at exit time.
    const exitPayload = active
      ? { lastExitALayerIds: state.layers.active.layers.map((l) => l.id) }
      : {};
    dispatch({ type: TOGGLE_ON_OFF, ...exitPayload });
  };
}
export function setValue(num) {
  return { type: CHANGE_VALUE, value: num };
}
export function changeMode(str) {
  return { type: CHANGE_MODE, mode: str };
}
