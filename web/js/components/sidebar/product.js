import React from 'react';
import PropTypes from 'prop-types';
import googleTagManager from 'googleTagManager';
import util from '../../util/util';

const listId = 'wv-data';

class Product extends React.Component {
  getHeaderContents() {
    const {
      id,
      productObject,
      countsObject,
      isSelected,
      showUnavailableReason,
    } = this.props;
    if (!productObject.notSelectable) {
      return (
        <>
          <input type="radio" value={id} checked={isSelected} readOnly />
          <h3
            className="header"
            dangerouslySetInnerHTML={{ __html: productObject.title }}
          />
          <i id={`${id}dynamictext`} className="dynamic">
            {`${countsObject[id]} Selected ` || `${0} Selected `}
          </i>
        </>
      );
    }
    return (
      <h3 className="header">
        {'Not available for download  '}
        <span
          onClick={(e) => {
            showUnavailableReason();
            googleTagManager.pushEvent({
              event: 'data_download_not_available',
            });
          }}
          className="link"
        >
          (?)
        </span>
      </h3>
    );
  }

  /**
   * When this product is clicked execute selectProduct function
   */
  onSelectProduct() {
    const { selectProduct, id, productObject } = this.props;
    if (productObject.notSelectable) return;
    selectProduct(id);
  }

  render() {
    const { id, productObject, isSelected } = this.props;
    return (
      <div
        className={isSelected ? 'dl-group dl-group-selected ' : 'dl-group'}
        onClick={this.onSelectProduct.bind(this)}
        value={id}
      >
        <div className="head">{this.getHeaderContents()}</div>
        <ul className="wv-datacategory" id={`wv-data${id}`}>
          {productObject.items.map((layer, index) => (
            <li
              /* eslint react/no-array-index-key: 1 */
              key={layer + index}
              id={`${listId}-${id}${util.encodeId(layer.value)}`}
              className="item item-static"
            >
              <h4>
                {' '}
                {layer.label}
                {' '}
              </h4>
              <p dangerouslySetInnerHTML={{ __html: layer.sublabel }} />
            </li>
          ))}
        </ul>
      </div>
    );
  }
}

Product.propTypes = {
  countsObject: PropTypes.object,
  id: PropTypes.string,
  isSelected: PropTypes.bool,
  productObject: PropTypes.object,
  selectProduct: PropTypes.func,
  showUnavailableReason: PropTypes.func,
};

export default Product;
