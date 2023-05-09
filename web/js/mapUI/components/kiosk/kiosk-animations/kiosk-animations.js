import { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import PropTypes from 'prop-types';
import {
  onActivate as initiateAnimationAction,
  playKioskAnimation as playKioskAnimationAction,
} from '../../../../modules/animation/actions';
import { selectDate as selectDateAction } from '../../../../modules/date/actions';

function KioskAnimations({ ui }) {
  const dispatch = useDispatch();
  const initiateAnimation = () => { dispatch(initiateAnimationAction()); };
  const playKioskAnimation = (startDate, endDate) => { dispatch(playKioskAnimationAction(startDate, endDate)); };
  const selectDate = (date) => { dispatch(selectDateAction(date)); };

  const {
    selectedDate, isAnimationPlaying, isKioskModeActive, eic, map, readyForKioskAnimation,
  } = useSelector((state) => ({
    selectedDate: state.date.selected,
    isAnimationPlaying: state.animation.isPlaying,
    isKioskModeActive: state.ui.isKioskModeActive,
    eic: state.ui.eic,
    map: state.map,
    readyForKioskAnimation: state.ui.readyForKioskAnimation,
  }));

  const [subdailyAnimationDateUpdated, setSubdailyAnimationDateUpdated] = useState(false);

  useEffect(() => {
    if (!ui.selected || !isKioskModeActive) return;
    if (eic === 'sa' || eic === 'da') checkAnimationSettings();
  }, [map, readyForKioskAnimation]);

  const subdailyPlayCheck = eic === 'sa' && subdailyAnimationDateUpdated && readyForKioskAnimation && !isAnimationPlaying;
  const dailyPlayCheck = eic === 'da' && readyForKioskAnimation && !isAnimationPlaying;

  // if subdaily animation check that date moved back one day otherwise check if animation should play
  const checkAnimationSettings = () => {
    if (!ui.selected.frameState_) return;
    if (eic === 'sa' && !subdailyAnimationDateUpdated) {
      const prevDayDate = new Date(selectedDate);
      prevDayDate.setDate(prevDayDate.getDate() - 1);
      selectDate(prevDayDate);
      setSubdailyAnimationDateUpdated(true);
    } else if (subdailyPlayCheck || dailyPlayCheck) {
      handleAnimationSettings();
    }
  };

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

  // start time to determine animation duration
  const updateStartTime = (dateString) => {
    const date = new Date(dateString);
    if (eic === 'sa') {
      // Subtract 6 hours (6 * 60 * 60 * 1000 milliseconds) for subdaily animations
      date.setTime(date.getTime() - 6 * 60 * 60 * 1000);
    } else {
      // Subtract 1 month for daily animations
      date.setMonth(date.getMonth() - 1);
    }
    return date.toString();
  };

  const handleAnimationSettings = () => {
    const start = updateStartTime(selectedDate);
    const end = selectedDate;
    const { startDate, endDate } = zeroDates(start, end);

    initiateAnimation();
    playKioskAnimation(startDate, endDate);
  };

  return null;
}

KioskAnimations.propTypes = {
  ui: PropTypes.object,
};

export default KioskAnimations;
