import React from 'react';
import PropTypes from 'prop-types';
import { Table } from 'reactstrap';
import VectorMetaTooltip from './tooltip';
import { find as lodashFind } from 'lodash';
import Scrollbars from '../util/scrollbar';

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
    const { metaArray, title, height } = this.props;
    return (
      <div>
        {metaArray.map((obj, metaIndex) => {
          const metaFeatures = obj.features;
          const metaLegend = obj.legend;
          return (
            <div key={title + '_' + metaIndex}>
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
                          <span>{properties ? properties.Title || featureId : featureId}</span>
                          {properties && properties.Description ? (
                            <VectorMetaTooltip id={title + '-' + (metaIndex + index)} index={index} description={properties.Description} />
                          ) : undefined
                          }


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
