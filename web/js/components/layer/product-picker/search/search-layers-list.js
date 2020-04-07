import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { withSearch } from '@elastic/react-search-ui';
import InfiniteScroll from 'react-infinite-scroller';
import { debounce as lodashDebounce } from 'lodash';
import Scrollbars from '../../../util/scrollbar';
import SearchLayerRow from './search-layer-row';
import 'whatwg-fetch'; // fetch() polyfill for IE
import {
  selectLayer as selectLayerAction,
} from '../../../../modules/product-picker/actions';

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
    };
    this.loadMoreItems = this.loadMoreItems.bind(this);
  }

  /**
   * Handle selecting/showing metadata when there is only a single search result
   */
  componentDidMount() {
    const { selectedLayer } = this.props;
    if (selectedLayer && selectedLayer.id) {
      this.showLayerMetadata(selectedLayer.id);
    }
  }

  /**
   * Handle selecting/showing metadata when there is only a single search result
   */
  componentDidUpdate(prevProps, prevState, snapshot) {
    const { selectedLayer, results } = this.props;
    if (prevProps.selectedLayer !== selectedLayer) {
      const id = selectedLayer ? selectedLayer.id : null;
      this.showLayerMetadata(id);
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

    // Single result, auto selected, and we have the metadata for it already
    if (selectedLayer && selectedLayer.id === layerId && layer.metadata) {
      return;
    }

    if (!layer.metadata) {
      const errorMessage = '<p>There was an error loading layer metadata.</p>';
      const uri = `config/metadata/layers/${layer.description}.html`;
      fetch(uri)
        .then((res) => (res.ok ? res.text() : errorMessage))
        .then((body) => {
          // Check that we have a metadata html snippet, rather than a fully
          // formed HTML file. Also avoid executing any script or style tags.
          const isMetadataSnippet = !body.match(/<(head|body|html|style|script)[^>]*>/i);
          layer.metadata = isMetadataSnippet ? body : errorMessage;
          selectLayer(layer);
        });
    } else {
      selectLayer(layer);
    }
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

  render() {
    const { visibleItems, hasMoreItems } = this.state;
    const {
      componentHeights, isMobile,
    } = this.props;
    const { listHeight, listMinHeight } = componentHeights;
    const listContainerClass = isMobile
      ? 'layer-list-container search mobile'
      : 'layer-list-container search ';
    const scrollHeightStyles = {
      height: `${listHeight}px`,
      maxHeight: `${listHeight}px`,
      minHeight: `${listMinHeight}px`,
    };
    const scrollParentSelector = '.layer-list-container .simplebar-content-wrapper';
    const debouncedOnScroll = lodashDebounce(({ scrollTop }) => {
      // updateScrollPosition(scrollTop);
    }, 500);
    this.scrollParent = this.scrollParent || document.querySelector(scrollParentSelector);

    return (
      <div className={listContainerClass}>
        <Scrollbars
          style={scrollHeightStyles}
          // scrollBarVerticalTop={listScrollTop}
          onScroll={debouncedOnScroll}
        >
          <div className="product-outter-list-case layers-all">
            <InfiniteScroll
              pageStart={0}
              loadMore={this.loadMoreItems}
              hasMore={hasMoreItems}
              useWindow={false}
              getScrollParent={() => this.scrollParent}
            >
              {visibleItems.map((layer) => (
                <SearchLayerRow
                  key={layer.id}
                  layer={layer}
                  showLayerMetadata={(id) => this.showLayerMetadata(id)}
                />
              ))}
            </InfiniteScroll>
          </div>
        </Scrollbars>
      </div>
    );
  }
}

SearchLayerList.propTypes = {
  componentHeights: PropTypes.object,
  results: PropTypes.array,
  isMobile: PropTypes.bool,
  selectedLayer: PropTypes.object,
  selectLayer: PropTypes.func,
};

const mapStateToProps = (state, ownProps) => {
  const { productPicker, browser } = state;
  const { selectedLayer } = productPicker;
  return {
    isMobile: browser.lessThan.medium,
    selectedLayer,
  };
};

const mapDispatchToProps = (dispatch) => ({
  selectLayer: (layer) => {
    dispatch(selectLayerAction(layer));
  },
});

export default withSearch(
  ({ results }) => ({ results }),
)(connect(
  mapStateToProps,
  mapDispatchToProps,
)(SearchLayerList));
