import React from 'react';

class TourBox extends React.Component {
  render() {
    return (
      <a href="#" className={this.props.className} onClick={(e) => this.props.startTour(e, this.props.box)}>
        <div className="tour-box-content">
          <div className="tour-box-header">
            <h3 className="tour-box-title">{this.props.title}</h3>
          </div>
          <div className="tour-box-description">
            <p>{this.props.description}</p>
          </div>
        </div>
      </a>
    );
  }
}

export default TourBox;