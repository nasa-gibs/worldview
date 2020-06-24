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
      tooltipOpen: false,
      tooltipToggleTime: 0,
    };
  }

  componentDidMount() {
    const { showErrorTooltip } = this.props;
    if (showErrorTooltip) {
      this.setState({
        showErrorTooltip,
      });
    }
  }

  componentDidUpdate(prevProps) {
    const { showErrorTooltip, tooltipToggleTime } = this.props;
    const tooltipToggleTimeChange = tooltipToggleTime !== this.state.tooltipToggleTime;
    const showErrorTooltipChange = showErrorTooltip && !prevProps.showErrorTooltip;
    if (tooltipToggleTimeChange || showErrorTooltipChange) {
      this.updateToolTipState();
    }
  }

  componentWillUnmount() {
    // clear pending timeouts
    clearTimeout(this.toolTipOpenTimeout);
    clearTimeout(this.showErrorTimeout);
  }

  updateToolTipState = () => {
    const { showErrorTooltip, tooltipToggleTime } = this.props;
    // eslint-disable-next-line react/no-access-state-in-setstate
    const toolTipChange = tooltipToggleTime !== this.state.tooltipToggleTime;
    this.setState({
      showErrorTooltip,
      tooltipToggleTime,
      tooltipOpen: toolTipChange,
    });
  }

  render() {
    const { showErrorTooltip, tooltipOpen } = this.state;
    if (showErrorTooltip) {
      clearTimeout(this.showErrorTimeout);
      this.showErrorTimeout = setTimeout(() => {
        this.setState({ showErrorTooltip: false });
      }, 2000);
    }
    if (tooltipOpen) {
      clearTimeout(this.toolTipOpenTimeout);
      this.toolTipOpenTimeout = setTimeout(() => {
        this.setState({ tooltipOpen: false });
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
          isOpen={tooltipOpen}
          target="copy-to-clipboard-button"
        >
          Copied!
        </Tooltip>
      </>
    );
  }
}

ShareToolTips.propTypes = {
  showErrorTooltip: PropTypes.bool,
  tooltipToggleTime: PropTypes.number,
};

export default ShareToolTips;
