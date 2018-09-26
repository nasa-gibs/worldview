import React from 'react';
import { Modal, ModalHeader, ModalBody } from 'reactstrap';

class ModalStart extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      data: '',
      description: '',
      isLoading: false,
      error: null
    };
  }

  componentDidMount() {
    this.setState({ isLoading: true });

    fetch('../stories/stories.json', {
      method: 'get'
    }).then(response => {
      if (response.ok) {
        return response.json();
      } else {
        throw new Error('Something went wrong ...');
      }
    })
      .then(data => this.setState({ data: data, isLoading: false }))
      .catch(error => this.setState({ error, isLoading: false }));
  }

  render() {
    var { data, description, isLoading, error } = this.state;

    if (isLoading) description = 'Loading ..';
    if (error) description = error.message;
    if (data) description = data[0].description;

    return (
      <div>
        <Modal isOpen={this.props.modalStart} toggle={this.props.toggleModalStart} wrapClassName='tour tour-start' className={this.props.className} backdrop={true}>
          <ModalHeader toggle={this.props.toggleModalStart} charCode="">Welcome to Worldview!</ModalHeader>
          <ModalBody>
            <div className="tour-intro">
              <p className="intro">
                The NASA Worldview app provides a satellite's perspective of the planet as it
                looks today and as it has in the past. Click an event below to analyze the event in
                great detail within the application. These guides will walk you through new and
                create ways to use Worldview. <a href="#" title="Start using Worldview" onClick={this.props.toggleModalStart}>Start using Worldview <i className="fa fa-arrow-right" aria-hidden="true"></i></a>
              </p>
            </div>
            <div className="tour-box-container">
              <div className="tour-box-row">
                <a href="#" className="tour-box wildfire" onClick={this.props.startTour}>
                  <div className="tour-box-content">
                    <div className="tour-box-header">
                      <h3 className="tour-box-title">
                        Wildfire Event<br />
                        Wildfire Event<br />
                        Wildfire Event
                      </h3>
                    </div>
                    <div className="tour-box-description">
                      <p>{description}</p>
                    </div>
                  </div>
                </a>
                <a href="#" className="tour-box volcano" onClick={this.props.startTour}>
                  <div className="tour-box-content">
                    <div className="tour-box-header">
                      <h3 className="tour-box-title">
                        Volcano Event<br />
                        Volcano Event
                      </h3>
                    </div>
                    <div className="tour-box-description">
                      <p>{description}</p>
                    </div>
                  </div>
                </a>
                <a href="#" className="tour-box snow" onClick={this.props.startTour}>
                  <div className="tour-box-content">
                    <div className="tour-box-header">
                      <h3 className="tour-box-title">Snow Event</h3>
                    </div>
                    <div className="tour-box-description">
                      <p>{description}</p>
                    </div>
                  </div>
                </a>
              </div>
              <div className="tour-box-row">
                <a href="#" className="tour-box sea-and-lake-ice" onClick={this.props.startTour}>
                  <div className="tour-box-content">
                    <div className="tour-box-header">
                      <h3 className="tour-box-title">Sea and Lake Ice Event</h3>
                    </div>
                    <div className="tour-box-description">
                      <p>{description}</p>
                    </div>
                  </div>
                </a>
                <a href="#" className="tour-box iceberg" onClick={this.props.startTour}>
                  <div className="tour-box-content">
                    <div className="tour-box-header">
                      <h3 className="tour-box-title">Iceberg Event</h3>
                    </div>
                    <div className="tour-box-description">
                      <p>{description}</p>
                    </div>
                  </div>
                </a>
                <a href="#" className="tour-box water-color" onClick={this.props.startTour}>
                  <div className="tour-box-content">
                    <div className="tour-box-header">
                      <h3 className="tour-box-title">Water Color Event</h3>
                    </div>
                    <div className="tour-box-description">
                      <p>{description}</p>
                    </div>
                  </div>
                </a>
              </div>
              <div className="tour-box-row">
                <a href="#" className="tour-box dust-and-haze" onClick={this.props.startTour}>
                  <div className="tour-box-content">
                    <div className="tour-box-header">
                      <h3 className="tour-box-title">Dust and Haze Event</h3>
                    </div>
                    <div className="tour-box-description">
                      <p>{description}</p>
                    </div>
                  </div>
                </a>
                <a href="#" className="tour-box severe-storm" onClick={this.props.startTour}>
                  <div className="tour-box-content">
                    <div className="tour-box-header">
                      <h3 className="tour-box-title">Severe Storm Event</h3>
                    </div>
                    <div className="tour-box-description">
                      <p>{description}</p>
                    </div>
                  </div>
                </a>
                <a href="#" className="tour-box man-made" onClick={this.props.startTour}>
                  <div className="tour-box-content">
                    <div className="tour-box-header">
                      <h3 className="tour-box-title">Man Made Event</h3>
                    </div>
                    <div className="tour-box-description">
                      <p>{description}</p>
                    </div>
                  </div>
                </a>
              </div>
            </div>
          </ModalBody>
        </Modal>
      </div>
    );
  }
}

export default ModalStart;