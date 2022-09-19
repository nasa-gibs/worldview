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
      overlay: '',
      hovered: false,
      textActive: props.alwaysShow,
    };
    this.nodeRef = React.createRef();
    this.timerRef = React.createRef();
  }

  componentDidMount() {
    const { lineX, map } = this.props;
    const overlay = new OlOverlay({
      element: this.nodeRef.current,
      stopEvent: false,
    });
    overlay.setPosition([lineX, 90]);
    map.addOverlay(overlay);
    this.setState({ overlay });
  }

  componentDidUpdate(prevProps) {
    const { lineX, lineY, alwaysShow } = this.props;
    const { overlay } = this.state;
    overlay.setPosition([lineX, lineY]);
    if (!alwaysShow && alwaysShow !== prevProps.alwaysShow) {
      // eslint-disable-next-line react/no-did-update-set-state
      this.setState({ textActive: false });
    }
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
    const { map, setTextCoords } = this.props;
    const coords = map.getCoordinateFromPixel([e.clientX, e.clientY]);

    this.timerRef.current = setTimeout(() => {
      setTextCoords(coords);
      this.setState({
        textActive: true,
      });
    }, 500);
  }

  mouseLeaveHidden = () => {
    clearTimeout(this.timerRef.current);
    this.setState({ textActive: false });
  }

  render() {
    const {
      id,
      alwaysShow,
      date,
      lineX,
      isCompareActive,
      style,
      map,
      height,
      textCoords,
      hideText,
    } = this.props;
    const { hovered, textActive } = this.state;

    const {
      strokeWidth, dashArray, color, svgStyle, width,
    } = lineStyles;
    const useOpacity = alwaysShow || util.browser.mobileAndTabletDevice || hovered
      ? lineStyles.opacity
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
            onMouseLeave={this.mouseLeaveHidden}
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
          active={!hideText && (alwaysShow || textActive)}
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
  alwaysShow: PropTypes.bool,
  date: PropTypes.object,
  height: PropTypes.number,
  id: PropTypes.string,
  isCompareActive: PropTypes.bool,
  lineX: PropTypes.number,
  lineY: PropTypes.number,
  map: PropTypes.object,
  style: PropTypes.object,
  setTextCoords: PropTypes.func,
  textCoords: PropTypes.array,
  hideText: PropTypes.bool,
};

export default Line;
