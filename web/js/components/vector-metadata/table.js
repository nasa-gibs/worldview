import React from 'react';
import PropTypes from 'prop-types';
import { Table } from 'reactstrap';
import VectorMetaTooltip from './tooltip';

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
    if (
      metaFeatures &&
      (typeof metaFeatures === 'object' && metaFeatures !== null)
    ) {
      header = Object.entries(metaFeatures).map(([featureId, i], x) => {
        var tooltipDescription;
        Object.values(metaLegend.mvt_properties).forEach(property => {
          if (property && property.Description && (property.Identifier.toLowerCase() === featureId.toLowerCase())) {
            tooltipDescription = property.Description;
          }
        });
        return (
          <th key={x} index={x} className={(tooltipDescription ? 'pr-4' : 'pr-0')}>
            {featureId}
            {tooltipDescription &&
              <VectorMetaTooltip index={x} description={tooltipDescription} />
            }
          </th>
        );
      });

      data = Object.entries(metaFeatures).map(([featureId, i], x) => (
        <th key={x} index={x}>
          {i}
        </th>
      ));
    }

    return (
      <Table dark striped bordered size="sm">
        <thead>
          <tr>
            {header}
          </tr>
        </thead>
        <tbody>
          <tr>
            {data}
          </tr>
        </tbody>
      </Table>
    );
  }
}

VectorMetaTable.propTypes = {
  metaFeatures: PropTypes.object.isRequired,
  metaLegend: PropTypes.object.isRequired
};
