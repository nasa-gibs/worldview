/* eslint-disable react/destructuring-assignment */
import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import { Tooltip } from 'reactstrap';

/*
 * @class CopyClipboardTooltip
 * @extends React.PureComponent
 */
class CopyClipboardTooltip extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      showCopiedToolTip: false,
    };
  }

  componentDidUpdate(prevProps) {
    const { clearCopyToClipboardTooltip, tooltipToggleTime } = this.props;
    const toolTipChange = tooltipToggleTime !== prevProps.tooltipToggleTime;
    if (toolTipChange) {
      this.updateToolTipState();
      clearTimeout(this.showCopiedToolTipTimeout);
      this.showCopiedToolTipTimeout = setTimeout(() => {
        clearCopyToClipboardTooltip();
        this.setState({ showCopiedToolTip: false });
      }, 2000);
    }
  }

  componentWillUnmount() {
    // clear pending timeouts
    clearTimeout(this.showCopiedToolTipTimeout);
  }

  updateToolTipState = () => {
    this.setState({
      showCopiedToolTip: true,
    });
  };

  render() {
    const { showCopiedToolTip } = this.state;
    const { placement } = this.props;
    return (
      <Tooltip
        id="center-align-tooltip"
        placement={placement}
        isOpen={showCopiedToolTip}
        hideArrow
        target="copy-coordinates-to-clipboard-button"
      >
        Copied to clipboard!
      </Tooltip>
    );
  }
}

CopyClipboardTooltip.propTypes = {
  clearCopyToClipboardTooltip: PropTypes.func,
  tooltipToggleTime: PropTypes.number,
  placement: PropTypes.string,
};

export default CopyClipboardTooltip;
