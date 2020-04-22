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
// import LayerFilters from './layer-filters';
import {
  selectLayer as selectLayerAction,
  toggleCategoryMode as toggleCategoryModeAction,
  toggleSearchMode as toggleSearchModeAction,
} from '../../../modules/product-picker/actions';
import FilterUnavailable from './filterUnavailable';


/*
 * A scrollable list of layers
 * @class LayerList
 * @extends React.Component
 */
class ProductPickerHeader extends React.Component {
  constructor(props) {
    super(props);
    this.revertToInitialScreen = this.revertToInitialScreen.bind(this);
    this.handleChange = this.handleChange.bind(this);
    this.onSearchInputFocus = this.onSearchInputFocus.bind(this);
    this.resetSearch = this.resetSearch.bind(this);
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
    const { setSearchTerm } = this.props;
    const { value } = e.target;
    setSearchTerm(value, {
      shouldClearFilters: false,
      debounce: 200,
    });
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
      isMobile,
      selectedProjection,
      mode,
      filters,
      category,
      width,
      results,
      searchTerm,
      selectedLayer,
      toggleSearchMode,
    } = this.props;
    const isSearching = mode === 'search';
    const categoryId = category && category.id;
    const showBackButton = isSearching
      || (categoryId !== 'featured-all'
      && selectedProjection === 'geographic'
      && mode !== 'category');
    const isBreadCrumb = showBackButton && !isSearching && width > 650;
    const showReset = !!(filters.length || searchTerm.length);

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

          {(mode !== 'search' && !selectedLayer)
            && (
              <Button
                className="filter-button"
                onClick={toggleSearchMode}
              >
                <FontAwesomeIcon icon={faFilter} />
              </Button>
            )}

          {showReset && (
            <Button
              className="clear-filters"
              onClick={() => this.resetSearch()}
            >
              Reset
            </Button>
          )}

          <Input
            onChange={this.handleChange}
            id="layers-search-input"
            value={searchTerm}
            placeholder="Search"
            type="search"
            onFocus={(e) => this.onSearchInputFocus(e)}
          />
        </InputGroup>
        {(mode === 'search' && !isMobile) && (
          <div className="header-filter-container">
            <div className="header-filters">
              <FilterUnavailable
                // selectedDate={selectedDate}
                filterByAvailable
                toggleFilterByAvailable={this.toggleFilterByAvailable}
              />
            </div>
            <div className="results-text">
              { `Showing ${results.length} results`}
              {/* {numRowsFilteredOut > 0 && (
                  <span>
                    {`(${numRowsFilteredOut} hidden by filters)`}
                  </span>
                )} */}
            </div>
          </div>
        )}
      </>
    );
  }
}

ProductPickerHeader.propTypes = {
  category: PropTypes.object,
  clearFilters: PropTypes.func,
  filters: PropTypes.array,
  isMobile: PropTypes.bool,
  mode: PropTypes.string,
  results: PropTypes.array,
  setSearchTerm: PropTypes.func,
  selectedLayer: PropTypes.object,
  selectedProjection: PropTypes.string,
  searchTerm: PropTypes.string,
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
});

const mapStateToProps = (state, ownProps) => {
  const { productPicker, browser, proj } = state;
  const {
    mode,
    category,
    selectedDate,
    selectedLayer,
    filterByAvailable,
  } = productPicker;
  const isMobile = browser.lessThan.medium;

  return {
    isMobile,
    mode,
    category,
    selectedDate,
    selectedLayer,
    selectedProjection: proj.id,
    filterByAvailable,
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
