import { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';

import PQueue, { TimeoutError } from 'p-queue';
import { Progress } from 'reactstrap';
import LoadingIndicator from './loading-indicator';
import util from '../../util/util';
import {
  getNextImageryDelta,
} from '../../modules/date/util';

// We assume anything this fast or faster is a frame that was pulled from the cache
const MIN_REQUEST_TIME_MS = 200;
const CONCURRENT_REQUESTS = 3;
const toString = (date) => util.toISOStringSeconds(date);
const toDate = (dateString) => util.parseDateUTC(dateString);

/**
 * Calculate the initial buffer size, using a larger buffer for higher speeds
 * @param {Number} numberOfFrames | Number of frames for the entire animation
 * @param {Number} speed | Frames Per Second selected for this animation
 *
 * @return {Number} | The lower of the default buffer size & the calculated buffer size.
 */
const getInitialBufferSize = (numberOfFrames, speed) => {
  const defaultSize = 10;
  const buffer = defaultSize + (speed * 1.5);
  return numberOfFrames < buffer ? numberOfFrames : buffer;
};

/**
 * A component that handles buffering datetimes for animation frames.  Only mounted while playback
 * is active, unmounts when playback stops.
 *
 * The buffering logic is as follows:
 * - n = 10 + speed (frames per sec)
 * - Make at least n requests (assuming there are >= n frames) to determine
 * the avg fetch time for a frame
 * - While making initial requests, if any return too quickly (e.g. they were cached), keep making
 * requests until at least n "real" requests can be made to determine average fetch time
 * - Based on how long it took to load the first n, calculate how many additional frames
 * need to be pre-loaded, based on avg fetch time and playback speed,
 * in order for playback to begin without having to stop to buffer.
 */
function PlayQueue(props) {
  const {
    numberOfFrames,
    speed,
    map,
    startDate,
    endDate,
    snappedCurrentDate,
    isLoopActive,
    selectDate,
    togglePlaying,
    interval,
    delta,
    autoSelected,
    layers,
    promiseImageryForTime,
    isPlaying,
    currentDate,
    onClose,
    isMobile,
    isKioskModeActive,
  } = props;
  const queue = new PQueue({
    concurrency: CONCURRENT_REQUESTS,
    timeout: 3000,
  });
  const initialBufferSize = getInitialBufferSize(numberOfFrames, speed);
  const fetchTimes = [];
  const minBufferLength = null;
  const canPreloadAll = numberOfFrames <= initialBufferSize;
  let inQueueObject = {};
  let bufferArray = [];
  let abortController = null;
  let isBetweenSteps = false;
  let hasPlayStarted = false;
  let playingDate;
  let mounted = false;
  let frameDates = [];

  const [isAnimating, setIsAnimating] = useState(false);
  const [loadedItems, setLoadedItems] = useState(0);
  const bufferObjectRef = useRef({});

  function nextDate(date) {
    if (autoSelected) {
      return util.dateAdd(date, 'minute', getNextImageryDelta(layers, date, 1));
    }
    return util.dateAdd(date, interval, delta);
  }

  function onPropertyChange() {
    if (isBetweenSteps) return;
    isBetweenSteps = true;
  }

  function onMoveEnd() {
    if (!isBetweenSteps) return;
    isBetweenSteps = false;
    checkShouldPlay();
  }

  function getNextBufferDate() {
    const strDate = bufferArray[bufferArray.length - 1];
    const lastInBuffer = toDate(strDate);
    const nextDateObj = nextDate(lastInBuffer);
    if (lastInBuffer >= endDate || nextDateObj > endDate) {
      return new Date(startDate.getTime());
    }
    return nextDateObj;
  }

  /**
   * Gets the last date that should be added to the queue
   */
  function getLastInQueue() {
    let currentDateObj = toDate(playingDate);
    const currentBufferSize = util.objectLength(bufferObjectRef.current);
    const queueLength = currentBufferSize || initialBufferSize;

    let i = 1;
    while (i < queueLength) {
      if (nextDate(currentDateObj) > endDate) {
        if (!isLoopActive) {
          return toString(currentDateObj);
        }
        currentDateObj = startDate;
      } else {
        currentDateObj = nextDate(currentDateObj);
      }
      i += 1;
    }
    return toString(currentDateObj);
  };

  /**
   * Gets next date based on current increments
   */
  async function addDate(date, initialLoad) {
    const strDate = toString(date);
    if (inQueueObject[strDate] || bufferObjectRef.current[strDate]) {
      return;
    }
    inQueueObject[strDate] = date;
    bufferArray.push(strDate);

    try {
      await queue.add(async () => {
        const startTime = Date.now();
        await promiseImageryForTime(date);
        const elapsedTime = Date.now() - startTime;
        const fetchTime = elapsedTime >= MIN_REQUEST_TIME_MS ? elapsedTime : MIN_REQUEST_TIME_MS;
        fetchTimes.push(fetchTime);
        setLoadedItems(util.objectLength(bufferObjectRef.current) + 1);

        if (!mounted) return true;
        bufferObjectRef.current[strDate] = strDate;
        delete inQueueObject[strDate];
        const currentBufferSize = util.objectLength(bufferObjectRef.current);

        if (!initialLoad || canPreloadAll || currentBufferSize >= initialBufferSize) {
          checkQueue();
          checkShouldPlay();
        }

        return strDate;
      });
    } catch (error) {
      if (error instanceof TimeoutError) {
        console.error('Imagery loading timed out after 3 seconds');
      }
    }
  }

  /**
  * Queue up initial dates to create a minimum buffer
  * @param {Date} animStartDate | 1-Day prior to the Animation Start Date
  * @return {void}
  */
  function initialPreload(animStartDate) {
    let currentDateObj = animStartDate;
    const lastInQueue = getLastInQueue();
    if (numberOfFrames <= 1) {
      // if only one frame will play just move to that date
      selectDate(startDate);
      togglePlaying();
      return;
    }
    for (let i = 0; i < initialBufferSize; i += 1) {
      addDate(currentDateObj, true);
      currentDateObj = getNextBufferDate();
      if (toString(currentDateObj) === lastInQueue) {
        addDate(currentDateObj, true);
      }
    }
  }

  /**
   * Add next date to the queue
   */
  function addItemToQueue() {
    const nextDateObj = getNextBufferDate();
    const nextDateStr = toString(nextDateObj);
    const dateInRange = nextDateObj <= endDate && nextDateObj >= startDate;
    const shouldQueue = !inQueueObject[nextDateStr] && !bufferObjectRef.current[nextDateStr];
    if (shouldQueue && dateInRange) {
      addDate(nextDateObj);
    }
  }

  /**
   * Either do inital preload or queue next item
   */
  function checkQueue() {
    if (!bufferArray[0] && !inQueueObject[playingDate]) {
      const currentDateObj = toDate(playingDate);
      initialPreload(currentDateObj);
      return;
    }
    const nextInQueue = toString(getNextBufferDate());
    if (
      !bufferObjectRef.current[nextInQueue] &&
      !inQueueObject[nextInQueue] &&
      !canPreloadAll
    ) {
      addItemToQueue();
    }
  }

  function isPreloadSufficient() {
    const currentBufferSize = util.objectLength(bufferObjectRef.current);
    if (currentBufferSize === numberOfFrames) {
      return true;
    }
    if (currentBufferSize < initialBufferSize) {
      return false;
    }
    if (fetchTimes.length < initialBufferSize) {
      checkQueue();
      return false;
    }
    return false;
  }

  function play() {
    if (!isAnimating) {
      setIsAnimating(true);
    }
    animate();
    if (document.hidden) {
      togglePlaying();
    }
  }

  /**
   * Determines whether to start at current date or the selected start date
   */
  function getStartDate() {
    const nextDateObj = nextDate(snappedCurrentDate);
    const nextDateAfterSnapped = nextDate(nextDateObj);
    if (snappedCurrentDate > startDate && nextDateObj < endDate && nextDateAfterSnapped < endDate) {
      return toString(nextDateObj);
    }
    return toString(startDate);
  }

  function checkShouldPlay(loopStart) {
    const currentDateObj = toDate(playingDate);
    const restartLoop = loopStart && currentDateObj.getTime() === startDate.getTime();

    if ((isAnimating || hasPlayStarted) && !loopStart) {
      return true;
    }
    if (isPreloadSufficient() || restartLoop) {
      if (isBetweenSteps) return true;
      // console.debug('Started: ', Date.now());
      hasPlayStarted = true;
      return play();
    }
    return checkQueue();
  };

  /**
   * Create a frameDates array of each date to be played to be used in getPlaybackPosition()
   */
  function determineFrameDates() {
    let frameDate = startDate;
    frameDates = [];
    frameDates.push(toString(frameDate));
    while (frameDate < endDate) {
      frameDate = nextDate(frameDate);
      frameDates.push(toString(frameDate));
    }
  }

  const clearCache = () => {
    bufferObjectRef.current = {};
    bufferArray = [];
    inQueueObject = {};
  };

  useEffect(() => {
    mounted = true;
    // queue.on('completed', (dateStr) => {
    //   console.debug(dateStr, queue.size, queue.pending);
    // });
    map.ui.selected.getView().on('propertychange', onPropertyChange);
    map.ui.selected.on('moveend', onMoveEnd);
    playingDate = getStartDate();
    checkQueue();
    checkShouldPlay();
    determineFrameDates();

    return () => {
      mounted = false;
      clearCache();
      queue.clear();
      map.ui.selected.getView().un('propertychange', onPropertyChange);
      map.ui.selected.un('moveend', onMoveEnd);
      if (abortController) {
        abortController.abort();
      }
    };
  }, []);

  function checkShouldLoop() {
    const loopDelay = speed === 0.5 ? 2000 : 1500;

    if (isLoopActive) {
      playingDate = toString(startDate);
      setTimeout(() => {
        if (!mounted) return;
        checkShouldPlay(true);
        checkQueue();
      }, loopDelay);
    } else {
      togglePlaying();
    }
  }

  function stopPlaying() {
    abortController.abort();
    setIsAnimating(false);
    hasPlayStarted = false;
  }

  function animationInterval(ms, callback) {
    const start = document.timeline.currentTime;
    const scheduleFrame = (time) => {
      const elapsedTime = time - start;
      const roundedElapsedTime = Math.round(elapsedTime / ms) * ms;
      const targetNext = start + roundedElapsedTime + ms;
      const delay = targetNext - performance.now();

      setTimeout(() => requestAnimationFrame(frame), delay);
    };
    const frame = (time) => {
      if (abortController.signal.aborted) return;
      callback(time);
      scheduleFrame(time);
    };
    scheduleFrame(start);
  }

  /**
   * Loops through frames at a specified time interval
   */
  function animate() {
    let currentDateStr = playingDate;
    let nextDateObj;
    let nextDateStr;
    abortController = new AbortController();

    const player = () => {
      if (!mounted) {
        return abortController.abort();
      }
      const currentDateObj = toDate(currentDateStr);
      nextDateObj = nextDate(currentDateObj);
      nextDateStr = toString(nextDateObj);

      checkQueue();
      if (isPlaying) {
        selectDate(currentDateObj);
      }
      playingDate = currentDateStr;

      // Advance to next
      currentDateStr = nextDateStr;

      // End of animation range
      if (nextDateObj > endDate) {
        abortController.abort();
        checkShouldLoop();
        return true;
      }

      // Playback caught up with buffer :(
      if (!bufferObjectRef.current[nextDateStr]) {
        stopPlaying();
        checkQueue();
        return true;
      }
      if (!isPlaying || !mounted) {
        stopPlaying();
      }
      return checkQueue();
    };
    const animIntervalMS = speed === 0.5 ? 2000 : 1000 / speed;
    animationInterval(animIntervalMS, player);
  }

  function getPlaybackPosition() {
    if (!isAnimating) {
      return 0;
    }
    const currentDateStr = toString(currentDate);
    const position = frameDates.indexOf(currentDateStr) + 1;
    const percentage = (position / frameDates.length) * 100;
    return percentage;
  }

  const title = !minBufferLength ? 'Determining buffer size...' : 'Preloading buffer...';
  const mobileProgressStyle = {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    height: '6px',
  };

  return (
    isAnimating
      ? isMobile && (
        <Progress
          style={mobileProgressStyle}
          value={getPlaybackPosition()}
          color="dark"
        />
      )
      : (
        <LoadingIndicator
          title={title}
          onClose={onClose}
          loadedItems={loadedItems}
          totalItems={minBufferLength || 100}
          isKioskModeActive={isKioskModeActive}
        />
      )
  );
}

PlayQueue.propTypes = {
  endDate: PropTypes.oneOfType([PropTypes.object, PropTypes.oneOf(['null'])]),
  isMobile: PropTypes.bool,
  isPlaying: PropTypes.bool.isRequired,
  promiseImageryForTime: PropTypes.func.isRequired,
  selectDate: PropTypes.func.isRequired,
  speed: PropTypes.number.isRequired,
  startDate: PropTypes.oneOfType([PropTypes.object, PropTypes.oneOf(['null'])]),
  togglePlaying: PropTypes.func.isRequired,
  currentDate: PropTypes.oneOfType([PropTypes.object, PropTypes.oneOf(['null'])]),
  delta: PropTypes.number,
  interval: PropTypes.string,
  isLoopActive: PropTypes.bool,
  onClose: PropTypes.func,
  numberOfFrames: PropTypes.number,
  snappedCurrentDate: PropTypes.oneOfType([PropTypes.object, PropTypes.oneOf(['null'])]),
  isKioskModeActive: PropTypes.bool,
  map: PropTypes.oneOfType([PropTypes.object, PropTypes.oneOf(['null'])]),
  autoSelected: PropTypes.bool,
  layers: PropTypes.oneOfType([PropTypes.array, PropTypes.oneOf(['null'])]),
};

export default PlayQueue;
