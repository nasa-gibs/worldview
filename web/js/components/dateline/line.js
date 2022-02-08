import React from 'react';
import PropTypes from 'prop-types';
import OlOverlay from 'ol/Overlay';
import util from '../../util/util';
import LineText from './text';

const lineStyles = {
  dashArray: '5, 10',
  opacity: '0.5',
  width: '10',
  strokeWidth: '6',
  color: 'white',
  svgStyle: {
    transform: 'translateX(-3px)',
  },
};

class Line extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hovered: false,
      textActive: false,
      textCoords: [0, 0],
    };
    this.nodeRef = React.createRef();
  }

  componentDidMount() {
    const { lineX, map } = this.props;
    const overlay = new OlOverlay({
      element: this.nodeRef.current,
      stopEvent: false,
    });
    overlay.setPosition([lineX, 90]);
    map.addOverlay(overlay);
  }

  shouldComponentUpdate(nextProps, nextState) {
    const { hovered } = this.state;
    const { active, height } = this.props;
    const checkForStateUpdates = nextProps.active === active
      && nextProps.height === height
      && nextState.hovered === hovered;

    if (checkForStateUpdates) {
      return false;
    }
    return true;
  }

  mouseOver = () => {
    this.setState({
      hovered: true,
    });
  }

  mouseOut = () => {
    this.setState({
      hovered: false,
    });
  }

  mouseOverHidden = (e) => {
    const { map } = this.props;
    this.setState({
      textActive: true,
      textCoords: map.getCoordinateFromPixel([e.clientX, e.clientY]),
    });
  }

  mouseOutHidden = () => {
    this.setState({ textActive: false });
  }

  render() {
    const {
      id,
      active,
      date,
      lineX,
      isCompareActive,
      style,
      map,
      height,
    } = this.props;
    const { hovered, textCoords, textActive } = this.state;
    const {
      opacity, strokeWidth, dashArray, color, svgStyle, width,
    } = lineStyles;
    const useOpacity = (hovered && active)
    || (active && util.browser.mobileAndTabletDevice)
      ? opacity
      : '0';

    return (
      <>
        <svg
          id={id}
          ref={this.nodeRef}
          className="dateline-case"
          style={svgStyle}
          height={height}
          width={width}
          onMouseOver={this.mouseOver}
          onMouseOut={this.mouseOut}
        >
          <line
            strokeWidth={strokeWidth}
            stroke={color}
            opacity={useOpacity}
            x1={strokeWidth / 2}
            x2={strokeWidth / 2}
            strokeDasharray={dashArray}
            y1="0"
            y2={height}
          />
          <line
            className="dateline-hidden"
            onMouseOver={this.mouseOverHidden}
            onMouseMove={this.mouseOverHidden}
            onMouseOut={this.mouseOutHidden}
            style={style}
            opacity="0"
            x1={strokeWidth / 2}
            x2={strokeWidth / 2}
            strokeWidth={strokeWidth}
            stroke={color}
            y1="0"
            y2={height}
          />
        </svg>
        <LineText
          active={textActive}
          map={map}
          date={date}
          x={lineX}
          y={90}
          isCompareActive={isCompareActive}
          isLeft={lineX < 0}
          textCoords={textCoords}
        />
      </>
    );
  }
}

Line.propTypes = {
  active: PropTypes.bool,
  date: PropTypes.object,
  height: PropTypes.number,
  id: PropTypes.string,
  isCompareActive: PropTypes.bool,
  lineX: PropTypes.number,
  map: PropTypes.object,
  style: PropTypes.object,
};

export default Line;
