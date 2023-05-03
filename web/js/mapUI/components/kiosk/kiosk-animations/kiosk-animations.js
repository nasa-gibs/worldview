import { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import PropTypes from 'prop-types';
import {
  onActivate as initiateAnimationAction,
  playKioskAnimation as playKioskAnimationAction,
} from '../../../../modules/animation/actions';
import { selectInterval } from '../../../../modules/date/actions';
import { countTilesForSpecifiedLayers } from '../../../util/util';

const kioskAnimationTilesList = ['GOES-East_ABI_GeoColor', 'GOES-West_ABI_GeoColor', 'Himawari_AHI_Band3_Red_Visible_1km'];

function KioskAnimations({ ui }) {
  const dispatch = useDispatch();
  const setInterval = () => { dispatch(selectInterval(10, 5, true)); };
  const initiateAnimation = () => { dispatch(initiateAnimationAction()); };
  const playKioskAnimation = (startDate, endDate) => { dispatch(playKioskAnimationAction(startDate, endDate)); };

  const {
    selectedDate, isAnimationPlaying, isKioskModeActive, autoplay,
  } = useSelector((state) => ({
    selectedDate: state.date.selected,
    loop: state.animation.loop,
    isAnimationPlaying: state.animation.isPlaying,
    isKioskModeActive: state.ui.isKioskModeActive,
    autoplay: state.animation.autoplay,
  }));

  useEffect(() => {
    if (!ui.selected) return;
    const animationPlayCheck = autoplay && !isAnimationPlaying && isKioskModeActive;
    // nested if statements to protect agaisnt invoking countTilesForSpecifiedLayers since it is expensive
    if (animationPlayCheck) {
      const { totalExpectedTileCount, totalLoadedTileCount } = countTilesForSpecifiedLayers(ui, kioskAnimationTilesList);
      // console.log(totalExpectedTileCount, totalLoadedTileCount , selectedDate)
      if (totalExpectedTileCount === 28 && totalLoadedTileCount === 28) {
        handleAnimationSettings();
      }
    }
  });

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
    setInterval();
    playKioskAnimation(startDate, endDate);
  };

  return null;
}

KioskAnimations.propTypes = {
  ui: PropTypes.object,
};

export default KioskAnimations;
