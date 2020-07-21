import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import * as olProj from 'ol/proj';
import { debounce as lodashDebounce } from 'lodash';
import Products from '../../components/sidebar/product';
import Button from '../../components/util/button';
import Crop from '../../components/util/image-crop';
import util from '../../util/util';
import { getLayers } from '../../modules/layers/selectors';
import { getDataProductsFromActiveLayers } from '../../modules/data/selectors';
import { imageUtilGetCoordsFromPixelValues } from '../../modules/image-download/util';
import { openCustomContent } from '../../modules/modal/actions';
import { changeCropBounds } from '../../modules/animation/actions';

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
      onBoundaryChange,
    } = props;

    this.state = {
      boundaries: props.boundaries || {
        x: screenWidth / 2 - 100,
        y: screenHeight / 2 - 100,
        x2: screenWidth / 2 + 100,
        y2: screenHeight / 2 + 100,
      },
    };

    this.debounceBoundaryUpdate = lodashDebounce(onBoundaryChange, 200);
    this.onBoundaryChange = this.onBoundaryChange.bind(this);
  }

  /**
   * Fires when the image cropper is moved around on the map; updates the SW and NE lat/lon coordinates.
   * @param {*} boundaries - the focal point to which layer data should be contained within
   */
  onBoundaryChange(boundaries) {
    const {
      x, y, width, height,
    } = boundaries;
    const newBoundaries = {
      x,
      y,
      x2: x + width,
      y2: y + height,
    };

    this.setState({ boundaries: newBoundaries });
    this.debounceBoundaryUpdate(newBoundaries);
  }

  /**
   * Default render which displays the data-download panel
   */
  render() {
    const {
      isLayerSelected,
      products,
      map,
      screenWidth,
      screenHeight,
      proj,
      selectedProduct,
      selectProduct,
      showWarningModal,
      isActive,
    } = this.props;

    /** Determine if data-download 'smart-handoff' tab is activated by user */
    if (!isActive) return null;

    /** Bounardies referencing the coordinates displayed around image crop */
    const { boundaries } = this.state;
    const {
      x, y, x2, y2,
    } = boundaries;

    /** Keeps image crop to always be displayed on the map */
    const keepSelection = true;

    /** Retrieve the lat/lon coordinates based on the defining boundary and map projection */
    const lonlats = imageUtilGetCoordsFromPixelValues(
      boundaries,
      map.ui.selected,
    );
    const { crs } = proj;
    const geolonlat1 = olProj.transform(lonlats[0], crs, 'EPSG:4326');
    const geolonlat2 = olProj.transform(lonlats[1], crs, 'EPSG:4326');
    const boxTopLongitude = Math.abs(geolonlat1[0]) > 180 ? util.normalizeWrappedLongitude(geolonlat1[0]) : geolonlat1[0];
    const boxBottomLongitude = Math.abs(geolonlat2[0]) > 180 ? util.normalizeWrappedLongitude(geolonlat2[0]) : geolonlat2[0];

    /** Contains available imagery data that can be downloaded in Earthdata Search */
    const dataArray = Object.entries(products); // TO-DO: Display the correct products based on availablility

    return (
      <div>
        <h1>Select a layer to download:</h1>

        { /** Listing of layers that are available to download via Earthdata Search */ }
        <div id="wv-data">
          <div className="wv-datalist sidebar-panel content">
            <div id="wv-datacontent">
              {dataArray.map((product, i) => (
                <Products
                  key={product[0]}
                  id={product[0]}
                  productObject={product[1]}
                  countsObject={counts}
                  isSelected={selectedProduct === product[0]}
                  selectProduct={selectProduct}
                />
              ))}
            </div>
          </div>
        </div>

        { /** Download button that transfers user to NASA's Earthdata Search */ }
        <Button
          onClick={() => showWarningModal(this.state)}
          id="download-btn"
          text="Download"
          className="red"
          disabled={isLayerSelected}
        />

        { /** Image crop overlay used to determine user's area of interest */ }
        <Crop
          className="download-extent"
          x={x}
          y={y}
          width={x2 - x}
          height={y2 - y}
          maxHeight={screenHeight}
          maxWidth={screenWidth}
          onChange={this.onBoundaryChange}
          keepSelection={keepSelection}
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
          coordinates={{
            bottomLeft: util.formatCoordinate([boxTopLongitude, geolonlat1[1]]),
            topRight: util.formatCoordinate([boxBottomLongitude, geolonlat2[1]]),
          }}
          showCoordinates
        />
      </div>
    );
  }
}

/**
 * Handles the closeout of the custom modal window as defined below.
 */
const closeModal = () => {

};

/**
 * A custom modal window that instructs the user they are being directed to NASA's Earthdata Search web tool.
 */
const SmartHandoffModal = () => (
  <>
    <div id="modal-container">

      <div id="modal-heading">
        search.earthdata.nasa.gov
      </div>

      <div id="modal-message">
        You are about to be transferred to the NASA Earthdata Search tool. This tool is used to download
        data granules using the currently selected layer, area of interest, and date.
      </div>

      <hr />

      <div id="toggle-more-info">Show more</div>

      <h1 id="about-heading">About Earthdata Search</h1>

      <p>
        Earthdata Search provides the only means for data discovery, filtering, visualization, and
        access across all of NASA Earth science data holdings. Excepteur sint occaecat cupidatat non proident,
        sunt in culpa qui officia deserunt mollit anim id est laborum.
      </p>

      <p>
        The current selected layer and the designated viewport region within Worldview will be transferred to
        Earthdata Search. At vero eostui noir benet accusamus et iusto odio dignissimos ducimus qui blanditiis
        praesentium voluptatum deleniti atque corrupti quos dolores et quas molestias excepturi sint occaecati
        cupiditate non provident, similique sunt in culpa qui officia deserunt mollitia animi, id est laborum
        et dolorum fuga
      </p>

      <div id="layer-info">
        <h1> Selected layer to download: </h1>
        <p id="layer-name"> INSERT LAYER NAME </p>
        <p id="layer-mata-data"> INSERT LAYER META DATA </p>
      </div>


      <div id="button-group">
        <Button
          onClick={() => closeModal()}
          id="cancel-btn"
          text="Cancel"
        />

        <Button
          onClick={() => openEarthDataSearch()} // Need to pass reference of current state of boundaries
          id="continue-btn"
          text="Continue"
          className="red"
        />
      </div>

    </div>

  </>
);

/**
 * Handles the processing of various parameters that Earthdata Search needs to find specific
 * data prdocuts and granule files based on the currently selected product within Worldview.
 */
const openEarthDataSearch = () => {
  // TO-DO: Need to capture boundaries, layer data, etc; whatever essentials for Earthdata Search
  // const { boundaries } = this.state;

  // window.open('https://search.earthdata.nasa.gov/search', '_blank');
};

/**
 * Handle type-checking of defined properties
 */
SmartHandoff.propTypes = {
  isLayerSelected: PropTypes.bool,
  isActive: PropTypes.bool,
  products: PropTypes.object,
  selectedProduct: PropTypes.string,
  selectProduct: PropTypes.func,
  showWarningModal: PropTypes.func,
  map: PropTypes.object.isRequired,
  onBoundaryChange: PropTypes.func,
  boundaries: PropTypes.object,
  proj: PropTypes.object,
  screenHeight: PropTypes.number,
  screenWidth: PropTypes.number,
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
    browser, layers, map, proj, data, config, compare, sidebar, boundaries,
  } = state;
  const { screenWidth, screenHeight } = browser;
  const { selectedProduct } = data;
  const { activeString } = compare;
  const activeLayers = getLayers(layers[activeString], { proj: proj.id });
  const products = getDataProductsFromActiveLayers(
    activeLayers,
    config,
    proj.id,
  );
  return {
    screenWidth,
    screenHeight,
    boundaries,
    proj: proj.selected,
    map,
    selectedProduct,
    products,
    tabTypes,
    activeLayers,
    isActive: sidebar.activeTab === 'download',
  };
};

/**
 * React-Redux; used for SmartHandoff component to fire specific actions events
 * @param {*} dispatch | A function of the Redux store that is triggered upon a change of state.
 */
const mapDispatchToProps = (dispatch) => ({
  showWarningModal: () => {
    dispatch(
      openCustomContent('warning_now_leaving_worldview', {
        headerText: 'Leaving Worldview',
        bodyComponent: SmartHandoffModal(),
        size: 'lg',
      }),
    );
  },
  onBoundaryChange: (bounds) => {
    dispatch(changeCropBounds(bounds));
  },
});

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(SmartHandoff);
