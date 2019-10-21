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
    const { metaArray, title } = this.props;
    return metaArray.map((obj, metaIndex) => {
      const metaFeatures = obj.features;
      const metaLegend = obj.legend;
      title
      return (
        <div>
          <Table size="sm">
            <thead>
              <tr>
                <th>{obj.title || (title + ' ' + (metaIndex + 1))}</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(metaFeatures).map(([featureId, i], index) => {
                const properties = lodashFind(metaLegend.mvt_properties, { Identifier: featureId });
                return (
                  <tr key={'vector-row-' + title + '-' + (metaIndex + index)}>

                    <td>
                      {properties && properties.Description ? (
                        <VectorMetaTooltip id={title + '-' + (metaIndex + index)} index={index} description={properties.Description} />
                      ) : undefined
                      }
                      <span>{properties ? properties.Title || featureId : featureId}</span>

                    </td>
                    <td>
                      <span>{i}</span>
                      {properties && properties.Units ? (<span>{' ' + properties.Units} </span>) : undefined}
                    </td>

                  </tr>
                )
              })}
            </tbody>
          </Table>
        </div >
      )
    }
    )
  }
}
VectorMetaTable.propTypes = {
  metaFeatures: PropTypes.object.isRequired,
  metaLegend: PropTypes.object.isRequired
};
