import React from 'react';
import PropTypes from 'prop-types';
import Coordinates from './coordinates';
import util from '../../util/util';
import { transform } from 'ol/proj';
import vectorDialog from '../../containers/vector-dialog';
import { onMapClickGetVectorFeatures } from '../../modules/vector-styles/util';
import { openCustomContent } from '../../modules/modal/actions';
import { selectVectorFeatures } from '../../modules/vector-styles/actions';
import { connect } from 'react-redux';
import { groupBy as lodashGroupBy } from 'lodash';
import { changeCursor } from '../../modules/map/actions';

class OlCoordinates extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasMouse: false,
      latitude: null,
      longitude: null,
      crs: null,
      format: null
    };
    this.mouseMove = this.mouseMove.bind(this);
    this.mouseOut = this.mouseOut.bind(this);
    this.changeFormat = this.changeFormat.bind(this);
    this.mouseClick = this.mouseClick.bind(this);
    this.registerMouseListeners();
  }

  registerMouseListeners() {
    this.props.mouseEvents.on('mousemove', this.mouseMove);
    this.props.mouseEvents.on('mouseout', this.mouseOut);
    this.props.mouseEvents.on('singleclick', this.mouseClick);
  }

  mouseClick(e, map) {
    const pixels = e.pixel;
    const { lastSelected, openVectorDiaglog, selectVectorFeatures, modalState, getDialogObject } = this.props;
    const clickObj = getDialogObject(pixels, map);
    const metaArray = clickObj.metaArray || [];
    const selected = clickObj.selected || {};
    const offsetLeft = clickObj.offsetLeft || 10;
    const offsetTop = clickObj.offsetTop || 100;
    const dialogId = 'vector_dialog' + pixels[0] + pixels[1];
    const isVectorModalOpen = modalState.id.includes('vector_dialog') && modalState.isOpen;

    if (metaArray.length) {
      openVectorDiaglog(dialogId, metaArray, offsetLeft, offsetTop);
    }
    if (Object.entries(selected).length || (Object.entries(lastSelected).length && !isVectorModalOpen)) {
      selectVectorFeatures(selected);
    }
  }

  mouseMove(event, map, crs) {
    const pixels = map.getEventPixel(event);
    const coord = map.getCoordinateFromPixel(pixels);
    const { isShowingClick, changeCursor } = this.props;
    if (!coord) {
      this.clearCoord();
      return;
    }
    const hasFeatures = map.hasFeatureAtPixel(pixels);
    if (hasFeatures && !isShowingClick) {
      changeCursor(true);
    } else if (!hasFeatures && isShowingClick) {
      changeCursor(false);
    }

    const pcoord = transform(coord, crs, 'EPSG:4326');
    const [lon, lat] = pcoord;
    if (lon < -180 || lon > 180 || lat < -90 || lat > 90) {
      this.clearCoord();
      return;
    }

    this.setState({
      hasMouse: true,
      format: util.getCoordinateFormat(),
      latitude: pcoord[1],
      longitude: pcoord[0],
      crs
    });
  }

  mouseOut(event) {
    if (event.relatedTarget && event.relatedTarget.classList) {
      const cl = event.relatedTarget.classList;
      // Ignore when the mouse goes over the coordinate display. Clearing
      // the coordinates in this situation causes a flicker.
      if (cl.contains('map-coord')) {
        return;
      }
    }
    this.clearCoord();
  }

  clearCoord() {
    this.setState({ latitude: null, longitude: null });
  }

  changeFormat(format) {
    util.setCoordinateFormat(format);
    this.setState({ format });
  }

  render() {
    // Don't render until a mouse is being used
    if (!this.state.hasMouse) {
      return null;
    }

    return (
      <div>
        <Coordinates
          format={this.state.format}
          latitude={this.state.latitude}
          longitude={this.state.longitude}
          crs={this.state.crs}
          onFormatChange={this.changeFormat}
        />
      </div>
    );
  }
}
const mapDispatchToProps = dispatch => ({
  selectVectorFeatures: (features) => {
    dispatch(selectVectorFeatures(features));
  },
  changeCursor: (bool) => {
    dispatch(changeCursor(bool));
  },

  openVectorDiaglog: (dialogId, metaArray, offsetLeft, offsetTop) => {
    dispatch(openCustomContent(dialogId,
      {
        backdrop: false,
        clickableBehindModal: true,
        desktopOnly: true,
        isDraggable: true,
        wrapClassName: 'vector-modal-wrap',
        modalClassName: 'vector-modal light',
        CompletelyCustomModal: vectorDialog,
        isResizable: true,
        vectorMetaObject: lodashGroupBy(metaArray, 'id'),
        width: 445,
        height: 300,
        offsetLeft,
        offsetTop,
        timeout: 150,
        onClose: () => {
          dispatch(selectVectorFeatures({}));
        }
      }
    ));
  }
});
function mapStateToProps(state) {
  return {
    modalState: state.modal,
    isShowingClick: state.map.isClickable,
    getDialogObject: (pixels, map) => { return onMapClickGetVectorFeatures(pixels, map, state); },
    lastSelected: state.vectorStyles.selected
  };
}
OlCoordinates.propTypes = {
  mouseEvents: PropTypes.object.isRequired
};
export default connect(
  mapStateToProps,
  mapDispatchToProps
)(OlCoordinates);
