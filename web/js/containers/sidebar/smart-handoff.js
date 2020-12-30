import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import * as olProj from 'ol/proj';
import { debounce as lodashDebounce, get as lodashGet } from 'lodash';
import moment from 'moment';
import SmartHandoffModal from '../../components/smart-handoffs/smart-handoff-modal';
import Button from '../../components/util/button';
import Checkbox from '../../components/util/checkbox';
import Crop from '../../components/util/image-crop';
import util from '../../util/util';
import GranuleAlertModalBody from '../../components/smart-handoffs/smart-handoff-granule-alert';
import { imageUtilGetCoordsFromPixelValues } from '../../modules/image-download/util';
import { onClose, openCustomContent } from '../../modules/modal/actions';
import { getActiveLayers } from '../../modules/layers/selectors';
import getSelectedDate from '../../modules/date/selectors';
import safeLocalStorage from '../../util/local-storage';
import openEarthDataSearch from '../../components/smart-handoffs/util';

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
      totalGranules: undefined,
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
      proj,
    } = this.props;
    const {
      currentExtent,
      selectedLayer,
    } = this.state;

    // Determine if existing selected layer is active still and visibility toggle is 'ON'
    const selectedConceptId = selectedLayer && selectedLayer.conceptId;
    const isLayerStillActive = activeLayers.find(({ conceptId }) => selectedConceptId === conceptId);

    if (selectedConceptId && !isLayerStillActive) {
      // eslint-disable-next-line react/no-did-update-set-state
      this.setState(this.baseState);
    }
    if (dateSelection !== prevProps.dateSelection) {
      // eslint-disable-next-line react/no-did-update-set-state
      this.setState({ totalGranules: undefined }, () => {
        this.updateGranuleCount(currentExtent);
      });
    }
    if (proj.id !== prevProps.proj.id) {
      // eslint-disable-next-line react/no-did-update-set-state
      this.setState({ showBoundingBox: false });
    }
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
    this.setState({
      selectedLayer: layer,
      totalGranules: undefined,
    }, () => this.updateGranuleCount(currentExtent));
  }

  /**
   * Asynchronous call to fetch granule data for the specified selected layer. Contains
   * conditional logic to determine which counts are provided back to the user; total
   * count vs selected count (that is if the bounding box has been enabled by the user)
   * @param {*} currentExtent
   */
  async updateGranuleCount({ southWest, northEast }) {
    const { dateSelection } = this.props;
    const {
      selectedLayer,
      showBoundingBox,
      totalGranules,
    } = this.state;

    if (!selectedLayer) return;

    // Places the compoent state in a loading state; triggers {...} animation.
    this.setState({ isSearchingForGranules: true });

    const startDate = `${moment.utc(dateSelection).format('YYYY-MM-DD')}T00:00:00.000Z`;
    const endDate = `${moment.utc(dateSelection).format('YYYY-MM-DD')}T23:59:59.999Z`;
    const dateRange = `${startDate},${endDate}`;
    const { daynight } = selectedLayer;
    const params = {
      temporal: dateRange,
      collection_concept_id: selectedLayer.conceptId,
      include_facets: 'v2',
      page_size: 0,
      day_night_flag: daynight || undefined,
    };
    const newState = { isSearchingForGranules: false };

    let granuleRequestUrl = `https://cmr.earthdata.nasa.gov/search/granules.json${util.toQueryString(params)}`;

    if (!totalGranules) {
      // Gets the total amount of granules that the layer has
      const totalGranuleResponse = await fetch(granuleRequestUrl, { timeout: 5000 });
      const totalResult = await totalGranuleResponse.json();
      newState.totalGranules = lodashGet(totalResult, 'feed.facets.children[0].children[0].children[0].count', 0);
    }

    // Gets the total subset of granules that are within the defining bounding box
    if (showBoundingBox && southWest && northEast) {
      granuleRequestUrl += `&bounding_box=${southWest},${northEast}`;
      const selectedGranulesResponse = await fetch(granuleRequestUrl, { timeout: 5000 });
      const selectedResult = await selectedGranulesResponse.json();
      newState.selectedGranules = lodashGet(selectedResult, 'feed.facets.children[0].children[0].children[0].count', 0);
    }

    this.setState(newState);
  }

  /**
   * Render radio buttons for layer selection
   */
  renderLayerChoices() {
    const { activeLayers } = this.props;
    const { selectedLayer, currentExtent } = this.state;
    const selectedId = selectedLayer && selectedLayer.id;

    return (
      <div className="smart-handoff-layer-list">
        {activeLayers.map((layer) => {
          const inputId = `${util.encodeId(layer.id)}-smart-handoff-choice`;
          return layer.conceptId && (
            <div className="layer-item" key={inputId}>
              <input
                id={inputId}
                type="radio"
                value={layer.conceptId}
                name="smart-handoff-layer-radio"
                checked={selectedId === layer.id}
                onChange={() => this.onLayerChange(layer, currentExtent)}
              />
              <label htmlFor={inputId}>{layer.title}</label>
              <span>{layer.subtitle}</span>
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
      screenWidth,
      screenHeight,
      proj,
    } = this.props;

    const {
      boundaries,
      selectedLayer,
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
            label="Target Area Selection"
            text="Toggle boundary selection."
            color="gray"
            checked={showBoundingBox}
            onCheck={() => {
              if (!showBoundingBox) {
                this.setState({
                  showBoundingBox: !showBoundingBox,
                  isSearchingForGranules: true,
                });
              } else {
                this.setState({ showBoundingBox: !showBoundingBox });
              }
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
        <hr />
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
          {` ${dateSelection}: `}

          { !isSearchingForGranules && totalGranules === 0 && (
            <span className="fade-in constant-width">NONE</span>
          )}

          { !isSearchingForGranules && totalGranules !== 0 && (
            <span className="fade-in constant-width">
              {showBoundingBox && `${selectedGranules} of `}
              {totalGranules}
            </span>
          )}

          { isSearchingForGranules && (
            <span className="loading-granule-count fade-in constant-width" />
          )}
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
      proj,
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
    const hideModal = safeLocalStorage.getItem(HIDE_EDS_WARNING);

    // Determine if the download button is enabled
    const isValidDownload = selectedLayer && selectedLayer.id !== undefined;
    const availableLayers = activeLayers.filter((layer) => layer.conceptId !== undefined).length;

    if (!availableLayers > 0) {
      return this.renderNoLayersToDownload();
    }
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
        {this.renderGranuleCount()}
        <Button
          onClick={() => {
            if (!hideModal) showWarningModal(proj.id, dateSelection, selectedLayer, currentExtent, showBoundingBox);
            else openEarthDataSearch(proj.id, dateSelection, selectedLayer, currentExtent, showBoundingBox);
          }}
          text="DOWNLOAD VIA EARTHDATA SEARCH"
          className="download-btn red"
          valid={!!isValidDownload}
        />
      </div>
    );
  }
}

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
  } = state;

  const {
    screenWidth,
    screenHeight,
  } = browser;

  return {
    activeLayers: getActiveLayers(state).filter((layer) => layer.projections[proj.id]),
    dateSelection: moment.utc(getSelectedDate(state)).format('YYYY MMM DD'),
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
  showWarningModal: (proj, dateSelection, selectedLayer, currentExtent, showBoundingBox) => {
    dispatch(
      openCustomContent('transferring-to-earthdata-search', {
        headerText: 'Leaving Worldview',
        bodyComponent: SmartHandoffModal,
        desktopOnly: true,
        bodyComponentProps: {
          proj,
          dateSelection,
          selectedLayer,
          currentExtent,
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
