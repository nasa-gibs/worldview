/* eslint-disable no-console */
import React from 'react';
import PropTypes from 'prop-types';
import PQueue from 'p-queue/dist';
import LoadingIndicator from './loading-indicator';
import util from '../../util/util';

const CONCURRENT_REQUESTS = 3;
const toString = (date) => util.toISOStringSeconds(date);
const toDate = (dateString) => util.parseDateUTC(dateString);

class PlayQueue extends React.Component {
  constructor(props) {
    super(props);
    const { numberOfFrames } = props;
    this.state = {
      isAnimating: false,
      loadedItems: 0,
    };
    this.fetchTimes = [0];
    this.queue = new PQueue({ concurrency: CONCURRENT_REQUESTS });
    this.inQueueObject = {};
    this.bufferObject = {};
    this.bufferArray = [];
    this.playInterval = 0;
    this.defaultBufferSize = numberOfFrames < 10 ? numberOfFrames : 10;
    this.minBufferLength = null;
    this.canPreloadAll = numberOfFrames <= this.defaultBufferSize;
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
    const currentBufferSize = util.objectLength(this.bufferObject);
    const queueLength = currentBufferSize || this.defaultBufferSize;

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
    const filteredTimes = this.fetchTimes.filter((time) => time >= 200);
    const averageFetchTime = filteredTimes.length
      && filteredTimes.reduce((a, b) => a + b) / filteredTimes.length;
    // If we don't have enough real times, use a reasonable default
    const averageTime = filteredTimes.length > 10 ? averageFetchTime : defaultTime;
    return averageTime;
  }

  calcBufferSize() {
    // NOTE: for some reason playback takes about 1.5 times as long as it is calculated to be
    // (likely due to setTimeout being unreliable) which means we often buffer a little more than needed
    let bufferSize = 0;
    const { numberOfFrames, speed } = this.props;
    const avgFetchTime = this.getAverageFetchTime();
    const remainingFrames = numberOfFrames - this.defaultBufferSize;
    const remainingPlayTime = (remainingFrames / speed) * 1000;
    const remainingLoadTime = (avgFetchTime * remainingFrames) / CONCURRENT_REQUESTS;
    const totalPlayTime = (numberOfFrames / speed) * 1000;
    const timeToBufferEnd = totalPlayTime - remainingPlayTime;
    const canFinishLoadWhilePlaying = timeToBufferEnd > remainingLoadTime;

    if (!canFinishLoadWhilePlaying && remainingLoadTime >= remainingPlayTime) {
      const preloadTime = remainingLoadTime - timeToBufferEnd;
      bufferSize = Math.ceil(preloadTime / 1000);
    }

    console.debug('fetch time: ', (avgFetchTime / 1000).toFixed(2));
    console.debug('Play time: ', (totalPlayTime / 1000).toFixed(2), (remainingPlayTime / 1000).toFixed(2));
    const totalLoadTime = ((avgFetchTime * numberOfFrames) / 1000 / CONCURRENT_REQUESTS).toFixed(2);
    console.debug('rLoad time: ', totalLoadTime, (remainingLoadTime / 1000).toFixed(2));
    console.debug('total frames:', numberOfFrames);

    const totalBuffer = bufferSize + this.defaultBufferSize;
    if (totalBuffer >= numberOfFrames) {
      this.minBufferLength = numberOfFrames;
    } else {
      this.minBufferLength = totalBuffer;
    }
  }

  isPreloadSufficient() {
    const { numberOfFrames } = this.props;
    const currentBufferSize = util.objectLength(this.bufferObject);
    if (this.canPreloadAll) {
      return currentBufferSize === numberOfFrames;
    }
    if (currentBufferSize < this.defaultBufferSize) {
      return false;
    }
    if (!this.minBufferLength) {
      this.calcBufferSize();
    }
    console.debug(`buffer: ${currentBufferSize} / ${this.minBufferLength}`);
    return currentBufferSize >= this.minBufferLength;
  }

  checkShouldPlay = function(loopStart) {
    const { startDate } = this.props;
    const { isAnimating } = this.state;
    const currentDate = toDate(this.playingDate);
    const restartLoop = loopStart && currentDate.getTime() === startDate.getTime();

    if (isAnimating && !loopStart) {
      return;
    }
    if (this.isPreloadSufficient() || restartLoop) {
      console.debug('Started: ', Date.now());
      return this.play();
    }
    this.checkQueue();
  };


  checkShouldLoop() {
    const { isLoopActive, startDate, togglePlaying } = this.props;
    // Could base this off animation speed?
    const loopDelay = 1000;

    if (isLoopActive) {
      this.playingDate = toString(startDate);
      setTimeout(() => {
        if (!this.mounted) return;
        this.checkShouldPlay(true);
        this.checkQueue();
      }, loopDelay);
    } else {
      togglePlaying();
      console.debug('Stopped: ', Date.now());
    }
  }

  /**
   * Either do inital preload or queue next item
   */
  checkQueue() {
    const currentDate = toDate(this.playingDate);
    const nextInQueue = this.minBufferLength
      ? this.getNextBufferDate()
      : this.getLastInQueue();

    if (!this.bufferArray[0] && !this.inQueueObject[this.playingDate]) {
      this.initialPreload(currentDate);
    } else if (
      !this.bufferObject[nextInQueue]
      && !this.inQueueObject[nextInQueue]
      && !this.canPreloadAll
    ) {
      this.addItemToQueue();
    }
  }

  clearCache = () => {
    this.bufferObject = {};
    this.bufferArray = [];
    this.inQueueObject = {};
  }

  nextDate(date) {
    const { interval, delta } = this.props;
    return util.dateAdd(date, interval, delta);
  }

  getNextBufferDate() {
    const { startDate, endDate } = this.props;
    const strDate = this.bufferArray[this.bufferArray.length - 1];
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
      this.addDate(nextDate);
    }
  }

  /**
   * Gets next date based on current increments
   */
  async addDate(date) {
    const { promiseImageryForTime } = this.props;
    let { loadedItems } = this.state;
    const strDate = toString(date);
    if (this.inQueueObject[strDate] || this.bufferObject[strDate]) {
      return;
    }
    this.inQueueObject[strDate] = date;
    this.bufferArray.push(strDate);

    await this.queue.add(async () => {
      const startTime = Date.now();
      await promiseImageryForTime(date);
      this.fetchTimes.push(Date.now() - startTime);
      this.setState({ loadedItems: loadedItems += 1 });
      return strDate;
    });

    if (!this.mounted) return;
    this.bufferObject[strDate] = strDate;
    delete this.inQueueObject[strDate];
    this.checkQueue();
    this.checkShouldPlay();
  }

  play() {
    const { togglePlaying } = this.props;
    const { isAnimating } = this.state;
    if (!isAnimating) {
      this.setState({ isAnimating: true });
    }
    this.animate();
    if (document.hidden) {
      togglePlaying();
    }
  }

  stopPlaying() {
    clearInterval(this.playInterval);
    this.setState({ isAnimating: false });
    console.debug('Stopped', Date.now());
  }

  /**
   * Loops through frames at a specified time interval
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

      this.checkQueue();
      if (isPlaying) {
        selectDate(currentDate);
      }
      this.playingDate = currentDateStr;

      // Advance to next
      currentDateStr = nextDateStr;

      // End of animation range
      if (nextDate > endDate) {
        clearInterval(this.playInterval);
        this.checkShouldLoop();
        return;
      }

      // Playback caught up with buffer :(
      if (!this.bufferObject[nextDateStr]) {
        this.stopPlaying();
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
    const { isAnimating } = this.state;
    const { onClose } = this.props;
    const loadedItems = util.objectLength(this.bufferObject);
    const title = !this.minBufferLength ? 'Determining buffer size...' : 'Preloading buffer...';

    return isAnimating
      ? ''
      : (
        <LoadingIndicator
          title={title}
          onClose={onClose}
          loadedItems={loadedItems}
          totalItems={this.minBufferLength || 100}
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
  interval: PropTypes.string,
  isLoopActive: PropTypes.bool,
  onClose: PropTypes.func,
  numberOfFrames: PropTypes.number,
  subDailyMode: PropTypes.bool,
};

export default PlayQueue;
