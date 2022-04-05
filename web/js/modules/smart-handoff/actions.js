import { get as lodashGet } from 'lodash';
import {
  SELECT_COLLECTION,
  SET_AVAILABLE_TOOLS,
  SET_VALID_LAYERS_CONCEPTIDS,
} from './constants';
import { getCollectionsUrl, getConceptUrl } from './selectors';

// eslint-disable-next-line import/prefer-default-export
export function selectCollection(conceptId, layerId) {
  return {
    type: SELECT_COLLECTION,
    conceptId,
    layerId,
  };
}

export function fetchAvailableTools() {
  return async (dispatch, getState) => {
    let availableTools = [];
    let requestFailed = false;
    try {
      const state = getState();
      const { smartHandoffs } = state.config.features;
      availableTools = await Promise.all(smartHandoffs.map(async (tool) => {
        const url = getConceptUrl(state)(tool.conceptId);
        const response = await fetch(url, { timeout: 5000 });
        const result = await response.json();
        return {
          name: tool.toolName,
          action: result.PotentialAction,
        };
      }));
    } catch (e) {
      console.error(e);
      requestFailed = true;
    } finally {
      dispatch({
        type: SET_AVAILABLE_TOOLS,
        availableTools,
        requestFailed,
      });
    }
  };
}

export function validateLayersConceptIds (layers) {
  return async (dispatch, getState) => {
    const state = getState();
    const { smartHandoffs: { validatedConceptIds } } = state;
    let validatedLayers = [];
    let requestFailed = false;

    try {
      const conceptIdRequest = async (url) => {
        const granulesResponse = await fetch(url, { timeout: 5000 });
        const result = await granulesResponse.json();
        return lodashGet(result, 'feed.entry', []);
      };
      const allConceptIds = layers.reduce((prev, curr) => {
        (curr.conceptIds || []).forEach(({ value }) => {
          if (value) prev.push(value);
        });
        return prev;
      }, []);

      await Promise.all(allConceptIds.map(
        async (id) => {
          if (validatedConceptIds[id] !== undefined) return;
          const requestUrl = getCollectionsUrl(state)(id);
          const response = await conceptIdRequest(requestUrl);
          validatedConceptIds[id] = !!response.length;
        },
      ));

      validatedLayers = layers.reduce((prev, curr) => {
        const validIdsArray = (curr.conceptIds || []).filter(({ value }) => validatedConceptIds[value]);
        if (validIdsArray.length) prev.push(curr);
        return prev;
      }, []);
    } catch (e) {
      console.error(e);
      requestFailed = true;
    } finally {
      dispatch({
        type: SET_VALID_LAYERS_CONCEPTIDS,
        validatedLayers,
        validatedConceptIds,
        requestFailed,
      });
    }
  };
}

