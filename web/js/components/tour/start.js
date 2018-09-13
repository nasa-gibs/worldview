import React from 'react';
import PropTypes from 'prop-types';
import { Steps } from 'intro.js-react';

class TourStart extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      stepsEnabled: true,
      initialStep: 0,
      steps: [
        {
          element: '.element1',
          intro: 'Element 1 step',
        },
        {
          element: '.element2',
          intro: 'Element 2 step'
        }
      ],
      options: {
        overlayOpacity: 0
      }
    };

    this.onExit = this.onExit.bind(this);
    this.toggleSteps = this.toggleSteps.bind(this);
  }

  onExit() {
    this.setState(() => ({ stepsEnabled: false }));
  };

  toggleSteps() {
    this.setState(prevState => ({ stepsEnabled: !prevState.stepsEnabled }));
  };

  render() {
    const { stepsEnabled, steps, initialStep, options } = this.state;

    return (
      <div>
        <Steps
          enabled={stepsEnabled}
          steps={steps}
          initialStep={initialStep}
          onExit={this.onExit}
          options={options}
        />

        <div className="controls">
          <div>
            <button onClick={this.toggleSteps}>Toggle Steps</button>
          </div>
        </div>

        <h1 className="element1">Element 1</h1>
        <hr />
        <h1 className="element2">Element 2!</h1>
        <hr />
        <h1 className="element3">Element 3!</h1>
      </div>
    );
  }
}

TourStart.propTypes = {
  stepsEnabled: PropTypes.bool,
  initialStep: PropTypes.number,
  steps: PropTypes.object,
  options: PropTypes.object
};

export default TourStart;
