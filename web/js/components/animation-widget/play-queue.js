import React from 'react';
import PropTypes from 'prop-types';
import { Modal, ModalBody, ModalHeader } from 'reactstrap';
import Spinner from 'react-loader';
import util from '../../util/util';
import * as animUtil from '../../modules/animation/util';

/*
 * Preload and play animation
 *
 * @class PlayAnimation
 * @extends React.Component
 */
class PlayAnimation extends React.Component {
  /*
   * gets next date to add to
   * queue
   *
   * @method addItemToQueue
   * @static
   *
   * @param currentDate {object} JS date
   * @param startDate {object} JS date
   * @param endDate {object} JS date
   *
   * @returns {object} JS Date
   *
   */
  getNextBufferDate(currentDate, startDate, endDate) {
    const { preloadedArray } = this.state;
    var lastInBuffer = util.parseDateUTC(
      preloadedArray[preloadedArray.length - 1]
    );
    var nextDate = self.nextDate(lastInBuffer);
    if (lastInBuffer >= endDate || self.nextDate(lastInBuffer) > endDate) {
      return startDate;
    }
    return nextDate(lastInBuffer);
  }
  /*
   * Verifies that date is
   * valid and adds it to queuer
   *
   * @method addItemToQueue
   * @static
   *
   * @param startDate {object} JS date
   * @param endDate {object} JS date
   *
   * @returns {void}
   *
   */
  addItemToQueue(currentDate, startDate, endDate) {
    const { queueLength, playIndex, inQueue } = this.state;
    var nextDate = animUtil.getNextBufferDate(currentDate, startDate, endDate);
    var nextDateStr = util.toISOStringSeconds(nextDate);

    if (
      !inQueue[nextDateStr] &&
      !preload[nextDateStr] &&
      nextDate <= endDate &&
      nextDate >= startDate
    ) {
      self.addDate(nextDate);
      self.checkQueue(queueLength, playIndex);
    }
  }

  renderSpinner() {
    const { onClose } = this.props;
    return (
      <Modal isOpen={true} toggle={onClose}>
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
    const { isReadyToPlay } = this.state;
    return isReadyToPlay ? '' : this.renderSpinner();
  }
}

PlayAnimation.propTypes = {};

export default PlayAnimation;
