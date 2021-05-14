import {
  assign as lodashAssign,
  cloneDeep as lodashCloneDeep,
} from 'lodash';
import { getOverlayGroups } from '../layers/util';

/**
 * Update embed state when location-pop action occurs
 *
 * @param {Object} parameters | parameters parsed from permalink
 * @param {Object} stateFromLocation | State derived from permalink parsers
 * @param {Object} state
 */
// eslint-disable-next-line import/prefer-default-export
export function mapLocationToEmbedState(
  parameters,
  stateFromLocation,
) {
  if (parameters.em === 'true') {
    const { layers } = stateFromLocation;
    const layersClone = lodashCloneDeep(layers);
    const { active, activeB } = layersClone;

    const activeFiltered = active.layers.filter((layer) => layer.visible);
    // remove reference layers overlay group
    const activeOverlayGroups = getOverlayGroups(activeFiltered).filter((group) => group.groupName !== 'Reference');
    layersClone.active.layers = activeFiltered;
    layersClone.active.overlayGroups = activeOverlayGroups;

    const activeBFiltered = activeB.layers.filter((layer) => layer.visible);
    // remove reference layers overlay group
    const activeBOverlayGroups = getOverlayGroups(activeBFiltered).filter((group) => group.groupName !== 'Reference');
    layersClone.activeB.layers = activeBFiltered;
    layersClone.activeB.overlayGroups = activeBOverlayGroups;

    stateFromLocation = lodashAssign({}, stateFromLocation, {
      embed: { isEmbedModeActive: true },
      layers: layersClone,
    });
  }

  return stateFromLocation;
}
