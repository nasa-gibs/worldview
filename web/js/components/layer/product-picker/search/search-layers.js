import React from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { withSearch } from '@elastic/react-search-ui';
import SearchLayerList from './search-layers-list';
import Facets from './facets';
import LayerMetadataDetail from './layer-metadata-detail';
// import {
//   updateListScrollTop,
// } from '../../../../modules/product-picker/actions';

function SearchLayers(props) {
  const {
    isMobile,
    browser,
    selectedLayer,
    showMobileFacets,
  } = props;

  const listDetailContainerClass = selectedLayer
    ? 'layer-list-detail-container show-details'
    : 'layer-list-detail-container';

  const showFacets = browser.greaterThan.small || showMobileFacets;
  const showListAndDetails = isMobile ? !showFacets : true;

  return (
    <div className="search-layers-container">
      <Facets />
      {showListAndDetails && (
        <div className={listDetailContainerClass}>
          <div className="layer-list-container search">
            <SearchLayerList />
          </div>
          { !selectedLayer && browser.lessThan.large ? null : (
            <div className="layer-detail-container layers-all search">
              <LayerMetadataDetail />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

SearchLayers.propTypes = {
  browser: PropTypes.object,
  isMobile: PropTypes.bool,
  selectedLayer: PropTypes.object,
  showMobileFacets: PropTypes.bool,
};

const mapDispatchToProps = (dispatch) => ({
  // updateScrollPosition: (scrollTop) => {
  //   dispatch(updateListScrollTop(scrollTop));
  // },
});

function mapStateToProps(state, ownProps) {
  const { browser, productPicker } = state;
  const { selectedLayer, showMobileFacets } = productPicker;

  return {
    isMobile: browser.lessThan.medium,
    showMobileFacets,
    selectedLayer,
    browser,
  };
}
export default withSearch(
  ({ facets }) => ({ facets }),
)(connect(
  mapStateToProps,
  mapDispatchToProps,
)(SearchLayers));
