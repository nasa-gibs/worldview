import React from 'react';
import TourBox from './tour-box';

class TourBoxes extends React.Component {
  render() {
    if (this.props.data) {
      var data = this.props.data;
      var startTour = this.props.startTour;
      return (
        <div className="tour-box-container">
          <div className="tour-box-row">
            {data.map(function(object, i) {
              return (<TourBox key={i} box={i} tourId={object.id} title={object.title} description={object.description} backgroundImage={object.backgroundImage} backgroundImageHover={object.backgroundImageHover} startTour={startTour} className={'tour-box ' + object.type}/>);
            })}
          </div>
        </div>
      );
    } else {
      return null;
    }
  }
}

export default TourBoxes;
