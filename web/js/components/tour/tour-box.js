import React from 'react';
import PropTypes from 'prop-types';

class TourBox extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      styles: { },
    };

    this.onMouseOver = this.onMouseOver.bind(this);
    this.onMouseOut = this.onMouseOut.bind(this);
  }

  UNSAFE_componentWillMount() {
    const { backgroundImage, storyId } = this.props;
    if (backgroundImage) {
      this.setState({
        styles: {
          backgroundImage: `url(config/metadata/stories/${storyId}/${backgroundImage})`,
        },
      });
    }
  }

  onMouseOver(e) {
    const { backgroundImageHover, storyId } = this.props;
    e.preventDefault();
    if (backgroundImageHover) {
      this.setState({
        styles: {
          backgroundImage: `url(config/metadata/stories/${storyId}/${backgroundImageHover})`,
        },
      });
    }
  }

  onMouseOut(e) {
    const { backgroundImage, storyId } = this.props;
    e.preventDefault();
    if (backgroundImage) {
      this.setState({
        styles: {
          backgroundImage: `url(config/metadata/stories/${storyId}/${backgroundImage})`,
        },
      });
    }
  }

  render() {
    const {
      index, story, storyId, storyOrder, className, title, description, selectTour,
    } = this.props;
    const { styles } = this.state;
    let floatBox = '';
    if (storyOrder.length - (index + 1) === 0
      || storyOrder.length - (index + 2) === 0) {
      floatBox = ' tour-box-float';
    }
    return (
      <a
        href="#"
        style={styles}
        onMouseOver={(e) => this.onMouseOver(e)}
        onMouseOut={(e) => this.onMouseOut(e)}
        className={className + floatBox}
        onClick={(e) => selectTour(e, story, index, storyId)}
      >
        <div className="tour-box-content">
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
}

TourBox.propTypes = {
  index: PropTypes.number.isRequired,
  selectTour: PropTypes.func.isRequired,
  story: PropTypes.object.isRequired,
  storyId: PropTypes.string.isRequired,
  backgroundImage: PropTypes.string,
  backgroundImageHover: PropTypes.string,
  className: PropTypes.string,
  description: PropTypes.string,
  storyOrder: PropTypes.array,
  title: PropTypes.string,
};

export default TourBox;
