import React from 'react';

class TourBox extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      styles: { }
    };

    this.onMouseOver = this.onMouseOver.bind(this);
    this.onMouseOut = this.onMouseOut.bind(this);
  }

  componentWillMount() {
    if (this.props.backgroundImage) {
      let { origin, pathname } = window.location;
      this.setState({
        styles: { backgroundImage: `url(${origin}${pathname}config/metadata/stories/${this.props.storyId}/${this.props.backgroundImage})` }
      });
    }
  }

  onMouseOver(e) {
    e.preventDefault();
    if (this.props.backgroundImageHover) {
      let { origin, pathname } = window.location;
      this.setState({
        styles: { backgroundImage: `url(${origin}${pathname}config/metadata/stories/${this.props.storyId}/${this.props.backgroundImageHover})` }
      });
    }
  }

  onMouseOut(e) {
    e.preventDefault();
    if (this.props.backgroundImage) {
      let { origin, pathname } = window.location;
      this.setState({
        styles: { backgroundImage: `url(${origin}${pathname}config/metadata/stories/${this.props.storyId}/${this.props.backgroundImage})` }
      });
    }
  }

  render() {
    return (
      <a href="#" style={this.state.styles} onMouseOver={(e) => this.onMouseOver(e)} onMouseOut={(e) => this.onMouseOut(e)} className={this.props.className} onClick={(e) => this.props.startTour(e, this.props.story, this.props.box, this.props.storyId)}>
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