/* eslint-disable react/jsx-props-no-spreading */
/* eslint-disable react/no-danger */
/* eslint-disable no-nested-ternary */
import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Draggable } from 'react-beautiful-dnd';
import { isEmpty as lodashIsEmpty, get as lodashGet } from 'lodash';
import googleTagManager from 'googleTagManager';
import { connect } from 'react-redux';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  UncontrolledTooltip,
} from 'reactstrap';
import PaletteLegend from '../../components/sidebar/paletteLegend';
import util from '../../util/util';
import {
  getPalette,
  getPaletteLegends,
} from '../../modules/palettes/selectors';
import { toggleCustomContent, openCustomContent } from '../../modules/modal/actions';
import LayerInfo from '../../components/layer/info/info';
import LayerSettings from '../../components/layer/settings/layer-settings';
import { requestPalette } from '../../modules/palettes/actions';
import {
  toggleVisibility,
  removeLayer,
} from '../../modules/layers/actions';
import OrbitTrack from './orbit-track';
import Zot from './zot';
import { isVectorLayerClickable } from '../../modules/layers/util';
import { MODAL_PROPERTIES } from '../../modules/alerts/constants';
import { getActiveLayers } from '../../modules/layers/selectors';

const { events } = util;
const { vectorModalProps } = MODAL_PROPERTIES;
const visibilityButtonClasses = 'hdanchor hide hideReg bank-item-img';
const getItemStyle = (isDragging, draggableStyle) => ({
  // some basic styles to make the items look a bit nicer
  ...draggableStyle,
  position: isDragging ? 'absolute' : 'relative',
  top: null,
  left: null,
});

function LayerRow (props) {
  const {
    compare,
    layer,
    compareState,
    paletteLegends,
    getPalette,
    palette,
    renderedPalette,
    requestPalette,
    isCustomPalette,
    isLoading,
    isMobile,
    zot,
    names,
    onRemoveClick,
    onInfoClick,
    onOptionsClick,
    hasClickableFeature,
    openVectorAlertModal,
    toggleVisibility,
    isDisabled,
    isVisible,
    index,
    hasPalette,
    isInProjection,
    tracksForLayer,
    isVectorLayer,
    runningObject,
  } = props;

  const encodedLayerId = util.encodeId(layer.id);
  const [showButtons, toggleShowButtons] = useState(isMobile);

  const getPaletteLegend = () => {
    if (!lodashIsEmpty(renderedPalette)) {
      const isRunningData = compare.active
        ? compare.activeString === compareState && !!runningObject
        : !!runningObject;
      const colorHex = isRunningData ? runningObject.paletteHex : null;
      return (
        <PaletteLegend
          layer={layer}
          compareState={compareState}
          paletteId={palette.id}
          getPalette={getPalette}
          width={zot ? 220 : 231}
          paletteLegends={paletteLegends}
          isCustomPalette={isCustomPalette}
          isRunningData={isRunningData}
          colorHex={colorHex}
          isMobile={isMobile}
        />
      );
    }
  };

  useEffect(() => {
    if (!isLoading && layer && hasPalette) requestPalette(layer.id);
  }, [layer]);

  const getDisabledTitle = (layer) => {
    const {
      endDate,
      period,
      startDate,
    } = layer;

    // start date
    let layerStartDate;
    if (startDate) {
      layerStartDate = util.coverageDateFormatter('START-DATE', startDate, period);
    }
    // end date
    let layerEndDate;
    if (endDate) {
      layerEndDate = util.coverageDateFormatter('END-DATE', endDate, period);
    }

    if (layerStartDate && layerEndDate) {
      return `Data available between ${layerStartDate} - ${layerEndDate}`;
    } if (layerStartDate) {
      return `Data available between ${layerStartDate} - Present`;
    }
    return 'No data on selected date for this layer';
  };

  const stopPropagation = (e) => {
    e.nativeEvent.stopImmediatePropagation();
    e.stopPropagation();
    e.preventDefault();
  };

  const renderControls = () => {
    const { title } = names;
    const removeLayerBtnId = `close-${compareState}${encodedLayerId}`;
    const removeLayerBtnTitle = 'Remove Layer';

    const layerOptionsBtnId = `layer-options-btn-${encodedLayerId}`;
    const layerOptionsBtnTitle = 'View Options';

    const layerInfoBtnId = `layer-info-btn-${encodedLayerId}`;
    const layerInfoBtnTitle = 'View Description';

    return (
      <>
        <a
          id={removeLayerBtnId}
          arira-label={removeLayerBtnTitle}
          className="button wv-layers-close"
          onClick={() => onRemoveClick(layer.id)}
        >
          <UncontrolledTooltip placement="top" target={removeLayerBtnId}>
            {removeLayerBtnTitle}
          </UncontrolledTooltip>
          <FontAwesomeIcon icon="times" fixedWidth />
        </a>
        <a
          id={layerOptionsBtnId}
          aria-label={layerOptionsBtnTitle}
          className={isMobile ? 'hidden wv-layers-options' : 'button wv-layers-options'}
          onMouseDown={stopPropagation}
          onClick={() => onOptionsClick(layer, title)}
        >
          <UncontrolledTooltip placement="top" target={layerOptionsBtnId}>
            {layerOptionsBtnTitle}
          </UncontrolledTooltip>
          <FontAwesomeIcon icon="sliders-h" className="wv-layers-options-icon" />
        </a>
        <a
          id={layerInfoBtnId}
          aria-label={layerInfoBtnTitle}
          className={isMobile ? 'hidden wv-layers-info' : 'button wv-layers-info'}
          onMouseDown={stopPropagation}
          onClick={() => onInfoClick(layer, title)}
        >
          <UncontrolledTooltip placement="top" target={layerInfoBtnId}>
            {layerInfoBtnTitle}
          </UncontrolledTooltip>
          <FontAwesomeIcon icon="info" className="wv-layers-info-icon" />
        </a>
      </>
    );
  };

  const renderVectorIcon = () => {
    const classNames = hasClickableFeature
      ? 'layer-pointer-icon'
      : 'layer-pointer-icon disabled';
    const title = hasClickableFeature
      ? 'You can click the features of this layer to see associated metadata.'
      : 'Zoom in further to click features.';
    const layerVectorBtnId = `layer-vector-hand-btn-${encodedLayerId}`;
    return (
      <div
        id={layerVectorBtnId}
        aria-label={title}
        className={runningObject ? `${classNames} running` : classNames}
        onMouseDown={stopPropagation}
        onClick={openVectorAlertModal}
      >
        <UncontrolledTooltip placement="top" target={layerVectorBtnId}>
          {title}
        </UncontrolledTooltip>
        <FontAwesomeIcon icon="hand-pointer" fixedWidth />
      </div>
    );
  };

  const mouseOver = () => {
    if (isMobile) return;
    events.trigger('sidebar:layer-hover', layer.id, true);
    toggleShowButtons(true);
  };

  const mouseLeave = () => {
    if (isMobile) return;
    events.trigger('sidebar:layer-hover', layer.id, false);
    toggleShowButtons(false);
  };

  const baseClasses = 'item productsitem';
  const containerClass = isDisabled
    ? `${baseClasses} disabled layer-hidden`
    : !isVisible
      ? `${baseClasses} layer-hidden`
      : zot
        ? `${baseClasses} layer-enabled layer-visible zotted`
        : `${baseClasses} layer-enabled layer-visible`;
  const visibilityToggleClass = isDisabled
    ? `${visibilityButtonClasses} layer-hidden`
    : !isVisible
      ? `${visibilityButtonClasses} layer-hidden`
      : `${visibilityButtonClasses} layer-enabled layer-visible`;
  const visibilityTitle = !isVisible && !isDisabled
    ? 'Show Layer'
    : isDisabled
      ? getDisabledTitle(layer)
      : 'Hide Layer';
  const visibilityIconClass = isDisabled
    ? 'ban'
    : !isVisible
      ? ['far', 'eye-slash']
      : ['far', 'eye'];


  const renderLayerRow = () => (
    <>
      <a
        id={`hide${encodedLayerId}`}
        className={visibilityToggleClass}
        aria-label={visibilityTitle}
        onClick={() => toggleVisibility(layer.id, !isVisible)}
      >
        <UncontrolledTooltip
          placement="right"
          target={`hide${encodedLayerId}`}
        >
          {visibilityTitle}
        </UncontrolledTooltip>
        <FontAwesomeIcon icon={visibilityIconClass} className="layer-eye-icon" />
      </a>

      <Zot zot={zot} layer={layer.id} isMobile={isMobile} />

      <div className="layer-main">
        <div className="layer-info" style={{ minHeight: isVectorLayer ? '60px' : '40px' }}>
          <div className="layer-buttons">
            {showButtons && renderControls()}
          </div>
          <h4 title={names.title}>{names.title}</h4>
          <p dangerouslySetInnerHTML={{ __html: names.subtitle }} />
          {hasPalette ? getPaletteLegend() : ''}
        </div>
        {isVectorLayer && isVisible ? renderVectorIcon() : null}
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
    </>
  );

  return (
    <Draggable
      draggableId={`${encodedLayerId}-${compareState}`}
      index={index}
      direction="vertical"
    >
      {(provided, snapshot) => (isInProjection ? (
        <li
          id={`${compareState}-${encodedLayerId}`}
          className={containerClass}
          style={getItemStyle(snapshot.isDragging, provided.draggableProps.style)}
          ref={provided.innerRef}
          onMouseOver={mouseOver}
          onMouseLeave={mouseLeave}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
        >
          {renderLayerRow()}
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

const mapStateToProps = (state, ownProps) => {
  const {
    layer,
    isVisible,
    compareState,
  } = ownProps;
  const {
    palettes, config, map, compare, proj,
  } = state;
  const hasPalette = !lodashIsEmpty(layer.palette);
  const renderedPalettes = palettes.rendered;
  const paletteName = lodashGet(config, `layers['${layer.id}'].palette.id`);
  const paletteLegends = hasPalette && renderedPalettes[paletteName]
    ? getPaletteLegends(layer.id, compareState, state)
    : [];
  const isCustomPalette = hasPalette && palettes.custom[layer.id];
  const selectedMap = lodashGet(map, 'ui.selected');
  const isVector = layer.type === 'vector';
  const mapRes = selectedMap ? selectedMap.getView().getResolution() : null;
  const tracksForLayer = getActiveLayers(state).filter(
    (activeLayer) => (layer.tracks || []).some((track) => activeLayer.id === track),
  );

  return {
    compare,
    tracksForLayer,
    layer,
    isVisible,
    paletteLegends,
    isCustomPalette,
    isLoading: palettes.isLoading[paletteName],
    renderedPalette: renderedPalettes[paletteName],
    isVectorLayer: isVector,
    hasClickableFeature: isVector && isVisible && isVectorLayerClickable(layer, mapRes, proj.id),
    isMobile: state.browser.lessThan.medium,
    hasPalette,
    getPalette: (layerId, i) => getPalette(layer.id, i, compareState, state),
  };
};

const mapDispatchToProps = (dispatch) => ({
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
});

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(LayerRow);

LayerRow.defaultProps = {
  palette: {},
};

LayerRow.propTypes = {
  compare: PropTypes.object,
  getPalette: PropTypes.func,
  hasPalette: PropTypes.bool,
  hover: PropTypes.func,
  index: PropTypes.number,
  isCustomPalette: PropTypes.bool,
  isDisabled: PropTypes.bool,
  isInProjection: PropTypes.bool,
  isLoading: PropTypes.bool,
  isMobile: PropTypes.bool,
  isVisible: PropTypes.bool,
  layer: PropTypes.object,
  compareState: PropTypes.string,
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
  zot: PropTypes.object,
  isVectorLayer: PropTypes.bool,
};
