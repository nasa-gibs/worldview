/* eslint-disable react/jsx-one-expression-per-line */
/* eslint-disable react/jsx-props-no-spreading */
/* eslint-disable react/no-danger */
import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Draggable } from 'react-beautiful-dnd';
import { isEmpty as lodashIsEmpty, get as lodashGet } from 'lodash';
import googleTagManager from 'googleTagManager';
import { connect } from 'react-redux';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  UncontrolledTooltip, Dropdown, DropdownToggle, DropdownMenu, DropdownItem,
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
import {
  getActiveLayers, makeGetDescription, getCollections,
} from '../../modules/layers/selectors';
import { coverageDateFormatter } from '../../modules/date/util';
import { SIDEBAR_LAYER_HOVER, MAP_RUNNING_DATA } from '../../util/constants';

const { events } = util;
const { vectorModalProps } = MODAL_PROPERTIES;
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
    collections,
    paletteLegends,
    getPalette,
    palette,
    renderedPalette,
    requestPalette,
    globalTemperatureUnit,
    isCustomPalette,
    isDistractionFreeModeActive,
    isEmbedModeActive,
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
    measurementDescriptionPath,
    isAnimating,
  } = props;

  const encodedLayerId = util.encodeId(layer.id);
  const { title } = names;
  const removeLayerBtnId = `close-${compareState}${encodedLayerId}`;
  const removeLayerBtnTitle = 'Remove Layer';
  const collectionIdentifierDescription = 'Dataset version and the source of data processing, Near Real-Time (NRT) or Standard (STD)';

  const layerOptionsBtnId = `layer-options-btn-${encodedLayerId}`;
  const layerOptionsBtnTitle = 'View Options';

  const layerInfoBtnId = `layer-info-btn-${encodedLayerId}`;
  const layerInfoBtnTitle = 'View Description';
  const [showButtons, toggleShowButtons] = useState(isMobile);
  const [showDropdownBtn, setDropdownBtnVisible] = useState(false);
  const [showDropdownMenu, setDropdownMenuVisible] = useState(false);
  const [runningDataObj, setRunningDataObj] = useState({});

  useEffect(() => {
    events.on(MAP_RUNNING_DATA, setRunningDataObj);
    return () => {
      events.off(MAP_RUNNING_DATA, setRunningDataObj);
    };
  }, []);

  const toggleDropdownMenuVisible = () => {
    if (showDropdownMenu) {
      setDropdownBtnVisible(false);
    }
    setDropdownMenuVisible(!showDropdownMenu);
  };

  const getPaletteLegend = () => {
    if (!lodashIsEmpty(renderedPalette)) {
      const runningDataForLayer = runningDataObj[layer.id];
      const isRunningData = compare.active
        ? compare.activeString === compareState && !!runningDataForLayer
        : !!runningDataForLayer;
      const colorHex = isRunningData ? runningDataForLayer.paletteHex : null;
      let width = zot ? 220 : 231;
      if (isEmbedModeActive) {
        width = 201;
      }
      return (
        <PaletteLegend
          layer={layer}
          compareState={compareState}
          paletteId={palette.id}
          getPalette={getPalette}
          width={width}
          paletteLegends={paletteLegends}
          isCustomPalette={isCustomPalette}
          isRunningData={isRunningData}
          colorHex={colorHex}
          globalTemperatureUnit={globalTemperatureUnit}
          isDistractionFreeModeActive={isDistractionFreeModeActive}
          isEmbedModeActive={isEmbedModeActive}
          isMobile={isMobile}
        />
      );
    }
  };

  useEffect(() => {
    // Request the layer palette only if it hasn't been loaded and is not currently being loaded
    if (!isLoading && layer && hasPalette && lodashIsEmpty(renderedPalette)) {
      requestPalette(layer.id);
    }
  }, [layer.id]);

  const getDisabledTitle = (layer) => {
    const {
      endDate,
      period,
      startDate,
    } = layer;

    // start date
    let layerStartDate;
    if (startDate) {
      layerStartDate = coverageDateFormatter('START-DATE', startDate, period);
    }
    // end date
    let layerEndDate;
    if (endDate) {
      layerEndDate = coverageDateFormatter('END-DATE', endDate, period);
    }

    if (layerStartDate && layerEndDate) {
      return (<> Data available between <br /> {layerStartDate} - {layerEndDate} </>);
    } if (layerStartDate) {
      return (<> Data available between <br /> {layerStartDate} - Present </>);
    }
    return 'No data on selected date for this layer';
  };

  const stopPropagation = (e) => {
    e.nativeEvent.stopImmediatePropagation();
    e.stopPropagation();
    e.preventDefault();
  };

  const renderDropdownMenu = () => (
    <Dropdown className="layer-group-more-options" isOpen={showDropdownMenu} toggle={toggleDropdownMenuVisible}>
      <DropdownToggle>
        <FontAwesomeIcon
          className="layer-group-more"
          icon="ellipsis-v"
        />
      </DropdownToggle>
      <DropdownMenu container="body" className="layer-options-dropdown-menu">
        <DropdownItem
          id={layerInfoBtnId}
          aria-label={layerInfoBtnTitle}
          className="button wv-layers-info layer-options-dropdown-item"
          onClick={() => onInfoClick(layer, title, measurementDescriptionPath)}
        >
          {layerInfoBtnTitle}
        </DropdownItem>
        <DropdownItem
          id={layerOptionsBtnId}
          aria-label={layerOptionsBtnTitle}
          className="button wv-layers-options layer-options-dropdown-item"
          onClick={() => onOptionsClick(layer, title)}
        >
          {layerOptionsBtnTitle}
        </DropdownItem>
        <DropdownItem
          id={removeLayerBtnId}
          onClick={() => onRemoveClick(layer.id)}
          className="button wv-layers-options layer-options-dropdown-item"
        >
          {removeLayerBtnTitle}
        </DropdownItem>
      </DropdownMenu>
    </Dropdown>
  );

  const renderControls = () => !isAnimating && (
    <>
      {showDropdownBtn || isMobile ? renderDropdownMenu() : null}
      <a
        id={removeLayerBtnId}
        aria-label={removeLayerBtnTitle}
        className={isMobile ? 'hidden wv-layers-options' : 'button wv-layers-close'}
        onClick={() => onRemoveClick(layer.id)}
      >
        <UncontrolledTooltip id="center-align-tooltip" placement="top" target={removeLayerBtnId}>
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
        <UncontrolledTooltip id="center-align-tooltip" placement="top" target={layerOptionsBtnId}>
          {layerOptionsBtnTitle}
        </UncontrolledTooltip>
        <FontAwesomeIcon icon="sliders-h" className="wv-layers-options-icon" />
      </a>
      <a
        id={layerInfoBtnId}
        aria-label={layerInfoBtnTitle}
        className={isMobile ? 'hidden wv-layers-info' : 'button wv-layers-info'}
        onMouseDown={stopPropagation}
        onClick={() => onInfoClick(layer, title, measurementDescriptionPath)}
      >
        <UncontrolledTooltip id="center-align-tooltip" placement="top" target={layerInfoBtnId}>
          {layerInfoBtnTitle}
        </UncontrolledTooltip>
        <FontAwesomeIcon icon="fa-solid fa-info" className="wv-layers-info-icon" />
      </a>
    </>
  );

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
        className={runningDataObj ? `${classNames} running` : classNames}
        onMouseDown={stopPropagation}
        onClick={openVectorAlertModal}
      >
        <UncontrolledTooltip id="center-align-tooltip" placement="top" target={layerVectorBtnId}>
          {title}
        </UncontrolledTooltip>
        <FontAwesomeIcon icon="hand-pointer" fixedWidth />
      </div>
    );
  };

  const mouseOver = () => {
    if (isMobile) return;
    events.trigger(SIDEBAR_LAYER_HOVER, layer.id, true);
    toggleShowButtons(true);
  };

  const mouseLeave = () => {
    if (isMobile) return;
    events.trigger(SIDEBAR_LAYER_HOVER, layer.id, false);
    toggleShowButtons(false);
  };

  const getLayerItemClasses = () => {
    let baseClasses = 'item productsitem layer-enabled';
    if (isAnimating) baseClasses += ' disabled';
    if (!isVisible || isDisabled) {
      baseClasses += ' layer-hidden';
    } else {
      baseClasses += ' layer-visible';
    }
    if (zot) baseClasses += ' zotted';
    return baseClasses;
  };

  const getVisibilityToggleClass = () => {
    let baseClasses = 'visibility';
    if (isDisabled || isAnimating) {
      baseClasses += ' disabled';
    } else {
      baseClasses += ' layer-enabled';
    }
    if (isVisible && !isDisabled) {
      baseClasses += ' layer-visible';
    } else {
      baseClasses += ' layer-hidden';
    }
    return baseClasses;
  };

  const visibilityTitle = !isVisible && !isDisabled
    ? 'Show layer'
    : isDisabled
      ? getDisabledTitle(layer)
      : 'Hide layer';

  const visibilityIconClass = isDisabled
    ? 'ban'
    : !isVisible
      ? ['fas', 'eye-slash']
      : ['fas', 'eye'];

  const collectionClass = collections?.type === 'NRT' ? 'collection-title badge rounded-pill bg-secondary' : 'collection-title badge rounded-pill text-dark bg-light';

  const renderLayerRow = () => (
    <>
      {!isEmbedModeActive && (
        <a
          id={`hide${encodedLayerId}`}
          className={getVisibilityToggleClass()}
          aria-label={visibilityTitle}
          onClick={() => !isAnimating && !isDisabled && toggleVisibility(layer.id, !isVisible)}
        >
          {!isAnimating && (
          <UncontrolledTooltip
            id="center-align-tooltip"
            placement="right"
            target={`hide${encodedLayerId}`}
          >
            {visibilityTitle}
          </UncontrolledTooltip>
          )}
          <FontAwesomeIcon icon={visibilityIconClass} className="layer-eye-icon" />
        </a>
      )}

      <Zot zot={zot} layer={layer.id} isMobile={isMobile} />

      <div className={isVectorLayer ? 'layer-main wv-vector-layer' : 'layer-main'}>
        <div className="layer-info" style={{ minHeight: isVectorLayer ? '60px' : '40px' }}>
          <div className="layer-buttons">
            {showButtons && renderControls()}
          </div>
          <h4 title={names.title}>{names.title}</h4>
          <div className="instrument-collection">
            <p dangerouslySetInnerHTML={{ __html: names.subtitle }} />

            {collections && isVisible ? (
              <h6>
                <span id="collection-identifier" className={collectionClass}>
                  {collections.version} {collections.type}
                  <UncontrolledTooltip id="center-align-tooltip" placement="right" target="collection-identifier" boundariesElement="wv-content" delay={{ show: 250, hide: 0 }}>
                    {collectionIdentifierDescription}
                  </UncontrolledTooltip>
                </span>
              </h6>
            ) : ''}
          </div>

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
      isDragDisabled={isEmbedModeActive || isAnimating}
      draggableId={`${encodedLayerId}-${compareState}`}
      index={index}
      direction="vertical"
    >
      {(provided, snapshot) => (isInProjection ? (
        <li
          id={`${compareState}-${encodedLayerId}`}
          className={getLayerItemClasses()}
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

const makeMapStateToProps = () => {
  const getDescriptionPath = makeGetDescription();
  return (state, ownProps) => {
    const {
      layer,
      isVisible,
      compareState,
    } = ownProps;
    const {
      screenSize, palettes, config, embed, map, compare, proj, ui, settings, animation, layers, date,
    } = state;
    const isMobile = screenSize.isMobileDevice;
    const { isDistractionFreeModeActive } = ui;
    const globalTemperatureUnit = lodashGet(ownProps, 'layer.disableUnitConversion') ? '' : settings.globalTemperatureUnit;
    const hasPalette = !lodashIsEmpty(layer.palette);
    const renderedPalettes = palettes.rendered;
    const paletteName = lodashGet(config, `layers['${layer.id}'].palette.id`);
    const paletteLegends = hasPalette && renderedPalettes[paletteName]
      ? getPaletteLegends(layer.id, compareState, state)
      : [];
    const isCustomPalette = hasPalette && palettes.custom[layer.id];
    const { isEmbedModeActive } = embed;
    const selectedMap = lodashGet(map, 'ui.selected');
    const isVector = layer.type === 'vector';
    const mapRes = selectedMap ? selectedMap.getView().getResolution() : null;
    const tracksForLayer = getActiveLayers(state).filter(
      (activeLayer) => (layer.orbitTracks || []).some((track) => activeLayer.id === track),
    );
    const activeDate = compare.activeString === 'active' ? date.selected : date.selectedB;
    const convertedDate = activeDate.toISOString().split('T')[0];
    const collections = getCollections(layers, convertedDate, layer);
    const measurementDescriptionPath = getDescriptionPath(state, ownProps);

    return {
      compare,
      collections,
      tracksForLayer,
      measurementDescriptionPath,
      globalTemperatureUnit,
      isCustomPalette,
      isDistractionFreeModeActive,
      isEmbedModeActive,
      isLoading: palettes.isLoading[paletteName],
      isMobile,
      isVisible,
      isVectorLayer: isVector,
      isAnimating: animation.isPlaying,
      hasClickableFeature: isVector && isVisible && isVectorLayerClickable(layer, mapRes, proj.id, isMobile),
      hasPalette,
      getPalette: (layerId, i) => getPalette(layer.id, i, compareState, state),
      paletteLegends,
      renderedPalette: renderedPalettes[paletteName],
    };
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
        modalClassName: ' sidebar-modal layer-settings-modal',
        timeout: 150,
        bodyComponentProps: {
          layer,
        },
      }),
    );
  },
  onInfoClick: (layer, title, measurementDescriptionPath) => {
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
        modalClassName: ' sidebar-modal layer-info-modal',
        timeout: 150,
        size: 'lg',
        bodyComponentProps: {
          layer,
          measurementDescriptionPath,
        },
      }),
    );
  },
  requestPalette: (id) => {
    dispatch(requestPalette(id));
  },
});

export default connect(
  makeMapStateToProps,
  mapDispatchToProps,
)(LayerRow);

LayerRow.defaultProps = {
  palette: {},
};

LayerRow.propTypes = {
  compare: PropTypes.object,
  getPalette: PropTypes.func,
  hasPalette: PropTypes.bool,
  globalTemperatureUnit: PropTypes.string,
  hover: PropTypes.func,
  index: PropTypes.number,
  isCustomPalette: PropTypes.bool,
  isDisabled: PropTypes.bool,
  isDistractionFreeModeActive: PropTypes.bool,
  isEmbedModeActive: PropTypes.bool,
  isInProjection: PropTypes.bool,
  isLoading: PropTypes.bool,
  isMobile: PropTypes.bool,
  isVisible: PropTypes.bool,
  layer: PropTypes.object,
  collections: PropTypes.object,
  compareState: PropTypes.string,
  measurementDescriptionPath: PropTypes.string,
  names: PropTypes.object,
  onInfoClick: PropTypes.func,
  onOptionsClick: PropTypes.func,
  onRemoveClick: PropTypes.func,
  palette: PropTypes.object,
  paletteLegends: PropTypes.array,
  renderedPalette: PropTypes.object,
  requestPalette: PropTypes.func,
  toggleVisibility: PropTypes.func,
  hasClickableFeature: PropTypes.bool,
  tracksForLayer: PropTypes.array,
  openVectorAlertModal: PropTypes.func,
  zot: PropTypes.object,
  isVectorLayer: PropTypes.bool,
  isAnimating: PropTypes.bool,
};
