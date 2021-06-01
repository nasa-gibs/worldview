import googleTagManager from 'googleTagManager';
import update from 'immutability-helper';
import safeLocalStorage from '../../util/local-storage';

const { HIDE_TOUR } = safeLocalStorage.keys;

/**
 * Update Tour state when location-pop action occurs
 *
 * @param {Object} parameters | parameters parsed from permalink
 * @param {Object} stateFromLocation | State derived from permalink parsers
 * @param {Object} state | initial state before location POP action
 * @param {Object} config
 */
export function mapLocationToTourState(
  parameters,
  stateFromLocation,
  state,
  config,
) {
  const isEmbedModeActive = parameters.em && parameters.em === 'true';
  if (parameters.tr && !isEmbedModeActive) {
    stateFromLocation = update(stateFromLocation, {
      tour: { active: { $set: true } },
    });
  } else {
    stateFromLocation = update(stateFromLocation, {
      tour: { active: { $set: false } },
    });
  }
  return stateFromLocation;
}

/**
 * Determine if tour should be shown based on
 * user's browser and is 'hidestore' key is in localStorage
 *
 * @param {Object} config
 *
 * @returns {Boolean}
 */
export function checkTourBuildTimestamp(config) {
  if (!safeLocalStorage.enabled) return false;
  const hideTour = safeLocalStorage.getItem(HIDE_TOUR);

  // Don't start tour if coming in via a permalink
  if (window.location.search && !config.parameters.tour) {
    return false;
  }

  if (hideTour && config.buildDate) {
    const buildDate = new Date(config.buildDate);
    const tourDate = new Date(hideTour);
    // Tour hidden when visiting fresh URL
    googleTagManager.pushEvent({
      event: 'tour_start_hidden',
      buildDate,
      tourDate,
    });
    if (buildDate > tourDate) {
      safeLocalStorage.removeItem(HIDE_TOUR);
      return true;
    }
    return false;
  } if (hideTour) {
    return false;
  }
  // Tour shown when visiting fresh URL
  googleTagManager.pushEvent({
    event: 'tour_start',
  });
  return true;
}
