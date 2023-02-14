/* eslint-disable react/no-did-update-set-state */
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import * as olProj from 'ol/proj';
import { isEqual as lodashEqual } from 'lodash';
import googleTagManager from 'googleTagManager';
import moment from 'moment';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Spinner, UncontrolledTooltip } from 'reactstrap';
import Button from '../../components/util/button';
import Checkbox from '../../components/util/checkbox';
import Crop from '../../components/util/image-crop';
import AlertUtil from '../../components/util/alert';
import util from '../../util/util';
import SmartHandoffModal from '../../components/smart-handoffs/smart-handoff-modal';
import SmartHandoffNotAvailableModal from '../../components/smart-handoffs/smart-handoff-not-available-modal';
import GranuleAlertModalBody from '../../components/smart-handoffs/smart-handoff-granule-alert';
import GranuleCount from '../../components/smart-handoffs/granule-count';
import { imageUtilGetCoordsFromPixelValues } from '../../modules/image-download/util';
import { onClose, openCustomContent } from '../../modules/modal/actions';
import { getActiveGranuleLayers } from '../../modules/layers/selectors';
import {
  getValidLayersForHandoffs,
  getConceptUrl as getConceptUrlSelector,
  getGranulesUrl as getGranulesUrlSelector,
} from '../../modules/smart-handoff/selectors';
import { getSelectedDate } from '../../modules/date/selectors';
import safeLocalStorage from '../../util/local-storage';
import openEarthDataSearch, { getStartEndDates } from '../../modules/smart-handoff/util';
import {
  selectCollection as selectCollectionAction,
  fetchAvailableTools as fetchAvailableToolsAction,
  validateLayersConceptIds as validateLayersConceptIdsAction,
} from '../../modules/smart-handoff/actions';
import { CRS } from '../../modules/map/constants';

import { formatDisplayDate } from '../../modules/date/util';

const STD_NRT_MAP = {
  STD: 'Standard',
  NRT: 'Near Real-Time',
};

/**
 * The Smart-Handoff component directs users to select specific layer products
 * in NASA's Earthdata Search web tool that will proceed in fetching corresponding
 * layer data and granule files that are available for download.
 */
class SmartHandoff extends Component {
  constructor(props) {
    super(props);

    const {
      screenWidth,
      screenHeight,
    } = props;

    this.state = {
      boundaries: {
        x: screenWidth / 2 - 100,
        y: screenHeight / 2 - 100,
        x2: screenWidth / 2 + 100,
        y2: screenHeight / 2 + 100,
      },
      currentExtent: {},
      coordinates: {},
      showBoundingBox: false,
      showZoomedIntoDatelineAlert: false,
      selectionOutsideExtents: false,
    };

    this.baseState = this.state;
    this.onBoundaryChange = this.onBoundaryChange.bind(this);
    this.onCheckboxToggle = this.onCheckboxToggle.bind(this);
    this.onClickDownload = this.onClickDownload.bind(this);
    this.updateExtent = this.updateExtent.bind(this);
  }

  componentDidMount() {
    const {
      proj, availableLayers, validateLayersConceptIds, fetchAvailableTools,
    } = this.props;
    fetchAvailableTools();
    validateLayersConceptIds(availableLayers);
    if (proj.id === 'geographic') {
      this.checkMapExtentValid();
    }
  }

  componentDidUpdate(prevProps) {
    const {
      availableLayers,
      proj,
      map,
      selectedLayer,
      selectedCollection,
      validateLayersConceptIds,
    } = this.props;

    // Determine if existing selected layer is active still and visibility toggle is 'ON'
    const isLayerStillActive = availableLayers.find(({ id }) => selectedLayer && selectedLayer.id);
    const layerChange = !lodashEqual(availableLayers, prevProps.availableLayers);

    if (layerChange) {
      validateLayersConceptIds(availableLayers);
    }
    if (selectedCollection && !isLayerStillActive) {
      this.setState(this.baseState);
    }
    if (proj.id !== prevProps.proj.id) {
      const projChangeStateUpdate = { showBoundingBox: false };
      if (proj.id !== 'geographic') {
        projChangeStateUpdate.showZoomedIntoDatelineAlert = false;
      }
      this.setState(projChangeStateUpdate);
    }

    if (proj.id === 'geographic') {
      const extentChange = !lodashEqual(map.extent, prevProps.map.extent);
      if (extentChange) {
        this.checkMapExtentValid();
      }
    }
  }

  /**
   * Check if entire map extent is over dateline (within a wing)
   *
   * @returns {Boolean} is map extent within wing
   */
  checkMapExtentValid = () => {
    const { map: { extent }, proj: { maxExtent } } = this.props;
    const inLeftWing = extent[0] < maxExtent[0] && extent[2] < maxExtent[0];
    const inRightWing = extent[0] > maxExtent[2] && extent[2] > maxExtent[2];
    const isWithinWings = inLeftWing || inRightWing;
    this.setState({ showZoomedIntoDatelineAlert: isWithinWings });
  };

  /**
   * Fires when the bounding box / crop toggle is activated and changed
   */
  updateExtent(coordinates, boundaries, extent) {
    const newState = { boundaries, coordinates };
    if (extent) {
      newState.currentExtent = extent;
    }
    this.setState(newState);
  }

  /**
   * Fires when the image cropper is moved around on the map; updates the SW and NE lat/lon coordinates.
   * @param {*} boundaries - the focal point to which layer data should be contained within
   * @param {boolean} setExtent - should the subsequent setState call set the extent, which will trigger
   *                              the granule count async requests
   */
  onBoundaryChange(boundaries, setExtent) {
    const { proj, map, selectedCollection } = this.props;

    if (!selectedCollection) return;

    const {
      x,
      y,
      width,
      height,
    } = boundaries;

    const newBoundaries = {
      x,
      y,
      x2: width ? x + width : boundaries.x2,
      y2: height ? y + height : boundaries.y2,
    };

    const lonlats = imageUtilGetCoordsFromPixelValues(
      newBoundaries,
      map.ui.selected,
    );
    const { crs } = proj;

    // Retrieve the lat/lon coordinates based on the defining boundary and map projection
    const bottomLeft = olProj.transform(lonlats[0], crs, CRS.GEOGRAPHIC);
    const topRight = olProj.transform(lonlats[1], crs, CRS.GEOGRAPHIC);
    let [x1, y1] = bottomLeft;
    let [x2, y2] = topRight;

    const entireSelectionOutside = x1 > 180 || x2 < -180 || y1 > 90 || y2 < -90;

    // Determine longitude out of bounds areas and reset to limits
    if (x1 > 180) {
      x1 = 180;
    } else if (x1 < -180) {
      x1 = -180;
    }

    if (x2 > 180) {
      x2 = 180;
    } else if (x2 < -180) {
      x2 = -180;
    }

    // Determine latitude out of bounds areas and reset to limits
    if (y1 > 90) {
      y1 = 90;
    } else if (y1 < -90) {
      y1 = -90;
    }

    if (y2 > 90) {
      y2 = 90;
    } else if (y2 < -90) {
      y2 = -90;
    }

    this.updateSelectionAlerts(entireSelectionOutside);

    const extent = {
      southWest: `${x1.toFixed(5)},${y1.toFixed(5)}`,
      northEast: `${x2.toFixed(5)},${y2.toFixed(5)}`,
    };

    const coordinates = {
      bottomLeft: util.formatCoordinate([x1, y1]),
      topRight: util.formatCoordinate([x2, y2]),
    };

    if (selectedCollection && extent) {
      this.updateExtent(coordinates, newBoundaries, setExtent && extent);
    }
  }

  /**
   * Handle bounding box checkbox toggle
   */
  onCheckboxToggle() {
    const { showBoundingBox, boundaries } = this.state;
    if (!showBoundingBox) {
      googleTagManager.pushEvent({
        event: 'smart_handoffs_toggle_true_target_area',
      });
      this.setState({ showBoundingBox: true });
      this.onBoundaryChange(boundaries, true);
    } else {
      this.setState({
        showBoundingBox: false,
      });
    }
  }

  /**
   * Handle clicking 'Download Via Earthdata Search"
   * Will open warning/info modal or go directly to EDS (if modal was hidden by user)
   */
  onClickDownload() {
    const {
      availableTools,
      displayDate,
      isGranuleLayer,
      proj,
      selectedLayer,
      selectedCollection,
      startDate,
      endDate,
      showWarningModal,
    } = this.props;
    const {
      currentExtent,
      showBoundingBox,
    } = this.state;

    // Used to determine if the smart-handoff modal should be shown
    const { HIDE_EDS_WARNING } = safeLocalStorage.keys;
    const hideModal = safeLocalStorage.getItem(HIDE_EDS_WARNING);
    let useDisplayDate = displayDate;

    if (isGranuleLayer) {
      const formatGranuleStart = formatDisplayDate(startDate, isGranuleLayer);
      const formatGranuleEnd = formatDisplayDate(endDate, isGranuleLayer);
      useDisplayDate = `${formatGranuleStart} - ${formatGranuleEnd}`;
    }

    const continueToEDS = () => {
      const options = {
        projection: proj.crs,
        conceptId: selectedCollection.value,
        currentExtent,
        showBoundingBox,
        startDate,
        endDate,
      };
      return openEarthDataSearch(availableTools, options);
    };

    if (!hideModal) {
      showWarningModal(useDisplayDate, selectedLayer, selectedCollection, continueToEDS);
    } else {
      continueToEDS();
    }
  }

  /**
   * Determine if dateline alert updates are necessary
   *
   * @param {Boolean} selectionOutside
   * @param {Boolean} entireSelectionOutside
   */
  updateSelectionAlerts = (entireSelectionOutside) => {
    const { selectionOutsideExtents } = this.state;
    if (entireSelectionOutside !== selectionOutsideExtents) {
      this.setState({ selectionOutsideExtents: entireSelectionOutside });
    }
  };

  /**
   * Render alerts to indicate map view/area of interest outside visible extents
   * 1) The map view is zoomed entirely into the map wings
   * 2) The entire area of interest crossed the dateline
   */
  renderSelectionWarning = () => {
    const {
      showBoundingBox,
      selectionOutsideExtents,
      showZoomedIntoDatelineAlert,
    } = this.state;

    const message = showBoundingBox && selectionOutsideExtents && !showZoomedIntoDatelineAlert
      ? 'The selection is outside the available map area.'
      : showZoomedIntoDatelineAlert
        ? 'The map is zoomed into an area with no available data.'
        : '';

    return (selectionOutsideExtents || showZoomedIntoDatelineAlert) && message && (
    <AlertUtil
      id="data-download-unavailable-dateline-alert"
      isOpen
      title="Data Download Unavailable"
      message={message}
    />
    );
  };

  renderCollectionTooltip = ({ value, title }, tooltipTarget) => {
    const { getConceptUrl } = this.props;
    const url = value && `${getConceptUrl(value)}.html`;
    return url && (
      <UncontrolledTooltip
        id="center-align-tooltip"
        className="zot-tooltip"
        boundariesElement="window"
        target={tooltipTarget}
        placement="right"
        trigger="hover"
        autohide={false}
        delay={{ show: 50, hide: 500 }}
      >
        <div>{title}</div>
        <div>
          <a href={url} target="_blank" rel="noreferrer"> View Collection Details </a>
        </div>
      </UncontrolledTooltip>
    );
  };

  /**
   * Render radio buttons for layer selection
   */
  renderLayerChoices() {
    const {
      selectCollection,
      selectedCollection,
      selectedLayer,
      validatedConceptIds,
      validatedLayers,
    } = this.props;

    return (
      <div className="smart-handoff-layer-list">

        {validatedLayers.map((layer) => {
          const layerIsSelected = (selectedLayer || {}).id === layer.id;
          const itemClass = layerIsSelected ? 'layer-item selected' : 'layer-item';

          return (
            <div className={itemClass} key={`${util.encodeId(layer.id)}-layer-choice`}>
              <div className="layer-title">{layer.title}</div>
              <div className="layer-subtitle">{layer.subtitle}</div>

              {layer.conceptIds.filter(({ value }) => validatedConceptIds[value]).map((collection) => {
                const {
                  type, value, version, quality,
                } = collection;
                const inputId = `${util.encodeId(value)}-${util.encodeId(layer.id)}-collection-choice`;
                const isSelected = (selectedCollection || {}).value === value && layerIsSelected;
                const labelId = `${inputId}-label`;
                const label = STD_NRT_MAP[type]
                   + (version ? ` - v${version}` : '')
                   + (quality ? ' (Quality)' : '');

                return (
                  <div className="collection-choice" key={inputId}>
                    <input
                      id={inputId}
                      type="radio"
                      name="smart-handoff-layer-radio"
                      checked={isSelected}
                      onChange={() => selectCollection(collection.value, layer.id)}
                    />
                    <label id={labelId} htmlFor={inputId}>
                      {label}
                      <FontAwesomeIcon id={`${util.encodeId(value)}-tooltip`} icon="info-circle" />
                    </label>

                    {this.renderCollectionTooltip(collection, labelId)}
                  </div>
                );
              })}

            </div>
          );
        })}
      </div>
    );
  }

  /**
   * Render the checkbox to toggle the cropbox and the cropbox itself
   */
  renderCropBox() {
    const {
      proj,
      screenHeight,
      screenWidth,
      selectedLayer,
      selectedCollection,
    } = this.props;

    const {
      boundaries,
      coordinates,
      showBoundingBox,
    } = this.state;

    const {
      x, y, x2, y2,
    } = boundaries;

    return selectedCollection && selectedLayer && proj.id === 'geographic' && (
      <>
        <div className="smart-handoff-crop-toggle">
          <Checkbox
            id="chk-crop-toggle"
            label="Set Area of Interest"
            text="Toggle boundary selection."
            color="gray"
            checked={showBoundingBox}
            onCheck={this.onCheckboxToggle}
          />
        </div>

        { showBoundingBox && (
          <Crop
            x={x}
            y={y}
            width={x2 - x}
            height={y2 - y}
            maxHeight={screenHeight}
            maxWidth={screenWidth}
            onChange={this.onBoundaryChange}
            onDragStop={(crop) => {
              this.onBoundaryChange(crop, true);
            }}
            onClose={onClose}
            keepSelection
            bottomLeftStyle={{
              left: x,
              top: y2 + 5,
              width: x2 - x,
              zIndex: 2,
            }}
            topRightStyle={{
              left: x,
              top: y - 20,
              width: x2 - x,
              zIndex: 2,
            }}
            coordinates={coordinates}
            showCoordinates
            zIndex={1}
          />
        )}
        <hr />
      </>
    );
  }

  /**
   * Render "no layers to download" message
   */
  renderNoLayersToDownload = () => {
    const { showNotAvailableModal, requestFailed } = this.props;

    return (
      <div className="smart-handoff-side-panel error">
        {requestFailed
          ? (
            <h1>Data records from the Common Metadata Repository (CMR) could not be reached. Data downloads are not possible at this time.</h1>
          )
          : (
            <>
              <h1>
                None of your current layers are available for download.
              </h1>
              <hr />
              <h2>
                <a className="help-link" onClick={showNotAvailableModal}>
                  Why are my layers not available?
                </a>
              </h2>
            </>
          )}
      </div>
    );
  };

  renderLoadingSpinner = () => {
    const containerStyle = {
      padding: '30px 107px',
    };

    const spinnerStyle = {
      height: '5rem',
      width: '5rem',
      margin: '40px auto',
    };

    return (
      <div style={containerStyle}>
        <Spinner style={spinnerStyle} color="light" size="lg" />
      </div>
    );
  };

  /**
   * Default render which displays the download panel
   */
  render() {
    const {
      displayDate,
      getGranulesUrl,
      isLoading,
      granuleLayers,
      showNotAvailableModal,
      selectedLayer,
      selectedCollection,
      selectedDate,
      showGranuleHelpModal,
      startDate,
      endDate,
      validatedLayers,
    } = this.props;
    const {
      showBoundingBox, selectionOutsideExtents, showZoomedIntoDatelineAlert, currentExtent,
    } = this.state;

    // Determine if the download button is enabled
    const validSelection = showBoundingBox ? !selectionOutsideExtents && !showZoomedIntoDatelineAlert : !showZoomedIntoDatelineAlert;
    const isValidDownload = selectedLayer && selectedLayer.id && validSelection;

    if (isLoading) {
      return this.renderLoadingSpinner();
    }

    if (!validatedLayers.length) {
      return this.renderNoLayersToDownload();
    }

    return (
      <>
        {this.renderSelectionWarning()}
        <div className="smart-handoff-side-panel">
          <div className="esd-notification">
            Downloading data will be performed using
            <a href="https://search.earthdata.nasa.gov" target="_blank" rel="noopener noreferrer"> NASA&apos;s Earthdata Search </a>
            application.
          </div>
          <h2>
            <a className="help-link" onClick={showNotAvailableModal}>
              Why are some layers not available?
            </a>
          </h2>
          <hr />
          {this.renderLayerChoices()}
          <hr />
          {this.renderCropBox()}
          {isValidDownload && (
            <GranuleCount
              displayDate={displayDate}
              granuleLayers={granuleLayers}
              currentExtent={isValidDownload && showBoundingBox ? currentExtent : undefined}
              selectedDate={selectedDate}
              startDate={startDate}
              endDate={endDate}
              selectedCollection={selectedCollection}
              showGranuleHelpModal={showGranuleHelpModal}
              getGranulesUrl={getGranulesUrl}
            />
          )}
          <Button
            onClick={this.onClickDownload}
            text="DOWNLOAD VIA EARTHDATA SEARCH"
            className="download-btn red"
            valid={!!isValidDownload && !!selectedCollection}
          />
        </div>
      </>
    );
  }
}

const mapStateToProps = (state) => {
  const {
    screenSize, map, proj, smartHandoffs,
  } = state;
  const {
    conceptId, layerId, availableTools, validatedConceptIds, validatedLayers, isLoadingTools, isValidatingCollections, requestFailed,
  } = smartHandoffs;
  const { screenWidth, screenHeight } = screenSize;

  const granuleLayers = getActiveGranuleLayers(state);
  const selectedDate = getSelectedDate(state);
  const selectedDateFormatted = moment.utc(selectedDate).format('YYYY-MM-DD'); // 2020-01-01
  const availableLayers = getValidLayersForHandoffs(state);
  const selectedLayer = availableLayers.find(({ id }) => id === layerId);
  const selectedCollection = selectedLayer && (selectedLayer.conceptIds || []).find(({ value }) => value === conceptId);
  const isLoading = isLoadingTools || isValidatingCollections;
  const isGranuleLayer = selectedLayer && selectedLayer.type === 'granule';
  const { startDate, endDate } = selectedLayer
    ? getStartEndDates(selectedLayer, selectedDate, granuleLayers)
    : {};

  return {
    availableLayers,
    displayDate: formatDisplayDate(selectedDate), // 2020 JAN 01
    getConceptUrl: getConceptUrlSelector(state),
    getGranulesUrl: getGranulesUrlSelector(state),
    isLoading,
    isGranuleLayer,
    granuleLayers,
    map,
    proj: proj.selected,
    requestFailed,
    screenHeight,
    screenWidth,
    selectedDate: selectedDateFormatted,
    selectedLayer,
    selectedCollection,
    startDate,
    endDate,
    availableTools,
    validatedConceptIds,
    validatedLayers,
  };
};

const mapDispatchToProps = (dispatch) => ({
  selectCollection: (conceptId, layerId) => {
    dispatch(selectCollectionAction(conceptId, layerId));
  },
  fetchAvailableTools: () => {
    dispatch(fetchAvailableToolsAction());
  },
  validateLayersConceptIds: (layers) => {
    dispatch(validateLayersConceptIdsAction(layers));
  },
  showWarningModal: (displayDate, selectedLayer, selectedCollection, continueToEDS) => {
    googleTagManager.pushEvent({
      event: 'smart_handoffs_open_warning_modal',
    });
    dispatch(
      openCustomContent('transferring-to-earthdata-search', {
        headerText: 'Leaving @NAME@',
        bodyComponent: SmartHandoffModal,
        desktopOnly: true,
        bodyComponentProps: {
          displayDate,
          selectedLayer,
          selectedCollection,
          continueToEDS,
        },
        size: 'md',
      }),
    );
  },
  showNotAvailableModal: () => {
    dispatch(
      openCustomContent('layers-not-available', {
        desktopOnly: true,
        headerText: 'Data Download Availability',
        bodyComponent: SmartHandoffNotAvailableModal,
        size: 'md',
      }),
    );
  },
  showGranuleHelpModal: () => {
    googleTagManager.pushEvent({
      event: 'smart_handoffs_open_granule_help_link',
    });
    dispatch(
      openCustomContent('granule-help', {
        desktopOnly: true,
        headerText: 'Granule Availability',
        bodyComponent: GranuleAlertModalBody,
        size: 'md',
      }),
    );
  },
});

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(SmartHandoff);

SmartHandoff.propTypes = {
  availableLayers: PropTypes.array,
  availableTools: PropTypes.array,
  displayDate: PropTypes.string,
  isLoading: PropTypes.bool,
  isGranuleLayer: PropTypes.bool,
  endDate: PropTypes.string,
  getConceptUrl: PropTypes.func,
  getGranulesUrl: PropTypes.func,
  granuleLayers: PropTypes.object,
  map: PropTypes.object.isRequired,
  proj: PropTypes.object,
  fetchAvailableTools: PropTypes.func,
  requestFailed: PropTypes.bool,
  screenHeight: PropTypes.number,
  screenWidth: PropTypes.number,
  selectCollection: PropTypes.func,
  selectedDate: PropTypes.string,
  selectedLayer: PropTypes.object,
  selectedCollection: PropTypes.object,
  showWarningModal: PropTypes.func,
  showGranuleHelpModal: PropTypes.func,
  showNotAvailableModal: PropTypes.func,
  startDate: PropTypes.string,
  validatedLayers: PropTypes.array,
  validatedConceptIds: PropTypes.object,
  validateLayersConceptIds: PropTypes.func,
};
