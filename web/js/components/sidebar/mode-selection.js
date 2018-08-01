import React from 'react';
import PropTypes from 'prop-types';
import { Button, ButtonGroup } from 'reactstrap';

class ModeSelection extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      selected: props.selected
    };
  }
  onclick(mode) {
    this.props.onclick(mode);
    this.setState({ selected: mode });
  }
  render() {
    const { isActive } = this.props;
    const { selected } = this.state;
    return (
      <div
        id="wv-ab-mode-selection-case"
        className="wv-ab-mode-selection-case"
        style={{ display: isActive ? 'block' : 'none' }}
      >
        <h3>COMPARE MODE:</h3>
        <ButtonGroup size="sm">
          <Button
            id="compare-swipe-button"
            className="compare-button"
            disabled={selected === 'swipe'}
            onClick={this.onclick.bind(this, 'swipe')}
          >
            Swipe
          </Button>
          <Button
            id="compare-opacity-button"
            className="compare-button"
            disabled={selected === 'opacity'}
            onClick={this.onclick.bind(this, 'opacity')}
          >
            Opacity
          </Button>
          <Button
            id="compare-spy-button"
            className="compare-button"
            disabled={selected === 'spy'}
            onClick={this.onclick.bind(this, 'spy')}
          >
            Spy
          </Button>
        </ButtonGroup>
      </div>
    );
  }
}
ModeSelection.propTypes = {
  isActive: PropTypes.bool,
  selected: PropTypes.string,
  onclick: PropTypes.func
};

export default ModeSelection;
