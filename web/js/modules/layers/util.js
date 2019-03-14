import { cloneDeep as lodashCloneDeep, get } from 'lodash';
import util from '../../util/util';

export function getLayersParameterSetup(
  parameters,
  config,
  models,
  legacyState,
  errors
) {
  const initialState = lodashCloneDeep(models.layers.active);
  models.palettes.load(legacyState, errors);
  if (models.compare.active) {
    models.layers.activeB = lodashCloneDeep(initialState);
  }
  const layerModelLoaded = models.layers.load(legacyState, errors);

  return {
    l: getPermalinkManagementObject(
      initialState,
      'legacy.layers.active',
      () => {
        return layerModelLoaded.active ? layerModelLoaded.active : initialState;
      },
      (currentItemState, state) => {
        const isActive = get(models, 'compare.active');
        const isCompareA = get(models, 'compare.isCompareA');
        const layersB = get(models, 'layers.activeB');
        const layersA = get(models, 'layers.active');
        return !isActive && !isCompareA
          ? serializeLayers(layersB, models, 'activeB')
          : serializeLayers(layersA, models, 'active');
      }
    ),
    l1: getPermalinkManagementObject(
      initialState,
      'legacy.layers.activeB',
      () => {
        return layerModelLoaded.activeB;
      },
      (currentItemState, state) => {
        const isActive = get(models, 'compare.active');
        const layersB = get(models, 'layers.activeB');
        return isActive
          ? serializeLayers(layersB, models, 'activeB')
          : undefined;
      }
    )
  };
}
function serializeLayers(layers, models, groupStr) {
  return layers.map(def => {
    var item = {};

    if (def.id) {
      item = {
        id: def.id
      };
    }
    if (!item.attributes) {
      item.attributes = [];
    }
    if (!def.visible) {
      item.attributes.push({
        id: 'hidden'
      });
    }
    if (def.opacity < 1) {
      item.attributes.push({
        id: 'opacity',
        value: def.opacity
      });
    }
    let def1 =
      def.id && def.palette
        ? models.palettes.get(def.id, undefined, groupStr)
        : undefined;
    if (def1) {
      if (def1.custom) {
        item.attributes.push({
          id: 'palette',
          value: def1.custom
        });
      }
      if (def1.min) {
        var minValue = def1.entries.values[def1.min];
        item.attributes.push({
          id: 'min',
          value: minValue
        });
      }
      if (def1.max) {
        var maxValue = def1.entries.values[def1.max];
        item.attributes.push({
          id: 'max',
          value: maxValue
        });
      }
      if (def1.squash) {
        item.attributes.push({
          id: 'squash'
        });
      }
    }
    return util.appendAttributesForURL(item);
  });
}
function getPermalinkManagementObject(
  initialState,
  stateKey,
  parser,
  serialize
) {
  return {
    stateKey: stateKey,
    initialState: initialState,
    type: 'array',
    options: {
      delimiter: ',',
      serializeNeedsGlobalState: true,
      parse: parser,
      serialize: serialize
    }
  };
}
