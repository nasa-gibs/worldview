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
  shouldComponentUpdate(nextProps) {
    if (this.props.metaLegend && nextProps.metaLegend && this.props.metaLegend.id === nextProps.metaLegend.id) {
      return false;
    } else {
      return true;
    }
  }
  render() {
    var header, data;
    const { metaFeatures, metaLegend } = this.state;
    return (
      <Table size="sm">
        <tbody>
          {Object.entries(metaFeatures).map(([featureId, i], index) => {
            const properties = lodashFind(metaLegend.mvt_properties, { Identifier: featureId });
            return (
              <tr key={'vector-row-' + index}>
                <td>{properties ? properties.Title || featureId : featureId}</td>
                <td>{i}</td>
                {properties && properties.Description ? (
                  <td><VectorMetaTooltip index={index} description={properties.Description} /></td>
                ) : undefined
                }
              </tr>
            )
          })}
        </tbody>
      </Table>
    )
  }
}
VectorMetaTable.propTypes = {
  metaFeatures: PropTypes.object.isRequired,
  metaLegend: PropTypes.object.isRequired
};
