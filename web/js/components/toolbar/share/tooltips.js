/* eslint-disable react/destructuring-assignment */
import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import {
  Tooltip,
} from 'reactstrap';

/*
 * @class ShareToolTips
 * @extends React.PureComponent
 */
class ShareToolTips extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      showErrorTooltip: false,
      showCopiedToolTip: false,
    };
  }

  componentDidUpdate(prevProps) {
    const { activeTab, tooltipToggleTime, tooltipErrorTime } = this.props;
    const toolTipChange = tooltipToggleTime !== prevProps.tooltipToggleTime;
    const tooltipErrorChange = tooltipErrorTime !== prevProps.tooltipErrorTime;
    const activeTabChange = activeTab !== prevProps.activeTab;
    if (activeTabChange) {
      this.clearPendingTimeouts();
      this.updateToolTipState(false, false);
    } else if (toolTipChange || tooltipErrorChange) {
      this.updateToolTipState(toolTipChange, tooltipErrorChange);
    }
  }

  componentWillUnmount() {
    this.clearPendingTimeouts();
  }

  clearPendingTimeouts = () => {
    clearTimeout(this.showCopiedToolTipTimeout);
    clearTimeout(this.showErrorTimeout);
  };

  updateToolTipState = (toolTipChange, tooltipErrorChange) => {
    this.setState({
      showErrorTooltip: tooltipErrorChange,
      showCopiedToolTip: toolTipChange,
    });
  };

  render() {
    const { showErrorTooltip, showCopiedToolTip } = this.state;
    if (showErrorTooltip) {
      clearTimeout(this.showErrorTimeout);
      this.showErrorTimeout = setTimeout(() => {
        this.setState({ showErrorTooltip: false });
      }, 2000);
    }
    if (showCopiedToolTip) {
      clearTimeout(this.showCopiedToolTipTimeout);
      this.showCopiedToolTipTimeout = setTimeout(() => {
        this.setState({ showCopiedToolTip: false });
      }, 2000);
    }
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
}

ShareToolTips.propTypes = {
  activeTab: PropTypes.string,
  tooltipErrorTime: PropTypes.number,
  tooltipToggleTime: PropTypes.number,
};

export default ShareToolTips;
