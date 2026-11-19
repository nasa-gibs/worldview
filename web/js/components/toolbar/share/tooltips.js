import { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import {
  Tooltip,
} from 'reactstrap';
import usePrevious from '../../../util/customHooks';

function ShareToolTips(props) {
  const {
    tooltipToggleTime,
    tooltipErrorTime,
    activeTab,
  } = props;

  const [showErrorTooltip, setShowErrorTooltip] = useState(false);
  const [showCopiedToolTip, setShowCopiedToolTip] = useState(false);

  const prevTooltipToggleTime = usePrevious(tooltipToggleTime);
  const prevTooltipErrorTime = usePrevious(tooltipErrorTime);
  const prevActiveTab = usePrevious(activeTab);

  const showErrorTimeout = useRef();
  const showCopiedToolTipTimeout = useRef();

  function clearPendingTimeouts() {
    clearTimeout(showCopiedToolTipTimeout.current);
    clearTimeout(showErrorTimeout.current);
  };

  function updateToolTipState(toolTipChange, tooltipErrorChange) {
    setShowErrorTooltip(tooltipErrorChange);
    setShowCopiedToolTip(toolTipChange);
  };

  useEffect(() => {
    const toolTipChange = tooltipToggleTime !== prevTooltipToggleTime;
    const tooltipErrorChange = tooltipErrorTime !== prevTooltipErrorTime;
    const activeTabChange = activeTab !== prevActiveTab;
    if (activeTabChange) {
      clearPendingTimeouts();
      updateToolTipState(false, false);
    } else if (toolTipChange || tooltipErrorChange) {
      updateToolTipState(toolTipChange, tooltipErrorChange);
    }
  }, [tooltipToggleTime, tooltipErrorTime, activeTab]);

  useEffect(() => {
    return () => {
      clearPendingTimeouts();
    };
  }, []);

  useEffect(() => {
    if (showErrorTooltip) {
      clearTimeout(showErrorTimeout.current);
      showErrorTimeout.current = setTimeout(() => {
        setShowErrorTooltip(false);
      }, 2000);
    }
  }, [showErrorTooltip, tooltipErrorTime]);

  useEffect(() => {
    if (showCopiedToolTip) {
      clearTimeout(showCopiedToolTipTimeout.current);
      showCopiedToolTipTimeout.current = setTimeout(() => {
        setShowCopiedToolTip(false);
      }, 2000);
    }
  }, [showCopiedToolTip, tooltipToggleTime]);

  return (
    <>
      <Tooltip
        id="center-align-tooltip"
        placement="right"
        isOpen={showErrorTooltip}
        target=".share-body"
        fade={false}
      >
        Link cannot be shortened at this time.
      </Tooltip>
      <Tooltip
        id="center-align-tooltip"
        placement="right"
        isOpen={showCopiedToolTip}
        target=".share-body"
        fade={false}
      >
        Copied!
      </Tooltip>
    </>
  );
}

ShareToolTips.propTypes = {
  activeTab: PropTypes.string,
  tooltipErrorTime: PropTypes.number,
  tooltipToggleTime: PropTypes.number,
};

export default ShareToolTips;
