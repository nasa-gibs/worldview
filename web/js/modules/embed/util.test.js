import { mapLocationToEmbedState } from './util';

const visibleLayer = { id: 'layer-a', visible: true, group: 'overlays' };
const hiddenLayer = { id: 'layer-b', visible: false, group: 'overlays' };
const referenceLayer = { id: 'layer-ref', visible: true, group: 'overlays' };

const baseStateFromLocation = {
  embed: { isEmbedModeActive: false },
  layers: {
    active: {
      layers: [visibleLayer, hiddenLayer],
      overlayGroups: [],
    },
    activeB: {
      layers: [visibleLayer, hiddenLayer],
      overlayGroups: [],
    },
  },
};

describe('mapLocationToEmbedState', () => {
  test('returns stateFromLocation unchanged when em parameter is not "true" [embed-util-no-em]', () => {
    const result = mapLocationToEmbedState({}, baseStateFromLocation);
    expect(result).toBe(baseStateFromLocation);
  });

  test('returns stateFromLocation unchanged when em is absent [embed-util-em-absent]', () => {
    const result = mapLocationToEmbedState({ em: undefined }, baseStateFromLocation);
    expect(result).toBe(baseStateFromLocation);
  });

  test('returns stateFromLocation unchanged when em is "false" [embed-util-em-false]', () => {
    const result = mapLocationToEmbedState({ em: 'false' }, baseStateFromLocation);
    expect(result).toBe(baseStateFromLocation);
  });

  test('sets isEmbedModeActive to true when em is "true" [embed-util-em-true]', () => {
    const result = mapLocationToEmbedState({ em: 'true' }, baseStateFromLocation);
    expect(result.embed.isEmbedModeActive).toBe(true);
  });

  test('does not mutate the original stateFromLocation [embed-util-no-mutation]', () => {
    mapLocationToEmbedState({ em: 'true' }, baseStateFromLocation);
    expect(baseStateFromLocation.embed.isEmbedModeActive).toBe(false);
  });

  test('filters out invisible layers from active when em is "true" [embed-util-filters-active-invisible]', () => {
    const result = mapLocationToEmbedState({ em: 'true' }, baseStateFromLocation);
    expect(result.layers.active.layers.every((l) => l.visible)).toBe(true);
  });

  test('filters out invisible layers from activeB when em is "true" [embed-util-filters-activeb-invisible]', () => {
    const result = mapLocationToEmbedState({ em: 'true' }, baseStateFromLocation);
    expect(result.layers.activeB.layers.every((l) => l.visible)).toBe(true);
  });

  test('hidden layer is excluded from active.layers [embed-util-hidden-excluded-active]', () => {
    const result = mapLocationToEmbedState({ em: 'true' }, baseStateFromLocation);
    const ids = result.layers.active.layers.map((l) => l.id);
    expect(ids).not.toContain(hiddenLayer.id);
  });

  test('hidden layer is excluded from activeB.layers [embed-util-hidden-excluded-activeb]', () => {
    const result = mapLocationToEmbedState({ em: 'true' }, baseStateFromLocation);
    const ids = result.layers.activeB.layers.map((l) => l.id);
    expect(ids).not.toContain(hiddenLayer.id);
  });

  test('visible layer is retained in active.layers [embed-util-visible-retained-active]', () => {
    const result = mapLocationToEmbedState({ em: 'true' }, baseStateFromLocation);
    const ids = result.layers.active.layers.map((l) => l.id);
    expect(ids).toContain(visibleLayer.id);
  });

  test('visible layer is retained in activeB.layers [embed-util-visible-retained-activeb]', () => {
    const result = mapLocationToEmbedState({ em: 'true' }, baseStateFromLocation);
    const ids = result.layers.activeB.layers.map((l) => l.id);
    expect(ids).toContain(visibleLayer.id);
  });

  test('Reference overlay group is removed from active.overlayGroups [embed-util-reference-removed-active]', () => {
    const stateWithReference = {
      ...baseStateFromLocation,
      layers: {
        active: {
          layers: [visibleLayer, referenceLayer],
          overlayGroups: [
            { groupName: 'Reference', layers: [referenceLayer] },
            { groupName: 'Overlays', layers: [visibleLayer] },
          ],
        },
        activeB: {
          layers: [visibleLayer],
          overlayGroups: [
            { groupName: 'Overlays', layers: [visibleLayer] },
          ],
        },
      },
    };
    const result = mapLocationToEmbedState({ em: 'true' }, stateWithReference);
    const groupNames = result.layers.active.overlayGroups.map((g) => g.groupName);
    expect(groupNames).not.toContain('Reference');
  });

  test('Reference overlay group is removed from activeB.overlayGroups [embed-util-reference-removed-activeb]', () => {
    const stateWithReference = {
      ...baseStateFromLocation,
      layers: {
        active: {
          layers: [visibleLayer],
          overlayGroups: [{ groupName: 'Overlays', layers: [visibleLayer] }],
        },
        activeB: {
          layers: [visibleLayer, referenceLayer],
          overlayGroups: [
            { groupName: 'Reference', layers: [referenceLayer] },
            { groupName: 'Overlays', layers: [visibleLayer] },
          ],
        },
      },
    };
    const result = mapLocationToEmbedState({ em: 'true' }, stateWithReference);
    const groupNames = result.layers.activeB.overlayGroups.map((g) => g.groupName);
    expect(groupNames).not.toContain('Reference');
  });

  test('result layers object is a deep clone, not the original [embed-util-deep-clone]', () => {
    const result = mapLocationToEmbedState({ em: 'true' }, baseStateFromLocation);
    expect(result.layers).not.toBe(baseStateFromLocation.layers);
    expect(result.layers.active).not.toBe(baseStateFromLocation.layers.active);
  });

  test('returns a new object reference when em is "true" [embed-util-new-reference]', () => {
    const result = mapLocationToEmbedState({ em: 'true' }, baseStateFromLocation);
    expect(result).not.toBe(baseStateFromLocation);
  });

  test('handles empty active layers array when em is "true" [embed-util-empty-active]', () => {
    const emptyState = {
      ...baseStateFromLocation,
      layers: {
        active: { layers: [], overlayGroups: [] },
        activeB: { layers: [], overlayGroups: [] },
      },
    };
    const result = mapLocationToEmbedState({ em: 'true' }, emptyState);
    expect(result.layers.active.layers).toEqual([]);
    expect(result.layers.activeB.layers).toEqual([]);
    expect(result.embed.isEmbedModeActive).toBe(true);
  });

  test('preserves other stateFromLocation properties when em is "true" [embed-util-preserves-other-state]', () => {
    const stateWithExtra = {
      ...baseStateFromLocation,
      date: { selected: new Date('2022-01-01') },
      compare: { active: false },
    };
    const result = mapLocationToEmbedState({ em: 'true' }, stateWithExtra);
    expect(result.date).toEqual(stateWithExtra.date);
    expect(result.compare).toEqual(stateWithExtra.compare);
  });

  test('preserves other stateFromLocation properties when em is not "true" [embed-util-preserves-state-no-em]', () => {
    const stateWithExtra = {
      ...baseStateFromLocation,
      date: { selected: new Date('2022-01-01') },
    };
    const result = mapLocationToEmbedState({}, stateWithExtra);
    expect(result.date).toEqual(stateWithExtra.date);
  });
});
