import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import Draggable from 'react-draggable';

class Dragger extends PureComponent {
  constructor(props) {
    super(props);
    this.selectDragger = this.selectDragger.bind(this);
    this.handleDragDragger = this.handleDragDragger.bind(this);
    this.startShowDraggerTime = this.startShowDraggerTime.bind(this);
    this.stopShowDraggerTime = this.stopShowDraggerTime.bind(this);
  };

  // Select between A 'selected' or B 'selectedB'
  selectDragger = (e) => {
    this.props.selectDragger(this.props.draggerName, e);
  };

  // Handles deltaX changes on dragging
  handleDragDragger = (e, d) => {
    this.props.handleDragDragger(this.props.draggerName, e, d);
  };

  // Show dragger tooltip on start dragging
  startShowDraggerTime = () => {
    this.props.toggleShowDraggerTime(true);
  };

  // Hide dragger tooltip on stop dragging
  stopShowDraggerTime = () => {
    this.props.toggleShowDraggerTime(false);
  };

  render() {
    let { transformX,
      draggerPosition,
      draggerVisible,
      draggerName,
      compareModeActive,
      disabled
    } = this.props;
    return (
      <Draggable
        axis='x'
        onMouseDown={this.selectDragger}
        onDrag={this.handleDragDragger}
        position={{ x: draggerPosition - 12, y: -20 }}
        onStart={this.startShowDraggerTime}
        onStop={this.stopShowDraggerTime}
        disabled={disabled}
      >
        <g
          style={{
            cursor: 'pointer',
            display: draggerVisible ? 'block' : 'none'
          }}
          className='gridShell dragger'
          transform={`translate(${transformX}, 0)`}
        >
          <polygon
            fill={disabled ? '#7a7a7a' : '#ccc'}
            stroke='#333'
            strokeWidth='1px'
            points='60,20, 95,65, 25,65'>
          </polygon>
          {compareModeActive
            ? <text
              fontSize='30px'
              fontWeight='400'
              x='11'
              y='48'
              fill={disabled ? '#ccc' : '#000'}
              transform='translate(39, 10)'
              textRendering='optimizeLegibility'
              clipPath='url(#textDisplay)'>
              {draggerName === 'selected' ? 'A' : 'B'}
            </text>
            : <React.Fragment>
              <rect
                pointerEvents='none' fill='#515151'
                width='3' height='20' x='52' y='39'></rect>
              <rect pointerEvents='none' fill='#515151'
                width='3' height='20' x='58' y='39'></rect>
              <rect pointerEvents='none' fill='#515151'
                width='3' height='20' x='64' y='39'></rect>
            </React.Fragment>
          }
        </g>
      </Draggable>
    );
  }
}

Dragger.propTypes = {
  compareModeActive: PropTypes.bool,
  disabled: PropTypes.bool,
  draggerName: PropTypes.string,
  draggerPosition: PropTypes.number,
  draggerVisible: PropTypes.bool,
  handleDragDragger: PropTypes.func,
  selectDragger: PropTypes.func,
  toggleShowDraggerTime: PropTypes.func,
  transformX: PropTypes.number
};

export default Dragger;
