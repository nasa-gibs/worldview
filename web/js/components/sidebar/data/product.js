import React from 'react';
import PropTypes from 'prop-types';
import util from '../../../util/util';
import googleTagManager from 'googleTagManager';
const listId = 'wv-data';

class Data extends React.Component {
  getHeaderContents() {
    const {
      id,
      productObject,
      countsObject,
      isSelected,
      showUnavailableReason
    } = this.props;
    if (!productObject.notSelectable) {
      return (
        <React.Fragment>
          <input type="radio" value={id} checked={isSelected} readOnly={true} />
          <h3
            className="header"
            dangerouslySetInnerHTML={{ __html: productObject.title }}
          />
          <i id={id + 'dynamictext'} className="dynamic">
            {countsObject[id] + ' Selected ' || 0 + ' Selected '}
          </i>
        </React.Fragment>
      );
    } else {
      return (
        <h3 className="header">
          {'Not available for download  '}
          <span
            onClick={e => {
              showUnavailableReason();
              googleTagManager.pushEvent({
                'event': 'data_download_not_available'
              });
            }}
            className="link"
          >
            (?)
          </span>
        </h3>
      );
    }
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
        <ul className="wv-datacategory" id={'wv-data' + id}>
          {productObject.items.map((layer, index) => {
            return (
              <li
                key={layer + index}
                id={listId + '-' + id + util.encodeId(layer.value)}
                className="item item-static"
              >
                <h4> {layer.label} </h4>
                <p dangerouslySetInnerHTML={{ __html: layer.sublabel }} />
              </li>
            );
          })}
        </ul>
      </div>
    );
  }
}
Data.defaultProps = {
  count: 0
};
Data.propTypes = {
  count: PropTypes.number,
  selectProduct: PropTypes.func,
  id: PropTypes.string,
  productObject: PropTypes.object,
  countsObject: PropTypes.object,
  isSelected: PropTypes.bool,
  showUnavailableReason: PropTypes.func
};

export default Data;
