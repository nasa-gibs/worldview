import React from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { withSearch, Facet } from '@elastic/react-search-ui';
// import { debounce as lodashDebounce } from 'lodash';
import SearchLayerList from './search-layers-list';
import Scrollbars from '../../../util/scrollbar';
import LayerMetadataDetail from './layer-metadata-detail';
import {
  updateListScrollTop,
} from '../../../../modules/product-picker/actions';

function SearchLayers(props) {
  const {
    browser,
    selectedLayer,
    bodyHeight,
  } = props;

  function renderFacetList() {
    return (
      <div className="inner-container">
        {/* {wasSearched && (
              <Sorting label={"Sort by"} sortOptions={SORT_OPTIONS} />
            )} */}
        <Facet
          field="categories"
          label="Category"
          filterType="any"
          show={20}
        />
        <Facet
          field="measurements"
          label="Measurement"
          filterType="any"
          isFilterable
          show={5}
        />
        <Facet
          field="sources"
          label="Source"
          filterType="any"
          isFilterable
        />
        <Facet
          field="facetPeriod"
          label="Period"
          filterType="any"
          show={15}
        />
        <Facet
          field="active"
          label="Currently Active?"
          filterType="any"
        />
        <Facet
          field="track"
          label="Track Asc/Desc"
          filterType="any"
        />
        <Facet
          field="daynight"
          label="Track Day/Night"
          filterType="any"
        />
        <Facet
          field="processingLevelId"
          label="Processing Level"
          filterType="any"
          show={15}
        />
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
  ({ results }) => ({ results }),
)(connect(
  mapStateToProps,
  mapDispatchToProps,
)(SearchLayers));
