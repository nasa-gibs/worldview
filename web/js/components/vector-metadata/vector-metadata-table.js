import React from 'react';
import PropTypes from 'prop-types';
import { Table } from 'reactstrap';

export default class VectorMetaTable extends React.Component {
  render() {
    var header, data;
    let metaFeatures = this.props.metaFeatures;
    let metaLegend = this.props.metaLegend;
    if (
      metaFeatures &&
      (typeof metaFeatures === 'object' && metaFeatures !== null)
    ) {
      let metaFeaturesArray = Object.entries(metaFeatures);
      header = metaFeaturesArray.map(([featureId, i]) => (
        <th key={i} index={i}>
          {featureId}
        </th>
      ));
      data = metaFeaturesArray.map(([featureId, i]) => (
        <th key={i} index={i}>
          {i}
        </th>
      ));
    }
    console.log(metaLegend);
    return (
      <Table striped bordered size="sm">
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
