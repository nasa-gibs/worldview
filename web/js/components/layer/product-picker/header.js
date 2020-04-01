import React from 'react';
import PropTypes from 'prop-types';
import {
  InputGroup,
  Input,
  Button,
  Breadcrumb,
  BreadcrumbItem,
  UncontrolledDropdown,
  DropdownToggle,
  DropdownMenu,
} from 'reactstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFilter, faArrowLeft } from '@fortawesome/free-solid-svg-icons';
import LayerFilters from './layer-filters';
import util from '../../../util/util';


/*
 * A scrollable list of layers
 * @class LayerList
 * @extends React.Component
 */
class ProductPickerHeader extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      inputValue: props.inputValue,
    };
    this.revertToInitialScreen = this.revertToInitialScreen.bind(this);
    this.handleChange = this.handleChange.bind(this);
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
    const { updateListState } = this.props;
    e.preventDefault();
    updateListState();
    this.setState({ inputValue: '' });
  }

  handleChange(e) {
    const { setSearchTerm } = this.props;
    setSearchTerm(e.target.value, { shouldClearFilters: false });
    this.setState({ inputValue: e.target.value });
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

  render() {
    const isAutoFocus = !util.browser.touchDevice;
    const { inputValue } = this.state;
    const {
      selectedProjection,
      selectedDate,
      listType,
      category,
      width,
      toggleFilterByAvailable,
      filterByAvailable,
      isMobile,
      children,
      enableSearchMode,
    } = this.props;
    const isSearching = listType === 'search';
    const categoryId = category && category.id;
    const showBackButton = isSearching
      || (categoryId !== 'featured-all'
      && selectedProjection === 'geographic'
      && listType !== 'category');
    const isBreadCrumb = showBackButton && !isSearching && width > 650;

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

          <Button className="filter-button" onClick={enableSearchMode}>
            <FontAwesomeIcon icon={faFilter} />
          </Button>

          <Input
            onChange={this.handleChange}
            id="layers-search-input"
            value={inputValue}
            placeholder="Search"
            // eslint-disable-next-line no-return-assign
            innerRef={(c) => (this._input = c)}
            type="search"
            autoFocus={isAutoFocus}
          />
        </InputGroup>
        {children}
      </>
    );
  }
}

ProductPickerHeader.propTypes = {
  category: PropTypes.object,
  children: PropTypes.node,
  filterByAvailable: PropTypes.bool,
  inputValue: PropTypes.string,
  isMobile: PropTypes.bool,
  listType: PropTypes.string,
  setSearchTerm: PropTypes.func,
  selectedDate: PropTypes.object,
  selectedProjection: PropTypes.string,
  toggleFilterByAvailable: PropTypes.func,
  updateListState: PropTypes.func,
  width: PropTypes.number,
};

export default ProductPickerHeader;
