import React from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import {
  InputGroup,
  Input,
  Button,
  Breadcrumb,
  BreadcrumbItem,
  UncontrolledTooltip,
} from 'reactstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { withSearch } from '@elastic/react-search-ui';
import {
  selectLayer as selectLayerAction,
  toggleCategoryMode as toggleCategoryModeAction,
  toggleSearchMode as toggleSearchModeAction,
  toggleMobileFacets as toggleMobileFacetsAction,
  saveSearchState as saveSearchStateAction,
} from '../../../modules/product-picker/actions';
import { getLayersForProjection } from '../../../modules/product-picker/selectors';
import util from '../../../util/util';
import { JOYRIDE_INCREMENT } from '../../../util/constants';

const { events } = util;

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
      filters,
      searchTerm,
      searchConfig,
      saveSearchState,
      toggleCategoryMode,
    } = this.props;
    e.preventDefault();
    saveSearchState(filters, searchTerm, searchConfig);
    toggleCategoryMode();
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
  };

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
      setTimeout(() => {
        events.trigger(JOYRIDE_INCREMENT);
      }, 4000);
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
    const searchMode = mode === 'search';
    const categoryId = category && category.id;
    const recentLayersMode = categoryType === 'recent';
    const featuredLayersMode = categoryType === 'featured';
    const showBackButton = searchMode
      || (categoryId !== 'featured-all'
      && selectedProjection === 'geographic'
      && mode !== 'category'
      && !featuredLayersMode
      && !recentLayersMode);
    const isBreadCrumb = showBackButton && !searchMode && width > 650;
    const showReset = !!(filters.length || searchTerm.length) && mode === 'search';
    const showFilterBtnMobile = recentLayersMode
      || (searchMode ? !showMobileFacets : !selectedLayer);
    const showFilterBnDesktop = recentLayersMode
      || (!searchMode && !selectedLayer);
    const showFilterBn = isMobile ? showFilterBtnMobile : showFilterBnDesktop;
    const filterBtnFn = !searchMode ? toggleSearchMode : toggleMobileFacets;
    const inputClass = !searchMode && searchTerm ? 'faded' : '';

    return (
      <>
        <InputGroup id="layer-search" className="layer-search">
          {showBackButton && (
            <>
              <Button
                id="layer-back-button"
                className="back-button"
                color="secondary"
                onClick={this.revertToInitialScreen}
              >
                <UncontrolledTooltip
                  id="center-align-tooltip"
                  placement="right"
                  target="layer-back-button"
                >
                  Return to category view
                </UncontrolledTooltip>
                <FontAwesomeIcon icon="arrow-left" />
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
              id="layer-filter-button"
              className="filter-button"
              onClick={filterBtnFn}
              aria-label="Filtered layer search"
            >
              <UncontrolledTooltip
                id="center-align-tooltip"
                placement="right"
                target="layer-filter-button"
              >
                Filtered layer search
              </UncontrolledTooltip>
              <FontAwesomeIcon icon="filter" />
            </Button>
          )}

          <Input
            className={inputClass}
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
  filters: PropTypes.array,
  isMobile: PropTypes.bool,
  layerCount: PropTypes.number,
  mode: PropTypes.string,
  results: PropTypes.array,
  saveSearchState: PropTypes.func,
  searchConfig: PropTypes.object,
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
  saveSearchState: (filters, searchTerm, searchConfig) => {
    dispatch(saveSearchStateAction(filters, searchTerm, searchConfig));
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

const mapStateToProps = (state) => {
  const { productPicker, screenSize, proj } = state;
  const {
    mode,
    category,
    categoryType,
    showMobileFacets,
    selectedLayer,
    searchConfig,
  } = productPicker;
  const isMobile = screenSize.isMobileDevice;
  const layers = getLayersForProjection(state);

  return {
    layerCount: layers.length,
    category,
    categoryType,
    isMobile,
    showMobileFacets,
    mode,
    searchConfig,
    selectedLayer,
    selectedProjection: proj.id,
  };
};

export default withSearch(
  ({
    filters,
    results,
    searchTerm,
    setSearchTerm,
  }) => ({
    filters,
    searchTerm,
    setSearchTerm,
    results,
  }),
)(connect(
  mapStateToProps,
  mapDispatchToProps,
)(ProductPickerHeader));
