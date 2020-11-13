import { connect } from 'react-redux';
import {
  debounce as lodashDebounce,
} from 'lodash';
import React from 'react';
import PropTypes from 'prop-types';
import { transform } from 'ol/proj';
import { changeCursor as changeCursorActionCreator } from '../../modules/map/actions';
import { getCoordinatesDialogAtMapPixel } from './ol-coordinates-marker-util';
import { clearCoordinates } from '../../modules/geosearch/actions';

export class CoordinatesInteractions extends React.Component {
  constructor(props) {
    super(props);
    this.mouseMove = lodashDebounce(this.mouseMove.bind(this), 8);
    this.singleClick = this.singleClick.bind(this);
    this.registerMouseListeners();
  }

  registerMouseListeners() {
    const { mouseEvents } = this.props;
    mouseEvents.on('mousemove', this.mouseMove);
    mouseEvents.on('singleclick', this.singleClick);
  }

  mouseMove(event, map, crs) {
    const pixels = map.getEventPixel(event);
    const coord = map.getCoordinateFromPixel(pixels);

    const {
      isShowingClick,
      changeCursor,
      measureIsActive,
    } = this.props;
    const [lon, lat] = transform(coord, crs, 'EPSG:4326');
    if (lon < -250 || lon > 250 || lat < -90 || lat > 90) {
      return;
    }
    const hasFeatures = map.hasFeatureAtPixel(pixels);
    if (hasFeatures && !isShowingClick && !measureIsActive) {
      let isActiveLayer = false;
      map.forEachFeatureAtPixel(pixels, (feature) => {
        const featureId = feature.getId();
        const isMarker = featureId === 'coordinates-map-marker';
        if (isMarker) {
          isActiveLayer = true;
        }
      });
      if (isActiveLayer) {
        changeCursor(true);
      }
    } else if (!hasFeatures && isShowingClick) {
      changeCursor(false);
    }
  }

  singleClick(e, map) {
    e.stopPropagation();
    const {
      measureIsActive,
    } = this.props;

    if (measureIsActive) return;
    const pixels = e.pixel;
    this.getCoordinatesDialog(pixels, map);
  }

  getCoordinatesDialog = (pixels, olMap) => {
    const {
      config,
      clearCoordinates,
      isMobile,
    } = this.props;
    getCoordinatesDialogAtMapPixel(pixels, olMap, config, isMobile, clearCoordinates);
  }

  render() {
    return null;
  }
}

function mapStateToProps(state) {
  const {
    browser,
    config,
    map,
    measure,
    geosearch,
  } = state;
  const { coordinates } = geosearch;
  const isMobile = browser.lessThan.medium;

  return {
    config,
    map,
    coordinates,
    isMobile,
    isShowingClick: map.isClickable,
    measureIsActive: measure.isActive,
  };
} const mapDispatchToProps = (dispatch) => ({
  changeCursor: (bool) => {
    dispatch(changeCursorActionCreator(bool));
  },
  clearCoordinates: () => {
    dispatch(clearCoordinates());
  },
});
CoordinatesInteractions.propTypes = {
  changeCursor: PropTypes.func.isRequired,
  config: PropTypes.object.isRequired,
  clearCoordinates: PropTypes.func.isRequired,
  isMobile: PropTypes.bool.isRequired,
  isShowingClick: PropTypes.bool.isRequired,
  measureIsActive: PropTypes.bool.isRequired,
  mouseEvents: PropTypes.object.isRequired,
};
export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(CoordinatesInteractions);
