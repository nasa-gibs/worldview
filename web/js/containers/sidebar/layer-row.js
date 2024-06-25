/* eslint-disable react/jsx-one-expression-per-line */
/* eslint-disable react/jsx-props-no-spreading */
/* eslint-disable react/no-danger */
import React, { useState, useEffect } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { Draggable } from 'react-beautiful-dnd';
import { isEmpty as lodashIsEmpty, get as lodashGet } from 'lodash';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  UncontrolledTooltip, Dropdown, DropdownToggle, DropdownMenu, DropdownItem,
} from 'reactstrap';
import { faToggleOn, faToggleOff } from '@fortawesome/free-solid-svg-icons';
import googleTagManager from 'googleTagManager';
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
import { formatDailyDate, formatSubdailyDate } from '../../mapUI/components/kiosk/tile-measurement/utils/date-util';
import { coverageDateFormatter } from '../../modules/date/util';
import { SIDEBAR_LAYER_HOVER, MAP_RUNNING_DATA } from '../../util/constants';
import {
  updateActiveChartingLayerAction,
} from '../../modules/charting/actions';
import AlertUtil from '../../components/util/alert';
import {
  enableDDVZoomAlert, enableDDVLocationAlert, disableDDVLocationAlert, disableDDVZoomAlert,
} from '../../modules/alerts/actions';

const { events } = util;
const { vectorModalProps, granuleModalProps, zoomModalProps } = MODAL_PROPERTIES;
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
    ddvLocationAlerts,
    ddvZoomAlerts,
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
    openGranuleAlertModal,
    openZoomAlertModal,
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
    palettes,
    isChartingActive,
    activeChartingLayer,
    updateActiveChartingLayer,
    enableDDVZoomAlert,
    enableDDVLocationAlert,
    disableDDVLocationAlert,
    disableDDVZoomAlert,
    map,
    selectedDate,
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
  const [disabled, setDisabled] = useState(isDisabled);
  const [activeZot, setActiveZot] = useState(zot);
  const [showZoomAlert, setShowZoomAlert] = useState(false);
  const [showGranuleAlert, setShowGranuleAlert] = useState(false);
  const [hideZoomAlert, setHideZoomAlert] = useState(false);
  const [hideGranuleAlert, setHideGranuleAlert] = useState(false);

  const ddvLayerZoomNoticeActive = ddvZoomAlerts.includes(layer.title);
  const ddvLayerLocationNoticeActive = ddvLocationAlerts.includes(layer.title);
  // All DDV layer notices are dismissable + Reflectance (Nadir BRDF-Adjusted) + DSWx-HLS
  const isLayerNotificationDismissable = layer.type === 'titiler' || layer.title === 'Reflectance (Nadir BRDF-Adjusted)' || layer.subtitle === 'DSWx-HLS';

  useEffect(() => {
    const asyncFunc = async () => {
      if (layer.enableCMRDataFinder && isVisible) {
        const conceptID = layer?.conceptIds?.[0]?.value || layer?.collectionConceptID;
        const dateTime = selectedDate?.toISOString().split('T');
        dateTime.pop();
        dateTime.push('00:00:00.000Z');
        const zeroedDate = dateTime.join('T');
        const maxExtent = [-180, -90, 180, 90];
        // clamp extent to maximum extent allowed by the CMR api
        const extent = map.extent.map((coord, i) => {
          const condition = i <= 1 ? coord > maxExtent[i] : coord < maxExtent[i];
          if (condition) {
            return coord;
          }
          return maxExtent[i];
        });
        const olderUrl = `https://cmr.earthdata.nasa.gov/search/granules.json?collection_concept_id=${conceptID}&bounding_box=${extent.join(',')}&temporal=P0Y0M0DT0H0M/${zeroedDate}&sort_key=-start_date&pageSize=1`;
        const newerUrl = `https://cmr.earthdata.nasa.gov/search/granules.json?collection_concept_id=${conceptID}&bounding_box=${extent.join(',')}&temporal=${zeroedDate}/P0Y0M1DT0H0M&sort_key=-start_date&pageSize=1`;
        const headers = { 'Client-Id': 'Worldview' };
        const requests = [fetch(olderUrl, { headers }), fetch(newerUrl, { headers })];
        const responses = await Promise.allSettled(requests);
        const [olderRes, newerRes] = responses.filter(({ status }) => status === 'fulfilled').map(({ value }) => value);
        if (!olderRes.ok || !newerRes.ok) return;
        const jsonRequests = [olderRes.json(), newerRes.json()];
        const jsonResponses = await Promise.allSettled(jsonRequests);
        const [olderGranules, newerGranules] = jsonResponses.filter(({ status }) => status === 'fulfilled').map(({ value }) => value);
        const olderEntries = olderGranules?.feed?.entry || [];
        const newerEntries = newerGranules?.feed?.entry || [];
        const granules = [...olderEntries, ...newerEntries];
        if (zot?.underZoomValue > 0) {
          setShowZoomAlert(true);
        } else {
          setShowZoomAlert(false);
        }
        if (!granules.length && !(zot?.underZoomValue > 0)) {
          setActiveZot({ hasGranules: false });
          setShowGranuleAlert(true);
        } else {
          setActiveZot(zot);
          setShowGranuleAlert(false);
        }
        if (!granules.length || zot?.underZoomValue > 0) {
          setDisabled(true);
        } else {
          setDisabled(isDisabled);
        }
      }
    };
    asyncFunc();
  }, [map.extent, zot, selectedDate, isVisible]);

  // hook that checks if the ddv layer zoom alert should be enabled or disabled
  useEffect(() => {
    const { title } = layer;
    // if layer is ddv && layer IS NOT already in zoom alert list && zoom is at alertable level
    if (isLayerNotificationDismissable && !ddvLayerZoomNoticeActive && showZoomAlert) {
      enableDDVZoomAlert(title);
    // if layer is ddv && layer IS already in zoom alert list && zoom is NOT at alertable level
    } else if (isLayerNotificationDismissable && ddvLayerZoomNoticeActive && !showZoomAlert) {
      disableDDVZoomAlert(title);
    }
  }, [showZoomAlert]);

  // hook that checks if the ddv layer location alert should be enabled or disabled
  useEffect(() => {
    const { title } = layer;
    // if layer is ddv && layer IS NOT already in location alert list && location is at alertable coordinates
    if (isLayerNotificationDismissable && !ddvLayerLocationNoticeActive && showGranuleAlert) {
      enableDDVLocationAlert(title);
      // if layer is ddv && layer IS NOT already in location alert list && location is at alertable coordinates
    } else if (isLayerNotificationDismissable && ddvLayerLocationNoticeActive && !showGranuleAlert) {
      disableDDVLocationAlert(title);
    }
  }, [showGranuleAlert]);

  useEffect(() => {
    events.on(MAP_RUNNING_DATA, setRunningDataObj);
    return () => {
      events.off(MAP_RUNNING_DATA, setRunningDataObj);
    };
  }, []);

  useEffect(() => {
    setDisabled(isDisabled);
  }, [isDisabled]);

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
      let width = activeZot || zot ? 220 : 231;
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
          palettes={palettes}
          showingVectorHand={isVectorLayer && isVisible}
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

  // function called on click when removing a layer
  const removeLayer = () => {
    const { id, title } = layer;
    // remove ddv location alert
    if (ddvLayerLocationNoticeActive) {
      disableDDVLocationAlert(title);
    }
    // remove ddv zoom alert
    if (ddvLayerZoomNoticeActive) {
      disableDDVZoomAlert(title);
    }
    // remove layer
    onRemoveClick(id);
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
          onClick={() => onOptionsClick(layer, title, zot)}
        >
          {layerOptionsBtnTitle}
        </DropdownItem>
        <DropdownItem
          id={removeLayerBtnId}
          onClick={() => removeLayer()}
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
      {!isChartingActive && (
      <a
        id={removeLayerBtnId}
        aria-label={removeLayerBtnTitle}
        className={isMobile ? 'hidden wv-layers-options' : 'button wv-layers-close'}
        onClick={() => removeLayer()}
      >
        <UncontrolledTooltip id="center-align-tooltip" placement="top" target={removeLayerBtnId}>
          {removeLayerBtnTitle}
        </UncontrolledTooltip>
        <FontAwesomeIcon icon="times" fixedWidth />
      </a>
      )}
      <a
        id={layerOptionsBtnId}
        aria-label={layerOptionsBtnTitle}
        className={isMobile ? 'hidden wv-layers-options' : 'button wv-layers-options'}
        onMouseDown={stopPropagation}
        onClick={() => onOptionsClick(layer, title, zot)}
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
    if (!isVisible || disabled) {
      baseClasses += ' layer-hidden';
    } else {
      baseClasses += ' layer-visible';
    }
    if (activeZot || zot) baseClasses += ' zotted';
    return baseClasses;
  };

  const getVisibilityToggleClass = () => {
    let baseClasses = 'visibility';
    if (disabled || isAnimating) {
      baseClasses += ' disabled';
    } else {
      baseClasses += ' layer-enabled';
    }
    if (isVisible && !disabled) {
      baseClasses += ' layer-visible';
    } else {
      baseClasses += ' layer-hidden';
    }
    return baseClasses;
  };

  const visibilityTitle = !isVisible && !disabled
    ? 'Show layer'
    : disabled
      ? getDisabledTitle(layer)
      : 'Hide layer';

  const visibilityIconClass = disabled
    ? 'ban'
    : !isVisible
      ? ['fas', 'eye-slash']
      : ['fas', 'eye'];

  const collectionClass = collections?.type === 'NRT' ? 'collection-title badge rounded-pill bg-secondary' : 'collection-title badge rounded-pill text-dark bg-light';

  const makeActiveForCharting = (layer) => {
    if (layer !== activeChartingLayer) {
      updateActiveChartingLayer(layer);
    }
  };

  const renderLayerRow = () => (
    <>
      {(!isEmbedModeActive && !isChartingActive) && (
        <a
          id={`hide${encodedLayerId}`}
          className={getVisibilityToggleClass()}
          aria-label={visibilityTitle}
          onClick={() => !isAnimating && !disabled && toggleVisibility(layer.id, !isVisible)}
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
      {isChartingActive && (
        <>
          <div />
          <a
            id={`activate-${encodedLayerId}`}
            className={layer.id === activeChartingLayer ? 'layer-visible visibility active-chart' : 'layer-visible visibility'}
            onClick={() => makeActiveForCharting(layer.id)}
          >
            <UncontrolledTooltip
              id="center-align-tooltip"
              placement="right"
              target={`activate-${encodedLayerId}`}
            >
              Select layer for processing
            </UncontrolledTooltip>
            {/* <FontAwesomeIcon icon="fa-solid fa-circle-dot" className="fa-circle-dot" /> */}
            {layer.id === activeChartingLayer ? (
              <FontAwesomeIcon
                icon={faToggleOn}
                className="charting-indicator"
              />
            ) : (
              <FontAwesomeIcon
                icon={faToggleOff}
                className="charting-indicator"
              />
            )}
          </a>
        </>
      )}
      <Zot zot={activeZot || zot} layer={layer.id} isMobile={isMobile} />

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
        {showZoomAlert && !hideZoomAlert && !isLayerNotificationDismissable && (
          <AlertUtil
            id="zoom-alert"
            isOpen
            title="Zoom in to see imagery for this layer"
            messageTitle={layer.title}
            message="Imagery is not available at this zoom level."
            onDismiss={() => setHideZoomAlert(true)}
            onClick={openZoomAlertModal}
          />
        )}
        {showGranuleAlert && !hideGranuleAlert && !isLayerNotificationDismissable && (
          <AlertUtil
            id="granule-alert"
            isOpen
            title="Try moving the map or select a different date in the layer's settings."
            messageTitle={layer.title}
            message="Imagery is not available at this location or date."
            onDismiss={() => setHideGranuleAlert(true)}
            onClick={openGranuleAlertModal}
          />
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
    const dailyDate = formatDailyDate(activeDate);
    const selectedDate = date.selected;
    const subdailyDate = formatSubdailyDate(activeDate);
    const collections = getCollections(layers, dailyDate, subdailyDate, layer, proj.id);
    const measurementDescriptionPath = getDescriptionPath(state, ownProps);
    const { ddvZoomAlerts, ddvLocationAlerts } = state.alerts;

    return {
      compare,
      collections,
      ddvLocationAlerts,
      ddvZoomAlerts,
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
      palettes,
      map,
      selectedDate,
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
  openGranuleAlertModal: () => {
    const { id, props } = granuleModalProps;
    dispatch(openCustomContent(id, props));
  },
  openZoomAlertModal: () => {
    const { id, props } = zoomModalProps;
    dispatch(openCustomContent(id, props));
  },
  onRemoveClick: (id) => {
    dispatch(removeLayer(id));
  },
  onOptionsClick: (layer, title, zot) => {
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
          zot,
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
  updateActiveChartingLayer: (layersId) => {
    dispatch(updateActiveChartingLayerAction(layersId));
  },
  enableDDVZoomAlert: (title) => {
    dispatch(enableDDVZoomAlert(title));
  },
  enableDDVLocationAlert: (title) => {
    dispatch(enableDDVLocationAlert(title));
  },
  disableDDVLocationAlert: (title) => {
    dispatch(disableDDVLocationAlert(title));
  },
  disableDDVZoomAlert: (title) => {
    dispatch(disableDDVZoomAlert(title));
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
  updateActiveChartingLayer: PropTypes.func,
  palette: PropTypes.object,
  palettes: PropTypes.object,
  paletteLegends: PropTypes.array,
  renderedPalette: PropTypes.object,
  requestPalette: PropTypes.func,
  toggleVisibility: PropTypes.func,
  hasClickableFeature: PropTypes.bool,
  tracksForLayer: PropTypes.array,
  openVectorAlertModal: PropTypes.func,
  openGranuleAlertModal: PropTypes.func,
  zot: PropTypes.object,
  isVectorLayer: PropTypes.bool,
  isAnimating: PropTypes.bool,
  isChartingActive: PropTypes.bool,
  activeChartingLayer: PropTypes.string,
  enableDDVZoomAlert: PropTypes.func,
  enableDDVLocationAlert: PropTypes.func,
  isDDVLocationAlertPresent: PropTypes.bool,
  isDDVZoomAlertPresent: PropTypes.bool,
  openZoomAlertModal: PropTypes.func,
};
