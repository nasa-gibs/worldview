import React from 'react';
import PropTypes from 'prop-types';
import { Steps } from 'intro.js-react';

// import 'intro.js/introjs.css';
// import './index.css';

class TourStart extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      stepsEnabled: true,
      initialStep: 0,
      steps: [
        {
          element: '.hello',
          intro: 'Hello step'
        },
        {
          element: '.world',
          intro: 'World step'
        }
      ],
      hintsEnabled: true,
      hints: [
        {
          element: '.hello',
          hint: 'Hello hint',
          hintPosition: 'middle-right'
        }
      ]
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
    const { stepsEnabled, steps, initialStep, hintsEnabled, hints } = this.state;

    return (
      <div>
        <Steps
          enabled={stepsEnabled}
          steps={steps}
          initialStep={initialStep}
          onExit={this.onExit}
        />

        <div className="controls">
          <div>
            <button onClick={this.toggleSteps}>Toggle Steps</button>
          </div>
        </div>
      </div>
    );
  }
}

// TourStart.propTypes = {
// };

export default TourStart;
