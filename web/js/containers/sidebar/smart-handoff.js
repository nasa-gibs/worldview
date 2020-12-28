import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import * as olProj from 'ol/proj';
import { debounce as lodashDebounce, get as lodashGet } from 'lodash';
import moment from 'moment';
import SmartHandoffModal from './smart-handoff-modal';
import Button from '../../components/util/button';
import Checkbox from '../../components/util/checkbox';
import Crop from '../../components/util/image-crop';
import util from '../../util/util';
import GranuleAlertModalBody from './smart-handoff-granule-alert';
import { imageUtilGetCoordsFromPixelValues } from '../../modules/image-download/util';
import { onClose, openCustomContent } from '../../modules/modal/actions';
import { getActiveLayers } from '../../modules/layers/selectors';
import getSelectedDate from '../../modules/date/selectors';
import safeLocalStorage from '../../util/local-storage';

/**
 * The Smart-Handoff components replaces the existing data download capability
 * by directing users to select specific layer products within Worldview and 'hand' them 'off'
 * to NASA's Earthdata Search web tool that will proceed in fetching corresponding
 * layer data and granule files that are available for download.
 */
class SmartHandoff extends Component {
  /**
   * SmartHandoff's default constructor
   * @param {*} props | A read-only object used to transfer data from a parent component
   */
  constructor(props) {
    super(props);

    const {
      screenWidth,
      screenHeight,
    } = props;

    // Set default state
    this.state = {
      boundaries: {
        x: screenWidth / 2 - 100,
        y: screenHeight / 2 - 100,
        x2: screenWidth / 2 + 100,
        y2: screenHeight / 2 + 100,
      },
      selectedLayer: undefined,
      showBoundingBox: false,
      isSearchingForGranules: false,
      selectedGranules: 0,
      totalGranules: 0,
      currentExtent: {},
      coordinates: {},
    };

    this.baseState = this.state;
    this.onBoundaryChange = this.onBoundaryChange.bind(this);
    this.updateExtent = this.updateExtent.bind(this);
    this.debouncedUpdateExtent = lodashDebounce(this.updateExtent, 250);
  }

  /**
   * When fired, compare prevProps to determine if previously selected layer is still active
   * and whether or not to update granule data base don data changes.
   * @param {*} prevProps
   */
  componentDidUpdate(prevProps) {
    const {
      dateSelection,
      activeLayers,
    } = this.props;
    const {
      currentExtent,
      selectedLayer,
    } = this.state;

    // Determine if existing selected layer is active still and visibility toggle is 'ON'
    const selectedConceptId = selectedLayer && selectedLayer.conceptId;
    const isLayerStillActive = activeLayers.find(({ conceptId }) => selectedConceptId === conceptId);

    if (selectedConceptId && !isLayerStillActive) {
      this.resetState();
    }

    // Determine if date changed; if so, fire update on granule count
    const didDateChange = dateSelection !== prevProps.dateSelection;
    if (didDateChange) this.updateGranuleCount(currentExtent);
  }

  /**
   * Resets this component to it's default state
   */
  resetState() {
    this.setState(this.baseState);
  }

  /**
   * Fires when the bounding box / crop toggle is activated and changed
   */
  updateExtent() {
    const { currentExtent, selectedLayer } = this.state;
    if (selectedLayer && currentExtent) {
      this.updateGranuleCount(currentExtent);
    }
  }

  /**
   * Fires when the image cropper is moved around on the map; updates the SW and NE lat/lon coordinates.
   * @param {*} boundaries - the focal point to which layer data should be contained within
   */
  onBoundaryChange(boundaries) {
    const { proj, map } = this.props;
    const { selectedLayer } = this.state;

    if (!selectedLayer) return;

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

    const currentExtent = {
      southWest: `${geolonlat1[0]},${geolonlat1[1]}`,
      northEast: `${geolonlat2[0]},${geolonlat2[1]}`,
    };

    const coordinates = {
      bottomLeft: util.formatCoordinate([geolonlat1[0], geolonlat1[1]]),
      topRight: util.formatCoordinate([geolonlat2[0], geolonlat2[1]]),
    };

    this.setState({
      boundaries: newBoundaries,
      coordinates,
      currentExtent,
    }, () => {
      if (selectedLayer && currentExtent) {
        this.debouncedUpdateExtent();
      }
    });
  }

  /**
   * Fires when user selected a different layer
   * @param {*} layer - the specified layer designated by the user
   * @param {*} currentExtent - the current boundaries of the bounding box
   */
  onLayerChange(layer, currentExtent) {
    this.setState({ selectedLayer: layer }, () => this.updateGranuleCount(currentExtent));
  }

  /**
   * Asynchronous call to fetch granule data for the specified selected layer. Contains
   * conditional logic to determine which counts are provided back to the user; total
   * count vs selected count (that is if the bounding box has been enabled by the user)
   * @param {*} currentExtent
   */
  async updateGranuleCount(currentExtent) {
    const { dateSelection } = this.props;
    const {
      selectedLayer,
      showBoundingBox,
    } = this.state;

    if (!selectedLayer) return;

    // Places the compoent state in a loading state; triggers {...} animation.
    this.setState({ isSearchingForGranules: true });

    const startDate = `${moment.utc(dateSelection).format('YYYY-MM-DD')}T00:00:00.000Z`;
    const endDate = `${moment.utc(dateSelection).format('YYYY-MM-DD')}T23:59:59.999Z`;
    const dateRange = `${startDate},${endDate}`;

    let totalGranules = 0;
    let selectedGranules = 0;

    let urlTotalGranules = 'https://cmr.earthdata.nasa.gov/search/granules.json?'
                + `temporal=${dateRange}&`
                + `collection_concept_id=${selectedLayer.conceptId}&`
                + 'include_facets=v2&'
                + 'page_size=0';

    if (selectedLayer.daynight) urlTotalGranules += `&day_night_flag=${selectedLayer.daynight}`;

    let urlSelectedGranules = urlTotalGranules;

    // Gets the total amount of granules that the layer has
    const totalGranuleResponse = await fetch(urlTotalGranules, { timeout: 5000 });
    const totalResult = await totalGranuleResponse.json();
    totalGranules = lodashGet(totalResult, 'feed.facets.children[0].children[0].children[0].count', 0);

    // Gets the total subset of granules that are within the defining bounding box
    if (showBoundingBox) {
      urlSelectedGranules += `&bounding_box=${currentExtent.southWest},${currentExtent.northEast}`;
      const selectedGranulesResponse = await fetch(urlSelectedGranules, { timeout: 5000 });
      const selectedResult = await selectedGranulesResponse.json();
      selectedGranules = lodashGet(selectedResult, 'feed.facets.children[0].children[0].children[0].count', 0);
    }

    this.setState({
      selectedGranules,
      totalGranules,
      isSearchingForGranules: false,
    });
  }

  /**
   * Render radio buttons for layer selection
   */
  renderLayerChoices() {
    const { activeLayers } = this.props;
    const { selectedLayer, currentExtent } = this.state;

    return (
      <div className="smart-handoff-layer-list">
        {activeLayers.map((layer) => {
          if (layer.conceptId) {
            const inputId = `${util.encodeId(layer.id)}-smart-handoff-choice`;
            return (
              <div className="layer-item" key={inputId}>
                <input
                  id={inputId}
                  type="radio"
                  value={layer.conceptId}
                  name="smart-handoff-layer-radio"
                  checked={selectedLayer && selectedLayer.id === layer.id}
                  onChange={() => this.onLayerChange(layer, currentExtent)}
                />
                <label htmlFor={inputId}>{layer.title}</label>
                <span>{layer.subtitle}</span>
              </div>
            );
          }
          return null;
        })}
      </div>
    );
  }

  /**
   * Render the checkbox to toggle the cropbox and the cropbox itself
   */
  renderCropBox() {
    const {
      screenWidth,
      screenHeight,
    } = this.props;

    const {
      boundaries,
      selectedLayer,
      coordinates,
      currentExtent,
      showBoundingBox,
    } = this.state;

    const {
      x, y, x2, y2,
    } = boundaries;

    return (
      <>
        <div className="smart-handoff-crop-toggle">
          <Checkbox
            id="chk-crop-toggle"
            label="Target Area Selection"
            text="Toggle boundary selection."
            color="gray"
            checked={showBoundingBox}
            onCheck={() => {
              this.setState({ showBoundingBox: !showBoundingBox }, () => {
                if (selectedLayer && selectedLayer.id) this.updateGranuleCount(currentExtent);
              });
            }}
          />
        </div>

        { showBoundingBox && (
          <Crop
            className="download-extent"
            x={x}
            y={y}
            width={x2 - x}
            height={y2 - y}
            maxHeight={screenHeight}
            maxWidth={screenWidth}
            onChange={this.onBoundaryChange}
            onClose={onClose}
            keepSelection
            bottomLeftStyle={{
              left: x,
              top: y2 + 5,
              width: x2 - x,
            }}
            topRightStyle={{
              left: x,
              top: y - 20,
              width: x2 - x,
            }}
            coordinates={coordinates}
            showCoordinates
          />
        )}
      </>
    );
  }

  /**
   * Render the granule count
   */
  renderGranuleCount() {
    const {
      showGranuleHelpModal,
      dateSelection,
    } = this.props;

    const {
      selectedLayer,
      isSearchingForGranules,
      selectedGranules,
      totalGranules,
      showBoundingBox,
    } = this.state;
    return selectedLayer && selectedLayer.conceptId && (
      <div className="granule-count">
        <h1>
          Available granules for
          {' '}
          {dateSelection}
          :
          {' '}
          { !isSearchingForGranules && totalGranules === 0 && (<span className="fade-in constant-width">NONE</span>)}
          { !showBoundingBox && !isSearchingForGranules && totalGranules !== 0 && (<span className="fade-in constant-width">{totalGranules}</span>)}
          { showBoundingBox && !isSearchingForGranules && totalGranules !== 0 && (<span className="fade-in constant-width">{`${selectedGranules} of ${totalGranules}`}</span>)}
          { isSearchingForGranules && (<span className="loading-granule-count fade-in constant-width" />)}

          <span className="granule-help-link" onClick={() => showGranuleHelpModal()}>(?)</span>
        </h1>
      </div>
    );
  }

  /**
   * Render "no layers to download" message
   */
  renderNoLayersToDownload = () => (
    <div className="smart-handoff-side-panel">
      <h1>
        None of your currently listed layers are available for downloading.
      </h1>
      <hr />
      <h2>Why are my current layers not available?</h2>
      <p>
        Some layers in Worldview do not have corresponding source data products available for download.
      </p>
      <p>
        These include National Boundaries, Orbit Tracks, Earth at Night, and MODIS Corrected Reflectance products.
      </p>
      <p>
        If you would like to download only an image, please use the “camera” icon in the upper right.
      </p>
    </div>
  )

  /**
   * Default render which displays the download panel
   */
  render() {
    const {
      activeLayers,
      isActive,
      showWarningModal,
      dateSelection,
    } = this.props;

    const {
      selectedLayer,
      currentExtent,
      showBoundingBox,
    } = this.state;

    // Determine if download 'smart-handoff' tab is activated by user
    if (!isActive) return null;

    // Used to determine if the added smart-handoff modal should be shown
    const { HIDE_EDS_WARNING } = safeLocalStorage.keys;
    const showModal = safeLocalStorage.getItem(HIDE_EDS_WARNING);

    // Determine if the download button is enabled
    const isValidDownload = selectedLayer && selectedLayer.id !== undefined;
    const availableLayers = activeLayers.filter((layer) => layer.conceptId !== undefined).length;
    const areThereLayersToDownload = availableLayers > 0;


    if (areThereLayersToDownload) {
      return (
        <div className="smart-handoff-side-panel">

          <h1>Select an available layer to download:</h1>
          <div className="esd-notification">
            Downloading data will be performed using
            <a href="https://search.earthdata.nasa.gov" target="_blank" rel="noopener noreferrer"> NASA&apos;s Earthdata Search </a>
            application.
          </div>
          <hr />
          {this.renderLayerChoices()}
          <hr />
          {this.renderCropBox()}
          <hr />
          {this.renderGranuleCount()}
          <Button
            onClick={() => {
              if (!showModal) showWarningModal(dateSelection, selectedLayer, currentExtent, showBoundingBox);
              else openEarthDataSearch(dateSelection, selectedLayer, currentExtent, showBoundingBox);
            }}
            text="DOWNLOAD VIA EARTHDATA SEARCH"
            className="download-btn red"
            valid={!!isValidDownload}
          />
        </div>
      );
    }
    return this.renderNoLayersToDownload();
  }
}

/**
 * Method call to direct the user to Earthdata Search with the necessary URL parameters that
 * encapsulate what the user is intending to try and download data / granules from
 * @param {*} selectedLayer
 * @param {*} extentCoords
 * @param {*} showBoundingBox
 */
const openEarthDataSearch = (dateSelection, selectedLayer, extentCoords, showBoundingBox) => {
  const {
    conceptId,
    daynight,
  } = selectedLayer;

  const {
    southWest,
    northEast,
  } = extentCoords;

  const startDate = `${moment.utc(dateSelection).format('YYYY-MM-DD')}T00:00:00.000Z`;
  const endDate = `${moment.utc(dateSelection).format('YYYY-MM-DD')}T23:59:59.999Z`;

  const dateRange = `${startDate},${endDate}`;

  let earthDataSearchURL = `https://search.earthdata.nasa.gov/search/granules?p=${conceptId}&[qt]=${dateRange}&m=0.0!-180.0!0!1!0!0,2`;

  if (daynight) earthDataSearchURL += `&pg[0][dnf]=${daynight}`;
  if (showBoundingBox) earthDataSearchURL += `&sb=${southWest},${northEast}`;

  window.open(earthDataSearchURL, '_blank');
};

/**
 * Handle type-checking of defined properties
 */
SmartHandoff.propTypes = {
  isActive: PropTypes.bool,
  activeLayers: PropTypes.array,
  dateSelection: PropTypes.string,
  map: PropTypes.object.isRequired,
  proj: PropTypes.object,
  screenHeight: PropTypes.number,
  screenWidth: PropTypes.number,
  showWarningModal: PropTypes.func,
  showGranuleHelpModal: PropTypes.func,
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
    sidebar,
  } = state;

  const {
    screenWidth,
    screenHeight,
  } = browser;

  const activeLayers = getActiveLayers(state).filter((layer) => layer.projections[proj.id]);

  return {
    activeLayers,
    dateSelection: moment.utc(getSelectedDate(state)).format('YYYY MMM DD'),
    isActive: sidebar.activeTab === 'download',
    map,
    proj: proj.selected,
    screenWidth,
    screenHeight,
  };
};

/**
 * React-Redux; used for SmartHandoff component to fire specific actions events
 * @param {*} dispatch | A function of the Redux store that is triggered upon a change of state.
 */
const mapDispatchToProps = (dispatch) => ({
  showWarningModal: (dateSelection, selectedLayer, showBoundingBox) => {
    dispatch(
      openCustomContent('transferring-to-earthdata-search', {
        headerText: 'Leaving Worldview',
        bodyComponent: SmartHandoffModal,
        desktopOnly: true,
        bodyComponentProps: {
          dateSelection,
          selectedLayer,
          showBoundingBox,
          goToEarthDataSearch: openEarthDataSearch,
        },
        size: 'lg',
      }),
    );
  },
  showGranuleHelpModal: () => {
    dispatch(
      openCustomContent('granule-help', {
        desktopOnly: true,
        headerText: 'Granule Availablilty',
        bodyComponent: GranuleAlertModalBody,
        size: 'lg',
      }),
    );
  },
});

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(SmartHandoff);
