import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import HoverTooltip from '../../util/hover-tooltip';
import LoadingIndicator from '../../animation-widget/loading-indicator';
import {
  setArrowDown as setArrowDownAction,
  setArrowUp as setArrowUpAction,
} from '../../../modules/date/actions';

const ANIMATION_DELAY = 600; // interval for timestep
const CLICK_HOLD_DELAY = 200; // wait before click is considered a hold

let arrowDownCheckTimer = null;
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
  }

  componentDidUpdate (prevProps) {
    const { tilesPreloaded, arrowDown } = this.props;
    const notAnimating = !intervals.left && !intervals.right;

    if (tilesPreloaded && arrowDown && notAnimating) {
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
    arrowDownCheckTimer = null;
  };

  onArrowDown = (direction) => {
    this.arrowDownMap[direction]();
    arrowDownCheckTimer = setTimeout(() => {
      this.clickAndHold(direction);
    }, CLICK_HOLD_DELAY);
  };

  onArrowUp = (direction) => {
    const { setArrowUp, arrowDown } = this.props;
    if (arrowDownCheckTimer) {
      clearTimeout(arrowDownCheckTimer);
    }
    clearInterval(intervals[direction]);
    intervals[direction] = 0;
    if (arrowDown) setArrowUp();
  };

  render() {
    const {
      handleSelectNowButton,
      isMobile,
      leftArrowDisabled,
      nowButtonDisabled,
      rightArrowDisabled,
      arrowDown,
      tilesPreloaded,
      isKioskModeActive,
      isEmbedModeActive,
    } = this.props;

    const leftArrowDown = () => this.onArrowDown('left');
    const rightArrowDown = () => this.onArrowDown('right');
    const leftArrowUp = () => this.onArrowUp('left');
    const rightArrowUp = () => this.onArrowUp('right');

    return (
      <div>
        {arrowDown && !tilesPreloaded && (
          <LoadingIndicator
            title="Loading ..."
            bodyMsg="Keep holding to animate the map!"
          />
        )}

        {/* LEFT ARROW */}
        <div
          className={`button-action-group${leftArrowDisabled ? ' button-disabled' : ''} ${isKioskModeActive && !isEmbedModeActive ? 'd-none' : ''}`}
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
          className={`button-action-group${rightArrowDisabled ? ' button-disabled' : ''} ${isKioskModeActive && !isEmbedModeActive ? 'd-none' : ''}`}
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
          className={`button-action-group now-button-group${nowButtonDisabled ? ' button-disabled' : ''} ${isKioskModeActive ? 'd-none' : ''}`}
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
  const { date, embed, ui } = state;
  return {
    tilesPreloaded: date.preloaded,
    arrowDown: date.arrowDown,
    isKioskModeActive: ui.isKioskModeActive,
    isEmbedModeActive: embed.isEmbedModeActive,
  };
};

const mapDispatchToProps = (dispatch) => ({
  setArrowDown: (isDownDirection) => {
    dispatch(setArrowDownAction(isDownDirection));
  },
  setArrowUp: () => {
    dispatch(setArrowUpAction());
  },
});

DateChangeArrows.propTypes = {
  handleSelectNowButton: PropTypes.func,
  arrowDown: PropTypes.string,
  leftArrowDisabled: PropTypes.bool,
  leftArrowDown: PropTypes.func,
  isKioskModeActive: PropTypes.bool,
  isMobile: PropTypes.bool,
  nowButtonDisabled: PropTypes.bool,
  rightArrowDisabled: PropTypes.bool,
  rightArrowDown: PropTypes.func,
  setArrowDown: PropTypes.func,
  setArrowUp: PropTypes.func,
  tilesPreloaded: PropTypes.bool,
};

export default connect(mapStateToProps, mapDispatchToProps)(DateChangeArrows);
