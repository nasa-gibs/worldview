import React from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import OlCoordinates from '../components/map/ol-coordinates';
import vectorDialog from './vector-dialog';
import { onMapClickGetVectorFeatures } from '../modules/vector-styles/util';
import { openCustomContent, onClose } from '../modules/modal/actions';
import { selectVectorFeatures } from '../modules/vector-styles/actions';
import { groupBy as lodashGroupBy, debounce as lodashDebounce } from 'lodash';
import { changeCursor } from '../modules/map/actions';

export class MapInteractions extends React.Component {
  constructor(props) {
    super(props);
    this.mouseMove = this.mouseMove.bind(this);
    this.mouseMove = lodashDebounce(this.mouseMove.bind(this), 8);
    this.singleClick = this.singleClick.bind(this);
    this.registerMouseListeners();
  }

  registerMouseListeners() {
    this.props.mouseEvents.on('mousemove', this.mouseMove);
    this.props.mouseEvents.on('singleclick', this.singleClick);
  }

  singleClick(e, map) {
    const { lastSelected, openVectorDiaglog, onCloseModal, selectVectorFeatures, modalState, getDialogObject, measureIsActive } = this.props;
    if (measureIsActive) return;
    const isVectorModalOpen = modalState.id.includes('vector_dialog') && modalState.isOpen;
    const pixels = e.pixel;
    const clickObj = getDialogObject(pixels, map);
    const metaArray = clickObj.metaArray || [];
    const selected = clickObj.selected || {};
    const offsetLeft = clickObj.offsetLeft || 10;
    const offsetTop = clickObj.offsetTop || 100;
    const dialogId = isVectorModalOpen ? modalState.id : 'vector_dialog' + pixels[0] + pixels[1];

    if (metaArray.length) {
      openVectorDiaglog(dialogId, metaArray, offsetLeft, offsetTop);
    }
    if (Object.entries(selected).length || (Object.entries(lastSelected).length && !isVectorModalOpen)) {
      selectVectorFeatures(selected);
    } else if (isVectorModalOpen && !Object.entries(selected).length) {
      onCloseModal();
      selectVectorFeatures({});
    }
  }

  mouseMove(event, map, crs) {
    const pixels = map.getEventPixel(event);
    const coord = map.getCoordinateFromPixel(pixels);
    const { isShowingClick, changeCursor, measureIsActive } = this.props;
    const [lon, lat] = coord;
    if (lon < -180 || lon > 180 || lat < -90 || lat > 90) {
      return;
    }
    const hasFeatures = map.hasFeatureAtPixel(pixels);
    if (hasFeatures && !isShowingClick && !measureIsActive) {
      changeCursor(true);
    } else if (!hasFeatures && isShowingClick) {
      changeCursor(false);
    }
  }

  render() {
    const { isShowingClick, mouseEvents } = this.props;
    const mapClasses = isShowingClick ? 'wv-map' + ' cursor-pointer' : 'wv-map';

    return (
      <React.Fragment>
        <div id="wv-map" className={mapClasses} />
        <OlCoordinates mouseEvents={mouseEvents} />
      </React.Fragment>
    );
  }
}
const mapDispatchToProps = dispatch => ({
  selectVectorFeatures: (features) => {
    setTimeout(() => {
      dispatch(selectVectorFeatures(features));
    }, 1);
  },
  changeCursor: (bool) => {
    dispatch(changeCursor(bool));
  },
  onCloseModal: () => {
    dispatch(onClose());
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
        dragHandle: '.modal-header',
        dialogKey: new Date().getUTCMilliseconds(),
        vectorMetaObject: lodashGroupBy(metaArray, 'id'),
        width: 445,
        height: 300,
        offsetLeft,
        offsetTop,
        timeout: 0,
        onClose: () => {
          setTimeout(() => {
            dispatch(selectVectorFeatures({}));
          }, 1);
        }
      }
    ));
  }
});
function mapStateToProps(state) {
  const { modal, map, measure, vectorStyles } = state;
  return {
    modalState: modal,
    isShowingClick: map.isClickable,
    getDialogObject: (pixels, map) => { return onMapClickGetVectorFeatures(pixels, map, state); },
    lastSelected: vectorStyles.selected,
    measureIsActive: measure.isActive
  };
}
MapInteractions.propTypes = {
  changeCursor: PropTypes.func.isRequired,
  getDialogObject: PropTypes.func.isRequired,
  isShowingClick: PropTypes.bool.isRequired,
  measureIsActive: PropTypes.bool.isRequired,
  modalState: PropTypes.object.isRequired,
  mouseEvents: PropTypes.object.isRequired,
  onCloseModal: PropTypes.func.isRequired,
  openVectorDiaglog: PropTypes.func.isRequired,
  selectVectorFeatures: PropTypes.func.isRequired,
  lastSelected: PropTypes.object
};
export default connect(
  mapStateToProps,
  mapDispatchToProps
)(MapInteractions);
