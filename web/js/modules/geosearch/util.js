import update from 'immutability-helper';
import safeLocalStorage from '../../util/local-storage';

const { GEOSEARCH_COLLAPSED } = safeLocalStorage.keys;
/**
 *
 * @param {*} parameters
 * @param {*} stateFromLocation
 */
export function mapLocationToGeosearchState(
  parameters,
  stateFromLocation,
  state,
) {
  const { marker } = parameters;
  const coordinates = marker
    ? marker.split(',').map((coord) => Number(coord))
    : [];

  const isMobile = state.browser.lessThan.medium;
  const localStorageCollapseState = getLocalStorageCollapseState();
  const isExpanded = !isMobile && !localStorageCollapseState;

  stateFromLocation = update(stateFromLocation, {
    geosearch: {
      coordinates: { $set: coordinates },
      isExpanded: { $set: isExpanded },
    },
  });

  return stateFromLocation;
}

/**
 * @return {Boolean} is geosearch local storage set to 'collapsed'
 */
export function getLocalStorageCollapseState() {
  return safeLocalStorage.getItem(GEOSEARCH_COLLAPSED) === 'collapsed';
}

/**
 * @param {String} storageValue
 * @return {Void}
 */
export function setLocalStorageCollapseState(storageValue) {
  safeLocalStorage.setItem(GEOSEARCH_COLLAPSED, storageValue);
}
