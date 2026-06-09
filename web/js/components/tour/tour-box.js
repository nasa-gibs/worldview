import React, { useState } from 'react';
import PropTypes from 'prop-types';

function TourBox({
  index, story, storyId, storyOrder, className, title, description,
  selectTour, backgroundImage, backgroundImageHover,
}) {
  const [styles, setStyles] = useState(
    backgroundImage
      ? { backgroundImage: `url(config/metadata/stories/${storyId}/${backgroundImage})` }
      : {},
  );

  const onMouseOver = (e) => {
    e.preventDefault();
    if (backgroundImageHover) {
      setStyles({
        backgroundImage: `url(config/metadata/stories/${storyId}/${backgroundImageHover})`,
      });
    }
  };

  const onMouseOut = (e) => {
    e.preventDefault();
    if (backgroundImage) {
      setStyles({
        backgroundImage: `url(config/metadata/stories/${storyId}/${backgroundImage})`,
      });
    }
  };

  let floatBox = '';
  if (storyOrder.length - (index + 1) === 0 ||
    storyOrder.length - (index + 2) === 0) {
    floatBox = ' tour-box-float';
  }
  return (
    <a
      href="#"
      style={styles}
      onMouseOver={onMouseOver}
      onMouseOut={onMouseOut}
      className={className + floatBox}
      onClick={(e) => selectTour(e, story, index, storyId)}
    >
      <div className="tour-box-content">
        <i className="tour-box-icon" aria-hidden="true" />
        <div className="tour-box-gradient" />
        <div className="tour-box-header">
          <h3 className="tour-box-title">{title}</h3>
        </div>
        <div className="tour-box-description">
          <p>{description}</p>
        </div>
      </div>
    </a>
  );
}

TourBox.propTypes = {
  index: PropTypes.number.isRequired,
  selectTour: PropTypes.func.isRequired,
  story: PropTypes.oneOfType([PropTypes.object, PropTypes.oneOf(['null'])]),
  storyId: PropTypes.string.isRequired,
  backgroundImage: PropTypes.string,
  backgroundImageHover: PropTypes.string,
  className: PropTypes.string,
  description: PropTypes.string,
  storyOrder: PropTypes.oneOfType([PropTypes.array, PropTypes.oneOf(['null'])]),
  title: PropTypes.string,
};

export default TourBox;
