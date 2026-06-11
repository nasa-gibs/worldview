import { useEffect, useRef, useCallback } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { ArrowChevronLeft, ArrowChevronRight } from '@edsc/earthdata-react-icons/horizon-design-system/hds/ui';
import HoverTooltip from '../../util/hover-tooltip';
import LoadingIndicator from '../../animation-widget/loading-indicator';
import {
  setArrowDown as setArrowDownAction,
  setArrowUp as setArrowUpAction,
} from '../../../modules/date/actions';

const ANIMATION_DELAY = 600; // interval for timestep
const CLICK_HOLD_DELAY = 200; // wait before click is considered a hold

function DateChangeArrows(props) {
  const {
    handleSelectNowButton,
    isMobile,
    leftArrowDisabled,
    leftArrowDown: leftArrowDownProp,
    nowButtonDisabled,
    rightArrowDisabled,
    rightArrowDown: rightArrowDownProp,
    arrowDown,
    tilesPreloaded,
    isKioskModeActive,
    isEmbedModeActive,
    setArrowDown,
    setArrowUp,
  } = props;

  const intervalsRef = useRef({ left: 0, right: 0 });
  const arrowDownCheckTimerRef = useRef(null);

  // Refs to always access the latest callbacks
  const leftArrowDownRef = useRef(leftArrowDownProp);
  leftArrowDownRef.current = leftArrowDownProp;
  const rightArrowDownRef = useRef(rightArrowDownProp);
  rightArrowDownRef.current = rightArrowDownProp;

  const arrowDownMap = useCallback((direction) => {
    if (direction === 'left') {
      leftArrowDownRef.current();
    } else {
      rightArrowDownRef.current();
    }
  }, []);

  // Start click-and-hold interval when tiles are preloaded and arrow is held
  useEffect(() => {
    const notAnimating = !intervalsRef.current.left && !intervalsRef.current.right;
    if (tilesPreloaded && arrowDown && notAnimating) {
      intervalsRef.current[arrowDown] = setInterval(
        () => arrowDownMap(arrowDown),
        ANIMATION_DELAY,
      );
    }
  }, [tilesPreloaded, arrowDown]);

  // Cleanup intervals on unmount
  useEffect(() => () => {
    clearInterval(intervalsRef.current.left);
    clearInterval(intervalsRef.current.right);
  }, []);

  const onArrowDown = (direction) => {
    arrowDownMap(direction);
    arrowDownCheckTimerRef.current = setTimeout(() => {
      setArrowDown(direction);
      arrowDownCheckTimerRef.current = null;
    }, CLICK_HOLD_DELAY);
  };

  const onArrowUp = (direction) => {
    if (arrowDownCheckTimerRef.current) {
      clearTimeout(arrowDownCheckTimerRef.current);
    }
    clearInterval(intervalsRef.current[direction]);
    intervalsRef.current[direction] = 0;
    if (arrowDown) setArrowUp();
  };

  const leftArrowMouseDown = () => onArrowDown('left');
  const rightArrowMouseDown = () => onArrowDown('right');
  const leftArrowMouseUp = () => onArrowUp('left');
  const rightArrowMouseUp = () => onArrowUp('right');

  return (
    <div className="arrow-group">
      {arrowDown && !tilesPreloaded && (
        <LoadingIndicator
          title="Loading ..."
          bodyMsg="Keep holding to animate the map!"
        />
      )}

      {/* LEFT ARROW */}
      <button
        type="button"
        className={`button-action-group${leftArrowDisabled ? ' button-disabled' : ''} ${isKioskModeActive && !isEmbedModeActive ? 'd-none' : ''}`}
        id="left-arrow-group"
        onMouseDown={leftArrowMouseDown}
        onMouseUp={leftArrowMouseUp}
        onMouseLeave={leftArrowMouseUp}
        aria-disabled={leftArrowDisabled}
        aria-label="Decrement date"
      >
        <HoverTooltip
          isMobile={isMobile}
          labelText="Decrement date"
          placement="top"
          target="left-arrow-group"
        />
        <ArrowChevronLeft className="arrow" size="30px" />
      </button>

      {/* RIGHT ARROW */}
      <button
        type="button"
        className={`button-action-group${rightArrowDisabled ? ' button-disabled' : ''} ${isKioskModeActive && !isEmbedModeActive ? 'd-none' : ''}`}
        id="right-arrow-group"
        onMouseDown={rightArrowMouseDown}
        onMouseUp={rightArrowMouseUp}
        onMouseLeave={rightArrowMouseUp}
        aria-disabled={rightArrowDisabled}
        aria-label="Increment date"
      >
        <HoverTooltip
          isMobile={isMobile}
          labelText="Increment date"
          placement="top"
          target="right-arrow-group"
        />
        <ArrowChevronRight className="arrow" size="30px" />
      </button>

      {/* NOW BUTTON */}
      <button
        type="button"
        className={`button-action-group now-button-group${nowButtonDisabled ? ' button-disabled' : ''} ${isKioskModeActive ? 'd-none' : ''}`}
        id="now-button-group"
        onClick={handleSelectNowButton}
        aria-disabled={nowButtonDisabled}
        aria-label="Latest available date"

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
      </button>
    </div>
  );
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
  isEmbedModeActive: PropTypes.bool,
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
