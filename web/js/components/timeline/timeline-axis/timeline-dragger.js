import React, { PureComponent } from 'react';
import Draggable from 'react-draggable';

class Dragger extends PureComponent {
  render() {
    let { transformX, draggerPosition, draggerName, handleDragDragger, toggleShowDraggerTime, selectDragger, compareModeActive, disabled } = this.props;
    let draggerLetter = draggerName === 'selected' ? 'A' : 'B';
    return (
      <Draggable
        axis='x'
        onMouseDown={selectDragger.bind(this, draggerName)}
        onDrag={handleDragDragger.bind(this, draggerName)}
        position={{ x: draggerPosition - 12, y: -20 }}
        onStart={() => toggleShowDraggerTime(true)}
        onStop={() => toggleShowDraggerTime(false)}
        disabled={disabled}
      >
        <g
          style={{ cursor: 'pointer', display: this.props.draggerVisible ? 'flex' : 'none' }}
          className='gridShell dragger' transform={`translate(${transformX}, 0)`}
        >
          <polygon fill={disabled ? '#7a7a7a' : '#ccc'} stroke='#333' strokeWidth='1px' points='60,20, 95,65, 25,65'></polygon>
          {compareModeActive
            ? <text
              fontSize='30px'
              fontWeight='400'
              x='0'
              y='65'
              fill={disabled ? '#ccc' : '#000'}
              transform='translate(39, 10)'
              textRendering='optimizeLegibility'
              clipPath='url(#textDisplay)'>
              {draggerLetter}
            </text>
            : <React.Fragment>
              <rect pointerEvents="none" fill='#515151' width='3' height='20' x='52' y='39'></rect>
              <rect pointerEvents="none" fill='#515151' width='3' height='20' x='58' y='39'></rect>
              <rect pointerEvents="none" fill='#515151' width='3' height='20' x='64' y='39'></rect>
            </React.Fragment>
          }
        </g>
      </Draggable>
    );
  }
}

export default Dragger;
