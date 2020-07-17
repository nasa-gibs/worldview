/* eslint-disable no-nested-ternary */
import React from 'react';
import PropTypes from 'prop-types';
import { Draggable } from 'react-beautiful-dnd';
import { isEmpty as lodashIsEmpty, get as lodashGet } from 'lodash';
import googleTagManager from 'googleTagManager';
import { connect } from 'react-redux';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faTimes, faSlidersH, faInfo, faBan, faHandPointer,
} from '@fortawesome/free-solid-svg-icons';
import { faEye, faEyeSlash } from '@fortawesome/free-regular-svg-icons';
import PaletteLegend from '../../components/sidebar/paletteLegend';
import util from '../../util/util';
import {
  getPalette,
  getPaletteLegends,
} from '../../modules/palettes/selectors';
import { toggleCustomContent, openCustomContent } from '../../modules/modal/actions';
import LayerInfo from '../../components/layer/info/info';
import LayerSettings from '../../components/layer/settings/settings';
import { requestPalette } from '../../modules/palettes/actions';
import {
  toggleVisibility,
  removeLayer,
  layerHover,
  changeGranuleSatelliteInstrumentGroup,
} from '../../modules/layers/actions';
import Switch from '../../components/util/switch';
import OrbitTrack from './orbit-track';
import { isVectorLayerClickable } from '../../modules/layers/util';
import { MODAL_PROPERTIES } from '../../modules/alerts/constants';

const { vectorModalProps } = MODAL_PROPERTIES;

const visibilityButtonClasses = 'hdanchor hide hideReg bank-item-img';
const getItemStyle = (isDragging, draggableStyle) => ({
  // some basic styles to make the items look a bit nicer
  ...draggableStyle,
  position: isDragging ? 'absolute' : 'relative',
  top: null,
  left: null,
});

class Layer extends React.Component {
  getPaletteLegend = () => {
    const {
      compare,
      layer,
      layerGroupName,
      runningObject,
      paletteLegends,
      checkerBoardPattern,
      getPalette,
      palette,
      renderedPalette,
      requestPalette,
      isCustomPalette,
      isLoading,
      isMobile,
      zot,
    } = this.props;
    if (!lodashIsEmpty(renderedPalette)) {
      const isRunningData = compare.active
        ? compare.activeString === layerGroupName && !!runningObject
        : !!runningObject;
      const colorHex = isRunningData ? runningObject.paletteHex : null;
      return (
        <PaletteLegend
          layer={layer}
          layerGroupName={layerGroupName}
          paletteId={palette.id}
          getPalette={getPalette}
          width={zot ? 220 : 231}
          paletteLegends={paletteLegends}
          isCustomPalette={isCustomPalette}
          isRunningData={isRunningData}
          checkerBoardPattern={checkerBoardPattern}
          colorHex={colorHex}
          isMobile={isMobile}
        />
      );
    } if (!isLoading) {
      requestPalette(layer.id);
    }
  }

  getDisabledTitle = (layer) => {
    let startDate; let
      endDate;

    if (layer.startDate) {
      startDate = util.coverageDateFormatter('START-DATE', layer.startDate, layer.period);
    }

    if (layer.endDate) {
      endDate = util.coverageDateFormatter('END-DATE', layer.endDate, layer.period);
    }

    if (startDate && endDate) {
      return `Data available between ${startDate} - ${endDate}`;
    } if (startDate) {
      return `Data available between ${startDate} - Present`;
    }
    return 'No data on selected date for this layer';
  }

  stopPropagation = (e) => {
    e.nativeEvent.stopImmediatePropagation();
    e.stopPropagation();
    e.preventDefault();
  }

  renderControls() {
    const {
      layer,
      layerGroupName,
      names,
      isMobile,
      onRemoveClick,
      onInfoClick,
      onOptionsClick,
    } = this.props;
    const { title } = names;
    return (
      <>
        <a
          id={`close${layerGroupName}${util.encodeId(layer.id)}`}
          title="Remove Layer"
          className="button wv-layers-close"
          onClick={() => onRemoveClick(layer.id)}
        >
          <FontAwesomeIcon icon={faTimes} fixedWidth />
        </a>
        <a
          title={`Layer options for ${title}`}
          className={isMobile ? 'hidden wv-layers-options' : 'wv-layers-options'}
          onMouseDown={this.stopPropagation}
          onClick={() => onOptionsClick(layer, title)}
        >
          <FontAwesomeIcon icon={faSlidersH} className="wv-layers-options-icon" />
        </a>
        <a
          title={`Layer description for ${title}`}
          className={isMobile ? 'hidden wv-layers-info' : 'wv-layers-info'}
          onMouseDown={this.stopPropagation}
          onClick={() => onInfoClick(layer, title)}
        >
          <FontAwesomeIcon icon={faInfo} className="wv-layers-info-icon" />
        </a>
      </>
    );
  }

  renderVectorIcon() {
    const {
      hasClickableFeature, openVectorAlertModal, runningObject,
    } = this.props;
    const clasNames = hasClickableFeature
      ? 'layer-pointer-icon'
      : 'layer-pointer-icon disabled';
    const title = hasClickableFeature
      ? 'You can click the features of this layer to see metadata associated with the feature.'
      : 'Zoom in further to click features.';
    return (
      <div title={title} className={runningObject ? `${clasNames} running` : clasNames} onClick={openVectorAlertModal}>
        {' '}
        <FontAwesomeIcon
          icon={faHandPointer}
          fixedWidth
        />
      </div>
    );
  }

  renderGranuleHoverIcon() {
    const {
      activeString,
      changeGranuleSatelliteInstrumentGroup,
      layer,
      granuleSatelliteInstrumentGroup,
      layerSatelliteInstrumentGroup,
    } = this.props;

    const isGranuleSatelliteActive = granuleSatelliteInstrumentGroup[activeString] === layerSatelliteInstrumentGroup;
    const title = isGranuleSatelliteActive
      ? 'Granule hover footprints are active for this satellite instrument.'
      : 'The hover capability for this granule satellite instrument is not active. Click to make active.';
    return (
      <div
        title={title}
        className="layer-granule-footprint-toggle"
      >
        <Switch
          containerClass="layer-granule-footprint-toggle-container"
          id={`${layer.id}-${activeString}-tooltip`}
          active={isGranuleSatelliteActive}
          toggle={() => changeGranuleSatelliteInstrumentGroup(layer.id, isGranuleSatelliteActive ? '' : layerSatelliteInstrumentGroup)}
        />
      </div>
    );
  }

  render() {
    const {
      layerGroupName,
      toggleVisibility,
      hover,
      layer,
      isDisabled,
      isGranule,
      isVisible,
      layerClasses,
      names,
      index,
      hasPalette,
      zot,
      isInProjection,
      tracksForLayer,
      isVectorLayer,
    } = this.props;

    const containerClass = isDisabled
      ? `${layerClasses} disabled layer-hidden`
      : !isVisible
        ? `${layerClasses} layer-hidden`
        : zot
          ? `${layerClasses} layer-enabled layer-visible zotted`
          : `${layerClasses} layer-enabled layer-visible`;
    const visibilityToggleClass = isDisabled
      ? `${visibilityButtonClasses} layer-hidden`
      : !isVisible
        ? `${visibilityButtonClasses} layer-hidden`
        : `${visibilityButtonClasses} layer-enabled layer-visible`;
    const visibilityTitle = !isVisible && !isDisabled
      ? 'Show Layer'
      : isDisabled
        ? this.getDisabledTitle(layer)
        : 'Hide Layer';
    const visibilityIconClass = isDisabled
      ? faBan
      : !isVisible
        ? faEyeSlash
        : faEye;

    const zotTitle = zot
      ? `Layer is overzoomed by ${zot.toString()}x its maximum zoom level`
      : '';

    return (
      <Draggable
        draggableId={`${util.encodeId(layer.id)}-${layerGroupName}`}
        index={index}
        direction="vertical"
      >
        {(provided, snapshot) => (isInProjection ? (
          <li
            id={`${layerGroupName}-${util.encodeId(layer.id)}`}
            className={containerClass}
            style={getItemStyle(
              snapshot.isDragging,
              provided.draggableProps.style,
            )}
            ref={provided.innerRef}
            {...provided.draggableProps}
            {...provided.dragHandleProps}
            onMouseEnter={() => hover(layer.id, true)}
            onMouseLeave={() => hover(layer.id, false)}
          >
            <a
              className={visibilityToggleClass}
              id={`hide${util.encodeId(layer.id)}`}
              onClick={() => toggleVisibility(layer.id, !isVisible)}
              title={visibilityTitle}
            >
              <FontAwesomeIcon icon={visibilityIconClass} className="layer-eye-icon" />
            </a>

            <div
              className="zot"
              title={zotTitle}
            >
              <b>!</b>
            </div>

            <div className="layer-main">
              <div className="layer-info">
                {this.renderControls()}
                <h4 title={names.title}>{names.title}</h4>
                <p dangerouslySetInnerHTML={{ __html: names.subtitle }} />
                {hasPalette ? this.getPaletteLegend() : ''}
              </div>
              {isVectorLayer && isVisible ? this.renderVectorIcon() : null}
              {isGranule && isVisible ? this.renderGranuleHoverIcon() : null}
              {tracksForLayer.length > 0 && (
              <div className="layer-tracks">
                {tracksForLayer.map((track) => (
                  <OrbitTrack
                    key={track.id}
                    trackLayer={track}
                    parentLayer={layer}
                  />
                ))}
              </div>
              )}
            </div>
          </li>
        ) : (
          <li
            className="layer-list-placeholder"
            ref={provided.innerRef}
            {...provided.draggableProps}
            {...provided.dragHandleProps}
          />
        ))}
      </Draggable>
    );
  }
}

Layer.defaultProps = {
  palette: {},
};

function mapStateToProps(state, ownProps) {
  const {
    layer,
    isDisabled,
    isVisible,
    layerClasses,
    names,
    index,
    layerGroupName,
  } = ownProps;
  const {
    palettes, config, map, layers, compare, proj,
  } = state;
  const hasPalette = !lodashIsEmpty(layer.palette);
  const renderedPalettes = palettes.rendered;
  const paletteName = lodashGet(config, `layers['${layer.id}'].palette.id`);
  const paletteLegends = hasPalette && renderedPalettes[paletteName]
    ? getPaletteLegends(layer.id, layerGroupName, state)
    : [];
  const isCustomPalette = hasPalette && palettes.custom[layer.id];
  const tracksForLayer = layers[layerGroupName].filter((activeLayer) => (layer.tracks || []).some((track) => activeLayer.id === track));
  const selectedMap = lodashGet(map, 'ui.selected');
  const isVector = layer.type === 'vector';
  const mapRes = selectedMap ? selectedMap.getView().getResolution() : null;

  // granule icon
  const { isGranule } = layer;
  const { activeString } = compare;
  const layerSatelliteInstrumentGroup = `${layer.subtitle}`;
  const { granuleSatelliteInstrumentGroup } = layers;
  return {
    activeString,
    compare,
    tracksForLayer,
    layer,
    isDisabled,
    isVisible,
    isGranule,
    layerSatelliteInstrumentGroup,
    granuleSatelliteInstrumentGroup,
    layerClasses,
    paletteLegends,
    names,
    index,
    isCustomPalette,
    isLoading: palettes.isLoading[paletteName],
    renderedPalette: renderedPalettes[paletteName],
    layerGroupName,
    isVectorLayer: isVector,
    hasClickableFeature: isVector && isVisible && isVectorLayerClickable(layer, mapRes, proj.id),
    isMobile: state.browser.lessThan.medium,
    hasPalette,
    getPalette: (layerId, i) => getPalette(layer.id, i, layerGroupName, state),
    runningObject: map.runningDataObj[layer.id],
  };
}

const mapDispatchToProps = (dispatch) => ({
  hover: (id, value) => {
    dispatch(layerHover(id, value));
  },
  toggleVisibility: (id, isVisible) => {
    dispatch(toggleVisibility(id, isVisible));
  },
  openVectorAlertModal: () => {
    const { id, props } = vectorModalProps;
    dispatch(openCustomContent(id, props));
  },
  onRemoveClick: (id) => {
    dispatch(removeLayer(id));
  },
  onOptionsClick: (layer, title) => {
    const key = `LAYER_OPTIONS_MODAL-${layer.id}`;
    googleTagManager.pushEvent({
      event: 'sidebar_layer_options',
    });
    dispatch(
      toggleCustomContent(key, {
        headerText: title || 'Layer Options',
        backdrop: false,
        bodyComponent: LayerSettings,
        // Using clickableBehindModal: true here causes an issue where switching sidebar
        // tabs does not close this modal
        wrapClassName: 'clickable-behind-modal',
        modalClassName: ' layer-info-settings-modal layer-settings-modal',
        timeout: 150,
        bodyComponentProps: {
          layer,
        },
      }),
    );
  },
  onInfoClick: (layer, title) => {
    const key = `LAYER_INFO_MODAL-${layer.id}`;
    googleTagManager.pushEvent({
      event: 'sidebar_layer_info',
    });
    dispatch(
      toggleCustomContent(key, {
        headerText: title || 'Layer Description',
        backdrop: false,
        bodyComponent: LayerInfo,
        // Using clickableBehindModal: true here causes an issue where switching sidebar
        // tabs does not close this modal
        wrapClassName: 'clickable-behind-modal',
        modalClassName: ' layer-info-settings-modal layer-info-modal',
        timeout: 150,
        size: 'lg',
        bodyComponentProps: {
          layer,
        },
      }),
    );
  },
  requestPalette: (id) => {
    dispatch(requestPalette(id));
  },
  changeGranuleSatelliteInstrumentGroup: (id, satelliteInstrumentGroup) => {
    dispatch(changeGranuleSatelliteInstrumentGroup(id, satelliteInstrumentGroup));
  },
});
export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(Layer);
Layer.propTypes = {
  activeString: PropTypes.string,
  changeGranuleSatelliteInstrumentGroup: PropTypes.func,
  checkerBoardPattern: PropTypes.object,
  compare: PropTypes.object,
  getPalette: PropTypes.func,
  granuleSatelliteInstrumentGroup: PropTypes.object,
  layerSatelliteInstrumentGroup: PropTypes.string,
  hasPalette: PropTypes.bool,
  hover: PropTypes.func,
  index: PropTypes.number,
  isCustomPalette: PropTypes.bool,
  isDisabled: PropTypes.bool,
  isGranule: PropTypes.bool,
  isInProjection: PropTypes.bool,
  isLoading: PropTypes.bool,
  isMobile: PropTypes.bool,
  isVisible: PropTypes.bool,
  layer: PropTypes.object,
  layerClasses: PropTypes.string,
  layerGroupName: PropTypes.string,
  names: PropTypes.object,
  onInfoClick: PropTypes.func,
  onOptionsClick: PropTypes.func,
  onRemoveClick: PropTypes.func,
  palette: PropTypes.object,
  paletteLegends: PropTypes.array,
  renderedPalette: PropTypes.object,
  requestPalette: PropTypes.func,
  runningObject: PropTypes.object,
  toggleVisibility: PropTypes.func,
  hasClickableFeature: PropTypes.bool,
  tracksForLayer: PropTypes.array,
  openVectorAlertModal: PropTypes.func,
  zot: PropTypes.number,
  isVectorLayer: PropTypes.bool,
};
