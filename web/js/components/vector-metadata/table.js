import React from 'react';
import PropTypes from 'prop-types';
import { Table } from 'reactstrap';
import VectorMetaTooltip from './tooltip';
import util from '../../util/util';

export default class VectorMetaTable extends React.Component {
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
              <Table size="sm">
                <thead>
                  <tr>
                    <th>{title || `${obj.title} ${metaIndex + 1}`}</th>
                  </tr>
                </thead>
                <tbody>
                  {metaLegend.map((properties, index) => {
                    const {
                      Function, ValueMap, DataType, Title, Identifier, Units, Description,
                    } = properties;

                    const isIntegerToStyle = Function !== 'Identify' && (DataType === 'int');
                    const value = ValueMap
                      ? ValueMap[metaFeatures[Identifier]]
                      : isIntegerToStyle ? metaFeatures[Identifier].toLocaleString('en')
                        : metaFeatures[Identifier] ? metaFeatures[Identifier] : null;
                    const id = util.cleanId(String(`${title}-${metaIndex + index}`));

                    if (!value) return undefined;
                    return (
                      <tr key={`vector-row-${id}`}>
                        <td>
                          {Description ? (
                            <VectorMetaTooltip id={id} index={index} description={Description} />
                          ) : undefined}
                          <div className="vector-feature-name-cell">{Title || Identifier}</div>
                        </td>
                        <td>
                          <span>{value}</span>
                          {Units && (
                            <span>
                              {' '}
                              {Units}
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </Table>
            </div>
          );
        })}
      </div>
    );
  }
}
VectorMetaTable.propTypes = {
  id: PropTypes.number,
  metaArray: PropTypes.array,
  title: PropTypes.string,
};
