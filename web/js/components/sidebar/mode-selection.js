import React from 'react';
import PropTypes from 'prop-types';
import { Button, ButtonGroup } from 'reactstrap';

class ModeSelection extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      selected: props.selected,
      loaded: false,
    };
  }

  UNSAFE_componentWillReceiveProps(newProp) {
    if (this.state.selected !== newProp.selected) {
      this.setState({ selected: newProp.selected });
    }
  }

  render() {
    const { isActive, selected, onclick } = this.props;
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
            className="compare-button compare-swipe-button"
            disabled={selected === 'swipe'}
            onClick={() => onclick('swipe')}
          >
            Swipe
          </Button>
          <Button
            id="compare-opacity-button"
            className="compare-button compare-opacity-button"
            disabled={selected === 'opacity'}
            onClick={() => onclick('opacity')}
          >
            Opacity
          </Button>
          <Button
            id="compare-spy-button"
            className="compare-button compare-spy-button"
            disabled={selected === 'spy'}
            onClick={() => onclick('spy')}
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
  onclick: PropTypes.func,
  selected: PropTypes.string,
};

export default ModeSelection;
