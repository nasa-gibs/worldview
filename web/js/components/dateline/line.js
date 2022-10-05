import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import OlOverlay from 'ol/Overlay';
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
  const {
    id,
    alwaysShow,
    date,
    lineX,
    lineY,
    isCompareActive,
    style,
    map,
    height,
    setTextCoords,
    textCoords,
    hideText,
    isMobilePhone,
    isMobileTablet,
  } = props;

  const [overlay, setOverlay] = useState('');
  const [hovered, toggleHovered] = useState(false);
  const [textActive, toggleTextActive] = useState(alwaysShow);
  const prevAlwaysShow = usePrevious(alwaysShow);

  const nodeRef = useRef();
  const timerRef = useRef();

  useEffect(() => {
    const newOverlay = new OlOverlay({
      element: nodeRef.current,
      stopEvent: false,
    });
    newOverlay.setPosition([lineX, 90]);
    map.addOverlay(newOverlay);
    setOverlay(newOverlay);
  }, []);

  useEffect(() => {
    if (!alwaysShow && alwaysShow !== prevAlwaysShow) {
      toggleTextActive(false);
    }
    if (overlay !== '') return overlay.setPosition([lineX, lineY]);
  });

  const mouseOver = () => {
    toggleHovered(true);
    toggleTextActive(true);
  };

  const mouseOut = () => {
    toggleHovered(false);
    toggleTextActive(false);
  };

  const mouseOverHidden = (e) => {
    const coords = map.getCoordinateFromPixel([e.clientX, e.clientY]);
    timerRef.current = setTimeout(() => {
      setTextCoords(coords);
    }, 300);
  };

  const mouseLeaveHidden = () => {
    clearTimeout(timerRef.current);
  };

  const {
    strokeWidth, dashArray, color, svgStyle, width,
  } = lineStyles;
  const useOpacity = alwaysShow || isMobilePhone || isMobileTablet || hovered
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
  isMobilePhone: PropTypes.bool,
  isMobileTablet: PropTypes.bool,
};

