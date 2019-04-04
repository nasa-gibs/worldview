import React, { PureComponent } from 'react';
import Draggable from 'react-draggable';

class Dragger extends PureComponent {
  render() {
    let { transformX, draggerPosition, draggerName, handleDragDragger, toggleShowDraggerTime, selectDragger, compareModeActive, disabled } = this.props;
    return (
      <Draggable
        axis='x'
        onMouseDown={selectDragger.bind(this, draggerName)}
        onDrag={handleDragDragger.bind(this, draggerName)}
        position={{ x: draggerPosition, y: -25 }}
        onStart={() => toggleShowDraggerTime(true)}
        onStop={() => toggleShowDraggerTime(false)}
        disabled={disabled}
        // onStop={() => {
        // this.props.onStop(this.props.id, this.state.position);
        // }}
      >
        <g
          style={{ cursor: 'pointer', display: this.props.draggerVisible ? 'flex' : 'none' }}
          className='gridShell dragger' transform={`translate(${transformX}, 0)`}
        >
          <polygon fill='#ccc' stroke={this.props.draggerSelected ? 'yellow' : '#515151'} strokeWidth='2px' points='50,25, 90,90, 10,90'></polygon>
          {/* <polygon fill='#ccc' stroke='#515151' strokeWidth='2px' points='50,25, 90,90, 10,90'></polygon> */}
          {compareModeActive
            ? <text
              fontSize='30px'
              fontWeight='700'
              x='0'
              y='65'
              fill='#515151'
              transform='translate(39, 10)'
              textRendering='optimizeLegibility'
              clipPath='url(#textDisplay)'>
              {draggerName}
            </text>
            : <React.Fragment>
              <rect pointerEvents="none" fill='#515151' width='4' height='20' x='41' y='55'></rect>
              <rect pointerEvents="none" fill='#515151' width='4' height='20' x='48' y='55'></rect>
              <rect pointerEvents="none" fill='#515151' width='4' height='20' x='55' y='55'></rect>
            </React.Fragment>
          }
        </g>
      </Draggable>
    );
  }
}

export default Dragger;
