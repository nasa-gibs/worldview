import {
  debounce as lodashDebounce,
  get as lodashGet,
  includes as lodashIncludes,
} from 'lodash';
import React from 'react';
import PropTypes from 'prop-types';
import { transform } from 'ol/proj';
import { isFromActiveCompareRegion } from '../../modules/compare/util';
import { hasNonClickableVectorLayer } from '../../modules/layers/util';


export default class OlVectorInteractions extends React.Component {
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
      isShowingClick, changeCursor, measureIsActive, compareState, swipeOffset, proj,
    } = this.props;
    const [lon, lat] = transform(coord, crs, 'EPSG:4326');
    if (lon < -250 || lon > 250 || lat < -90 || lat > 90) {
      return;
    }
    const hasFeatures = map.hasFeatureAtPixel(pixels);
    if (hasFeatures && !isShowingClick && !measureIsActive) {
      let isActiveLayer = false;
      map.forEachFeatureAtPixel(pixels, (feature, layer) => {
        const def = lodashGet(layer, 'wv.def');
        if (!def || lodashIncludes(def.clickDisabledFeatures, feature.getType())) return;
        const isWrapped = proj.id === 'geographic' && (def.wrapadjacentdays || def.wrapX);
        const isRenderedFeature = isWrapped ? lon > -250 || lon < 250 || lat > -90 || lat < 90 : true;
        if (isRenderedFeature && isFromActiveCompareRegion(map, pixels, layer.wv, compareState, swipeOffset)) {
          isActiveLayer = true;
        }
      });
      if (isActiveLayer) changeCursor(true);
    } else if (!hasFeatures && isShowingClick) {
      changeCursor(false);
    }
  }

  singleClick(e, map) {
    const {
      lastSelected, openVectorDiaglog, onCloseModal, selectVectorFeatures,
      modalState, getDialogObject, measureIsActive, isMobile, activeLayers,
      activateVectorAlert, proj,
    } = this.props;

    if (measureIsActive) return;
    const isVectorModalOpen = modalState.id.includes('vector_dialog') && modalState.isOpen;
    const pixels = e.pixel;
    const clickObj = getDialogObject(pixels, map);
    const metaArray = clickObj.metaArray || [];
    const selected = clickObj.selected || {};
    const offsetLeft = clickObj.offsetLeft || 10;
    const offsetTop = clickObj.offsetTop || 100;
    const dialogId = isVectorModalOpen ? modalState.id : `vector_dialog${pixels[0]}${pixels[1]}`;

    if (metaArray.length) {
      openVectorDiaglog(dialogId, metaArray, offsetLeft, offsetTop, isMobile);
    } else {
      const mapRes = map.getView().getResolution();
      const hasNonClickableVectorLayerType = hasNonClickableVectorLayer(activeLayers, mapRes, proj.id);

      if (hasNonClickableVectorLayerType) {
        activateVectorAlert();
      }
    }
    if (Object.entries(selected).length || (Object.entries(lastSelected).length && !isVectorModalOpen)) {
      selectVectorFeatures(selected);
    } else if (isVectorModalOpen && !Object.entries(selected).length) {
      onCloseModal();
      selectVectorFeatures({});
    }
  }

  render() {
    return null;
  }
}

OlVectorInteractions.propTypes = {
  changeCursor: PropTypes.func.isRequired,
  getDialogObject: PropTypes.func.isRequired,
  isShowingClick: PropTypes.bool.isRequired,
  measureIsActive: PropTypes.bool.isRequired,
  modalState: PropTypes.object.isRequired,
  mouseEvents: PropTypes.object.isRequired,
  onCloseModal: PropTypes.func.isRequired,
  openVectorDiaglog: PropTypes.func.isRequired,
  selectVectorFeatures: PropTypes.func.isRequired,
  compareState: PropTypes.object,
  isMobile: PropTypes.bool,
  lastSelected: PropTypes.object,
  proj: PropTypes.object,
  swipeOffset: PropTypes.number,
  activeLayers: PropTypes.array,
  activateVectorAlert: PropTypes.func,
};
