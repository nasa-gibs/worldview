import React from 'react';
import PropTypes from 'prop-types';
import TourBox from './tour-box';

class TourBoxes extends React.Component {
  render() {
    const { stories, storyOrder, startTour } = this.props;
    return (
      <div className="tour-box-container">
        <div className="tour-box-row">
          {storyOrder.map(function(storyId, i) {
            let story = stories[storyId];
            return (<TourBox key={i} story={story} storyId={story.id} title={story.title} description={story.description} backgroundImage={story.backgroundImage} backgroundImageHover={story.backgroundImageHover} startTour={startTour} className={'tour-box ' + story.type}/>);
          })}
        </div>
      </div>
    );
  }
}

TourBoxes.propTypes = {
  stories: PropTypes.object.isRequired,
  storyOrder: PropTypes.array.isRequired,
  startTour: PropTypes.func.isRequired
};

export default TourBoxes;
