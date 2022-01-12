import React from 'react';
import PropTypes from 'prop-types';
import { isEmpty as lodashIsEmpty } from 'lodash';
import PQueue from 'p-queue/dist';
import PreloadSpinner from './preload-spinner';
import util from '../../util/util';

const fetchTimes = [0];
const toString = (date) => util.toISOStringSeconds(date);
const toDate = (dateString) => util.parseDateUTC(dateString);

class PlayQueue extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      isPlaying: false,
    };
    this.queue = new PQueue({ concurrency: 3 });
    this.inQueueObject = {};
    this.bufferObject = {};
    this.preloadedArray = [];
    this.pastDates = {};
    this.playInterval = 0;
    this.defaultBufferSize = 15;
    this.minBufferLength = null;
    this.canPreloadAll = props.numberOfFrames <= this.defaultBufferSize;
  }

  componentDidMount() {
    this.mounted = true;
    this.queue.on('completed', (dateStr) => {
      console.debug(dateStr, Date.now(), this.queue.size);
    });
    this.playingDate = this.getStartDate();
    this.checkQueue();
    this.checkShouldPlay();
  }

  componentWillUnmount() {
    this.mounted = false;
    this.clearCache();
    this.queue.clear();
    if (this.playInterval) {
      clearInterval(this.playInterval);
    }
  }

  /**
   * Determines whether to start at current date or the selected start date
   */
  getStartDate() {
    const { endDate, startDate, currentDate } = this.props;
    const nextDate = this.nextDate(currentDate);
    if (currentDate > startDate && nextDate < endDate) {
      return toString(nextDate);
    }
    return toString(startDate);
  }

  /**
   * Gets the last date that should be added to the queue
   */
  getLastInQueue = function() {
    const { isLoopActive, startDate, endDate } = this.props;
    let currentDate = toDate(this.playingDate);
    const queueLength = this.minBufferLength || this.defaultBufferSize;

    let i = 1;
    while (i < queueLength) {
      if (this.nextDate(currentDate) > endDate) {
        if (!isLoopActive) {
          return toString(currentDate);
        }
        currentDate = startDate;
      } else {
        currentDate = this.nextDate(currentDate);
      }
      i += 1;
    }
    return toString(currentDate);
  };

  /**
   * Queue up initial dates to create a minimum buffer
   *
   * @param currentDate {object} JS date
   */
  initialPreload(date) {
    const {
      numberOfFrames, selectDate, togglePlaying, startDate,
    } = this.props;
    let currentDate = date;
    const lastInQueue = this.getLastInQueue();
    if (numberOfFrames <= 1) {
      // if only one frame will play just move to that date
      selectDate(startDate);
      togglePlaying();
      return;
    }
    for (let i = 0; i < this.defaultBufferSize; i += 1) {
      this.addDate(currentDate);
      currentDate = this.getNextBufferDate();
      if (toString(currentDate) === lastInQueue) {
        this.addDate(currentDate);
      }
    }
  }

  getAverageFetchTime = () => {
    const { subDailyMode } = this.props;
    const defaultTime = subDailyMode ? 1800 : 500;
    // Filter outliers (e.g. layers that have already been loaded)
    const filteredTimes = fetchTimes.filter((time) => time >= 200);
    const averageFetchTime = filteredTimes.length && filteredTimes.reduce((a, b) => a + b) / filteredTimes.length;
    // If we don't have enough real times, use a reasonably default
    const averageTime = filteredTimes.length > 10 ? averageFetchTime : defaultTime;
    return averageTime;
  }

  calcBufferSize() {
    let totalBufferSize = this.defaultBufferSize;
    const { numberOfFrames, speed } = this.props;
    const averageFetchTime = this.getAverageFetchTime();
    const remainingFrames = numberOfFrames - this.defaultBufferSize;
    const remainingPlayTime = (remainingFrames / speed) * 1000;
    const remainingLoadTime = averageFetchTime * remainingFrames;

    if (remainingLoadTime >= remainingPlayTime) {
      const preloadTime = remainingLoadTime - remainingPlayTime;
      totalBufferSize = Math.ceil(preloadTime / 1000);
    }

    console.debug('fetch time: ', (averageFetchTime / 1000).toFixed(2));
    console.debug('play time: ', (remainingPlayTime / 1000).toFixed(2));
    console.debug('load time: ', (remainingLoadTime / 1000).toFixed(2));
    console.debug('total size:', numberOfFrames);

    this.minBufferLength = remainingFrames <= totalBufferSize ? remainingFrames : totalBufferSize;
  }

  isPreloadSufficient() {
    const currentBufferSize = util.objectLength(this.bufferObject);
    if (this.canPreloadAll) {
      return true;
    }
    if (currentBufferSize < this.defaultBufferSize) {
      return false;
    }
    if (!this.minBufferLength) {
      this.calcBufferSize();
    }
    console.debug(`buffer progress: ${currentBufferSize} / ${this.minBufferLength}`);
    return currentBufferSize >= this.minBufferLength;
  }

  /**
   * Determine if we should play
   */
  checkShouldPlay = function(loopStart) {
    const {
      startDate, hasCustomPalettes,
    } = this.props;
    const { isPlaying } = this.state;
    const currentDate = toDate(this.playingDate);
    const restartLoop = loopStart && currentDate.getTime() === startDate.getTime();

    if (isPlaying && !loopStart) {
      return;
    }
    if (this.isPreloadSufficient() || restartLoop) {
      console.debug('Started: ', Date.now());
      return this.play();
    }
    if (hasCustomPalettes && this.bufferObject[this.playingDate] && lodashIsEmpty(this.inQueueObject)) {
      return this.play();
    }
    this.checkQueue();
    this.shiftCache();
  };

  /**
   * Check if we should loop
   */
  checkShouldLoop() {
    const { isLoopActive, startDate, togglePlaying } = this.props;
    if (isLoopActive) {
      this.shiftCache();
      this.playingDate = toString(startDate);
      setTimeout(() => {
        this.checkShouldPlay(true);
        this.checkQueue();
      }, 1000);
    } else {
      togglePlaying();
      console.debug('Stopped: ', Date.now());
    }
  }

  /**
   * Determines what dates should be queued
   */
  checkQueue() {
    const {
      startDate,
      endDate,
      hasCustomPalettes,
    } = this.props;
    const currentDate = toDate(this.playingDate);
    const lastInQueue = this.getLastInQueue();
    const nextDate = this.nextDate(currentDate);

    if (!this.preloadedArray[0] && !this.inQueueObject[this.playingDate]) {
      this.initialPreload(currentDate);
    } else if (
      // TODO Can't lookup this array entry with date string as key. Is this causing bugs?
      !this.bufferObject[lastInQueue]
      && !this.inQueueObject[lastInQueue]
      && !hasCustomPalettes
      && !this.canPreloadAll
    ) {
      // if last preload date doesn't exist
      this.addItemToQueue();
    } else if (
      hasCustomPalettes
      && this.preloadedArray[0]
      && !this.inQueueObject[nextDate]
      // && queueLength > maxQueueLength
    ) {
      this.customQueuer(currentDate, startDate, endDate);
    }
  }

  clearCache = () => {
    this.bufferObject = {};
    this.preloadedArray = [];
    this.inQueueObject = {};
  }

  nextDate(date) {
    const { interval, delta } = this.props;
    return util.dateAdd(date, interval, delta);
  }

  /*
   * Custom date queuer created for custom colormaps
   */
  customQueuer(currentDate, startDate, endDate) {
    const { isPlaying } = this.state;
    let nextDate = this.nextDate(currentDate);
    if (nextDate > endDate) {
      nextDate = startDate;
    }
    const nextDateStr = toString(nextDate);
    if (!this.bufferObject[nextDateStr] && !this.inQueueObject[nextDateStr] && !isPlaying) {
      this.clearCache();
      this.checkQueue();
    }
  }

  /**
   * Removes item from cache after it has been played and quelimit reached
   */
  shiftCache() {
    const hasPlayed = !this.isInToPlayGroup(this.preloadedArray[0])
      && this.pastDates[this.preloadedArray[0]]
      && this.bufferObject[this.preloadedArray[0]];
    const preloadExceedsQueue = util.objectLength(this.bufferObject) > this.minBufferLength;

    if (hasPlayed && preloadExceedsQueue && !this.canPreloadAll) {
      // TODO Why do we need to remove previously preloaded dates?
      const key = this.preloadedArray.shift();
      delete this.bufferObject[key];
      delete this.pastDates[key];
    }
  }

  getNextBufferDate() {
    const { startDate, endDate } = this.props;
    const strDate = this.preloadedArray[this.preloadedArray.length - 1];
    const lastInBuffer = toDate(strDate);
    const nextDate = this.nextDate(lastInBuffer);
    if (lastInBuffer >= endDate || nextDate > endDate) {
      return startDate;
    }
    return nextDate;
  }

  /**
   * Add next date to the queue
   */
  addItemToQueue() {
    const { startDate, endDate } = this.props;
    const nextDate = this.getNextBufferDate();
    const nextDateStr = toString(nextDate);
    const dateInRange = nextDate <= endDate && nextDate >= startDate;
    const shouldQueue = !this.inQueueObject[nextDateStr] && !this.bufferObject[nextDateStr];

    if (shouldQueue && dateInRange) {
      // console.debug('Queue:', nextDateStr, Date.now());
      this.addDate(nextDate);
      // this.checkQueue();
    }
  }

  /**
   * checks if this date is in array of dates that need to play in future within buffer length
   *
   * @param testDate {string} JS date string
   */
  isInToPlayGroup(testDate) {
    const {
      startDate, endDate, isLoopActive,
    } = this.props;
    let i = 0;
    let currentDate = toDate(this.playingDate);
    const jsTestDate = toDate(testDate);

    while (i < this.minBufferLength) {
      if (this.nextDate(currentDate) > endDate) {
        if (!isLoopActive) {
          return false;
        }
        currentDate = startDate;
      } else {
        currentDate = this.nextDate(currentDate);
      }
      if (currentDate.valueOf() === jsTestDate.valueOf()) {
        return true;
      }
      i += 1;
    }
    return false;
  }

  /**
   * Gets next date based on current increments
   */
  async addDate(date) {
    const { promiseImageryForTime } = this.props;
    const strDate = toString(date);
    if (this.inQueueObject[strDate] || this.bufferObject[strDate]) {
      return;
    }
    this.inQueueObject[strDate] = date;
    this.preloadedArray.push(strDate);

    await this.queue.add(async () => {
      const startTime = Date.now();
      await promiseImageryForTime(date);
      fetchTimes.push(Date.now() - startTime);
      return strDate;
    });

    if (!this.mounted) return;
    this.bufferObject[strDate] = strDate;
    delete this.inQueueObject[strDate];
    this.shiftCache();
    this.checkQueue();
    this.checkShouldPlay();
  }

  play() {
    const { togglePlaying } = this.props;
    const { isPlaying } = this.state;
    if (!isPlaying) this.setState({ isPlaying: true });
    this.animate();
    if (document.hidden) {
      togglePlaying();
    }
  }

  stopPlaying() {
    clearInterval(this.playInterval);
    this.setState({ isPlaying: false });
    console.debug('Stopped', Date.now());
  }

  /**
   * loops through frame at a specified time interval
   */
  animate() {
    const {
      selectDate, endDate, speed, isPlaying,
    } = this.props;
    let currentDateStr = this.playingDate;
    let nextDate;
    let nextDateStr;

    const player = () => {
      if (!this.mounted) {
        return clearInterval(this.playInterval);
      }
      const currentDate = toDate(currentDateStr);
      nextDate = this.nextDate(currentDate);
      nextDateStr = toString(nextDate);

      this.shiftCache();
      this.checkQueue();
      if (isPlaying) {
        selectDate(currentDate);
      }
      this.pastDates[currentDateStr] = currentDate;
      this.playingDate = currentDateStr;

      // Advance to next
      currentDateStr = nextDateStr;

      // End of animation range
      if (nextDate > endDate) {
        clearInterval(this.playInterval);
        this.checkShouldLoop();
        return;
      }

      // Reached the end of preload
      if (!this.bufferObject[nextDateStr]) {
        this.stopPlaying();
        this.shiftCache();
        this.checkQueue();
        return;
      }
      if (!isPlaying || !this.mounted) {
        this.stopPlaying();
      }
      this.checkQueue();
      this.playInterval = setTimeout(player, 1000 / speed);
    };
    this.playInterval = setTimeout(player, speed);
  }

  render() {
    const { isPlaying } = this.state;
    const { onClose } = this.props;

    return isPlaying
      ? ''
      : (
        <PreloadSpinner
          title="Loading ..."
          bodyMsg="Preloading imagery for smooth animation"
          onClose={onClose}
        />
      );
  }
}

PlayQueue.propTypes = {
  endDate: PropTypes.object.isRequired,
  isPlaying: PropTypes.bool.isRequired,
  promiseImageryForTime: PropTypes.func.isRequired,
  selectDate: PropTypes.func.isRequired,
  speed: PropTypes.number.isRequired,
  startDate: PropTypes.object.isRequired,
  togglePlaying: PropTypes.func.isRequired,
  currentDate: PropTypes.object,
  delta: PropTypes.number,
  hasCustomPalettes: PropTypes.bool,
  interval: PropTypes.string,
  isLoopActive: PropTypes.bool,
  onClose: PropTypes.func,
  numberOfFrames: PropTypes.number,
  subDailyMode: PropTypes.bool,
};

export default PlayQueue;
