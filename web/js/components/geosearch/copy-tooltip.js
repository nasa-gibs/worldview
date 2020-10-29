/* eslint-disable react/destructuring-assignment */
import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import {
  Tooltip,
} from 'reactstrap';

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
    const { tooltipToggleTime } = this.props;
    const toolTipChange = tooltipToggleTime !== prevProps.tooltipToggleTime;
    if (toolTipChange) {
      this.updateToolTipState(toolTipChange);
    }
  }

  componentWillUnmount() {
    // clear pending timeouts
    clearTimeout(this.showCopiedToolTipTimeout);
  }

  updateToolTipState = (toolTipChange) => {
    this.setState({
      showCopiedToolTip: toolTipChange,
    });
  }

  render() {
    const { showCopiedToolTip } = this.state;
    if (showCopiedToolTip) {
      clearTimeout(this.showCopiedToolTipTimeout);
      this.showCopiedToolTipTimeout = setTimeout(() => {
        this.setState({ showCopiedToolTip: false });
      }, 2000);
    }
    return (
      <>
        <Tooltip
          placement="bottom"
          isOpen={showCopiedToolTip}
          hideArrow
          target="copy-coordinates-to-clipboard-button"
        >
          Copied to clipboard!
        </Tooltip>
      </>
    );
  }
}

CopyClipboardTooltip.propTypes = {
  tooltipToggleTime: PropTypes.number,
};

export default CopyClipboardTooltip;
