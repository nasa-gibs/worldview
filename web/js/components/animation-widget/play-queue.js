import React, { useEffect } from 'react';
import PropTypes from 'prop-types';
import { Modal, ModalBody, ModalHeader } from 'reactstrap';
import { isEmpty as lodashIsEmpty } from 'lodash';
import Spinner from 'react-loader';
import Queue from 'promise-queue';
import util from '../../util/util';
import { getLayersActiveAtDate } from '../../modules/date/util';
import {
  getQueueLength,
  getMaxQueueLength,
  snapToIntervalDelta,
} from '../../modules/animation/util';

const queue = new Queue(5, Infinity);
let isAnimating = false;

function PlayAnimation (props) {
  const {
    isPlaying,
    isLoopActive,
    interval,
    startDate,
    endDate,
    delta,
    layers,
    hasCustomPalettes,
    speed,
    selectDate,
    selectedDate,
    promiseImageryForTime,
    pause,
  } = props;

  let preloadObject = {};
  let inQueueObject = {};
  const pastDates = {};
  let preloadedArray = [];
  let timeout = 0;

  const maxQueueLength = getMaxQueueLength(speed);
  const queueLength = getQueueLength(
    startDate,
    endDate,
    speed,
    interval,
    delta,
  );
  const canPreloadAll = queueLength <= maxQueueLength;
  const currentDate = snapToIntervalDelta(
    selectedDate,
    startDate,
    endDate,
    interval,
    delta,
  );

  useEffect(() => {
    if (isPlaying) {
      console.log('remount!', queueLength, maxQueueLength);
      checkQueue();
    }

    return () => {
      queue.queue = [];
      if (timeout) {
        stopPlaying();
      }
    };
  }, [isPlaying]);

  const nextDate = (date) => util.dateAdd(date, interval, delta);

  const getStartDate = () => {
    const next = nextDate(currentDate);
    const useStartDate = currentDate > startDate && next < endDate ? next : startDate;
    return util.toISOStringSeconds(useStartDate);
  };

  let currentPlayingDate = getStartDate();

  /**
   * Gets next date based on current increments
   * @param date {object} JS date obj
   *
   * @returns {object} JS Date
   */
  const addDate = (date) => {
    const strDate = util.toISOStringSeconds(date);
    const activeLayers = getLayersActiveAtDate(layers, date);

    if (inQueueObject[strDate] || preloadObject[strDate]) {
      return;
    }
    inQueueObject[strDate] = date;
    preloadedArray.push(strDate);

    queue.add(() => promiseImageryForTime(date, activeLayers)).then((addedDate) => {
      preloadObject[strDate] = addedDate;
      delete inQueueObject[strDate];
      shiftCache();
      checkQueue();
      checkShouldPlay();
    });
  };

  /**
   * Gets the last date that should be added to the queuer
   * @returns {string} Date string
   */
  const getLastBufferDateStr = () => {
    let day = currentDate;
    let i = 1;

    while (i < queueLength) {
      if (nextDate(day) > endDate) {
        if (!isLoopActive) {
          return util.toISOStringSeconds(day);
        }
        day = startDate;
      } else {
        day = nextDate(day);
      }
      i += 1;
    }
    return util.toISOStringSeconds(day);
  };

  /**
   * adds dates to precache queuer
   *
   * @param lastToQueue {string} date String
   */
  const initialPreload = (lastToQueue) => {
    let day = util.parseDateUTC(currentPlayingDate);
    if (queueLength <= 1) {
      // if only one frame will play just move to that date
      selectDate(startDate);
      pause();
      return;
    }
    for (let i = 0; i < queueLength; i += 1) {
      addDate(day);
      day = getNextBufferDate(day);
      if (util.toISOStringSeconds(day) === lastToQueue) {
        addDate(day);
      }
    }
  };

  /**
   * Determine if we should play
   *
   * @param isLoopStart {Boolean}
   */
  const checkShouldPlay = (isLoopStart) => {
    const current = util.parseDateUTC(currentPlayingDate);
    const lastToQueue = getLastBufferDateStr(current);

    if (isAnimating && !isLoopStart) {
      return false;
    }
    if (preloadObject[lastToQueue]) {
      return play();
    }
    if (
      hasCustomPalettes
      && preloadObject[currentPlayingDate]
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
    const lastToQueue = getLastBufferDateStr(current);
    const next = nextDate(current);
    const [lastPreload] = preloadedArray.slice(-1);

    const nothingLoaded = !preloadedArray[0] && !inQueueObject[currentPlayingDate];

    if (nothingLoaded) {
      initialPreload(current, lastToQueue);
    } else if (
      !lastPreload !== lastToQueue
      && !inQueueObject[lastToQueue]
      && !hasCustomPalettes
      && !canPreloadAll
    ) {
      // if last preload date doesn't exist
      addItemToQueue(current);
    } else if (
      hasCustomPalettes
      && preloadedArray[0]
      && !inQueueObject[next]
      && queueLength > maxQueueLength
    ) {
      customQueuer(currentDate);
    }
  };

  const clearCache = () => {
    preloadObject = {};
    preloadedArray = [];
    inQueueObject = {};
  };

  const customQueuer = () => {
    let next = nextDate(currentDate);
    if (next > endDate) {
      next = startDate;
    }
    const nextDateStr = util.toISOStringSeconds(next);
    if (
      !preloadObject[nextDateStr]
      && !inQueueObject[nextDateStr]
      && !isAnimating
    ) {
      clearCache();
      checkQueue();
    }
  };

  /**
   * removes item from cache after it has
   * been played and quelimit reached
   */
  const shiftCache = () => {
    if (
      preloadObject[preloadedArray[0]]
      && util.objectLength(preloadObject) > queueLength
      && pastDates[preloadedArray[0]]
      && !isInToPlayGroup(preloadedArray[0])
      && !canPreloadAll
    ) {
      const key = preloadedArray.shift();
      delete preloadObject[key];
      delete pastDates[key];
    }
  };

  const getNextBufferDate = () => {
    const [strDate] = preloadedArray.slice(-1);
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
      && !preloadObject[nextDateStr]
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
      if (!preloadObject[nextDateStr]) {
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
  // togglePlaying: PropTypes.func.isRequired,
  delta: PropTypes.number,
  hasCustomPalettes: PropTypes.bool,
  interval: PropTypes.string,
  onClose: PropTypes.func,
};

export default PlayAnimation;
