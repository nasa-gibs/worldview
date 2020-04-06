import React from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import lodashDebounce from 'lodash/debounce';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMeteor } from '@fortawesome/free-solid-svg-icons';
import { Facet } from '@elastic/react-search-ui';
import SearchLayerList from './search-layers-list';
import Scrollbars from '../../../util/scrollbar';
import LayerMetadataDetail from './layer-metadata-detail';
import {
  updateListScrollTop,
} from '../../../../modules/product-picker/actions';

// import {
//   BooleanFacet, Layout, SingleSelectFacet, SingleLinksFacet,
// } from '@elastic/react-search-ui-views';

/*
 * A scrollable list of layers
 * @class LayerList
 * @extends React.Component
 */
class SearchLayers extends React.Component {
  renderDetails() {
    const {
      isMobile,
      selectedLayer,
      componentHeights,
    } = this.props;
    const { detailHeight } = componentHeights;
    const detailContainerClass = isMobile
      ? 'layer-detail-container layers-all search mobile'
      : 'layer-detail-container layers-all search';

    return isMobile && !selectedLayer ? null : (
      <div className={detailContainerClass}>
        <Scrollbars style={{ maxHeight: `${detailHeight}px` }}>
          <LayerMetadataDetail />
        </Scrollbars>
      </div>
    );
  }

  renderLayerList() {
    const {
      componentHeights,
      isMobile,
      listScrollTop,
    } = this.props;
    const { listHeight, listMinHeight } = componentHeights;

    const debouncedOnScroll = lodashDebounce(({ scrollTop }) => {
      // updateScrollPosition(scrollTop);
    }, 500);
    const listContainerClass = isMobile
      ? 'layer-list-container search mobile'
      : 'layer-list-container search';
    return (
      <div className={listContainerClass}>
        <Scrollbars
          style={{
            maxHeight: `${listHeight}px`,
            minHeight: `${listMinHeight}px`,
          }}
          scrollBarVerticalTop={listScrollTop}
          onScroll={debouncedOnScroll}
        >
          <div className="product-outter-list-case">
            <SearchLayerList isMobile={isMobile} />
          </div>
        </Scrollbars>
      </div>
    );
  }

  renderFacetList() {
    const { componentHeights } = this.props;
    const { listHeight, listMinHeight } = componentHeights;
    return (
      <div className="facet-container">
        <Scrollbars
          style={{
            maxHeight: `${listHeight}px`,
            minHeight: `${listMinHeight}px`,
          }}
        >
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
              field="facetPeriod"
              label="Period"
              filterType="any"
              show={10}
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
              field="sources"
              label="Source"
              filterType="any"
              isFilterable
            />
            <Facet
              field="processingLevelId"
              label="Processing Level"
              filterType="any"
              show={3}
            />
          </div>
        </Scrollbars>
      </div>
    );
  }

  renderNoResults() {
    const { componentHeights, numRowsFilteredOut } = this.props;
    const { listMinHeight } = componentHeights;
    return (
      <div className="no-results" style={{ height: `${listMinHeight - 45}px` }}>
        <FontAwesomeIcon icon={faMeteor} size="5x" />
        <h3> No layers found! </h3>
        {numRowsFilteredOut > 0 && (
          <p>
            {`${numRowsFilteredOut} result(s) are being filtered out.`}
            <a className="remove-filters" onClick={this.toggleFilterByAvailable}>
              Remove filters?
            </a>
          </p>
        )}
      </div>
    );
  }

  render() {
    const {
      isMobile,
      selectedLayer,
    } = this.props;
    const containerClass = isMobile ? 'search-container mobile' : 'search-container';

    return (
      <div className={containerClass}>
        {!selectedLayer && this.renderFacetList()}
        {this.renderLayerList()}
        { selectedLayer && this.renderDetails() }
      </div>
    );
  }
}

SearchLayers.propTypes = {
  isMobile: PropTypes.bool,
  listScrollTop: PropTypes.number,
  componentHeights: PropTypes.object,
  numRowsFilteredOut: PropTypes.number,
  selectedLayer: PropTypes.object,
};

const mapDispatchToProps = (dispatch) => ({
  updateScrollPosition: (scrollTop) => {
    dispatch(updateListScrollTop(scrollTop));
  },
});

function mapStateToProps(state, ownProps) {
  const {
    browser,
    productPicker,
  } = state;
  const isMobile = browser.lessThan.medium;

  const {
    listScrollTop,
    numRowsFilteredOut,
    selectedLayer,
  } = productPicker;

  return {
    numRowsFilteredOut,
    selectedLayer,
    listScrollTop,
    isMobile,
  };
}
export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(SearchLayers);
