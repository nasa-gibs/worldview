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
    const { tooltipToggleTime, tooltipErrorTime } = this.props;
    const prevTooltipToggleTime = prevProps.tooltipToggleTime;
    const prevTooltipErrorTime = prevProps.tooltipErrorTime;
    const toolTipChange = tooltipToggleTime !== prevTooltipToggleTime;
    const tooltipErrorChange = tooltipErrorTime !== prevTooltipErrorTime;
    if (toolTipChange || tooltipErrorChange) {
      this.updateToolTipState(toolTipChange, tooltipErrorChange);
    }
  }

  componentWillUnmount() {
    // clear pending timeouts
    clearTimeout(this.showCopiedToolTipTimeout);
    clearTimeout(this.showErrorTimeout);
  }

  updateToolTipState = (toolTipChange, tooltipErrorChange) => {
    this.setState({
      showErrorTooltip: tooltipErrorChange,
      showCopiedToolTip: toolTipChange,
    });
  }

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
          placement="left"
          isOpen={showErrorTooltip}
          target="permalink_content"
        >
          Link cannot be shortened at this time.
        </Tooltip>
        <Tooltip
          placement="right"
          isOpen={showCopiedToolTip}
          target="copy-to-clipboard-button"
        >
          Copied!
        </Tooltip>
      </>
    );
  }
}

ShareToolTips.propTypes = {
  tooltipErrorTime: PropTypes.number,
  tooltipToggleTime: PropTypes.number,
};

export default ShareToolTips;
