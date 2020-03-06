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
  }

  componentDidMount() {
    setTimeout(() => {
      if (this._input && !this.props.isMobile) this._input.focus();
    }, 500);
  }

  /**
   * Go back to original screen
   * @method revertToInitialScreen
   */
  revertToInitialScreen(e) {
    e.preventDefault();
    this.props.updateListState();
    this.setState({ inputValue: '' });
  }

  handleChange(e) {
    this.props.runSearch(e.target.value);
    this.setState({ inputValue: e.target.value });
  }

  render() {
    const isAutoFocus = !util.browser.touchDevice;
    const {
      selectedProjection,
      selectedDate,
      listType,
      category,
      width,
      toggleFilterByAvailable,
      filterByAvailable,
      isMobile,
    } = this.props;
    const isSearching = listType === 'search';
    const categoryId = category && category.id;
    const showBackButton = isSearching
      || (categoryId !== 'featured-all'
      && selectedProjection === 'geographic'
      && listType !== 'category');
    const isBreadCrumb = showBackButton && !isSearching && width > 650;
    const BreadcrubEl = (
      <Breadcrumb tag="nav" className="layer-bread-crumb">
        <BreadcrumbItem
          tag="a"
          title="Back to Layer Categories"
          href="#"
          onClick={this.revertToInitialScreen.bind(this)}
        >
          Categories
        </BreadcrumbItem>
        <BreadcrumbItem active tag="span">
          {category && category.title}
        </BreadcrumbItem>
      </Breadcrumb>
    );

    return (
      <>
        <InputGroup id="layer-search" className="layer-search">
          {showBackButton
          && (
            <>
              <Button
                className="back-button"
                color="secondary"
                onClick={this.revertToInitialScreen.bind(this)}
              >
                <FontAwesomeIcon icon={faArrowLeft} />
              </Button>
              {isBreadCrumb && BreadcrubEl}
            </>
          )}
          {isSearching && isMobile
            && (
            <UncontrolledDropdown>
              <DropdownToggle className="filter-button" caret>
                <FontAwesomeIcon icon={faFilter} />
              </DropdownToggle>
              <DropdownMenu>
                <LayerFilters
                  selectedDate={selectedDate}
                  filterByAvailable={filterByAvailable}
                  toggleFilterByAvailable={toggleFilterByAvailable}
                />
              </DropdownMenu>
            </UncontrolledDropdown>
            )}

          <Input
            onChange={this.handleChange.bind(this)}
            id="layers-search-input"
            value={this.state.inputValue}
            placeholder="Search"
            // eslint-disable-next-line no-return-assign
            innerRef={(c) => (this._input = c)}
            type="search"
            autoFocus={isAutoFocus}
          />
        </InputGroup>
        {this.props.children}
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
  modalView: PropTypes.string,
  runSearch: PropTypes.func,
  selectedDate: PropTypes.object,
  selectedProjection: PropTypes.string,
  toggleFilterByAvailable: PropTypes.func,
  updateListState: PropTypes.func,
  width: PropTypes.number,
};

export default ProductPickerHeader;
