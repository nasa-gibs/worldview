import React from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import {
  InputGroup,
  Input,
  Button,
  Breadcrumb,
  BreadcrumbItem,
} from 'reactstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFilter, faArrowLeft } from '@fortawesome/free-solid-svg-icons';
import { withSearch } from '@elastic/react-search-ui';
import {
  selectLayer as selectLayerAction,
  toggleCategoryMode as toggleCategoryModeAction,
  toggleSearchMode as toggleSearchModeAction,
  toggleMobileFacets as toggleMobileFacetsAction,
} from '../../../modules/product-picker/actions';
import { getLayersForProjection } from '../../../modules/product-picker/selectors';


class ProductPickerHeader extends React.Component {
  constructor(props) {
    super(props);
    this.revertToInitialScreen = this.revertToInitialScreen.bind(this);
    this.handleChange = this.handleChange.bind(this);
    this.onSearchInputFocus = this.onSearchInputFocus.bind(this);
    this.resetSearch = this.resetSearch.bind(this);
  }

  componentDidMount() {
    const { isMobile } = this.props;
    setTimeout(() => {
      if (this._input && !isMobile) this._input.focus();
    }, 500);
  }

  /**
   * Go back to original screen
   * @method revertToInitialScreen
   */
  revertToInitialScreen(e) {
    const {
      clearFilters,
      setSearchTerm,
      toggleCategoryMode,
    } = this.props;
    e.preventDefault();

    toggleCategoryMode();
    setSearchTerm('');
    clearFilters();
  }

  handleChange = (e) => {
    const {
      setSearchTerm,
      showMobileFacets,
      toggleMobileFacets,
    } = this.props;
    const { value } = e.target;

    this.onSearchInputFocus();
    setSearchTerm(value, {
      shouldClearFilters: false,
      debounce: 200,
    });

    // Entering search terms on mobile should hide facets
    if (showMobileFacets) {
      toggleMobileFacets();
    }
  }

  renderBreadCrumb() {
    const { category } = this.props;
    return (
      <Breadcrumb tag="nav" className="layer-bread-crumb">
        <BreadcrumbItem
          tag="a"
          title="Back to Layer Categories"
          href="#"
          onClick={this.revertToInitialScreen}
        >
          Categories
        </BreadcrumbItem>
        <BreadcrumbItem active tag="span">
          {category && category.title}
        </BreadcrumbItem>
      </Breadcrumb>
    );
  }

  resetSearch() {
    const { setSearchTerm, unselectLayer } = this.props;
    unselectLayer();
    setSearchTerm('', {
      shouldClearFilters: true,
      debounce: 100,
    });
  }

  onSearchInputFocus (e) {
    const { mode, toggleSearchMode } = this.props;
    if (mode !== 'search') {
      toggleSearchMode();
    }
  }

  render() {
    const {
      category,
      categoryType,
      filters,
      isMobile,
      layerCount,
      mode,
      showMobileFacets,
      toggleMobileFacets,
      results,
      searchTerm,
      selectedLayer,
      selectedProjection,
      toggleSearchMode,
      width,
    } = this.props;
    const isSearching = mode === 'search';
    const categoryId = category && category.id;
    const showBackButton = isSearching
      || (categoryId !== 'featured-all'
      && selectedProjection === 'geographic'
      && mode !== 'category');
    const recentLayersMode = categoryType === 'recent';
    const isBreadCrumb = showBackButton && !isSearching && width > 650;
    const showReset = !!(filters.length || searchTerm.length);
    const showFilterBtnMobile = recentLayersMode
      || (mode === 'search' ? !showMobileFacets : !selectedLayer);
    const showFilterBnDesktop = recentLayersMode
      || (mode !== 'search' && !selectedLayer);
    const showFilterBn = isMobile ? showFilterBtnMobile : showFilterBnDesktop;
    const filterBtnFn = mode !== 'search' ? toggleSearchMode : toggleMobileFacets;

    return (
      <>
        <InputGroup id="layer-search" className="layer-search">
          {showBackButton && (
            <>
              <Button
                className="back-button"
                color="secondary"
                onClick={this.revertToInitialScreen}
              >
                <FontAwesomeIcon icon={faArrowLeft} />
              </Button>
              {isBreadCrumb && this.renderBreadCrumb()}
            </>
          )}

          {showReset && (
            <Button
              className="clear-filters"
              onClick={() => this.resetSearch()}
            >
              Reset
            </Button>
          )}

          {showFilterBn && (
            <Button
              className="filter-button"
              onClick={filterBtnFn}
              title="Filter layer results"
            >
              <FontAwesomeIcon icon={faFilter} />
            </Button>
          )}


          <Input
            onChange={this.handleChange}
            onClick={this.onSearchInputFocus}
            id="layers-search-input"
            value={searchTerm}
            placeholder="Search"
            type="search"
            // eslint-disable-next-line no-return-assign
            innerRef={(c) => (this._input = c)}
          />
        </InputGroup>

        {mode === 'search' && (
          <div className="header-filter-container">
            <div className="results-text">
              {results.length === layerCount
                ? `Showing ${results.length} layers`
                : `Showing ${results.length} out of ${layerCount}`}
            </div>
          </div>
        )}
      </>
    );
  }
}

ProductPickerHeader.propTypes = {
  category: PropTypes.object,
  categoryType: PropTypes.string,
  clearFilters: PropTypes.func,
  filters: PropTypes.array,
  isMobile: PropTypes.bool,
  layerCount: PropTypes.number,
  mode: PropTypes.string,
  results: PropTypes.array,
  setSearchTerm: PropTypes.func,
  selectedLayer: PropTypes.object,
  selectedProjection: PropTypes.string,
  searchTerm: PropTypes.string,
  showMobileFacets: PropTypes.bool,
  toggleMobileFacets: PropTypes.func,
  toggleCategoryMode: PropTypes.func,
  toggleSearchMode: PropTypes.func,
  unselectLayer: PropTypes.func,
  width: PropTypes.number,
};

const mapDispatchToProps = (dispatch) => ({
  unselectLayer: () => {
    dispatch(selectLayerAction(null));
  },
  toggleCategoryMode: () => {
    dispatch(toggleCategoryModeAction());
  },
  toggleSearchMode: () => {
    dispatch(toggleSearchModeAction());
  },
  toggleMobileFacets: () => {
    dispatch(toggleMobileFacetsAction());
  },
});

const mapStateToProps = (state, ownProps) => {
  const { productPicker, browser, proj } = state;
  const {
    mode,
    category,
    categoryType,
    showMobileFacets,
    selectedLayer,
  } = productPicker;
  const isMobile = browser.lessThan.medium;
  const layers = getLayersForProjection(state);

  return {
    layerCount: layers.length,
    category,
    categoryType,
    isMobile,
    showMobileFacets,
    mode,
    selectedLayer,
    selectedProjection: proj.id,
  };
};

export default withSearch(
  ({
    filters,
    clearFilters,
    results,
    searchTerm,
    setSearchTerm,
  }) => ({
    filters,
    clearFilters,
    searchTerm,
    setSearchTerm,
    results,
  }),
)(connect(
  mapStateToProps,
  mapDispatchToProps,
)(ProductPickerHeader));
