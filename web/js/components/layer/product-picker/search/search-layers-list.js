import { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { withSearch } from '@elastic/react-search-ui';
import InfiniteScroll from 'react-infinite-scroller';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import SwipeToDelete from '../../../util/swipe-to-delete';
import SearchLayerRow from './search-layer-row';
import {
  selectLayer as selectLayerAction,
  clearSingleRecentLayer as clearSingleRecentLayerAction,
} from '../../../../modules/product-picker/actions';
import RecentLayersInfo from '../browse/recent-layers-info';
import usePrevious from '../../../../util/customHooks';

/*
 * A scrollable list of layers
 */
function SearchLayerList(props) {
  const {
    selectedLayer,
    results,
    selectLayer,
    recentLayerMode,
    isMobile,
    clearSingleRecentLayer,
  } = props;

  const [visibleItems, setVisibleItems] = useState([]);
  const [hasMoreItems, setHasMoreItems] = useState(true);
  const [nextIndex, setNextIndex] = useState(0);
  const [firstLoadAutoSelect, setFirstLoadAutoSelect] = useState(false);

  const scrollParentSelector = '.layer-list-container.search .simplebar-content-wrapper';
  const scrollParentRef = useRef(document.querySelector(scrollParentSelector));
  const isMountedRef = useRef(false);

  const prevResults = usePrevious(results);

  useEffect(() => {
    if (!selectedLayer) return;
    setFirstLoadAutoSelect(true);
  }, [selectedLayer]);

  /**
   * Handle selecting/showing metadata when there is only a single search result
   */
  useEffect(() => {
    if (!isMountedRef.current) {
      isMountedRef.current = true;
      return;
    }
    const selectedLayerInResults = selectedLayer &&
      (results || []).find((l) => l.id === selectedLayer.id);

    // Clear metadata when item no longer in list of results
    if (!selectedLayerInResults && selectedLayer) {
      showLayerMetadata(null);
    }
    // Select first item in list on initial load
    if (!selectedLayer && results && results.length && !firstLoadAutoSelect) {
      setFirstLoadAutoSelect(true);
    }
    if (prevResults !== results) {
      loadMoreItems();
    }
  }, [selectedLayer, results]);

  useEffect(() => {
    if (!firstLoadAutoSelect || !results[0]) return;
    const { id } = results[0];
    showLayerMetadata(id);
  }, [firstLoadAutoSelect]);

  useEffect(() => {
    if (!hasMoreItems) return;
    loadMoreItems();
  }, [hasMoreItems]);

  /**
   * Loads metadata for layer (if not previously loaded) and
   * triggers showing in layer detail area
   *
   * @param {string} layerId - the layer id to show metadata for
   * @return {void}
   */
  function showLayerMetadata(layerId) {
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

  function loadMoreItems() {
    // If results changed, reset
    if (!hasMoreItems) {
      setVisibleItems([]);
      setHasMoreItems(true);
      setNextIndex(0);
      return;
    }

    if (hasMoreItems) {
      const prevIndex = nextIndex;
      const newNextIndex = prevIndex + 50;
      const moreItems = results.slice(prevIndex, newNextIndex);
      const newItems = [...visibleItems, ...moreItems];
      setVisibleItems(newItems);
      setNextIndex(newNextIndex);
      setHasMoreItems(results.length > newItems.length);
    } else {
      setHasMoreItems(false);
    }
  }

  function renderNoResults() {
    return recentLayerMode
      ? (<RecentLayersInfo />)
      : (
        <div className="no-results">
          <FontAwesomeIcon icon="meteor" size="5x" widthAuto />
          <h3> No layers found! </h3>
        </div>
      );
  }

  return !results.length
    ? renderNoResults()
    : (
      <InfiniteScroll
        pageStart={0}
        loadMore={loadMoreItems}
        hasMore={hasMoreItems}
        useWindow={false}
        getScrollParent={scrollParentRef.current}
      >
        <div className="product-outer-list-case layers-all">
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
                  showLayerMetadata={(id) => showLayerMetadata(id)}
                />
              </SwipeToDelete>
            )
            : (
              <SearchLayerRow
                key={layer.id}
                layer={layer}
                showLayerMetadata={(id) => showLayerMetadata(id)}
              />
            )))}
        </div>
      </InfiniteScroll>
    );
}

SearchLayerList.propTypes = {
  clearSingleRecentLayer: PropTypes.func,
  isMobile: PropTypes.bool,
  results: PropTypes.oneOfType([PropTypes.array, PropTypes.oneOf(['null'])]),
  recentLayerMode: PropTypes.bool,
  selectedLayer: PropTypes.oneOfType([PropTypes.object, PropTypes.oneOf(['null'])]),
  selectLayer: PropTypes.func,
};

const mapStateToProps = (state) => {
  const { productPicker, screenSize } = state;
  const { selectedLayer, categoryType } = productPicker;
  return {
    isMobile: screenSize.isMobileDevice,
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
