import {
  assign as lodashAssign,
  cloneDeep as lodashCloneDeep,
} from 'lodash';
import { getOverlayGroups } from '../layers/util';
import { getActiveLayersMap } from '../layers/selectors';

/**
 * Update embed state when location-pop action occurs
 *
 * @param {Object} parameters | parameters parsed from permalink
 * @param {Object} stateFromLocation | State derived from permalink parsers
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

/**
 * Return an array of filtered overlay groups for the currently active compare state
 * that are available for the currently active projection (no hidden or reference layers)
 *
 * @param {Object} state
 */
export const getActiveOverlayGroupsEmbed = (state) => {
  const {
    compare, layers, proj,
  } = state;
  const { overlayGroups } = layers[compare.activeString];
  const activeLayersMap = getActiveLayersMap(state);
  const overlayGroupsFiltered = overlayGroups.filter((group) => group.groupName !== 'Reference');
  return (overlayGroupsFiltered || []).filter(
    (group) => group.layers.filter(
      (id) => !!activeLayersMap[id] && !!activeLayersMap[id].projections[proj.id]
          && !!activeLayersMap[id].visible,
    ).length,
  );
};

/**
 * Return a list of layers for the currently active compare state
 * regardless of projection (no hidden layers)
 */
export const getActiveLayersEmbed = (state, activeString) => {
  const { compare, layers } = state;
  const activeLayers = layers[activeString || compare.activeString].layers;
  return activeLayers.filter((layer) => layer.visible);
};

/**
 * Return a list of layer groups that filter out removed, hidden layers
 */
export const getFilteredOverlayGroups = (overlayGroups, overlays) => {
  const overlaysLayerIds = overlays.map((layer) => layer.id);
  // remove reference layers and revise overlay layers group
  return overlayGroups
    .filter((group) => group.groupName !== 'Reference')
    .map((group) => {
      const filteredLayers = group.layers.filter((layer) => overlaysLayerIds.includes(layer));
      const filteredGroup = { ...group };
      filteredGroup.layers = filteredLayers;
      return filteredGroup;
    });
};
