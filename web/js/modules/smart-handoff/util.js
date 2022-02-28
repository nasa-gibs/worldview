
import { get } from 'lodash';

export function parseSmartHandoff(state) {
  const [layerId, conceptId] = state.split(',');
  return {
    layerId,
    conceptId,
  };
}
export function serializeSmartHandoff(currentItemState, state) {
  const activeTab = get(state, 'sidebar.activeTab');
  const { layerId, conceptId } = currentItemState;
  const isActive = activeTab === 'download' && layerId && conceptId;
  return isActive ? [layerId, conceptId].join(',') : undefined;
}
