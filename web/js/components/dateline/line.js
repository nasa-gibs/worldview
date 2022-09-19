import React, { useState, useEffect, useRef} from 'react';
import PropTypes from 'prop-types';
import OlOverlay from 'ol/Overlay';
import util from '../../util/util';
import LineText from './text';
import usePrevious from '../../util/customHooks';

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

export default function Line (props) {

  const [overlay, setOverlay] = useState('');
  const [hovered, setHovered] = useState(false);
  const [textActive, setTextActive] = useState(props.alwaysShow);

  const nodeRef = useRef();
  const timerRef = useRef();

  // constructor(props) {
    // super(props);
    // this.state = {
    //   overlay: '',
    //   hovered: false,
    //   textActive: props.alwaysShow,
    // };
    // this.nodeRef = React.createRef();
    // this.timerRef = React.createRef();
  // }

  // componentDidMount() {
  //   const { lineX, map } = props;
  //   const overlay = new OlOverlay({
  //     element: nodeRef.current,
  //     stopEvent: false,
  //   });
  //   overlay.setPosition([lineX, 90]);
  //   map.addOverlay(overlay);
  //   // this.setState({ overlay });
  //   setOverlay({ overlay })
  // }

  //componentDidMount()
  useEffect(() => {
    const { lineX, map } = props;
    const newOverlay = new OlOverlay({
      element: nodeRef.current,
      stopEvent: false,
    });
    newOverlay.setPosition([lineX, 90]);
    map.addOverlay(newOverlay);

    setOverlay(newOverlay)
    console.log("CDM Overlay", overlay)
    console.log("newOverlay", newOverlay)
  }, [])

  const prevAlwaysShow = usePrevious(props.alwaysShow)

  //componentDidUpdate
  useEffect(() => {
    console.log("componentDidUpdate")
    const { lineX, lineY, alwaysShow } = props;

    console.log("CDU overlay",overlay)

    // overlay.setPosition([lineX, lineY]);

    if (!alwaysShow && alwaysShow !== prevAlwaysShow) {
      // eslint-disable-next-line react/no-did-update-set-state
      setTextActive(true)
    }
  })

  // componentDidUpdate(prevProps) {
  //   const { lineX, lineY, alwaysShow } = props;
  //   const { overlay } = state;
  //   overlay.setPosition([lineX, lineY]);
  //   if (!alwaysShow && alwaysShow !== prevProps.alwaysShow) {
  //     // eslint-disable-next-line react/no-did-update-set-state
  //     this.setState({ textActive: false });
  //   }
  // }

  const mouseOver = () => {
    setHovered(true)
  }

  const mouseOut = () => {
    setHovered(false)
  }

  const mouseOverHidden = (e) => {
    const { map, setTextCoords } = props;
    const coords = map.getCoordinateFromPixel([e.clientX, e.clientY]);

    timerRef.current = setTimeout(() => {
      setTextCoords(coords);
      setTextActive(true)
    }, 500);
  }

  const mouseLeaveHidden = () => {
    clearTimeout(timerRef.current);
    setTextActive(false)
  }

  // render() {
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
    } = props;
    // const { hovered, textActive } = this.state;

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
          ref={nodeRef}
          className="dateline-case"
          style={svgStyle}
          height={height}
          width={width}
          onMouseOver={mouseOver}
          onMouseOut={mouseOut}
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
            onMouseOver={mouseOverHidden}
            onMouseLeave={mouseLeaveHidden}
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

