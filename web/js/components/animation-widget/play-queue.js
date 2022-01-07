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
    this.queue = new PQueue({ concurrency: 2 });
    this.inQueueObject = {};
    this.preloadObject = {};
    this.preloadedArray = [];
    this.pastDates = {};
    this.playInterval = 0;
  }

  componentDidMount() {
    this.mounted = true;

    this.queue.on('completed', (dateStr) => {
      // console.log(dateStr);
    });

    this.queue.on('active', () => {
      // console.log('qSize', this.queue.size);
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
  getLastBufferDateStr = function() {
    const {
      queueLength, isLoopActive, startDate, endDate,
    } = this.props;
    let currentDate = toDate(this.playingDate);
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
   * adds dates to precache queuer
   *
   * @param currentDate {object} JS date
   * @param lastToQueue {string} date String
   */
  initialPreload(currentDate, lastToQueue) {
    const {
      queueLength, selectDate, togglePlaying, startDate,
    } = this.props;
    let day = currentDate;
    if (queueLength <= 1) {
      // if only one frame will play just move to that date
      selectDate(startDate);
      togglePlaying();
      return;
    }
    for (let i = 0; i < queueLength; i += 1) {
      this.addDate(day);
      day = this.getNextBufferDate();
      if (toString(day) === lastToQueue) {
        this.addDate(day);
      }
    }
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
    const lastToQueue = this.getLastBufferDateStr();
    const restartLoop = loopStart && currentDate.getTime() === startDate.getTime();

    if (isPlaying && !loopStart) {
      return false;
    }

    // TODO instead of checking lastToQueue check preload time?
    if (this.preloadObject[lastToQueue] || restartLoop) {
      return this.play(this.playingDate);
    }
    if (hasCustomPalettes && this.preloadObject[this.playingDate] && lodashIsEmpty(this.inQueueObject)) {
      return this.play(this.playingDate);
    }
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
      canPreloadAll,
      queueLength,
      maxQueueLength,
    } = this.props;
    const currentDate = toDate(this.playingDate);
    const lastToQueue = this.getLastBufferDateStr();
    const nextDate = this.nextDate(currentDate);

    if (!this.preloadedArray[0] && !this.inQueueObject[this.playingDate]) {
      this.initialPreload(currentDate, lastToQueue);
    } else if (
      // TODO Can't lookup this array entry with date string as key. Is this causing bugs?
      !this.preloadedArray[lastToQueue]
      && !this.inQueueObject[lastToQueue]
      && !hasCustomPalettes
      && !canPreloadAll
    ) {
      // if last preload date doesn't exist
      this.addItemToQueue(startDate, endDate);
    } else if (
      hasCustomPalettes
      && this.preloadedArray[0]
      && !this.inQueueObject[nextDate]
      && queueLength > maxQueueLength
    ) {
      this.customQueuer(currentDate, startDate, endDate);
    }
  }

  clearCache = () => {
    this.preloadObject = {};
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
    if (!this.preloadObject[nextDateStr] && !this.inQueueObject[nextDateStr] && !isPlaying) {
      this.clearCache();
      this.checkQueue();
    }
  }

  /**
   * Removes item from cache after it has been played and quelimit reached
   */
  shiftCache() {
    const { queueLength, canPreloadAll } = this.props;
    const hasPlayed = !this.isInToPlayGroup(this.preloadedArray[0])
      && this.pastDates[this.preloadedArray[0]]
      && this.preloadObject[this.preloadedArray[0]];
    const preloadExceedsQueue = util.objectLength(this.preloadObject) > queueLength;

    if (hasPlayed && preloadExceedsQueue && !canPreloadAll) {
      // TODO does this cause stuttering? Why do we need to remove previously preloaded dates?
      const key = this.preloadedArray.shift();
      delete this.preloadObject[key];
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
   * Verifies that date is valid and adds it to queuer
   *
   * @param startDate {object} JS date
   * @param endDate {object} JS date
   */
  addItemToQueue(startDate, endDate) {
    const { speed } = this.props;
    const nextDate = this.getNextBufferDate();
    const nextDateStr = toString(nextDate);
    const dateInRange = nextDate <= endDate && nextDate >= startDate;
    const shouldQueue = !this.inQueueObject[nextDateStr] && !this.preloadObject[nextDateStr];

    if (shouldQueue && dateInRange) {
      setTimeout(() => {
        this.addDate(nextDate);
        this.checkQueue();
      }, Math.floor(1000 / speed));
    }
  }

  /**
   * checks if this date is in array of dates that need to play in future within buffer length
   *
   * @param testDate {string} JS date string
   */
  isInToPlayGroup(testDate) {
    const {
      startDate, endDate, isLoopActive, queueLength,
    } = this.props;
    let i = 0;
    let currentDate = toDate(this.playingDate);
    const jsTestDate = toDate(testDate);

    while (i < queueLength) {
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
    if (this.inQueueObject[strDate] || this.preloadObject[strDate]) {
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
    this.preloadObject[strDate] = strDate;
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
        console.log(currentDateStr);
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
      if (!this.preloadObject[nextDateStr]) {
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
  queueLength: PropTypes.number.isRequired,
  selectDate: PropTypes.func.isRequired,
  speed: PropTypes.number.isRequired,
  startDate: PropTypes.object.isRequired,
  togglePlaying: PropTypes.func.isRequired,
  canPreloadAll: PropTypes.bool,
  currentDate: PropTypes.object,
  delta: PropTypes.number,
  hasCustomPalettes: PropTypes.bool,
  interval: PropTypes.string,
  isLoopActive: PropTypes.bool,
  maxQueueLength: PropTypes.number,
  onClose: PropTypes.func,
};

export default PlayQueue;
