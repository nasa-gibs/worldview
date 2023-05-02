import { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  play,
  toggleLooping,
  changeFrameRate,
  changeStartAndEndDate,
  onActivate as initiateAnimationAction,
} from '../../../../modules/animation/actions';
import {
  selectInterval,
} from '../../../../modules/date/actions';

function KioskAnimations() {
  const dispatch = useDispatch();
  const playAnimation = () => { dispatch(play()); };
  const toggleLoop = () => { dispatch(toggleLooping()); };
  const setFrameRate = (rate) => { dispatch(changeFrameRate(rate)); };
  const setStartAndEndDate = (start, end) => { dispatch(changeStartAndEndDate(start, end)); };
  const setInterval = () => { dispatch(selectInterval(10, 5, true)); };
  const initiateAnimation = () => { dispatch(initiateAnimationAction()); };

  const {
    readyForAnimation, selectedDate, isAnimationPlaying,
  } = useSelector((state) => ({
    readyForAnimation: state.ui.readyForAnimation,
    selectedDate: state.date.selected,
    loop: state.animation.loop,
    isAnimationPlaying: state.animation.isPlaying,
  }));

  useEffect(() => {
    if (readyForAnimation && !isAnimationPlaying) {
      handleAnimationSettings();
    }
  }, [readyForAnimation]);

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
    // Parse the input date string into a Date object
    const date = new Date(dateString);
    // Subtract 3 hours (3 * 60 * 60 * 1000 milliseconds)
    date.setTime(date.getTime() - 6 * 60 * 60 * 1000);
    // Return the updated date string
    return date.toString();
  };

  const handleAnimationSettings = () => {
    // console.log('selectedDate', selectedDate);
    const start = updateStartTime(selectedDate);
    const end = selectedDate;
    const { startDate, endDate } = zeroDates(start, end);

    initiateAnimation();
    setInterval();
    toggleLoop();
    setFrameRate(6);
    setStartAndEndDate(startDate, endDate);
    playAnimation();
  };

  return null;
}

export default KioskAnimations;
