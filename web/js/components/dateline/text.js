import React from 'react';
import PropTypes from 'prop-types';
import OlOverlay from 'ol/Overlay';
import util from '../../util/util';
import { getCompareDates } from '../../modules/compare/selectors';

const textStyles = {
  textOpacity: 1,
  rectOpacity: 0.85,
  width: '300',
  color: 'white',
  textY: 14,
  fill: 'rgba(40,40,40,0.75)',
  textWidth: 94,
  textHeight: 20,
  recRadius: 3,
};

class LineText extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      overlay: '',
    };
    this.nodeRef = React.createRef();
  }

  componentDidMount() {
    const { x, map } = this.props;
    const overlay = new OlOverlay({
      element: this.nodeRef.current,
      stopEvent: false,
    });
    overlay.setPosition([x, 90]);
    map.addOverlay(overlay);
    this.setState({ overlay });
  }

  componentDidUpdate() {
    const { overlay } = this.state;
    const { x, textCoords } = this.props;
    overlay.setPosition([x, textCoords[1]]);
  }

  getDateText() {
    const { date, isCompareActive, isLeft } = this.props;
    if (isCompareActive) {
      return {
        dateLeft: isLeft
          ? '+ 1 day'
          : '',
        dateRight: isLeft
          ? ''
          : '- 1 day',
      };
    }
    const dateState = {
      selected: util.dateAdd(date, 'day', 1),
      selectedB: date,
    };
    const { dateA, dateB } = getCompareDates({ date: dateState });
    return {
      dateLeft: dateA,
      dateRight: dateB,
    };
  }

  render() {
    const { active, isCompareActive } = this.props;
    const {
      textWidth, recRadius, textY, width, textOpacity, textHeight, rectOpacity,
    } = textStyles;
    const { dateLeft, dateRight } = this.getDateText();
    const leftTextWidth = isCompareActive ? 60 : textWidth;
    const rightTextWidth = isCompareActive ? 60 : textWidth;
    const svgStyle = {
      position: 'absolute',
      transform: `translateX(${-(leftTextWidth + 25)}px)`,
      overflow: 'visible',
      width: '100px',
      userSelect: 'none',
      pointerEvents: 'none',
      left: '0',
    };

    return (
      <svg
        ref={this.nodeRef}
        className="dateline-text"
        style={svgStyle}
      >
        {active && (
          <>
            <rect
              width={leftTextWidth + 10}
              height={textHeight}
              x={0}
              rx={recRadius}
              opacity={dateLeft ? rectOpacity : '0'}
            />
            <text
              y={textY}
              x={6}
              width={width}
              opacity={dateLeft ? textOpacity : '0'}
            >
              {dateLeft}
            </text>
            <rect
              width={rightTextWidth + 10}
              height={textHeight}
              x={leftTextWidth + 40}
              rx={recRadius}
              opacity={dateRight ? rectOpacity : '0'}
            />
            <text
              y={textY}
              x={leftTextWidth + 46}
              opacity={dateRight ? textOpacity : '0'}
            >
              {dateRight}
            </text>
          </>
        )}
      </svg>
    );
  }
}

LineText.propTypes = {
  active: PropTypes.bool,
  date: PropTypes.object,
  x: PropTypes.number,
  isCompareActive: PropTypes.bool,
  isLeft: PropTypes.bool,
  map: PropTypes.object,
  textCoords: PropTypes.array,
};

export default LineText;
