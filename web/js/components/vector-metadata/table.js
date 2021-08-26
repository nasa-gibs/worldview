import React from 'react';
import PropTypes from 'prop-types';
import { Table } from 'reactstrap';
import VectorMetaTooltip from './tooltip';
import util from '../../util/util';
import { checkTemperatureUnitConversion, convertPaletteValue, getAbbrevFromTemperatureUnit } from '../../modules/global-unit/util';

export default class VectorMetaTable extends React.Component {
  shouldComponentUpdate(nextProps) {
    const { id, title } = this.props;
    if (id && title && nextProps.id && nextProps.title && id === nextProps.id && title === nextProps.title) {
      return false;
    }
    return true;
  }

  render() {
    const { metaArray, globalTemperatureUnit } = this.props;

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
                    const featureId = properties.Identifier;
                    const isIntegerToStyle = properties.Function !== 'Identify' && (properties.DataType === 'int');
                    let value = properties.ValueMap
                      ? properties.ValueMap[metaFeatures[featureId]]
                      : isIntegerToStyle ? metaFeatures[featureId].toLocaleString('en')
                        : metaFeatures[featureId];
                    const id = util.cleanId(String(`${title}-${metaIndex + index}`));

                    let description = properties.Description;
                    let unit = properties.Units;
                    if (value && unit) {
                      const initialUnit = unit;
                      unit = getAbbrevFromTemperatureUnit(unit) || unit;
                      const { needsConversion, legendTempUnit } = checkTemperatureUnitConversion(unit, globalTemperatureUnit);
                      if (needsConversion) {
                        value = `${convertPaletteValue(`${value}`, legendTempUnit, globalTemperatureUnit)}`;
                        description = description.replace(initialUnit, globalTemperatureUnit);
                        unit = '';
                      }
                    }

                    if (!value) return undefined;
                    return (
                      <tr key={`vector-row-${id}`}>
                        <td>
                          {description ? (
                            <VectorMetaTooltip id={id} index={index} description={description} />
                          ) : undefined}
                          <div className="vector-feature-name-cell">{properties.Title ? properties.Title : featureId}</div>
                        </td>
                        <td>
                          <span>{value}</span>
                          {unit
                          && (
                            <span>
                              {' '}
                              {unit}
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
  globalTemperatureUnit: PropTypes.string,
  metaArray: PropTypes.array,
  title: PropTypes.string,
};
