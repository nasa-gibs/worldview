import { connect } from 'react-redux';
import {
  debounce as lodashDebounce,
} from 'lodash';
import React from 'react';
import PropTypes from 'prop-types';
import { transform } from 'ol/proj';
import { changeCursor as changeCursorActionCreator } from '../../modules/map/actions';
import getCoordinatesDialogAtMapPixel from './ol-coordinates-marker-util';

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
        const isMarker = featureId === 'coordinates-map-maker';
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
      getCoordinatesDialog, measureIsActive,
    } = this.props;

    if (measureIsActive) return;
    const pixels = e.pixel;
    getCoordinatesDialog(pixels, map);
  }

  render() {
    return null;
  }
}

function mapStateToProps(state) {
  const {
    map,
    measure,
    geosearch,
  } = state;
  const { coordinates } = geosearch;

  return {
    map,
    coordinates,
    isShowingClick: map.isClickable,
    getCoordinatesDialog: (pixels, olMap) => getCoordinatesDialogAtMapPixel(pixels, olMap),
    measureIsActive: measure.isActive,
  };
} const mapDispatchToProps = (dispatch) => ({
  changeCursor: (bool) => {
    dispatch(changeCursorActionCreator(bool));
  },
});
CoordinatesInteractions.propTypes = {
  changeCursor: PropTypes.func.isRequired,
  getCoordinatesDialog: PropTypes.func.isRequired,
  isShowingClick: PropTypes.bool.isRequired,
  measureIsActive: PropTypes.bool.isRequired,
  mouseEvents: PropTypes.object.isRequired,
};
export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(CoordinatesInteractions);
