import React from 'react';
import PropTypes from 'prop-types';
import Switch from '../../util/switch';
import Scrollbar from '../../util/scrollbar';

export default function ClassificationToggle (props) {
  const {
    legend, toggle, palette, height,
  } = props;
  const { tooltips } = legend;
  return (
    <div className="layer-classification-toggle settings-component">
      <h2 className="wv-header">Disable/Enable</h2>
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
ClassificationToggle.defaultProps = {
  start: 100,
};
ClassificationToggle.propTypes = {
  active: PropTypes.bool,
  height: PropTypes.number,
  layer: PropTypes.object,
  legend: PropTypes.object,
  palette: PropTypes.object,
  setOpacity: PropTypes.func,
  start: PropTypes.number,
  toggle: PropTypes.func,
};
