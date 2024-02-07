
import React from 'react';
import PropTypes from 'prop-types';
import TourBox from './tour-box';

function TourBoxes(props) {
  const { stories, storyOrder, selectTour } = props;
  // when we remove this we need to update tour-box.js render function to index+1 && index+2
  const activeStoryOrder = storyOrder.filter((storyId) => storyId !== 'surface_water_extent');
  return (
    <div className="tour-box-container">
      <div className="tour-box-row">
        {activeStoryOrder.map((storyId, i) => {
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
            />
          );
        })}
      </div>
    </div>
  );
}

TourBoxes.propTypes = {
  selectTour: PropTypes.func.isRequired,
  stories: PropTypes.object.isRequired,
  storyOrder: PropTypes.array.isRequired,
};

export default TourBoxes;
