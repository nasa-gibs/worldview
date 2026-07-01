import PropTypes from 'prop-types';
import lodashRound from 'lodash/round';

const Pick = ({
  color, height, max, path, position, text, width, yOffset,
}) => {
  const visibility = (position < 0 || position > max) ? 'hidden' : 'visible';
  const translate = `translate(${position},${yOffset})`;

  const getText = (x, y) => {
    if (!text) return false;
    return (
      <text
        x={x}
        y={y}
        alignmentBaseline="middle"
        textAnchor="middle"
        style={{ visibility }}
      >
        {text}
      </text>
    );
  };

  return (
    <g transform={translate}>
      <path
        style={{
          fill: color || null,
          visibility,
        }}
        d={path}
        transform={`translate(${-width / 2}, ${-height / 4})`}
      />
      {getText(-5, lodashRound(height / 6, 4))}
    </g>
  );
};

Pick.propTypes = {
  color: PropTypes.string,
  height: PropTypes.number,
  max: PropTypes.number,
  path: PropTypes.string,
  position: PropTypes.number,
  text: PropTypes.string,
  width: PropTypes.number,
  yOffset: PropTypes.number,
};

export default Pick;
