import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';

const tileRectTimeScaleOptions = {
  minute: function() {
    return {
      lineLengthY: (item) => {
        let timeScaleUnit = item.dateObject.minutes;
        let lineLengthY = timeScaleUnit === 0 ||
            timeScaleUnit === 15 ||
            timeScaleUnit === 30 ||
            timeScaleUnit === 45 ? 62 : timeScaleUnit % 5 === 0 ? 20 : 10;
        return lineLengthY;
      }
    };
  },
  hour: function() {
    return {
      lineLengthY: (item) => {
        let timeScaleUnit = item.dateObject.hours;
        let lineLengthY = timeScaleUnit === 0 ? 62
          : timeScaleUnit === 6 ||
            timeScaleUnit === 12 ||
            timeScaleUnit === 18 ? 22 : 10;
        return lineLengthY;
      }
    };
  },
  day: function() {
    return {
      lineLengthY: (item) => {
        let timeScaleUnit = item.dateObject.date;
        let dayOfWeek = item.dayOfWeek;
        let lineLengthY = timeScaleUnit === 1 ? 62 : dayOfWeek === 0 ? 22 : 10;
        return lineLengthY;
      }
    };
  },
  month: function() {
    return {
      lineLengthY: (item) => {
        let timeScaleUnit = item.dateObject.months;
        let lineLengthY = timeScaleUnit === 0 ? 62 : timeScaleUnit % 3 === 0 ? 22 : 10;
        return lineLengthY;
      }
    };
  },
  year: function() {
    return {
      lineLengthY: (item) => {
        let timeScaleUnit = item.dateObject.years;
        let lineLengthY = timeScaleUnit % 10 === 0 ? 62 : timeScaleUnit % 5 === 0 ? 22 : 10;
        return lineLengthY;
      }
    };
  }
};

class TileRect extends PureComponent {
  constructor(props) {
    super(props);
    this.showHover = this.showHover.bind(this);
  }

  showHover = (e) => {
    let { item, index } = this.props;
    this.props.showHover(e, item.rawDate, item.rawNextDate, index);
  }

  render() {
    let { item, gridWidth, index, timeScale } = this.props;
    let tileOptions = tileRectTimeScaleOptions[timeScale]();
    let lineLengthY = tileOptions.lineLengthY(item);
    let whiteLineStrokeWidth = lineLengthY !== 10 ? 2 : 1;
    return (
      <React.Fragment>
        <g onMouseMove={this.showHover}>
          <rect className="grid" width={gridWidth} height={100}
            transform={`translate(${index * gridWidth}, 0)`}
            fill={item.withinRange ? 'rgba(0,0,0,0)' : 'black'}
            shapeRendering="optimizeSpeed"
          />
          <line stroke="black" strokeLinecap="round"
            strokeWidth="0.2" x1="0" x2="0" y1="0" y2={lineLengthY}
            transform={`translate(${index * gridWidth + 2.2}, 0)`}
            shapeRendering="optimizeSpeed"
          />
          <line stroke="#555" strokeWidth={1} x1="0" x2={gridWidth}
            y1="46" y2="46"
            transform={`translate(${index * gridWidth + 1}, 0)`}
            shapeRendering="optimizeSpeed"
          />
          <line stroke="white" strokeLinecap="round"
            strokeWidth={whiteLineStrokeWidth} x1="0" x2="0" y1="0" y2={lineLengthY}
            transform={`translate(${index * gridWidth + 1}, 0)`}
            shapeRendering="optimizeSpeed"
          />
        </g>
      </React.Fragment>
    );
  }
}

TileRect.propTypes = {
  item: PropTypes.object,
  index: PropTypes.number,
  gridWidth: PropTypes.number,
  draggerPosition: PropTypes.func,
  timeScale: PropTypes.string
};

export default TileRect;
