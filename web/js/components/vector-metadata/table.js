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
      metaFeatures: this.props.metaFeatures,
      metaLegend: this.props.metaLegend
    };
  }

  render() {
    var header, data;
    const { metaFeatures, metaLegend } = this.state;
    console.log(metaFeatures)
    console.log(metaLegend)
    return (
      <Table size="sm">
        <tbody>
          {Object.entries(metaFeatures).map(([featureId, i], index) => {
            console.log(metaLegend.mvt_properties);
            const properties = lodashFind(metaLegend.mvt_properties, { Identifier: featureId });
            // Object.values(metaLegend.mvt_properties).forEach(property => {
            //   if (property && property.Description && (property.Identifier.toLowerCase() === featureId.toLowerCase())) {
            //     tooltipDescription = property.Description;
            //   }
            // })
            console.log(properties && properties.Description ? properties.Description : properties);
            return (
              <tr>
                <td>
                  {properties ? properties.Title || featureId : featureId}
                </td>
                <td>
                  {i}
                </td>
                {properties && properties.Description ? (
                  <td>
                    <VectorMetaTooltip index={index} description={properties.Description} />
                  </td>
                ) : ''
                }
              </tr>

            )
          })}
        </tbody>
      </Table >
    )
  }
}
VectorMetaTable.propTypes = {
  metaFeatures: PropTypes.object.isRequired,
  metaLegend: PropTypes.object.isRequired
};
