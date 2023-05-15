/* eslint-disable no-console */
import React from 'react';
import PropTypes from 'prop-types';
// eslint-disable-next-line import/no-unresolved
import PQueue from 'p-queue';
import { Progress } from 'reactstrap';
import LoadingIndicator from './loading-indicator';
import util from '../../util/util';

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
 * - Make at least n requests (assuming there are >= n frames) to determine the avg fetch time for a frame
 * - While making initial requests, if any return too quickly (e.g. they were cached), keep making
 *   requests until at least n "real" requests can be made to determine average fetch time
 * - Based on how long it took to load the first n, calculate how many additional frames
 *   need to be pre-loaded, based on avg fetch time and playback speed, in order for playback to begin
 *   without having to stop to buffer.
 *
 */
class PlayQueue extends React.Component {
  constructor(props) {
    super(props);
    const { numberOfFrames, speed } = props;
    this.state = {
      isAnimating: false,
      loadedItems: 0,
    };
    this.fetchTimes = [];
    this.queue = new PQueue({
      concurrency: CONCURRENT_REQUESTS,
      timeout: 3000,
    });
    this.inQueueObject = {};
    this.bufferObject = {};
    this.bufferArray = [];
    this.initialBufferSize = getInitialBufferSize(numberOfFrames, speed);
    this.minBufferLength = null;
    this.canPreloadAll = numberOfFrames <= this.initialBufferSize;
    this.abortController = null;
  }

  componentDidMount() {
    this.mounted = true;
    // this.queue.on('completed', (dateStr) => {
    //   console.debug(dateStr, this.queue.size, this.queue.pending);
    // });
    this.playingDate = this.getStartDate();
    this.checkQueue();
    this.checkShouldPlay();
    this.determineFrameDates();
  }

  componentWillUnmount() {
    this.mounted = false;
    this.clearCache();
    this.queue.clear();
    if (this.abortController) {
      this.abortController.abort();
    }
  }

  /**
   * Create a frameDates array of each date to be played to be used in getPlaybackPosition()
   */
  determineFrameDates() {
    const { startDate, endDate } = this.props;
    let frameDate = startDate;
    this.frameDates = [];
    this.frameDates.push(toString(frameDate));
    while (frameDate < endDate) {
      frameDate = this.nextDate(frameDate);
      this.frameDates.push(toString(frameDate));
    }
  }

  /**
   * Determines whether to start at current date or the selected start date
   */
  getStartDate() {
    const { startDate, endDate, snappedCurrentDate } = this.props;
    const nextDate = this.nextDate(snappedCurrentDate);
    const nextDateAfterSnapped = this.nextDate(nextDate);
    if (snappedCurrentDate > startDate && nextDate < endDate && nextDateAfterSnapped < endDate) {
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
    const queueLength = currentBufferSize || this.initialBufferSize;

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
  * @param {Date} animStartDate | 1-Day prior to the Animation Start Date
  * @return {void}
  */
  initialPreload(animStartDate) {
    const {
      numberOfFrames, selectDate, togglePlaying, startDate,
    } = this.props;
    let currentDate = animStartDate;
    const lastInQueue = this.getLastInQueue();
    if (numberOfFrames <= 1) {
      // if only one frame will play just move to that date
      selectDate(startDate);
      togglePlaying();
      return;
    }
    for (let i = 0; i < this.initialBufferSize; i += 1) {
      this.addDate(currentDate, true);
      currentDate = this.getNextBufferDate();
      if (toString(currentDate) === lastInQueue) {
        this.addDate(currentDate, true);
      }
    }
  }

  getAverageFetchTime = () => this.fetchTimes.reduce((a, b) => a + b) / this.fetchTimes.length;

  calcBufferSize() {
    const { numberOfFrames, speed } = this.props;
    let bufferSize = 0;
    const msPerSec = 1000;
    const avgFetchTime = this.getAverageFetchTime();
    const remainingFrames = numberOfFrames - this.initialBufferSize;
    const remainingLoadTime = avgFetchTime * remainingFrames;
    const remainingPlayTime = (remainingFrames / speed) * msPerSec;
    const totalPlayTime = (numberOfFrames / speed) * msPerSec;
    const timeToBufferEnd = totalPlayTime - remainingPlayTime;
    const framesLoadedDuringInitialBufferPlayback = timeToBufferEnd / avgFetchTime;
    const canKeepUp = framesLoadedDuringInitialBufferPlayback >= this.initialBufferSize;

    if (!canKeepUp && remainingLoadTime >= remainingPlayTime) {
      const preloadTime = remainingLoadTime - remainingPlayTime;
      bufferSize = Math.ceil(preloadTime / msPerSec);
    }

    // const totalLoadTime = ((avgFetchTime * numberOfFrames) / msPerSec / CONCURRENT_REQUESTS).toFixed(2);
    // console.debug('Total frames: ', numberOfFrames);
    // console.debug('Avg fetch time: ', (avgFetchTime / msPerSec).toFixed(2));
    // console.debug('Play time (t/r): ', (totalPlayTime / msPerSec).toFixed(2), (remainingPlayTime / msPerSec).toFixed(2));
    // console.debug('Load time (t/r): ', totalLoadTime, (remainingLoadTime / msPerSec).toFixed(2));

    const totalBuffer = bufferSize + this.initialBufferSize;
    if (totalBuffer >= numberOfFrames) {
      return numberOfFrames;
    }
    return totalBuffer;
  }

  isPreloadSufficient() {
    const { numberOfFrames } = this.props;
    const currentBufferSize = util.objectLength(this.bufferObject);
    if (currentBufferSize === numberOfFrames) {
      return true;
    }
    if (currentBufferSize < this.initialBufferSize) {
      return false;
    }
    if (this.fetchTimes.length < this.initialBufferSize) {
      this.checkQueue();
      return false;
    }
    if (!this.minBufferLength) {
      this.minBufferLength = this.calcBufferSize();
    }
    // console.debug(`Buffer: ${currentBufferSize} / ${this.minBufferLength}`);
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
      // console.debug('Started: ', Date.now());
      return this.play();
    }
    this.checkQueue();
  };

  checkShouldLoop() {
    const {
      isLoopActive, startDate, togglePlaying, speed,
    } = this.props;
    const loopDelay = speed === 0.5 ? 2000 : 1500;

    if (isLoopActive) {
      this.playingDate = toString(startDate);
      setTimeout(() => {
        if (!this.mounted) return;
        this.checkShouldPlay(true);
        this.checkQueue();
      }, loopDelay);
    } else {
      togglePlaying();
    }
  }

  /**
   * Either do inital preload or queue next item
   */
  checkQueue() {
    if (!this.bufferArray[0] && !this.inQueueObject[this.playingDate]) {
      const currentDate = toDate(this.playingDate);
      this.initialPreload(currentDate);
      return;
    }
    const nextInQueue = toString(this.getNextBufferDate());
    if (
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
  };

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
  async addDate(date, initialLoad) {
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
      const elapsedTime = Date.now() - startTime;
      const fetchTime = elapsedTime >= MIN_REQUEST_TIME_MS ? elapsedTime : MIN_REQUEST_TIME_MS;
      this.fetchTimes.push(fetchTime);
      this.setState({ loadedItems: loadedItems += 1 });
      return strDate;
    });

    if (!this.mounted) return;
    this.bufferObject[strDate] = strDate;
    delete this.inQueueObject[strDate];
    const currentBufferSize = util.objectLength(this.bufferObject);

    if (!initialLoad || this.canPreloadAll || currentBufferSize >= this.initialBufferSize) {
      this.checkQueue();
      this.checkShouldPlay();
    }
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
    this.abortController.abort();
    this.setState({ isAnimating: false });
    console.debug('Stopped', this.getAverageFetchTime(), this.fetchTimes);
  }

  animationInterval(ms, callback) {
    const start = document.timeline.currentTime;
    const frame = (time) => {
      if (this.abortController.signal.aborted) return;
      callback(time);
      scheduleFrame(time);
    };
    const scheduleFrame = (time) => {
      const elapsedTime = time - start;
      const roundedElapsedTime = Math.round(elapsedTime / ms) * ms;
      const targetNext = start + roundedElapsedTime + ms;
      const delay = targetNext - performance.now();
      setTimeout(() => requestAnimationFrame(frame), delay);
    };
    scheduleFrame(start);
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
    this.abortController = new AbortController();

    const player = () => {
      if (!this.mounted) {
        return this.abortController.abort();
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
        this.abortController.abort();
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
    };
    const animIntervalMS = speed === 0.5 ? 2000 : 1000 / speed;
    this.animationInterval(animIntervalMS, player);
  }

  getPlaybackPosition() {
    const { isAnimating } = this.state;
    const { currentDate } = this.props;
    if (!isAnimating) {
      return 0;
    }
    const currentDateStr = toString(currentDate);
    const position = this.frameDates.indexOf(currentDateStr) + 1;
    const percentage = (position / this.frameDates.length) * 100;
    return percentage;
  }

  render() {
    const { isAnimating } = this.state;
    const { onClose, isMobile } = this.props;
    const loadedItems = util.objectLength(this.bufferObject);
    const title = !this.minBufferLength ? 'Determining buffer size...' : 'Preloading buffer...';
    const mobileProgressStyle = {
      position: 'absolute',
      bottom: 0,
      width: '100%',
      height: '6px',
    };

    return isAnimating
      ? isMobile && (
        <Progress
          style={mobileProgressStyle}
          value={this.getPlaybackPosition()}
          color="dark"
        />
      )
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
  isMobile: PropTypes.bool,
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
  snappedCurrentDate: PropTypes.object,
};

export default PlayQueue;
