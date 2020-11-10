import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import * as olProj from 'ol/proj';
import { debounce as lodashDebounce } from 'lodash';
import moment from 'moment';
import SmartHandoffModal from './smart-handoff-modal';
import Button from '../../components/util/button';
import Checkbox from '../../components/util/checkbox';
import Crop from '../../components/util/image-crop';
import util from '../../util/util';
import { getLayers } from '../../modules/layers/selectors';
import { imageUtilGetCoordsFromPixelValues } from '../../modules/image-download/util';
import { onClose, openCustomContent } from '../../modules/modal/actions';
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
      boundaries: props.boundaries || {
        x: screenWidth / 2 - 100,
        y: screenHeight / 2 - 100,
        x2: screenWidth / 2 + 100,
        y2: screenHeight / 2 + 100,
      },
      selectedLayer: {},
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
    const { selectedDate, activeLayers } = this.props;
    const { currentExtent, selectedLayer } = this.state;

    // Determine if existing selected layer is active still and visibility toggle is 'ON'
    const isLayerStillActive = activeLayers.find((layer) => selectedLayer.conceptId === layer.conceptId);

    if (!isLayerStillActive) {
      this.resetState();
    }

    // Determine if date changed; if so, fire update on granule count
    const didDateChange = selectedDate !== prevProps.selectedDate;
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

    if (selectedLayer.id) {
      const {
        x, y, width, height,
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
    const { selectedDate } = this.props;
    const { selectedLayer, showBoundingBox } = this.state;

    // Places the compoent state in a loading state; triggers {...} animation.
    this.setState({ isSearchingForGranules: true });

    const startDate = `${moment.utc(selectedDate).format('YYYY-MM-DD')}T00:00:00.000Z`;
    const endDate = `${moment.utc(selectedDate).format('YYYY-MM-DD')}T23:59:59.999Z`;
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
    totalGranules = await fetch(urlTotalGranules, { timeout: 5000 })
      .then(async(response) => {
        const result = await response.json();
        return result.feed.facets.children[0].children[0].children[0].count;
      })
      .catch((error) => 0);

    // Gets the total subset of granules that are within the defining bounding box
    if (showBoundingBox) {
      urlSelectedGranules += `&bounding_box=${currentExtent.southWest},${currentExtent.northEast}`;
      selectedGranules = await fetch(urlSelectedGranules, { timeout: 5000 })
        .then(async(response) => {
          const result = await response.json();
          return result.feed.facets.children[0].children[0].children[0].count;
        })
        .catch((error) => 0);
    }

    this.setState({ selectedGranules, totalGranules });
    this.setState({ isSearchingForGranules: false });
  }

  /**
   * Default render which displays the data-download panel
   */
  render() {
    const {
      screenWidth,
      screenHeight,
      activeLayers,
      isActive,
      showWarningModal,
      selectedDate,
    } = this.props;

    const { selectedLayer, isSearchingForGranules } = this.state;
    const {
      selectedGranules, totalGranules, coordinates, currentExtent, showBoundingBox,
    } = this.state;

    // Determine if data-download 'smart-handoff' tab is activated by user
    if (!isActive) return null;

    const { boundaries } = this.state;
    const {
      x, y, x2, y2,
    } = boundaries;

    // Used to determine if the added smart-handoff modal should be shown
    const { HIDE_EDS_WARNING } = safeLocalStorage.keys;
    let showModal = safeLocalStorage.getItem(HIDE_EDS_WARNING);
    showModal = true;

    // Determine if the download button is enabled
    const isValidDownload = selectedLayer.id !== undefined;

    const availableLayers = activeLayers.filter((layer) => layer.conceptId !== undefined).length;
    const areThereLayersToDownload = availableLayers > 0;

    if (areThereLayersToDownload) {
      return (
        <div id="smart-handoff-side-panel">

          <h1>Select an available layer to download:</h1>

          <div id="esd-notification">
            Downloading data will be performed using
            {' '}
            <a href="https://search.earthdata.nasa.gov" target="_blank" rel="noopener noreferrer">NASA's Earthdata Search</a>
            {' '}
            application.
          </div>

          <hr />

          <div id="smart-handoff-layer-list">
            {activeLayers.map((layer, index) => {
              if (layer.conceptId) {
                return (
                  <div className="layer-item">
                    <input
                      id={layer.id}
                      type="radio"
                      value={layer.conceptId}
                      name="smart-handoff-layer-radio"
                      checked={selectedLayer.id === layer.id}
                      onChange={() => this.onLayerChange(layer, currentExtent)}
                    />
                    <label htmlFor={layer.id}>{layer.title}</label>
                    <span>{layer.subtitle}</span>
                  </div>
                );
              }
              return null;
            })}
          </div>

          <hr />

          <div id="crop-toggle">
            <Checkbox
              id="chk-crop-toggle"
              label="Toggle Bounding Box"
              text="Toggle boundary selection."
              color="gray"
              checked={showBoundingBox}
              onCheck={() => {
                this.setState({ showBoundingBox: !showBoundingBox }, () => {
                  if (selectedLayer.id) this.updateGranuleCount(currentExtent);
                });
              }}
            />
          </div>

          <hr />

          <div id="granule-count">
            <h1>
              Granules available:
              {' '}
              { !isSearchingForGranules && totalGranules === 0 && (<span className="fade-in constant-width">NONE</span>)}
              { !showBoundingBox && !isSearchingForGranules && totalGranules !== 0 && (<span className="fade-in constant-width">{totalGranules}</span>)}
              { showBoundingBox && !isSearchingForGranules && totalGranules !== 0 && (<span className="fade-in constant-width">{`${selectedGranules} of ${totalGranules}`}</span>)}
              { isSearchingForGranules && (<span className="loading-granule-count fade-in constant-width" />)}
            </h1>
          </div>

          <Button
            onClick={() => {
              if (showModal) showWarningModal(selectedDate, selectedLayer, currentExtent, showBoundingBox);
              else openEarthDataSearch(selectedDate, selectedLayer, currentExtent, showBoundingBox)();
            }}
            id="download-btn"
            text="GO TO EARTHDATA SEARCH"
            className="red"
            valid={isValidDownload}
          />

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
        </div>
      );
    }
    return (
      <div id="smart-handoff-side-panel">
        <h1>None of your currently listed layers are available for data download.</h1>
      </div>
    );
  }
}

/**
 * Method call to direct the user to Earthdata Search with the necessary URL parameters that
 * encapsulate what the user is intending to try and download data / granules from
 * @param {*} selectedDate
 * @param {*} selectedLayer
 * @param {*} extentCoords
 * @param {*} showBoundingBox
 */
const openEarthDataSearch = (selectedDate, selectedLayer, extentCoords, showBoundingBox) => () => {
  const { conceptId, daynight } = selectedLayer;
  const { southWest, northEast } = extentCoords;

  const startDate = `${moment.utc(selectedDate).format('YYYY-MM-DD')}T00:00:00.000Z`;
  const endDate = `${moment.utc(selectedDate).format('YYYY-MM-DD')}T23:59:59.999Z`;

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
  map: PropTypes.object.isRequired,
  boundaries: PropTypes.object,
  proj: PropTypes.object,
  screenHeight: PropTypes.number,
  screenWidth: PropTypes.number,
  selectedDate: PropTypes.instanceOf(Date),
  showWarningModal: PropTypes.func,
};

/**
 * ReactRedux; used for selecting the part of the data from the store
 * that the Smarthandoff component needs. This is called every time the
 * store state changes.
 * @param {*} state | Encapsulates the entire Redux store state.
 * @param {*} ownProps | Data from SmartHandoff that is used to retrieve data from the store.
 */
const mapStateToProps = (state, ownProps) => {
  const { tabTypes } = ownProps;
  const {
    browser, layers, map, proj, compare, sidebar, boundaries,
  } = state;
  const { screenWidth, screenHeight } = browser;
  const { activeString } = compare;
  const activeLayers = getLayers(layers[activeString], { proj: proj.id });
  return {
    activeLayers,
    boundaries,
    isActive: sidebar.activeTab === 'download',
    map,
    proj: proj.selected,
    screenWidth,
    screenHeight,
    selectedDate: getSelectedDate(state),
    tabTypes,
  };
};

/**
 * React-Redux; used for SmartHandoff component to fire specific actions events
 * @param {*} dispatch | A function of the Redux store that is triggered upon a change of state.
 */
const mapDispatchToProps = (dispatch) => ({
  showWarningModal: (selectedDate, selectedLayer, extentCoords, showBoundingBox) => {
    dispatch(
      openCustomContent('transferring-to-earthdata-search', {
        headerText: 'Leaving Worldview',
        bodyComponent: SmartHandoffModal,
        bodyComponentProps: {
          selectedDate,
          selectedLayer,
          extentCoords,
          showBoundingBox,
          goToEarthDataSearch: openEarthDataSearch(selectedDate, selectedLayer, extentCoords, showBoundingBox),
        },
        size: 'lg',
      }),
    );
  },
});

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(SmartHandoff);
