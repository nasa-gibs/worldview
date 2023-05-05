import { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import PropTypes from 'prop-types';
import {
  onActivate as initiateAnimationAction,
  playKioskAnimation as playKioskAnimationAction,
} from '../../../../modules/animation/actions';
import { selectInterval, selectDate as selectDateAction, } from '../../../../modules/date/actions';
import { countTilesForSpecifiedLayers } from '../../../util/util';


const kioskAnimationTilesList = ['GOES-East_ABI_GeoColor', 'GOES-West_ABI_GeoColor', 'Himawari_AHI_Band3_Red_Visible_1km'];

function KioskAnimations({ ui }) {
  const dispatch = useDispatch();
  const setInterval = (delta, timeScale, customSelected) => { dispatch(selectInterval(delta, timeScale, customSelected)); };
  const initiateAnimation = () => { dispatch(initiateAnimationAction()); };
  const playKioskAnimation = (startDate, endDate) => { dispatch(playKioskAnimationAction(startDate, endDate)); };
  const selectDate = (date) => { dispatch(selectDateAction(date)); };

  const {
    selectedDate, isAnimationPlaying, isKioskModeActive, autoplay, eic, date, compare, map
  } = useSelector((state) => ({
    selectedDate: state.date.selected,
    loop: state.animation.loop,
    isAnimationPlaying: state.animation.isPlaying,
    isKioskModeActive: state.ui.isKioskModeActive,
    autoplay: state.animation.autoplay,
    eic: state.ui.eic,
    date: state.date,
    compare: state.compare,
    map: state.map,
  }));

  const [subdailyAnimationDateUpdated, setSubdailyAnimationDateUpdated] = useState(false);

  useEffect(() => {
    if (!ui.selected) return;
    if (eic === 'sa' || eic === 'da') checkAnimationSettings()
  }, [map]);

  // if subdaily animation check that date moved back one day otherwise check if animation should play
  const checkAnimationSettings = () => {
    if (!ui.selected.frameState_) return

    if (isKioskModeActive && eic === 'sa' && !subdailyAnimationDateUpdated){
      const prevDayDate = new Date(selectedDate);
      prevDayDate.setDate(prevDayDate.getDate() - 1);
      selectDate(prevDayDate);
      setSubdailyAnimationDateUpdated(true);
      return
    } else if (isKioskModeActive && eic === 'sa' && subdailyAnimationDateUpdated && autoplay && !isAnimationPlaying){
      console.log('else if')
      handleAnimationSettings()
    }

    const animationPlayCheck = autoplay && !isAnimationPlaying && isKioskModeActive;
    // nested if statements to protect agaisnt invoking countTilesForSpecifiedLayers since it is expensive
    if (animationPlayCheck) {
      // const { totalExpectedTileCount, totalLoadedTileCount } = countTilesForSpecifiedLayers(ui, kioskAnimationTilesList);
      // console.log(totalExpectedTileCount, totalLoadedTileCount , selectedDate)
      // if (totalExpectedTileCount === 28 && totalLoadedTileCount === 28) {
        // handleAnimationSettings();
      // }
    }
  }

  // zero dates for subdaily times
  const zeroDates = (start, end) => {
    const startDateZeroed = new Date(start);
    const endDateZeroed = new Date(end);

    // for subdaily, zero start and end dates to UTC HH:MM:00:00
    const startMinutes = startDateZeroed.getMinutes();
    const endMinutes = endDateZeroed.getMinutes();
    startDateZeroed.setUTCMinutes(Math.floor(startMinutes / 10) * 10);
    startDateZeroed.setUTCSeconds(0);
    startDateZeroed.setUTCMilliseconds(0);
    endDateZeroed.setUTCMinutes(Math.floor(endMinutes / 10) * 10);
    endDateZeroed.setUTCSeconds(0);
    endDateZeroed.setUTCMilliseconds(0);

    return {
      startDate: startDateZeroed,
      endDate: endDateZeroed,
    };
  };

  const updateStartTime = (dateString) => {
    const date = new Date(dateString);
    // Subtract 3 hours (3 * 60 * 60 * 1000 milliseconds)
    date.setTime(date.getTime() - 6 * 60 * 60 * 1000);
    return date.toString();
  };

  const handleAnimationSettings = () => {
    const start = updateStartTime(selectedDate);
    const end = selectedDate;
    const { startDate, endDate } = zeroDates(start, end);

    initiateAnimation();
    // 10 minute
    // setInterval(10, 5, true);
    playKioskAnimation(startDate, endDate);
  };

  return null;
}

KioskAnimations.propTypes = {
  ui: PropTypes.object,
};

export default KioskAnimations;
