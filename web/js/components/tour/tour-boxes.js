import React from 'react';
import TourBox from './tour-box';

class TourBoxes extends React.Component {
  render() {
    if (this.props.data) {
      return (
        <div className="tour-box-container">
          <div className="tour-box-row">
            <TourBox
              box="0"
              data={this.props.data}
              startTour={this.props.startTour}
              className={'tour-box ' + this.props.data[0].type}
            ></TourBox>
            <TourBox
              box="1"
              data={this.props.data}
              startTour={this.props.startTour}
              className={'tour-box ' + this.props.data[1].type}
            ></TourBox>
            <TourBox
              box="2"
              data={this.props.data}
              startTour={this.props.startTour}
              className={'tour-box ' + this.props.data[2].type}
            ></TourBox>
          </div>
          <div className="tour-box-row">
            <TourBox
              box="3"
              data={this.props.data}
              startTour={this.props.startTour}
              className={'tour-box ' + this.props.data[3].type}
            ></TourBox>
            <TourBox
              box="4"
              data={this.props.data}
              startTour={this.props.startTour}
              className={'tour-box ' + this.props.data[4].type}
            ></TourBox>
            <TourBox
              box="5"
              data={this.props.data}
              startTour={this.props.startTour}
              className={'tour-box ' + this.props.data[5].type}
            ></TourBox>
          </div>
          <div className="tour-box-row">
            <TourBox
              box="6"
              data={this.props.data}
              startTour={this.props.startTour}
              className={'tour-box ' + this.props.data[6].type}
            ></TourBox>
            <TourBox
              box="7"
              data={this.props.data}
              startTour={this.props.startTour}
              className={'tour-box ' + this.props.data[7].type}
            ></TourBox>
            <TourBox
              box="8"
              data={this.props.data}
              startTour={this.props.startTour}
              className={'tour-box ' + this.props.data[8].type}
            ></TourBox>
          </div>
        </div>
      );
    } else {
      return null;
    }
  }
}

export default TourBoxes;
