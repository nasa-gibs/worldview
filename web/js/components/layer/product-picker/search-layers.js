import React from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import lodashDebounce from 'lodash/debounce';
// eslint-disable-next-line import/no-unresolved
import googleTagManager from 'googleTagManager';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMeteor } from '@fortawesome/free-solid-svg-icons';
import { Facet } from '@elastic/react-search-ui';
import LayerList from './layer-list';
import Scrollbars from '../../util/scrollbar';
import {
  addLayer as addLayerAction,
  removeLayer as removeLayerAction,
} from '../../../modules/layers/actions';
import { onToggle } from '../../../modules/modal/actions';
import LayerMetadataDetail from './layer-metadata-detail';
import {
  updateProductPicker,
  updateListScrollTop,
} from '../../../modules/product-picker/actions';
// import {
//   BooleanFacet, Layout, SingleSelectFacet, SingleLinksFacet,
// } from '@elastic/react-search-ui-views';

/*
 * A scrollable list of layers
 * @class LayerList
 * @extends React.Component
 */
class SearchLayers extends React.Component {
  constructor(props) {
    super(props);

    this.showMetadataForLayer = this.showMetadataForLayer.bind(this);
  }

  /**
   * When in "search" mode
   * @param {*} selectedLayer - the layer for which to show metadata
   */
  showMetadataForLayer(selectedLayer) {
    const { updateProductPickerState } = this.props;
    updateProductPickerState({ selectedLayer });
  }

  renderDetails() {
    const {
      isMobile,
      activeLayers,
      addLayer,
      removeLayer,
      selectedProjection,
      selectedLayer,
      showPreviewImage,
      detailHeight,
    } = this.props;
    const selectedLayerActive = selectedLayer
      && activeLayers.some(({ id }) => id === selectedLayer.id);
    const detailContainerClass = isMobile
      ? 'layer-detail-container layers-all search mobile'
      : 'layer-detail-container layers-all search';

    return isMobile && !selectedLayer ? null : (
      <div className={detailContainerClass}>
        <Scrollbars style={{ maxHeight: `${detailHeight}px` }}>
          <LayerMetadataDetail
            layer={selectedLayer}
            isActive={selectedLayerActive}
            addLayer={addLayer}
            removeLayer={removeLayer}
            selectedProjection={selectedProjection}
            showPreviewImage={showPreviewImage}
            showMetadataForLayer={this.showMetadataForLayer}
          />
        </Scrollbars>
      </div>
    );
  }

  renderLayerList() {
    const {
      listHeight,
      listMinHeight,
      isMobile,
      selectedProjection,
      activeLayers,
      removeLayer,
      addLayer,
      filteredRows,
      selectedLayer,
      updateScrollPosition,
      listScrollTop,
    } = this.props;

    const debouncedOnScroll = lodashDebounce(({ scrollTop }) => {
      updateScrollPosition(scrollTop);
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
            <LayerList
              listType="search"
              isMobile={isMobile}
              addLayer={addLayer}
              removeLayer={removeLayer}
              activeLayers={activeLayers}
              selectedProjection={selectedProjection}
              selectedLayer={selectedLayer}
              filteredRows={filteredRows}
              showMetadataForLayer={(layer) => this.showMetadataForLayer(layer)}
            />
          </div>
        </Scrollbars>
      </div>
    );
  }

  renderFacetList() {
    const { listHeight, listMinHeight } = this.props;
    return (
      <div
        className="facet-container"
        style={{ flexGrow: 1, maxWidth: '300px' }}
      >
        <Scrollbars
          style={{
            maxHeight: `${listHeight}px`,
            minHeight: `${listMinHeight}px`,
          }}
        >
          <div style={{ padding: '10px 15px 10px 10px' }}>
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
              field="projects"
              label="Project (From CMR)"
              filterType="any"
              isFilterable
            />
            <Facet
              field="sources"
              label="Source (From WV configs)"
              filterType="any"
              isFilterable
            />
            <Facet
              field="platforms"
              label="Platform (From CMR)"
              filterType="any"
            />
            <Facet
              field="processingLevelId"
              label="Processing Level"
              filterType="any"
              show={3}
            />
            <Facet
              field="collectionDataType"
              label="Data Type"
              filterType="any"
            />
            <Facet
              field="dataCenter"
              label="Data Center"
              filterType="any"
              show={3}
            />
            <Facet
              field="group"
              label="Layer Group"
              filterType="any"
            />
          </div>
        </Scrollbars>
      </div>
    );
  }

  renderNoResults() {
    const { listMinHeight, numRowsFilteredOut } = this.props;
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
  activeLayers: PropTypes.array,
  addLayer: PropTypes.func,
  filteredRows: PropTypes.array,
  isMobile: PropTypes.bool,
  listScrollTop: PropTypes.number,
  listHeight: PropTypes.number,
  listMinHeight: PropTypes.number,
  detailHeight: PropTypes.number,
  numRowsFilteredOut: PropTypes.number,
  removeLayer: PropTypes.func,
  selectedLayer: PropTypes.object,
  selectedProjection: PropTypes.string,
  showPreviewImage: PropTypes.bool,
  updateProductPickerState: PropTypes.func,
  updateScrollPosition: PropTypes.func,
};

const mapDispatchToProps = (dispatch) => ({
  addLayer: (id) => {
    googleTagManager.pushEvent({
      event: 'layer_added',
      layers: {
        id,
      },
    });
    dispatch(addLayerAction(id));
  },
  removeLayer: (id) => {
    dispatch(removeLayerAction(id));
  },
  onToggle: () => {
    dispatch(onToggle());
  },
  updateScrollPosition: (scrollTop) => {
    dispatch(updateListScrollTop(scrollTop));
  },
  updateProductPickerState: (partialState) => {
    dispatch(updateProductPicker(partialState));
  },
});

function mapStateToProps(state, ownProps) {
  const {
    config,
    browser,
    proj,
    layers,
    compare,
    productPicker,
  } = state;
  const { screenHeight } = browser;
  const isMobile = browser.lessThan.medium;
  const activeString = compare.isCompareA ? 'active' : 'activeB';
  const activeLayers = layers[activeString];
  const { listScrollTop, numRowsFilteredOut, selectedLayer } = productPicker;

  return {
    numRowsFilteredOut,
    selectedLayer,
    listScrollTop,
    isMobile,
    screenHeight,
    activeLayers,
    selectedProjection: proj.id,
    showPreviewImage: config.features.previewSnapshots,
  };
}
export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(SearchLayers);
