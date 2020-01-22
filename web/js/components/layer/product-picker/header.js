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
  DropdownMenu
} from 'reactstrap';
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
      inputValue: props.inputValue
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
      filterByAvailable
    } = this.props;
    const categoryId = category && category.id;
    const isBreadCrumb = categoryId !== 'featured-all' &&
      selectedProjection === 'geographic' &&
      listType !== 'category' &&
      width > 650;
    const isSearching = listType === 'search';

    return (
      <InputGroup id="layer-search" className="layer-search">
        <Button
          className="back-button"
          color="secondary"
          onClick={this.revertToInitialScreen.bind(this)}
        >
          <i className="fa fa-arrow-left" />{' '}
        </Button>

        {isBreadCrumb &&
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
              {listType === 'search'
                ? 'Search Results'
                : category
                  ? category.title
                  : ''}
            </BreadcrumbItem>
          </Breadcrumb>
        }

        {isSearching &&
          <UncontrolledDropdown>
            <DropdownToggle className="filter-button" caret>
              <i className="fas fa-filter"></i>
            </DropdownToggle>
            <DropdownMenu>
              <LayerFilters
                selectedDate={selectedDate}
                filterByAvailable={filterByAvailable}
                toggleFilterByAvailable={toggleFilterByAvailable}
              />
            </DropdownMenu>
          </UncontrolledDropdown>
        }

        <Input
          onChange={this.handleChange.bind(this)}
          id="layers-search-input"
          value={this.state.inputValue}
          placeholder="Search"
          innerRef={c => (this._input = c)}
          type="search"
          autoFocus={isAutoFocus}
        />
      </InputGroup>
    );
  }
}

ProductPickerHeader.propTypes = {
  category: PropTypes.object,
  inputValue: PropTypes.string,
  isMobile: PropTypes.bool,
  listType: PropTypes.string,
  modalView: PropTypes.string,
  runSearch: PropTypes.func,
  selectedProjection: PropTypes.string,
  updateListState: PropTypes.func,
  width: PropTypes.number
};

export default ProductPickerHeader;
