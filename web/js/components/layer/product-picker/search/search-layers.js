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

  function renderFacetList() {
    return (
      <div className="inner-container">
        {
          /* {wasSearched && (
              <Sorting label={"Sort by"} sortOptions={SORT_OPTIONS} />
            )} */
        }
        {facetConfig.map((config) => (
          <ProductFacet
            key={config.field}
            field={config.field}
            label={config.label}
            tooltip={config.tooltip}
            show={config.show}
            data={facets[config.field][0].data}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="search-layers-container" style={{ maxHeight: bodyHeight }}>

      { !browser.lessThan.medium && (
        <div className="facet-container">
          <Scrollbars style={{ height: '100%' }}>
            { renderFacetList() }
          </Scrollbars>
        </div>
      ) }

      <div className="layer-list-detail-container">

        <div className="layer-list-container search">
          <Scrollbars style={{ height: '100%' }}>
            <SearchLayerList />
          </Scrollbars>
        </div>

        { !selectedLayer && browser.lessThan.medium ? null : (
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
  ({ results, facets }) => ({ results, facets }),
)(connect(
  mapStateToProps,
  mapDispatchToProps,
)(SearchLayers));
