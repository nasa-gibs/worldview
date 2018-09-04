import React from 'react';
import PropTypes from 'prop-types';
import Tooltip from '../tooltip/tooltip';

/*
 * A react component, Builds a rather specific
 * interactive widget
 *
 * @class AnimationWidget
 * @extends React.Component
 */
class animWidgetHeader extends React.Component {
  render() {
    return (
      <div className='wv-animation-widget-header'>
        {'Animate Map in '}
        <Tooltip text={this.props.text} onClick={this.props.onClick} dataArray={this.props.toolTipTextArray}/>
        {' Increments'}
      </div>
    );
  }
}

animWidgetHeader.propTypes = {
  text: PropTypes.string,
  onClick: PropTypes.func,
  toolTipTextArray: PropTypes.array
};

export default animWidgetHeader;
