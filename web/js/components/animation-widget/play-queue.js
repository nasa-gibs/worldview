import React from 'react';
import PropTypes from 'prop-types';
import { Modal, ModalBody, ModalHeader } from 'reactstrap';
import { isEmpty as lodashIsEmpty } from 'lodash';
import Spinner from 'react-loader';
import util from '../../util/util';
import Queue from 'promise-queue';
import { getLayersActiveAtDate } from '../../modules/date/util';

/*
 * Preload and play animation
 *
 * @class PlayAnimation
 * @extends React.Component
 */
class PlayAnimation extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      isPlaying: false
    };
    this.queue = new Queue(5, Infinity);
    this.preloadObject = {};
    this.inQueueObject = {};
    this.preloadedArray = [];
    this.pastDates = {};
    this.interval = 0;
    this.currentPlayingDate = this.getStartDate();
    this.checkQueue();
    this.checkShouldPlay();
  }

  componentDidMount() {
    this.mounted = true;
  }

  componentWillUnmount() {
    this.mounted = false;
    this.queue.queue = [];
    if (this.interval) {
      clearInterval(this.interval);
    }
  }

  /**
   * Determines whether to start at
   * current date or to start at the
   * selected start date
   *
   * @returns {string} ISO string Date
   */
  getStartDate() {
    const { endDate, startDate, currentDate } = this.props;
    const nextDate = this.nextDate(currentDate);
    if (currentDate > startDate && nextDate < endDate) {
      return util.toISOStringSeconds(nextDate);
    }
    return util.toISOStringSeconds(startDate);
  }

  /**
   * Gets the last date that should be added
   * to the queuer
   *
   * @param currentDate {object} JS date
   * @param startDate {object} JS date
   * @param endDate {object} JS date
   *
   * @returns {string} Date string
   */
  getLastBufferDateStr = function(currentDate, startDate, endDate) {
    const { queueLength, loop } = this.props;
    let day = currentDate;
    let i = 1;

    while (i < queueLength) {
      if (this.nextDate(day) > endDate) {
        if (!loop) {
          return util.toISOStringSeconds(day);
        }
        day = startDate;
      } else {
        day = this.nextDate(day);
      }
      i++;
    }
    return util.toISOStringSeconds(day);
  };

  /**
   * adds dates to precache queuer
   *
   * @param currentDate {object} JS date
   * @param startDate {object} JS date
   * @param endDate {object} JS date
   * @param lastToQueue {string} date String
   */
  initialPreload(currentDate, startDate, endDate, lastToQueue) {
    const { queueLength, selectDate, togglePlaying } = this.props;
    var day = currentDate;
    if (queueLength <= 1) {
      // if only one frame will play just move to that date
      selectDate(startDate);
      togglePlaying();
      return;
    }
    for (var i = 0; i < queueLength; i++) {
      this.addDate(day);
      day = this.getNextBufferDate(day, startDate, endDate);
      if (util.toISOStringSeconds(day) === lastToQueue) {
        this.addDate(day);
      }
    }
  }

  /**
   * Determine if we should play
   *
   * @param isLoopStart {Boolean}
   */
  checkShouldPlay = function(isLoopStart) {
    const { startDate, endDate, hasCustomPalettes } = this.props;
    const currentDate = util.parseDateUTC(this.currentPlayingDate);
    const lastToQueue = this.getLastBufferDateStr(currentDate, startDate, endDate);

    if (this.state.isPlaying && !isLoopStart) {
      return false;
    }
    if (this.preloadObject[lastToQueue]) {
      return this.play(this.currentPlayingDate);
    }
    if (
      hasCustomPalettes &&
      this.preloadObject[this.currentPlayingDate] &&
      lodashIsEmpty(this.inQueueObject)
    ) {
      return this.play(this.currentPlayingDate);
    }
    this.shiftCache();
  };

  /**
   * Check if we should loop
   */
  checkShouldLoop() {
    const { loop, startDate, togglePlaying } = this.props;
    if (loop) {
      this.shiftCache();
      this.currentPlayingDate = util.toISOStringSeconds(startDate);
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
   *
   */
  checkQueue() {
    const {
      startDate,
      endDate,
      hasCustomPalettes,
      canPreloadAll,
      queueLength,
      maxQueueLength
    } = this.props;
    var currentDate = util.parseDateUTC(this.currentPlayingDate);
    var lastToQueue = this.getLastBufferDateStr(currentDate, startDate, endDate);
    var nextDate = this.nextDate(currentDate);

    if (
      !this.preloadedArray[0] &&
      !this.inQueueObject[this.currentPlayingDate]
    ) {
      this.initialPreload(currentDate, startDate, endDate, lastToQueue);
    } else if (
      // TODO Can't lookup this array entry with date string as key. Is this causing bugs?
      !this.preloadedArray[lastToQueue] &&
      !this.inQueueObject[lastToQueue] &&
      !hasCustomPalettes &&
      !canPreloadAll
    ) {
      // if last preload date doesn't exist
      this.addItemToQueue(currentDate, startDate, endDate);
    } else if (
      hasCustomPalettes &&
      this.preloadedArray[0] &&
      !this.inQueueObject[nextDate] &&
      queueLength > maxQueueLength
    ) {
      this.customQueuer(currentDate, startDate, endDate);
    }
  }

  /**
   * Clears precache
   */
  clearCache() {
    this.preloadObject = {};
    this.preloadedArray = [];
    this.inQueueObject = {};
  }

  /**
   * Gets next date based on current
   * increments
   * @param date {object} JS date obj
   *
   * @returns {object} JS Date
   */
  nextDate(date) {
    const { interval, delta } = this.props;
    return util.dateAdd(date, interval, delta);
  }

  /*
   * Custom date queuer created for
   * custom colormaps
   *
   * @param currentDate {object} JS date
   * @param startDate {object} JS date
   * @param endDate {object} JS date
   */
  customQueuer(currentDate, startDate, endDate) {
    var nextDateStr;
    var nextDate = this.nextDate(currentDate);
    if (nextDate > endDate) {
      nextDate = startDate;
    }
    nextDateStr = util.toISOStringSeconds(nextDate);
    if (
      !this.preloadObject[nextDateStr] &&
      !this.inQueueObject[nextDateStr] &&
      !this.state.isPlaying
    ) {
      this.clearCache();
      this.checkQueue();
    }
  }

  /*
   * Add date to loading Queue obj
   *
   * @param date {object} JS date obj
   */
  addToInQueue(date) {
    var strDate = util.toISOStringSeconds(date);
    this.inQueueObject[strDate] = date;
    this.preloadedArray.push(strDate);
  }

  /**
   * removes item from cache after it has
   * been played and quelimit reached
   */
  shiftCache() {
    const { queueLength, canPreloadAll } = this.props;
    if (
      this.preloadObject[this.preloadedArray[0]] &&
      util.objectLength(this.preloadObject) > queueLength &&
      this.pastDates[this.preloadedArray[0]] &&
      !this.isInToPlayGroup(this.preloadedArray[0]) &&
      !canPreloadAll
    ) {
      const key = this.preloadedArray.shift();
      delete this.preloadObject[key];
      delete this.pastDates[key];
    }
  }

  /**
   * @param currentDate {object} JS date
   * @param startDate {object} JS date
   * @param endDate {object} JS date
   */
  getNextBufferDate(currentDate, startDate, endDate) {
    const strDate = this.preloadedArray[this.preloadedArray.length - 1];
    var lastInBuffer = util.parseDateUTC(strDate);
    var nextDate = this.nextDate(lastInBuffer);
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
  addItemToQueue(currentDate, startDate, endDate) {
    var nextDate = this.getNextBufferDate(currentDate, startDate, endDate);
    var nextDateStr = util.toISOStringSeconds(nextDate);

    if (
      !this.inQueueObject[nextDateStr] &&
      !this.preloadObject[nextDateStr] &&
      nextDate <= endDate &&
      nextDate >= startDate
    ) {
      this.addDate(nextDate);
      this.checkQueue();
    }
  }

  /**
   * checks if this date is in array of dates that need
   * to play in future within buffer length
   *
   * @param testDate {string} JS date string
   */
  isInToPlayGroup(testDate) {
    const { startDate, endDate, loop, queueLength } = this.props;
    var i = 0;
    var day = util.parseDateUTC(this.currentPlayingDate);
    var jsTestDate = util.parseDateUTC(testDate);
    while (i < queueLength) {
      if (this.nextDate(day) > endDate) {
        if (!loop) {
          return false;
        }
        day = startDate;
      } else {
        day = this.nextDate(day);
      }
      if (day.valueOf() === jsTestDate.valueOf()) {
        return true;
      }
      i++;
    }
    return false;
  }

  /**
   * Gets next date based on current increments
   * @param date {object} JS date obj
   *
   * @returns {object} JS Date
   */
  addDate(date) {
    const { layers, promiseImageryForTime } = this.props;
    const activeLayers = getLayersActiveAtDate(layers, date);
    const strDate = util.toISOStringSeconds(date);

    if (this.inQueueObject[strDate] || this.preloadObject[strDate]) {
      return;
    }

    this.addToInQueue(date);
    this.queue
      .add(() => promiseImageryForTime(date, activeLayers))
      .then(date => {
        if (this.mounted) {
          this.preloadObject[strDate] = date;
          delete this.inQueueObject[strDate];
          this.shiftCache();
          this.checkQueue();
          this.checkShouldPlay();
        }
      });
  }

  /**
   * removes loader and starts the animation
   *
   * @param index {string} date string
   */
  play(dateStr) {
    const { togglePlaying } = this.props;
    if (!this.state.isPlaying) this.setState({ isPlaying: true });

    this.animate(dateStr);
    if (document.hidden) {
      togglePlaying();
    }
  }

  stopPlaying() {
    clearInterval(this.interval);
    this.setState({ isPlaying: false });
  }

  /**
   * loops through frame at a specified time interval
   *
   * @param index {string} Date string
   */
  animate(index) {
    const { selectDate, endDate, speed, isPlaying } = this.props;
    let currentDateStr = index;
    let nextDateStr, nextDateParsed;

    const player = () => {
      if (!this.mounted) {
        return clearInterval(this.interval);
      }
      const currentDateParsed = util.parseDateUTC(currentDateStr);
      nextDateParsed = this.nextDate(currentDateParsed);
      nextDateStr = util.toISOStringSeconds(nextDateParsed);

      this.shiftCache();
      this.checkQueue();
      if (isPlaying) {
        selectDate(currentDateParsed);
      }
      this.pastDates[currentDateStr] = currentDateParsed;
      this.currentPlayingDate = currentDateStr;

      // Advance to next
      currentDateStr = nextDateStr;

      // End of animation range
      if (nextDateParsed > endDate) {
        clearInterval(this.interval);
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
      this.interval = setTimeout(player, 1000 / speed);
    };
    this.interval = setTimeout(player, speed);
  }

  renderSpinner() {
    const { onClose } = this.props;
    return (
      <Modal
        isOpen={true}
        toggle={onClose}
        size="sm"
        backdrop={false}
        wrapClassName={'clickable-behind-modal'}
      >
        <ModalHeader toggle={onClose}> Preloading imagery </ModalHeader>
        <ModalBody>
          <div style={{ minHeight: 50 }}>
            <Spinner color={'#fff'} loaded={false}>
              Loaded
            </Spinner>
          </div>
        </ModalBody>
      </Modal>
    );
  }

  render() {
    const { isPlaying } = this.state;
    return !isPlaying ? this.renderSpinner() : '';
  }
}

PlayAnimation.propTypes = {
  endDate: PropTypes.object.isRequired,
  isPlaying: PropTypes.bool.isRequired,
  layers: PropTypes.array.isRequired,
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
  loop: PropTypes.bool,
  maxQueueLength: PropTypes.number,
  onClose: PropTypes.func
};

export default PlayAnimation;
