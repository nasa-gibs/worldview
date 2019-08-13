import React from 'react';
import PropTypes from 'prop-types';
import TourBox from './tour-box';

class TourBoxes extends React.Component {
  render() {
    const { stories, storyOrder, selectTour } = this.props;
    return (
      <div className="tour-box-container">
        <div className="tour-box-row">
          {storyOrder.slice(0, 9).map(function(storyId, i) {
            const story = stories[storyId];
            return (<TourBox key={i} index={i} story={story} storyId={story.id} title={story.title} description={story.description} backgroundImage={story.backgroundImage} backgroundImageHover={story.backgroundImageHover} selectTour={selectTour} className={'tour-box ' + story.type}/>);
          })}
        </div>
      </div>
    );
  }
}

TourBoxes.propTypes = {
  selectTour: PropTypes.func.isRequired,
  stories: PropTypes.object.isRequired,
  storyOrder: PropTypes.array.isRequired
};

export default TourBoxes;
