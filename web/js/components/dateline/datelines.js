/* eslint-disable react/no-render-return-value */
import React, { useEffect, useState } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import Line from './line';
import util from '../../util/util';
import { getSelectedDate } from '../../modules/date/selectors';

function DateLines(props) {
  const {
    map, proj, date, isCompareActive, mapIsRendered, alwaysShow, hideText,
  } = props;

  if (!mapIsRendered) return null;

  const [height, setHeight] = useState(0);
  const [startY, setStartY] = useState(0);
  const [hideLines, setHideLines] = useState(false);
  const [textCoords, setTextCoords] = useState([0, 0]);

  const updatePosition = () => {
    let topY;
    let bottomY;
    let newStartY;

    if (map.getSize()[0] === 0) {
      return [0, 0];
    }
    const extent = map.getView().calculateExtent(map.getSize());
    const top = [extent[2] - 1, extent[3] + 5];
    const bottom = [extent[2] - 1, extent[1] - 5];
    const topExtent = map.getPixelFromCoordinate([extent[2] - 1, extent[3] - 1]);
    const bottomExtent = map.getPixelFromCoordinate([extent[0] + 1, extent[1] + 1]);
    topY = Math.round(topExtent[1] + 5);
    bottomY = Math.round(bottomExtent[1] - 5);
    newStartY = Math.round(extent[3] + 5);

    if (newStartY > 90) {
      newStartY = 90;
      [, topY] = map.getPixelFromCoordinate([extent[2], 90]);
    } else {
      [, topY] = map.getPixelFromCoordinate(top);
    }
    if (extent[1] > -90) {
      [, bottomY] = map.getPixelFromCoordinate(bottom);
    } else {
      [, bottomY] = map.getPixelFromCoordinate([extent[2], -90]);
    }
    const newHeight = Math.round(Math.abs(bottomY - topY));
    setHeight(newHeight);
    setStartY(newStartY);
    setHideLines(false);
  };

  useEffect(() => {
    if (proj.id !== 'geographic' || !mapIsRendered) {
      return;
    }
    map.on('movestart', () => { setHideLines(true); });
    map.on('moveend', updatePosition);
    return () => {
      map.off('movestart', updatePosition);
      map.off('moveend', updatePosition);
    };
  }, [mapIsRendered]);

  useEffect(updatePosition, [mapIsRendered]);

  return (
    <>
      <Line
        id="dateline-left"
        map={map}
        hideText={hideText}
        alwaysShow={alwaysShow}
        isCompareActive={isCompareActive}
        height={hideLines ? 0 : height}
        lineX={-180}
        lineY={startY}
        date={date}
        textCoords={textCoords}
        setTextCoords={setTextCoords}
      />
      <Line
        id="dateline-right"
        map={map}
        hideText={hideText}
        alwaysShow={alwaysShow}
        isCompareActive={isCompareActive}
        height={hideLines ? 0 : height}
        lineX={180}
        lineY={startY}
        date={util.dateAdd(date, 'day', -1)}
        textCoords={textCoords}
        setTextCoords={setTextCoords}
      />
    </>
  );
}

const mapStateToProps = (state) => {
  const {
    proj, map, compare, settings, modal,
  } = state;
  const isImageDownload = modal.id === 'TOOLBAR_SNAPSHOT' && modal.isOpen;
  return {
    proj,
    map: map.ui.selected,
    date: getSelectedDate(state),
    isCompareActive: compare.active,
    mapIsRendered: map.rendered,
    hideText: isImageDownload,
    alwaysShow: isImageDownload || settings.alwaysShowDatelines,
  };
};

DateLines.propTypes = {
  map: PropTypes.object,
  proj: PropTypes.object,
  date: PropTypes.object,
  isCompareActive: PropTypes.bool,
  mapIsRendered: PropTypes.bool,
  alwaysShow: PropTypes.bool,
};

export default connect(
  mapStateToProps,
  () => ({}),
)(DateLines);
