import React from 'react';
import PropTypes from 'prop-types';
import { Table } from 'reactstrap';
import VectorMetaTooltip from './tooltip';
import { find as lodashFind } from 'lodash';

export default class VectorMetaTable extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      tooltipOpen: false,
    };
  }
  shouldComponentUpdate(nextProps) {
    if (this.props.title && nextProps.title && this.props.title === nextProps.title) {
      return false;
    } else {
      return true;
    }
  }
  render() {
    const { metaArray } = this.props;

    return (
      <div>
        {metaArray.map((obj, metaIndex) => {
          const metaFeatures = obj.features;
          const metaLegend = obj.legend;
          const title = obj.featureTitle
          return (
            <div key={title + '_' + metaIndex}>
              <Table size="sm">
                <thead>
                  <tr>
                    <th>{title || (obj.title + ' ' + (metaIndex + 1))}</th>
                  </tr>
                </thead>
                <tbody>
                  {metaLegend.map((properties, index) => {
                    const featureId = properties.Identifier;
                    const value = metaFeatures[featureId];
                    return (
                      <tr key={'vector-row-' + title + '-' + (metaIndex + index)}>
                        <td>
                          {properties && properties.Description ? (
                            <VectorMetaTooltip id={title + '-' + (metaIndex + index)} index={index} description={properties.Description} />
                          ) : undefined
                          }
                          <div class='vector-feature-name-cell' >{properties.Title ? properties.Title : featureId}</div>
                        </td>
                        <td>
                          <span >{value}</span>
                          {properties && properties.Units ? (<span>{' ' + properties.Units} </span>) : undefined}
                        </td>

                      </tr>
                    )
                  })}
                </tbody>
              </Table>
            </div>
          )
        })
        }
      </div>)
  }
}
VectorMetaTable.propTypes = {
  metaFeatures: PropTypes.object.isRequired,
  metaLegend: PropTypes.object.isRequired
};
