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
      <Switch
        id="header-disable"
        key="header-disable"
        label="Disable/Enable"
        containerClassAddition="header"
        active={!isEnableAllSelected}
        toggle={() => {
          const arrayOfIndices = !isEnableAllSelected ? [...Array(switchLength).keys()] : [];
          toggleAll(arrayOfIndices);
          toggleEnableAll(!isEnableAllSelected);
        }}
      />
      <Scrollbar style={{ maxHeight: `${height}px` }}>
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
