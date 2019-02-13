import React from 'react';
import PropTypes from 'prop-types';

class Tooltip extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hovered: false
    };
  }
  mouseOver() {
    this.setState({
      hovered: true
    });
  }
  mouseOut() {
    this.setState({
      hovered: false
    });
  }
  onClick(str) {
    this.props.onClick(str);
  }
  render() {
    return (
      <div
        onMouseEnter={this.mouseOver.bind(this)}
        onMouseLeave={this.mouseOut.bind(this)}
        className="wv-tooltip-case"
      >
        <span>{this.props.text}</span>
        <div
          className="wv-tooltip"
          style={this.state.hovered ? { visibility: 'visible' } : {}}
        >
          <ul>
            {this.props.dataArray.map((dataEl, i) => {
              return (
                <li
                  key={'tooltip-' + dataEl + '-' + i}
                  id={dataEl}
                  onClick={this.onClick.bind(this, dataEl)}
                >
                  {dataEl}
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    );
  }
}

Tooltip.propTypes = {
  onClick: PropTypes.func,
  text: PropTypes.string.isRequired,
  dataArray: PropTypes.array.isRequired
};

export default Tooltip;
