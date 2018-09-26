import React from 'react';

class TourBox extends React.Component {
  render() {
    if (this.props.data) {
      return (
        <a href="#" className={this.props.className} onClick={this.props.startTour}>
          <div className="tour-box-content">
            <div className="tour-box-header">
              <h3 className="tour-box-title">{this.props.data[this.props.box].title}</h3>
            </div>
            <div className="tour-box-description">
              <p>{this.props.data[this.props.box].description}</p>
            </div>
          </div>
        </a>
      );
    } else {
      return null;
    }
  }
}

export default TourBox;