import { useEffect } from 'react';
import PropTypes from 'prop-types';
import { useSelector, useDispatch } from 'react-redux';
import {
  clearErrorTiles as clearErrorTilesAction,
  toggleStaticMap as toggleStaticMapAction,
  toggleReadyForKioskAnimation as toggleReadyForKioskAnimationAction,
} from '../../../../modules/ui/actions';
import {
  selectDate as selectDateAction,
  selectInterval as selectIntervalAction,
} from '../../../../modules/date/actions';
import { getNextDateTime } from '../../../../modules/date/util';
import {
  subdailyLayersActive,
  getActiveLayers,
} from '../../../../modules/layers/selectors';
import { toggleGroupVisibility as toggleGroupVisiblityAction } from '../../../../modules/layers/actions';
import {
  formatDate,
  weekAgo,
  threeHoursAgo,
  twentySevenHoursAgo,
  compareDailyDates,
  compareSubdailyDates,
  formatSelectedDate,
} from '../../../util/util';

function TileErrorHandler({ action, ui }) {
  const dispatch = useDispatch();
  const clearErrorTiles = () => { dispatch(clearErrorTilesAction()); };
  const selectDate = (date) => { dispatch(selectDateAction(date)); };
  const selectInterval = (delta, timeScale, customSelected) => { dispatch(selectIntervalAction(delta, timeScale, customSelected)); };
  const toggleStaticMap = (isActive) => { dispatch(toggleStaticMapAction(isActive)); };
  const toggleGroupVisibility = (ids, visible) => { dispatch(toggleGroupVisiblityAction(ids, visible)); };
  const toggleReadyForKioskAnimation = (toggleAnimation) => { dispatch(toggleReadyForKioskAnimationAction(toggleAnimation)); };

  const {
    displayStaticMap,
    isKioskModeActive,
    errorTiles,
    selectedDate,
    date,
    compare,
    isLoading,
    realTimeDate,
    eic,
    map,
    readyForKioskAnimation,
    eicMeasurementComplete,
  } = useSelector((state) => ({
    autoplayAnimation: state.animation.autoplay,
    displayStaticMap: state.ui.displayStaticMap,
    isAnimationPlaying: state.animation.isPlaying,
    isKioskModeActive: state.ui.isKioskModeActive,
    errorTiles: state.ui.errorTiles,
    selectedDate: state.date.selected,
    date: state.date,
    compare: state.compare,
    isLoading: state.loading.isLoading,
    realTimeDate: state.date.appNow,
    eic: state.ui.eic,
    map: state.map,
    readyForKioskAnimation: state.ui.readyForKioskAnimation,
    eicMeasurementComplete: state.ui.eicMeasurementComplete,
  }));
  const { activeString } = compare;
  const hasSubdailyLayers = useSelector((state) => subdailyLayersActive(state));
  const activeLayerIds = useSelector((state) => getActiveLayers(state, activeString).map((layer) => layer.id));

  const {
    dailyTiles, subdailyTiles, kioskTileCount, lastCheckedDate,
  } = errorTiles;

  const errorTileCheck = dailyTiles.length || subdailyTiles.length;

  useEffect(() => {
    if (!ui.selected || !map.rendered || !eicMeasurementComplete || readyForKioskAnimation || eic === 'si') return;

    if (errorTileCheck) {
      handleTileErrors();
    } else if ((!errorTileCheck && !readyForKioskAnimation) || (eic === 'sa' && !errorTileCheck && !readyForKioskAnimation)) {
      readyForAnimation();
    }
    // replace this with eicMeasurementComplete???
  }, [action]);

  const handleStaticMap = () => {
    toggleStaticMap(true);
    toggleGroupVisibility(activeLayerIds, false);
  };

  const readyForAnimation = () => {
    toggleReadyForKioskAnimation(true);
    clearErrorTiles();
  };

  // need to write new functions here
  // no more time changing
  const handleTileErrors = () => {

  };

  return null;
}

export default TileErrorHandler;

TileErrorHandler.propTypes = {
  action: PropTypes.object,
  ui: PropTypes.object,
};
