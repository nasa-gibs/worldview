import { useEffect, useRef } from 'react';
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

function ProductPickerHeader(props) {
  const {
    isMobile,
    filters,
    searchTerm,
    searchConfig,
    saveSearchState,
    toggleCategoryMode,
    setSearchTerm,
    showMobileFacets,
    toggleMobileFacets,
    category,
    unselectLayer,
    mode,
    toggleSearchMode,
    categoryType,
    layerCount,
    results,
    selectedLayer,
    selectedProjection,
    width,
  } = props;

  const inputRef = useRef(null);

  useEffect(() => {
    setTimeout(() => {
      if (inputRef.current && !isMobile) inputRef.current.focus();
    }, 500);
  }, []);

  /**
   * Go back to original screen
   * @method revertToInitialScreen
   */
  function revertToInitialScreen(e) {
    e.preventDefault();
    saveSearchState(filters, searchTerm, searchConfig);
    toggleCategoryMode();
  }

  const handleChange = (e) => {
    const { value } = e.target;

    onSearchInputFocus();
    setSearchTerm(value, {
      shouldClearFilters: false,
      debounce: 200,
    });

    // Entering search terms on mobile should hide facets
    if (showMobileFacets) {
      toggleMobileFacets();
    }
  };

  function renderBreadCrumb() {
    return (
      <Breadcrumb tag="nav" className="layer-bread-crumb">
        <BreadcrumbItem
          tag="a"
          title="Back to Layer Categories"
          href="#"
          onClick={revertToInitialScreen}
        >
          Categories
        </BreadcrumbItem>
        <BreadcrumbItem active tag="span">
          {category && category.title}
        </BreadcrumbItem>
      </Breadcrumb>
    );
  }

  function resetSearch() {
    unselectLayer();
    setSearchTerm('', {
      shouldClearFilters: true,
      debounce: 100,
    });
  }

  function onSearchInputFocus (e) {
    if (mode !== 'search') {
      setTimeout(() => {
        events.trigger(JOYRIDE_INCREMENT);
      }, 4000);
      toggleSearchMode();
    }
  }

  const searchMode = mode === 'search';
  const categoryId = category && category.id;
  const recentLayersMode = categoryType === 'recent';
  const featuredLayersMode = categoryType === 'featured';
  const showBackButton = searchMode ||
    (categoryId !== 'featured-all' &&
    selectedProjection === 'geographic' &&
    mode !== 'category' &&
    !featuredLayersMode &&
    !recentLayersMode);
  const isBreadCrumb = showBackButton && !searchMode && width > 650;
  const showReset = !!(filters.length || searchTerm.length) && mode === 'search';
  const showFilterBtnMobile = recentLayersMode ||
    (searchMode ? !showMobileFacets : !selectedLayer);
  const showFilterBnDesktop = recentLayersMode ||
    (!searchMode && !selectedLayer);
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
              onClick={revertToInitialScreen}
            >
              <UncontrolledTooltip
                id="center-align-tooltip"
                placement="right"
                target="layer-back-button"
              >
                Return to category view
              </UncontrolledTooltip>
              <FontAwesomeIcon icon="arrow-left" widthAuto />
            </Button>
            {isBreadCrumb && renderBreadCrumb()}
          </>
        )}

        {showReset && (
          <Button
            className="clear-filters"
            onClick={() => resetSearch()}
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
            <FontAwesomeIcon icon="filter" widthAuto />
          </Button>
        )}

        <Input
          className={inputClass}
          onChange={handleChange}
          onClick={onSearchInputFocus}
          id="layers-search-input"
          value={searchTerm}
          placeholder="Search"
          type="search"

          innerRef={(c) => (inputRef.current = c)}
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

ProductPickerHeader.propTypes = {
  category: PropTypes.oneOfType([PropTypes.object, PropTypes.oneOf(['null'])]),
  categoryType: PropTypes.string,
  filters: PropTypes.oneOfType([PropTypes.array, PropTypes.oneOf(['null'])]),
  isMobile: PropTypes.bool,
  layerCount: PropTypes.number,
  mode: PropTypes.string,
  results: PropTypes.oneOfType([PropTypes.array, PropTypes.oneOf(['null'])]),
  saveSearchState: PropTypes.func,
  searchConfig: PropTypes.oneOfType([PropTypes.object, PropTypes.oneOf(['null'])]),
  setSearchTerm: PropTypes.func,
  selectedLayer: PropTypes.oneOfType([PropTypes.object, PropTypes.oneOf(['null'])]),
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
