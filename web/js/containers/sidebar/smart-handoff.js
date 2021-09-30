/* eslint-disable react/no-did-update-set-state */
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import * as olProj from 'ol/proj';
import { get as lodashGet, isEqual as lodashEqual } from 'lodash';
import googleTagManager from 'googleTagManager';
import moment from 'moment';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { UncontrolledTooltip } from 'reactstrap';
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
import { memoizedAvailable as availableSelector, getActiveLayers } from '../../modules/layers/selectors';
import { getSelectedDate } from '../../modules/date/selectors';
import safeLocalStorage from '../../util/local-storage';
import openEarthDataSearch from '../../components/smart-handoffs/util';
import selectCollection from '../../modules/smart-handoff/actions';

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
      showBoundingBox: false,
      showZoomedIntoWingsAlert: false,
      currentExtent: {},
      coordinates: {},
      validatedLayers: [],
      validatedConceptIds: {},
    };

    this.baseState = this.state;
    this.onBoundaryChange = this.onBoundaryChange.bind(this);
    this.onCheckboxToggle = this.onCheckboxToggle.bind(this);
    this.onClickDownload = this.onClickDownload.bind(this);
    this.updateExtent = this.updateExtent.bind(this);
  }

  componentDidMount() {
    const { proj } = this.props;
    this.validateConceptIds();
    if (proj.id === 'geographic') {
      this.checkMapExtentWithinWings();
    }
  }

  componentDidUpdate(prevProps) {
    const {
      isActive,
      availableLayers,
      proj,
      map,
      selectedLayer,
      selectedCollection,
    } = this.props;

    // Determine if existing selected layer is active still and visibility toggle is 'ON'
    const isLayerStillActive = availableLayers.find(({ id }) => selectedLayer && selectedLayer.id);

    if (!lodashEqual(availableLayers, prevProps.availableLayers)) {
      this.validateConceptIds();
    }
    if (selectedCollection && !isLayerStillActive) {
      this.setState(this.baseState);
    }
    if (proj.id !== prevProps.proj.id) {
      const projChangeStateUpdate = { showBoundingBox: false };
      if (proj.id !== 'geographic') {
        projChangeStateUpdate.showZoomedIntoWingsAlert = false;
      }
      this.setState(projChangeStateUpdate);
    }

    if (proj.id === 'geographic') {
      const tabChange = isActive && !prevProps.isActive;
      const extentChange = !lodashEqual(map.extent, prevProps.map.extent);
      if (tabChange || extentChange) {
        this.checkMapExtentWithinWings();
      }
    }
  }

  async validateConceptIds() {
    const { validatedConceptIds } = this.state;
    const { availableLayers } = this.props;
    const baseUrl = 'https://cmr.earthdata.nasa.gov/search/collections.json?concept_id=';
    const conceptIdRequest = async (url) => {
      const granulesResponse = await fetch(url, { timeout: 5000 });
      const result = await granulesResponse.json();
      return lodashGet(result, 'feed.entry', []);
    };
    const allConceptIds = availableLayers.reduce((prev, curr) => {
      (curr.conceptIds || []).forEach(({ value }) => {
        if (value) prev.push(value);
      });
      return prev;
    }, []);

    await Promise.all(allConceptIds.map(
      async (id) => {
        if (validatedConceptIds[id] !== undefined) return;
        const response = await conceptIdRequest(baseUrl + id);
        validatedConceptIds[id] = !!response.length;
      },
    ));

    const validatedLayers = availableLayers.reduce((prev, curr) => {
      const validIdsArray = (curr.conceptIds || []).filter(({ value }) => validatedConceptIds[value]);
      if (validIdsArray.length) prev.push(curr);
      return prev;
    }, []);

    this.setState({ validatedLayers, validatedConceptIds });
  }

  /**
   * Check if entire map extent is within a wing that is not available in data download
   *
   * @returns {Boolean} is map extent within wing
   */
  checkMapExtentWithinWings = () => {
    const { map: { extent }, proj: { maxExtent } } = this.props;
    const inLeftWing = extent[0] < maxExtent[0] && extent[2] < maxExtent[0];
    const inRightWing = extent[0] > maxExtent[2] && extent[2] > maxExtent[2];
    const isWithinWings = inLeftWing || inRightWing;
    this.setState({ showZoomedIntoWingsAlert: isWithinWings });
  }

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
      x2: x + width,
      y2: y + height,
    };

    const lonlats = imageUtilGetCoordsFromPixelValues(
      newBoundaries,
      map.ui.selected,
    );
    const { crs } = proj;

    // Retrieve the lat/lon coordinates based on the defining boundary and map projection
    const geolonlat1 = olProj.transform(lonlats[0], crs, 'EPSG:4326');
    const geolonlat2 = olProj.transform(lonlats[1], crs, 'EPSG:4326');

    // Determine longitude out of bounds areas and reset to limits
    if (geolonlat1[0] > 180) geolonlat1[0] = 180;
    else if (geolonlat1[0] < -180) geolonlat1[0] = -180;
    if (geolonlat2[0] > 180) geolonlat2[0] = 180;
    else if (geolonlat2[0] < -180) geolonlat2[0] = -180;

    // Determine latitude out of bounds areas and reset to limits
    if (geolonlat1[1] > 90) geolonlat1[1] = 90;
    else if (geolonlat1[1] < -90) geolonlat1[1] = -90;
    if (geolonlat2[1] > 90) geolonlat2[1] = 90;
    else if (geolonlat2[1] < -90) geolonlat2[1] = -90;

    const extent = {
      southWest: `${geolonlat1[0].toFixed(5)},${geolonlat1[1].toFixed(5)}`,
      northEast: `${geolonlat2[0].toFixed(5)},${geolonlat2[1].toFixed(5)}`,
    };

    const coordinates = {
      bottomLeft: util.formatCoordinate([geolonlat1[0], geolonlat1[1]]),
      topRight: util.formatCoordinate([geolonlat2[0], geolonlat2[1]]),
    };

    if (selectedCollection && extent) {
      this.updateExtent(coordinates, newBoundaries, setExtent && extent);
    }
  }

  /**
   * Handle bounding box checkbox toggle
   */
  onCheckboxToggle() {
    const { showBoundingBox } = this.state;
    if (!showBoundingBox) {
      googleTagManager.pushEvent({
        event: 'smart_handoffs_toggle_true_target_area',
      });
      this.setState({ showBoundingBox: true });
    } else {
      this.setState({ showBoundingBox: false });
    }
  }

  /**
   * Handle clicking 'Download Via Earthdata Search"
   * Will open warning/info modal or go directly to EDS (if modal was hidden by user)
   */
  onClickDownload() {
    const {
      displayDate,
      proj,
      selectedDate,
      selectedLayer,
      selectedCollection,
      showWarningModal,
    } = this.props;
    const {
      currentExtent,
      showBoundingBox,
    } = this.state;

    // Used to determine if the added smart-handoff modal should be shown
    const { HIDE_EDS_WARNING } = safeLocalStorage.keys;
    const hideModal = safeLocalStorage.getItem(HIDE_EDS_WARNING);
    const { dateRanges } = selectedLayer;
    const includeDates = dateRanges && dateRanges.length;

    const continueToEDS = () => openEarthDataSearch(
      proj.id, includeDates, selectedDate, selectedCollection, currentExtent, showBoundingBox,
    );

    if (!hideModal) {
      showWarningModal(displayDate, selectedLayer, selectedCollection, continueToEDS);
    } else {
      continueToEDS();
    }
  }

  /**
   * Render alert to indicate the map view is zoomed entirely into the map wings (geographic projection only)
   * Typically from activeTab change to data download when zoomed into wing, but triggers on changing the extent as well
   */
   renderZoomedIntoWingsAlert = () => {
     const { showZoomedIntoWingsAlert } = this.state;
     const message = 'The view is zoomed into the map wings which are unavailable in data download mode. Zoom out to see available map.';
     return showZoomedIntoWingsAlert && (
     <AlertUtil
       id="map-zoomed-into-wings-alert"
       isOpen
       title="Map Zoomed Into Unavailable Wings"
       message={message}
     />
     );
   }

  renderCollectionTooltip = ({ value, title }, tooltipTarget) => {
    const cmrSearchDetailURL = `https://cmr.earthdata.nasa.gov/search/concepts/${value}.html`;
    return (
      <UncontrolledTooltip
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
          <a href={cmrSearchDetailURL} target="_blank" rel="noreferrer"> View Collection Details </a>
        </div>
      </UncontrolledTooltip>
    );
  }

  /**
   * Render radio buttons for layer selection
   */
  renderLayerChoices() {
    const {
      selectCollection,
      selectedCollection,
      selectedLayer,
    } = this.props;
    const { validatedLayers, validatedConceptIds } = this.state;

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
                  type, value, version,
                } = collection;
                const inputId = `${util.encodeId(value)}-${util.encodeId(layer.id)}-collection-choice`;
                const isSelected = (selectedCollection || {}).value === value && layerIsSelected;
                const labelId = `${inputId}-label`;

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
                      {STD_NRT_MAP[type] + (version ? ` - v${version}` : '')}
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
    } = this.props;

    const {
      boundaries,
      coordinates,
      showBoundingBox,
    } = this.state;

    const {
      x, y, x2, y2,
    } = boundaries;

    return selectedLayer && proj.id === 'geographic' && (
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
    const { showNotAvailableModal } = this.props;
    return (
      <div className="smart-handoff-side-panel">
        <h1>
          None of your current layers are available for download.
        </h1>
        <hr />
        <h2>
          <a className="help-link" onClick={showNotAvailableModal}>
            Why are my layers not available?
          </a>
        </h2>
      </div>
    );
  }

  /**
   * Default render which displays the download panel
   */
  render() {
    const {
      displayDate,
      isActive,
      showNotAvailableModal,
      selectedLayer,
      selectedCollection,
      selectedDate,
      showGranuleHelpModal,
    } = this.props;
    const { showBoundingBox, currentExtent, validatedLayers } = this.state;

    // Determine if download 'smart-handoff' tab is activated by user
    if (!isActive) return null;

    // Determine if the download button is enabled
    const isValidDownload = selectedLayer && selectedLayer.id;

    if (!validatedLayers.length) {
      return this.renderNoLayersToDownload();
    }
    return (
      <>
        {this.renderZoomedIntoWingsAlert()}
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
          <GranuleCount
            displayDate={displayDate}
            currentExtent={showBoundingBox ? currentExtent : undefined}
            selectedDate={selectedDate}
            selectedLayer={selectedLayer}
            selectedCollection={selectedCollection}
            showGranuleHelpModal={showGranuleHelpModal}
          />
          <Button
            onClick={this.onClickDownload}
            text="DOWNLOAD VIA EARTHDATA SEARCH"
            className="download-btn red"
            valid={!!isValidDownload}
          />
        </div>
      </>
    );
  }
}

/**
 * Handle type-checking of defined properties
 */
SmartHandoff.propTypes = {
  isActive: PropTypes.bool,
  availableLayers: PropTypes.array,
  displayDate: PropTypes.string,
  map: PropTypes.object.isRequired,
  proj: PropTypes.object,
  screenHeight: PropTypes.number,
  screenWidth: PropTypes.number,
  selectCollection: PropTypes.func,
  selectedDate: PropTypes.string,
  selectedLayer: PropTypes.object,
  selectedCollection: PropTypes.object,
  showWarningModal: PropTypes.func,
  showGranuleHelpModal: PropTypes.func,
  showNotAvailableModal: PropTypes.func,
};

/**
 * ReactRedux; used for selecting the part of the data from the store
 * that the Smarthandoff component needs. This is called every time the
 * store state changes.
 * @param {*} state | Encapsulates the entire Redux store state.
 */
const mapStateToProps = (state) => {
  const {
    browser,
    map,
    proj,
    smartHandoffs,
  } = state;

  const { conceptId, layerId } = smartHandoffs;

  const {
    screenWidth,
    screenHeight,
  } = browser;

  const selectedDate = getSelectedDate(state);
  const selectedDateFormatted = moment.utc(selectedDate).format('YYYY-MM-DD'); // 2020-01-01
  const displayDate = moment.utc(selectedDate).format('YYYY MMM DD'); // 2020 JAN 01
  const filterForSmartHandoff = (layer) => {
    const {
      id, projections, disableSmartHandoff, conceptIds,
    } = layer;
    const isAvailable = availableSelector(state)(id);
    const filteredConceptIds = (conceptIds || []).filter(({ type, value, version }) => type && value && version);
    return isAvailable && projections[proj.id] && !disableSmartHandoff && !!filteredConceptIds.length;
  };
  const availableLayers = getActiveLayers(state).filter(filterForSmartHandoff);

  const selectedLayer = availableLayers.find(({ id }) => id === layerId);
  const selectedCollection = selectedLayer && (selectedLayer.conceptIds || []).find(({ value }) => value === conceptId);

  return {
    availableLayers,
    displayDate,
    map,
    proj: proj.selected,
    screenHeight,
    screenWidth,
    selectedDate: selectedDateFormatted,
    selectedLayer,
    selectedCollection,
  };
};

/**
 * React-Redux; used for SmartHandoff component to fire specific actions events
 * @param {*} dispatch | A function of the Redux store that is triggered upon a change of state.
 */
const mapDispatchToProps = (dispatch) => ({
  selectCollection: (conceptId, layerId) => {
    dispatch(selectCollection(conceptId, layerId));
  },
  showWarningModal: (displayDate, selectedLayer, selectedCollection, continueToEDS) => {
    googleTagManager.pushEvent({
      event: 'smart_handoffs_open_warning_modal',
    });
    dispatch(
      openCustomContent('transferring-to-earthdata-search', {
        headerText: 'Leaving Worldview',
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
