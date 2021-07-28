import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { Modal, ModalBody, ModalHeader } from 'reactstrap';
import { isEmpty as lodashIsEmpty } from 'lodash';
import Spinner from 'react-loader';
import PQueue from 'p-queue/dist';
import util from '../../util/util';
import {
  getQueueLength,
  getMaxQueueLength,
  snapToIntervalDelta,
} from '../../modules/animation/util';

const queue = new PQueue({ concurrency: 5 });
let isAnimating = false;

function PlayAnimation (props) {
  const {
    isPlaying,
    isLoopActive,
    interval,
    startDate,
    endDate,
    delta,
    hasCustomPalettes,
    speed,
    selectDate,
    selectedDate,
    promiseImageryForTime,
    pause,
  } = props;

  let preloadedDates = {};
  const pastDates = {};
  let timeout = 0;
  const [animateDates, setAnimateDates] = useState([]);
  const [lastToQueue, setLastToQueue] = useState();
  const [queueLength, setQueueLength] = useState(0);
  const [maxQueueLength, setMaxQueueLength] = useState(0);
  const [canPreloadAll, setCanPreloadAll] = useState();
  const [preloadArray, setPreLoadArray] = useState([]);
  const [inQueueObject, setInQueueObject] = useState({});

  const currentDate = snapToIntervalDelta(
    selectedDate,
    startDate,
    endDate,
    interval,
    delta,
  );

  useEffect(() => {
    setMaxQueueLength(getMaxQueueLength(speed));
    setQueueLength(getQueueLength(
      startDate,
      endDate,
      speed,
      interval,
      delta,
    ));
    setCanPreloadAll(queueLength <= maxQueueLength);
  }, [startDate, endDate, interval, delta, speed]);

  useEffect(() => {
    if (isPlaying) {
      console.log('remount!', queueLength, maxQueueLength);
      const nothingLoaded = !preloadArray[0] && !inQueueObject[currentPlayingDate];
      if (nothingLoaded) {
        initialPreload();
      } else {
        checkQueue();
      }
    }
    return () => {
      queue.clear();
      if (timeout) {
        stopPlaying();
      }
    };
  }, [isPlaying]);

  useEffect(() => {
    const dates = [startDate];
    let date = startDate;
    while (date <= endDate) {
      dates.push(date);
      date = nextDate(date);
    }
    setAnimateDates(dates);
    const last = dates[dates.length - 1];
    setLastToQueue(util.toISOStringSeconds(last));
  }, [startDate, endDate, interval, delta]);

  const nextDate = (date) => util.dateAdd(date, interval, delta);

  const getStartDate = () => {
    const next = nextDate(currentDate);
    const useStartDate = currentDate > startDate && next < endDate ? next : startDate;
    return util.toISOStringSeconds(useStartDate);
  };

  let currentPlayingDate = getStartDate();

  const addToInQueueObject = (key, val) => {
    setInQueueObject({
      ...inQueueObject,
      [key]: val,
    });
  };

  const removeFromInQueueObject = (strDate) => {
    const deleteProperty = ({ [strDate]: _, ...newObj }, key) => newObj;
    setInQueueObject(deleteProperty(inQueueObject, strDate));
  };

  /**
   * Gets next date based on current increments
   * @param date {object} JS date obj
   *
   * @returns {object} JS Date
   */
  const addDate = async (date) => {
    const strDate = util.toISOStringSeconds(date);
    console.log('addDate', date);

    if (inQueueObject[strDate] || preloadedDates[strDate]) {
      return;
    }
    addToInQueueObject(strDate, date);
    setPreLoadArray([...preloadArray, strDate]);

    preloadedDates[strDate] = await queue.add(
      () => promiseImageryForTime(date),
    );
    removeFromInQueueObject(strDate);
    shiftCache();
    checkQueue();
    checkShouldPlay();
  };

  const initialPreload = () => {
    if (queueLength <= 1) {
      // if only one frame will play just move to that date
      selectDate(startDate);
      pause();
      return;
    }
    animateDates.forEach((d) => addDate(d));
  };

  /**
   * Determine if we should play
   *
   * @param isLoopStart {Boolean}
   */
  const checkShouldPlay = (isLoopStart) => {
    const current = util.parseDateUTC(currentPlayingDate);

    console.log('last2Q', lastToQueue);

    if (isAnimating && !isLoopStart) {
      return false;
    }
    if (preloadedDates[lastToQueue]) {
      return play();
    }
    if (
      hasCustomPalettes
      && preloadedDates[currentPlayingDate]
      && lodashIsEmpty(inQueueObject)
    ) {
      return play();
    }
    if (isLoopStart && current.getTime() === startDate.getTime()) {
      return play();
    }
    shiftCache();
  };

  const checkShouldLoop = () => {
    if (isLoopActive) {
      shiftCache();
      currentPlayingDate = util.toISOStringSeconds(startDate);
      setTimeout(() => {
        checkShouldPlay(true);
        checkQueue();
      }, 1000);
    } else {
      pause();
    }
  };

  /**
   * Determines what dates should be queued
   */
  const checkQueue = () => {
    const current = util.parseDateUTC(currentPlayingDate);
    const next = nextDate(current);
    const [lastPreload] = preloadArray.slice(-1);

    if (
      lastPreload !== lastToQueue
      && !inQueueObject[lastToQueue]
      && !hasCustomPalettes
      && !canPreloadAll
    ) {
      // if last preload date doesn't exist
      addItemToQueue(current);
    } else if (
      hasCustomPalettes
      && preloadArray[0]
      && !inQueueObject[next]
      && queueLength > maxQueueLength
    ) {
      customQueuer(currentDate);
    }
  };

  const customQueuer = () => {
    let next = nextDate(currentDate);
    if (next > endDate) {
      next = startDate;
    }
    const nextDateStr = util.toISOStringSeconds(next);
    if (
      !preloadedDates[nextDateStr]
      && !inQueueObject[nextDateStr]
      && !isAnimating
    ) {
      preloadedDates = {};
      setPreLoadArray([]);
      setInQueueObject({});
      checkQueue();
    }
  };

  /**
   * removes item from cache after it has
   * been played and quelimit reached
   */
  const shiftCache = () => {
    // if (
    //   preloadedDates[preloadArray[0]]
    //   && util.objectLength(preloadedDates) > queueLength
    //   && pastDates[preloadArray[0]]
    //   && !isInToPlayGroup(preloadArray[0])
    //   && !canPreloadAll
    // ) {
    //   const key = preloadArray.shift();
    //   setPreLoadArray([...preloadArray]);

    //   delete preloadedDates[key];
    //   delete pastDates[key];
    // }
  };

  const getNextBufferDate = () => {
    const [strDate] = preloadArray.slice(-1);
    const lastInBuffer = util.parseDateUTC(strDate);
    const next = nextDate(lastInBuffer);
    if (lastInBuffer >= endDate || next > endDate) {
      return startDate;
    }
    return next;
  };

  /**
   * Verifies that date is valid and adds it to queuer
   */
  const addItemToQueue = () => {
    const next = getNextBufferDate(currentDate);
    const nextDateStr = util.toISOStringSeconds(next);

    if (
      !inQueueObject[nextDateStr]
      && !preloadedDates[nextDateStr]
      && next <= endDate
      && next >= startDate
    ) {
      setTimeout(() => {
        addDate(next);
        checkQueue();
      }, Math.floor(1000 / speed));
    }
  };

  /**
   * checks if this date is in array of dates that need
   * to play in future within buffer length
   *
   * @param testDate {string} JS date string
   */
  const isInToPlayGroup = (testDate) => {
    let i = 0;
    let day = util.parseDateUTC(currentPlayingDate);
    const jsTestDate = util.parseDateUTC(testDate);
    debugger;
    while (i < queueLength) {
      if (nextDate(day) > endDate) {
        if (!isLoopActive) {
          return false;
        }
        day = startDate;
      } else {
        day = nextDate(day);
      }
      if (day.valueOf() === jsTestDate.valueOf()) {
        return true;
      }
      i += 1;
    }
    return false;
  };


  const play = () => {
    if (!isAnimating) isAnimating = true;
    animate();
    if (document.hidden) {
      pause();
    }
  };

  const stopPlaying = () => {
    clearInterval(timeout);
    isAnimating = false;
    queue.pause();
    queue.clear();
    console.log('stop!', isAnimating, isPlaying);
  };

  const animate = () => {
    let currentDateStr = currentPlayingDate;
    let nextDateStr;
    let nextDateParsed;
    console.log('animate!', isAnimating, isPlaying);

    const player = () => {
      const currentDateParsed = util.parseDateUTC(currentDateStr);
      nextDateParsed = nextDate(currentDateParsed);
      nextDateStr = util.toISOStringSeconds(nextDateParsed);

      shiftCache();
      checkQueue();

      if (isPlaying) {
        selectDate(currentDateParsed);
      }
      pastDates[currentDateStr] = currentDateParsed;
      currentPlayingDate = currentDateStr;

      // Advance to next
      currentDateStr = nextDateStr;

      // End of animation range
      if (nextDateParsed > endDate) {
        clearInterval(interval);
        checkShouldLoop();
        return;
      }

      // Reached the end of preload
      if (!preloadedDates[nextDateStr]) {
        stopPlaying();
        shiftCache();
        checkQueue();
        return;
      }
      if (!isPlaying) {
        stopPlaying();
      }
      checkQueue();
      timeout = setTimeout(player, 1000 / speed);
    };
    timeout = setTimeout(player, speed);
  };

  const renderSpinner = () => (
    <Modal
      isOpen
      toggle={pause}
      size="sm"
      backdrop={false}
      wrapClassName="clickable-behind-modal"
    >
      <ModalHeader toggle={pause}> Preloading imagery </ModalHeader>
      <ModalBody>
        <div style={{ minHeight: 50 }}>
          <Spinner color="#fff" loaded={false}>
            Loaded
          </Spinner>
        </div>
      </ModalBody>
    </Modal>
  );

  return !isAnimating && isPlaying ? renderSpinner() : null;
}

PlayAnimation.propTypes = {
  startDate: PropTypes.object.isRequired,
  endDate: PropTypes.object.isRequired,
  isPlaying: PropTypes.bool.isRequired,
  isLoopActive: PropTypes.bool,
  layers: PropTypes.array.isRequired,
  promiseImageryForTime: PropTypes.func.isRequired,
  selectDate: PropTypes.func.isRequired,
  selectedDate: PropTypes.object.isRequired,
  speed: PropTypes.number.isRequired,
  delta: PropTypes.number,
  hasCustomPalettes: PropTypes.bool,
  interval: PropTypes.string,
  onClose: PropTypes.func,
};

export default PlayAnimation;
