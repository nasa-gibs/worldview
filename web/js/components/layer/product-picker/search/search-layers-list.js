import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { withSearch } from '@elastic/react-search-ui';
import InfiniteScroll from 'react-infinite-scroller';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import SwipeToDelete from 'react-swipe-to-delete-component';
import SearchLayerRow from './search-layer-row';
import {
  selectLayer as selectLayerAction,
  clearSingleRecentLayer as clearSingleRecentLayerAction,
} from '../../../../modules/product-picker/actions';
import RecentLayersInfo from '../browse/recent-layers-info';

/*
 * A scrollable list of layers
 * @class LayerList
 * @extends React.Component
 */
class SearchLayerList extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      visibleItems: [],
      hasMoreItems: true,
      nextIndex: 0,
      firstLoadAutoSelect: false,
    };
    this.loadMoreItems = this.loadMoreItems.bind(this);
  }

  static getDerivedStateFromProps(props, state) {
    if (props.selectedLayer) {
      return { firstLoadAutoSelect: true };
    }
    return null;
  }

  /**
   * Handle selecting/showing metadata when there is only a single search result
   */
  componentDidUpdate(prevProps, prevState, snapshot) {
    const { selectedLayer, results } = this.props;
    const { firstLoadAutoSelect } = this.state;
    const selectedLayerInResults = selectedLayer
      && (results || []).find((l) => l.id === selectedLayer.id);

    // Clear metadata when item no longer in list of results
    if (!selectedLayerInResults && selectedLayer) {
      this.showLayerMetadata(null);
    }
    // Select first item in list on initial load
    if (!selectedLayer && results && results.length && !firstLoadAutoSelect) {
      // eslint-disable-next-line react/no-did-update-set-state
      this.setState({ firstLoadAutoSelect: true }, () => {
        const { id } = results[0];
        this.showLayerMetadata(id);
      });
    }
    if (prevProps.results !== results) {
      this.loadMoreItems(0, prevProps);
    }
  }

  /**
   * Loads metadata for layer (if not previously loaded) and
   * triggers showing in layer detail area
   *
   * @param {string} layerId - the layer id to show metadata for
   * @return {void}
   */
  showLayerMetadata(layerId) {
    const {
      results,
      selectedLayer,
      selectLayer,
    } = this.props;
    const layer = results.find((l) => l.id === layerId);

    // No result found, clear the metadata detail view by passing null
    if (!layerId) {
      selectLayer(null);
      return;
    }

    // Single result and we have the metadata for it already
    if (selectedLayer && selectedLayer.id === layerId && layer.metadata) {
      return;
    }

    selectLayer(layer);
  }

  loadMoreItems(page, prevProps) {
    const { results } = this.props;
    const { visibleItems, nextIndex, hasMoreItems } = this.state;

    // If results changed, reset
    if (prevProps) {
      this.setState({
        visibleItems: [],
        hasMoreItems: true,
        nextIndex: 0,
      }, this.loadMoreItems);
      return;
    }

    if (hasMoreItems) {
      const prevIndex = nextIndex;
      const newNextIndex = prevIndex + 50;
      const moreItems = results.slice(prevIndex, newNextIndex);
      const newItems = [...visibleItems, ...moreItems];
      this.setState({
        visibleItems: newItems,
        nextIndex: newNextIndex,
        hasMoreItems: results.length > newItems.length,
      });
    } else {
      this.setState({
        hasMoreItems: false,
      });
    }
  }

  renderNoResults() {
    const { recentLayerMode } = this.props;
    return recentLayerMode
      ? (<RecentLayersInfo />)
      : (
        <div className="no-results">
          <FontAwesomeIcon icon="meteor" size="5x" />
          <h3> No layers found! </h3>
        </div>
      );
  }

  render() {
    const { visibleItems, hasMoreItems } = this.state;
    const {
      results, isMobile, clearSingleRecentLayer, recentLayerMode,
    } = this.props;
    const scrollParentSelector = '.layer-list-container.search .simplebar-content-wrapper';
    this.scrollParent = this.scrollParent || document.querySelector(scrollParentSelector);

    return !results.length
      ? this.renderNoResults()
      : (
        <InfiniteScroll
          pageStart={0}
          loadMore={this.loadMoreItems}
          hasMore={hasMoreItems}
          useWindow={false}
          getScrollParent={() => this.scrollParent}
        >
          <div className="product-outter-list-case layers-all">
            {visibleItems.map((layer) => (isMobile && recentLayerMode
              ? (
                <SwipeToDelete
                  key={layer.id}
                  item={layer}
                  deleteSwipe={0.33}
                  onDelete={() => clearSingleRecentLayer(layer)}
                >
                  <SearchLayerRow
                    layer={layer}
                    showLayerMetadata={(id) => this.showLayerMetadata(id)}
                  />
                </SwipeToDelete>
              )
              : (
                <SearchLayerRow
                  key={layer.id}
                  layer={layer}
                  showLayerMetadata={(id) => this.showLayerMetadata(id)}
                />
              )))}
          </div>
        </InfiniteScroll>
      );
  }
}

SearchLayerList.propTypes = {
  clearSingleRecentLayer: PropTypes.func,
  isMobile: PropTypes.bool,
  results: PropTypes.array,
  recentLayerMode: PropTypes.bool,
  selectedLayer: PropTypes.object,
  selectLayer: PropTypes.func,
};

const mapStateToProps = (state) => {
  const { productPicker, browser } = state;
  const { selectedLayer, categoryType } = productPicker;
  return {
    isMobile: browser.lessThan.medium,
    recentLayerMode: categoryType === 'recent',
    selectedLayer,
  };
};

const mapDispatchToProps = (dispatch) => ({
  selectLayer: (layer) => {
    dispatch(selectLayerAction(layer));
  },
  clearSingleRecentLayer: (layer) => {
    dispatch(clearSingleRecentLayerAction(layer));
  },
});

export default withSearch(
  ({ results }) => ({ results }),
)(connect(
  mapStateToProps,
  mapDispatchToProps,
)(SearchLayerList));
