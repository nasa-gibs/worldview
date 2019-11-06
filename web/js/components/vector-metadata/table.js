import React from 'react';
import PropTypes from 'prop-types';
import { Table } from 'reactstrap';
import VectorMetaTooltip from './tooltip';
import util from '../../util/util';

export default class VectorMetaTable extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      tooltipOpen: false
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
          const title = obj.featureTitle;
          return (
            <div key={util.encodeId(title + '_' + metaIndex)}>
              <Table size="sm">
                <thead>
                  <tr>
                    <th>{title || (obj.title + ' ' + (metaIndex + 1))}</th>
                  </tr>
                </thead>
                <tbody>
                  {metaLegend.map((properties, index) => {
                    const featureId = properties.Identifier;
                    const hasValueMap = !!properties.ValueMap;
                    const value = properties.ValueMap ? properties.ValueMap[metaFeatures[featureId]] : metaFeatures[featureId];
                    const id = util.cleanId(String(title + '-' + (metaIndex + index)));
                    if (!value) return undefined;
                    return (
                      <tr key={'vector-row-' + id}>
                        <td>

                          {properties && properties.Description ? (
                            <VectorMetaTooltip id={id} index={index} description={properties.Description} />
                          ) : undefined
                          }
                          <div className='vector-feature-name-cell' >{properties.Title ? properties.Title : featureId}</div>
                        </td>
                        <td>
                          <span >{value}</span>
                          {properties && properties.Units ? (<span>{' ' + properties.Units} </span>) : undefined}
                        </td>

                      </tr>
                    );
                  })}
                </tbody>
              </Table>
            </div>
          );
        })
        }
      </div>);
  }
}
VectorMetaTable.propTypes = {
  metaFeatures: PropTypes.object.isRequired,
  metaLegend: PropTypes.object.isRequired
};
