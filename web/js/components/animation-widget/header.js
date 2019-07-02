import React from 'react';
import PropTypes from 'prop-types';
import Tooltip from '../tooltip/tooltip';

/*
 * @class AnimationWidgetHeader
 * @extends React.Component
 */
class AnimationWidgetHeader extends React.Component {
  render() {
    return (
      <div className="wv-animation-widget-header">
        {'Animate Map in '}
        <Tooltip
          text={this.props.text}
          onClick={this.props.onClick}
          dataArray={this.props.toolTipTextArray}
        />
        {' Increments'}
      </div>
    );
  }
}

AnimationWidgetHeader.propTypes = {
  onClick: PropTypes.func,
  text: PropTypes.string,
  toolTipTextArray: PropTypes.array
};

export default AnimationWidgetHeader;
