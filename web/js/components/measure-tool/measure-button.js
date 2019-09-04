import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Button } from 'reactstrap';
import MeasureMenu from './measure-menu';
import { openCustomContent } from '../../modules/modal/actions';

const MEASURE_MENU_PROPS = {
  headerText: null,
  type: 'toolbar',
  modalClassName: 'measure-tool-modal toolbar-modal',
  backdrop: false,
  bodyComponent: MeasureMenu,
  clickType: null,
  wrapClassName: 'toolbar_modal_outer'
};

class MeasureButton extends React.Component {
  onButtonClick (evt) {
    const { openModal } = this.props;
    MEASURE_MENU_PROPS.clickType = evt.type;
    evt.stopPropagation();
    openModal('MEASURE_MENU', MEASURE_MENU_PROPS);
  }

  render() {
    return (
      <Button
        id="wv-measure-button"
        className="wv-measure-button wv-toolbar-button"
        title="Measure distances &amp; areas"
        onTouchEnd={this.onButtonClick.bind(this)}
        onMouseDown={this.onButtonClick.bind(this)}
      >
        <i className="fas fa-ruler fa-2x"></i>{' '}
      </Button>
    );
  }
}

const mapDispatchToProps = dispatch => ({
  openModal: (key, customParams) => {
    dispatch(openCustomContent(key, customParams));
  }
});

export default connect(
  null,
  mapDispatchToProps
)(MeasureButton);

MeasureButton.propTypes = {
  openModal: PropTypes.func
};
