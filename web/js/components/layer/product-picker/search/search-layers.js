import React from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { Button } from 'reactstrap';
import { withSearch } from '@elastic/react-search-ui';
import SearchLayerList from './search-layers-list';
import ProductFacet from './product-facet';
import Scrollbars from '../../../util/scrollbar';
import LayerMetadataDetail from './layer-metadata-detail';
import {
  updateListScrollTop,
  toggleMobileFacets as toggleMobileFacetsAction,
} from '../../../../modules/product-picker/actions';
import facetConfig from '../../../../modules/product-picker/facetConfig';

function SearchLayers(props) {
  const {
    isMobile,
    browser,
    selectedLayer,
    bodyHeight,
    facets,
    showMobileFacets,
    toggleMobileFacets,
  } = props;

  const listDetailContainerClass = selectedLayer
    ? 'layer-list-detail-container show-details'
    : 'layer-list-detail-container';

  const showFacets = browser.greaterThan.small || showMobileFacets;
  const showListAndDetails = isMobile ? !showFacets : true;
  const facetHeight = isMobile ? 'calc(100vh - 125px)' : '100%';

  return (
    <div className="search-layers-container" style={{ height: bodyHeight }}>

      {showFacets && (
        <div className="facet-container">
          <Scrollbars style={{ height: facetHeight }}>
            <div className="inner-container">
              {facetConfig.map((config) => {
                const facet = facets[config.field];
                const data = (facet && facet.length && facet[0].data) || [];
                return (
                  <ProductFacet
                    key={config.field}
                    field={config.field}
                    label={config.label}
                    filterType={config.filterType}
                    tooltip={config.tooltip}
                    show={config.show}
                    view={config.view}
                    data={data}
                  />
                );
              })}
            </div>
          </Scrollbars>

          {isMobile && showMobileFacets && (
            <Button
              className="apply-facets"
              onClick={toggleMobileFacets}
            >
              Apply
            </Button>
          )}
        </div>
      )}


      {showListAndDetails && (
        <div className={listDetailContainerClass}>

          <div className="layer-list-container search">
            <Scrollbars style={{ height: '100%' }}>
              <SearchLayerList />
            </Scrollbars>
          </div>

          { !selectedLayer && browser.lessThan.large ? null : (
            <div className="layer-detail-container layers-all search">
              <Scrollbars style={{ height: '100%' }}>
                <LayerMetadataDetail />
              </Scrollbars>
            </div>
          )}

        </div>
      )}

    </div>
  );
}

SearchLayers.propTypes = {
  browser: PropTypes.object,
  bodyHeight: PropTypes.number,
  facets: PropTypes.object,
  isMobile: PropTypes.bool,
  selectedLayer: PropTypes.object,
  showMobileFacets: PropTypes.bool,
  toggleMobileFacets: PropTypes.func,
};

const mapDispatchToProps = (dispatch) => ({
  updateScrollPosition: (scrollTop) => {
    dispatch(updateListScrollTop(scrollTop));
  },
  toggleMobileFacets: () => {
    dispatch(toggleMobileFacetsAction());
  },
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
