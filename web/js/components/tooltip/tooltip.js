import React from 'react';
import PropTypes from 'prop-types';

class Tooltip extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hovered: false,
    };
    this.mouseOver = this.mouseOver.bind(this);
    this.mouseOut = this.mouseOut.bind(this);
    this.onClick = this.onClick.bind(this);
  }

  mouseOver() {
    this.setState({
      hovered: true,
    });
  }

  mouseOut() {
    this.setState({
      hovered: false,
    });
  }

  onClick(str) {
    const { onClick } = this.props;
    onClick(str);
  }

  render() {
    const { text, dataArray } = this.props;
    const { hovered } = this.state;
    return (
      <div
        onMouseEnter={this.mouseOver}
        onMouseLeave={this.mouseOut}
        className="wv-tooltip-case"
      >
        <span>{text}</span>
        <div
          className="wv-tooltip"
          style={hovered ? { visibility: 'visible' } : {}}
        >
          <ul>
            {dataArray.map((dataEl, i) => (
              <li
                /* eslint react/no-array-index-key: 1 */
                key={`tooltip-${dataEl}-${i}`}
                id={dataEl}
                onClick={(dataEl) => this.onClick(dataEl)}
              >
                {dataEl}
              </li>
            ))}
          </ul>
        </div>
      </div>
    );
  }
}

Tooltip.propTypes = {
  dataArray: PropTypes.oneOfType([PropTypes.array, PropTypes.oneOf(['null'])]),
  text: PropTypes.string.isRequired,
  onClick: PropTypes.func,
};

export default Tooltip;
