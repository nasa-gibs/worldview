import React from 'react';
import PropTypes from 'prop-types';
import { Table as ReactStrapTable } from 'reactstrap';
import VectorMetaTooltip from './vector-metadata-tooltip';
import util from '../../util/util';

export default class VectorMetadataTable extends React.Component {
  shouldComponentUpdate(nextProps) {
    const { id, title } = this.props;
    if (id && title && nextProps.id && nextProps.title && id === nextProps.id && title === nextProps.title) {
      return false;
    }
    return true;
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
            <div key={util.encodeId(`${title}_${metaIndex}`)}>
              <ReactStrapTable size="sm">
                <thead>
                  <tr>
                    <th>{title || `${obj.title} ${metaIndex + 1}`}</th>
                  </tr>
                </thead>
                <tbody>
                  {metaLegend.map((properties, index) => {
                    const featureId = properties.Identifier;
                    const isIntegerToStyle = properties.Function !== 'Identify' && (properties.DataType === 'int');
                    const value = properties.ValueMap
                      ? properties.ValueMap[metaFeatures[featureId]]
                      : isIntegerToStyle ? metaFeatures[featureId].toLocaleString('en')
                        : metaFeatures[featureId];
                    const id = util.cleanId(String(`${title}-${metaIndex + index}`));
                    if (!value) return undefined;
                    return (
                      <tr key={`vector-row-${id}`}>
                        <td>

                          {properties && properties.Description ? (
                            <VectorMetaTooltip id={id} index={index} description={properties.Description} />
                          ) : undefined}
                          <div className="vector-feature-name-cell">{properties.Title ? properties.Title : featureId}</div>
                        </td>
                        <td>
                          <span>{value}</span>
                          {properties && properties.Units ? (
                            <span>
                              {` ${properties.Units}`}
                              {' '}
                            </span>
                          ) : undefined}
                        </td>

                      </tr>
                    );
                  })}
                </tbody>
              </ReactStrapTable>
            </div>
          );
        })}
      </div>
    );
  }
}
VectorMetadataTable.propTypes = {
  id: PropTypes.number,
  metaArray: PropTypes.array,
  title: PropTypes.string,
};
