import { useState } from 'react';
import PropTypes from 'prop-types';

function Tooltip(props) {
  const {
    onClick,
    text,
    dataArray,
  } = props;

  const [hovered, setHovered] = useState(false);

  function mouseOver() {
    setHovered(true);
  }

  function mouseOut() {
    setHovered(false);
  }

  return (
    <div
      onMouseEnter={mouseOver}
      onMouseLeave={mouseOut}
      className="wv-tooltip-case"
    >
      <span>{text}</span>
      <div
        className="wv-tooltip"
        style={hovered ? { visibility: 'visible' } : {}}
      >
        <ul>
          {dataArray.map((dataEl, i) => (
            <li
              /* eslint react/no-array-index-key: 1 */
              key={`tooltip-${dataEl}-${i}`}
              id={dataEl}
              onClick={(dataEl) => onClick(dataEl)}
            >
              {dataEl}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

Tooltip.propTypes = {
  dataArray: PropTypes.oneOfType([PropTypes.array, PropTypes.oneOf(['null'])]),
  text: PropTypes.string.isRequired,
  onClick: PropTypes.func,
};

export default Tooltip;
