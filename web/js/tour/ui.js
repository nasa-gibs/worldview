import React, { Component } from 'react';
import { render } from 'react-dom';
import { Steps } from 'intro.js-react';

import 'intro.js/introjs.css';

export default class Tour extends Component {
  constructor(props) {
    super(props);

    this.state = {
      stepsEnabled: true,
      initialStep: 0,
      steps: [
        {
          element: '.hello',
          intro: 'Hello step',
        }
        // {
        //   element: '.world',
        //   intro: 'World step',
        // },
      ]
    };
  }

  render() {
    const { stepsEnabled, steps, initialStep } = this.state;

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
            <button onClick={this.addStep}>Add Step</button>
          </div>
        </div>

        <h1 className="hello">Hello,</h1>
      </div>
    );
  }

  onExit = () => {
    this.setState(() => ({ stepsEnabled: false }));
  };

  toggleSteps = () => {
    this.setState(prevState => ({ stepsEnabled: !prevState.stepsEnabled }));
  };

  addStep = () => {
    const newStep = {
      element: '.alive',
      intro: 'Alive step',
    };

    this.setState(prevState => ({ steps: [...prevState.steps, newStep] }));
  };

}

render(<Tour />, document.getElementById('wv-map'));