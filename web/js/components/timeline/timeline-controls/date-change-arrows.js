import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import HoverTooltip from '../../util/hover-tooltip';
import {
  setArrowDown as setArrowDownAction,
  setArrowUp as setArrowUpAction,
  setPreload as setPreloadAction,
} from '../../../modules/date/actions';

const ANIMATION_DELAY = 300; // interval firing to trigger parent level arrow change
const CLICK_HOLD_DELAY = 300; // wait before click is considered a hold

let mouseHoldCheckTimer = null;
// left/right arrow intervals
const intervals = {
  left: 0,
  right: 0,
};

class DateChangeArrows extends PureComponent {
  constructor(props) {
    super(props);
    this.arrowDownMap = {
      left: props.leftArrowDown,
      right: props.rightArrowDown,
    };
    this.arrowUpMap = {
      left: props.leftArrowUp,
      right: props.rightArrowUp,
    };
  }

  componentDidUpdate (prevProps) {
    const { tilesPreloaded, arrowDown } = this.props;
    const finishedPreload = !prevProps.tilesPreloaded && tilesPreloaded;
    if (finishedPreload && arrowDown) {
      // set interval for holding arrow down
      intervals[arrowDown] = setInterval(this.arrowDownMap[arrowDown], ANIMATION_DELAY);
    }
  }

  componentWillUnmount() {
    clearInterval(intervals.left);
    clearInterval(intervals.right);
  }

  clickAndHold = (direction) => {
    const { setArrowDown } = this.props;
    setArrowDown(direction);
    mouseHoldCheckTimer = null;
  }

  arrowDown = (direction) => {
    this.arrowDownMap[direction]();
    mouseHoldCheckTimer = setTimeout(() => {
      this.clickAndHold(direction);
    }, CLICK_HOLD_DELAY);
  }

  arrowUp = (direction) => {
    const { setArrowUp } = this.props;
    if (mouseHoldCheckTimer) {
      clearTimeout(mouseHoldCheckTimer);
    }
    clearInterval(intervals[direction]);
    this.arrowUpMap[direction]();
    setArrowUp();
  }

  render() {
    const {
      handleSelectNowButton,
      isMobile,
      leftArrowDisabled,
      nowButtonDisabled,
      rightArrowDisabled,
    } = this.props;

    const leftArrowDown = () => this.arrowDown('left');
    const rightArrowDown = () => this.arrowDown('right');
    const leftArrowUp = () => this.arrowUp('left');
    const rightArrowUp = () => this.arrowUp('right');

    return (
      <div>
        {/* LEFT ARROW */}
        <div
          className={`button-action-group${leftArrowDisabled ? ' button-disabled' : ''}`}
          id="left-arrow-group"
          onMouseDown={leftArrowDown}
          onMouseUp={leftArrowUp}
          onMouseLeave={leftArrowUp}
          aria-disabled={leftArrowDisabled}
        >
          <HoverTooltip
            isMobile={isMobile}
            labelText="Decrement date"
            placement="top"
            target="left-arrow-group"
          />
          <svg width="24" height="30">
            <path
              d="M 10.240764,0 24,15 10.240764,30 0,30 13.759236,15 0,0 10.240764,0 z"
              className="arrow"
            />
          </svg>
        </div>

        {/* RIGHT ARROW */}
        <div
          className={`button-action-group${rightArrowDisabled ? ' button-disabled' : ''}`}
          id="right-arrow-group"
          onMouseDown={rightArrowDown}
          onMouseUp={rightArrowUp}
          onMouseLeave={rightArrowUp}
          aria-disabled={rightArrowDisabled}
        >
          <HoverTooltip
            isMobile={isMobile}
            labelText="Increment date"
            placement="top"
            target="right-arrow-group"
          />
          <svg width="24" height="30">
            <path
              d="M 10.240764,0 24,15 10.240764,30 0,30 13.759236,15 0,0 10.240764,0 z"
              className="arrow"
            />
          </svg>
        </div>

        {/* NOW BUTTON */}
        <div
          className={`button-action-group now-button-group${nowButtonDisabled ? ' button-disabled' : ''}`}
          id="now-button-group"
          onClick={handleSelectNowButton}
          aria-disabled={nowButtonDisabled}
        >
          <HoverTooltip
            isMobile={isMobile}
            labelText="Latest available date"
            placement="top"
            target="now-button-group"
          />
          <svg height="30" width="30" viewBox="0 0 40 28">
            <path
              d="M 10.240764,0 24,15 10.240764,30 0,30 13.759236,15 0,0 10.240764,0 z M 26,30 26,0 34,0 34,30 z"
              className="arrow"
            />
          </svg>
        </div>
      </div>
    );
  }
}

const mapStateToProps = (state) => {
  const { date } = state;
  return {
    tilesPreloaded: date.preloaded,
    arrowDown: date.arrowDown,
  };
};

const mapDispatchToProps = (dispatch) => ({
  setArrowDown: (isDownDirection) => {
    dispatch(setArrowDownAction(isDownDirection));
  },
  setArrowUp: () => {
    dispatch(setArrowUpAction());
  },
  setPreload: (bool) => {
    dispatch(setPreloadAction(bool));
  },
});

DateChangeArrows.propTypes = {
  handleSelectNowButton: PropTypes.func,
  arrowDown: PropTypes.string,
  leftArrowDisabled: PropTypes.bool,
  leftArrowDown: PropTypes.func,
  leftArrowUp: PropTypes.func,
  isMobile: PropTypes.bool,
  nowButtonDisabled: PropTypes.bool,
  rightArrowDisabled: PropTypes.bool,
  rightArrowDown: PropTypes.func,
  rightArrowUp: PropTypes.func,
  setArrowDown: PropTypes.func,
  setArrowUp: PropTypes.func,
  tilesPreloaded: PropTypes.bool,
};

export default connect(mapStateToProps, mapDispatchToProps)(DateChangeArrows);
