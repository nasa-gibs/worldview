import React from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { withSearch } from '@elastic/react-search-ui';
import SearchLayerList from './search-layers-list';
import ProductFacet from './product-facet';
import Scrollbars from '../../../util/scrollbar';
import LayerMetadataDetail from './layer-metadata-detail';
import {
  updateListScrollTop,
} from '../../../../modules/product-picker/actions';
import facetConfig from '../../../../modules/product-picker/facetConfig';

function SearchLayers(props) {
  const {
    browser,
    selectedLayer,
    bodyHeight,
    facets,
  } = props;

  const listDetailContainerClass = selectedLayer
    ? 'layer-list-detail-container show-details'
    : 'layer-list-detail-container';

  return (
    <div className="search-layers-container" style={{ maxHeight: bodyHeight }}>

      {browser.greaterThan.small && (
        <div className="facet-container">
          <Scrollbars style={{ height: '100%' }}>
            <div className="inner-container">
              {facetConfig.map((config) => {
                const facet = facets[config.field];
                const data = (facet && facet.length && facet[0].data) || [];
                return (
                  <ProductFacet
                    key={config.field}
                    field={config.field}
                    label={config.label}
                    tooltip={config.tooltip}
                    show={config.show}
                    data={data}
                  />
                );
              })}
            </div>
          </Scrollbars>
        </div>
      )}

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
    </div>
  );
}

SearchLayers.propTypes = {
  browser: PropTypes.object,
  bodyHeight: PropTypes.number,
  facets: PropTypes.object,
  selectedLayer: PropTypes.object,
};

const mapDispatchToProps = (dispatch) => ({
  updateScrollPosition: (scrollTop) => {
    dispatch(updateListScrollTop(scrollTop));
  },
});

function mapStateToProps(state, ownProps) {
  const { browser, productPicker } = state;
  const { numRowsFilteredOut, selectedLayer } = productPicker;

  return {
    numRowsFilteredOut,
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
