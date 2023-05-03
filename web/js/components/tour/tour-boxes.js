
import React from 'react';
import PropTypes from 'prop-types';
import TourBox from './tour-box';

function TourBoxes(props) {
  const {
    isKioskModeActive, stories, storyOrder, selectTour,
  } = props;
  console.log(`tourBoxes isKioskModeActive: ${isKioskModeActive}`);
  return (
    <div className="tour-box-container">
      <div className="tour-box-row">
        {storyOrder.map((storyId, i) => {
          const story = stories[storyId];
          return (
            <TourBox
            /* eslint react/no-array-index-key: 1 */
              key={i}
              index={i}
              story={story}
              storyId={story.id}
              storyOrder={storyOrder}
              title={story.title}
              description={story.description}
              backgroundImage={story.backgroundImage}
              backgroundImageHover={story.backgroundImageHover}
              selectTour={selectTour}
              className={`tour-box ${story.type}`}
              isKioskModeActive={isKioskModeActive}
            />
          );
        })}
      </div>
    </div>
  );
}

TourBoxes.propTypes = {
  isKioskModeActive: PropTypes.bool,
  selectTour: PropTypes.func.isRequired,
  stories: PropTypes.object.isRequired,
  storyOrder: PropTypes.array.isRequired,
};

export default TourBoxes;
