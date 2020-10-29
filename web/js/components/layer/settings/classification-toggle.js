import React, { useState } from 'react';
import PropTypes from 'prop-types';
import lodashGet from 'lodash/get';
import Switch from '../../util/switch';
import Scrollbar from '../../util/scrollbar';


export default function ClassificationToggle(props) {
  const {
    legend, toggle, palette, height, toggleAll,
  } = props;
  const switchLength = legend.colors.length;

  const [isEnableAllSelected, toggleEnableAll] = useState((lodashGet(palette, 'disabled.length') === switchLength) && switchLength);

  const { tooltips } = legend;


  return (
    <div className="layer-classification-toggle settings-component">
      <div className="classification-switch-header">
        <h2 className="wv-header">Disable/Enable</h2>
        <Switch
          id="header-disable"
          key="header-disable"
          label="All"
          active={!isEnableAllSelected}
          containerClassAddition="header"
          toggle={() => {
            const arrayOfIndices = !isEnableAllSelected ? [...Array(switchLength).keys()] : [];
            toggleAll(arrayOfIndices);
            toggleEnableAll(!isEnableAllSelected);
          }}
        />

      </div>
      <Scrollbar className="classification-list" style={{ maxHeight: `${height}px` }}>
        {legend.colors.map((color, index) => {
          const id = legend.id + index;
          const tooltip = tooltips[index];
          const inActive = palette.disabled && palette.disabled.includes(index);
          return (
            <Switch
              id={id}
              key={id}
              color={color.substring(0, 6)}
              label={tooltip}
              active={!inActive}
              toggle={() => toggle(index)}
            />
          );
        })}
      </Scrollbar>
    </div>
  );
}

ClassificationToggle.propTypes = {
  height: PropTypes.number,
  legend: PropTypes.object,
  palette: PropTypes.object,
  toggle: PropTypes.func,
  toggleAll: PropTypes.func,
};
