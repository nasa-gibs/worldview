import React from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { withSearch } from '@elastic/react-search-ui';
import SearchLayerList from './search-layers-list';
import Facets from './facets';
import LayerMetadataDetail from './layer-metadata-detail';

function SearchLayers(props) {
  const {
    smallView,
    isMobile,
    width,
    mediumBreakpoint,
    selectedLayer,
    showMobileFacets,
    results,
  } = props;

  const showFacets = (width > mediumBreakpoint && !isMobile) || showMobileFacets;
  const showListAndDetails = isMobile ? !showFacets : true;

  return (
    <div className="search-layers-container">
      <Facets />
      {showListAndDetails && (
        <div className="layer-list-detail-container">
          <div className="layer-list-container search">
            <SearchLayerList />
          </div>
          {!selectedLayer && smallView ? null : !!results.length && (
            <div className="layer-detail-container layers-all search">
              <LayerMetadataDetail layer={selectedLayer} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

SearchLayers.propTypes = {
  width: PropTypes.number,
  isMobile: PropTypes.bool,
  mediumBreakpoint: PropTypes.number,
  results: PropTypes.array,
  selectedLayer: PropTypes.object,
  smallView: PropTypes.bool,
  showMobileFacets: PropTypes.bool,
};

function mapStateToProps(state) {
  const { screenSize, productPicker } = state;
  const { selectedLayer, showMobileFacets } = productPicker;

  return {
    layer: selectedLayer,
    smallView: screenSize.screenWidth < screenSize.breakpoints.small,
    isMobile: screenSize.isMobileDevice,
    width: screenSize.screenWidth,
    mediumBreakpoint: screenSize.breakpoints.medium,
    showMobileFacets,
    selectedLayer,
    screenSize,
  };
}
export default withSearch(
  ({ facets, results }) => ({ facets, results }),
)(connect(
  mapStateToProps,
  null,
)(SearchLayers));
