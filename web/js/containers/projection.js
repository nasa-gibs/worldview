import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { get as lodashGet } from 'lodash';
import googleTagManager from 'googleTagManager';
import changeProjection from '../modules/projection/actions';
import { onToggle } from '../modules/modal/actions';
import IconList from '../components/util/icon-list';
import {
  changeTimeScale,
  selectInterval,
  changeSmartInterval as changeSmartIntervalAction,
} from '../modules/date/actions';
import {
  TIME_SCALE_TO_NUMBER,
} from '../modules/date/constants';

const DEFAULT_PROJ_ARRAY = [
  {
    text: 'Arctic',
    iconClass: 'ui-icon icon-large',
    iconName: 'arrow-circle-up',
    id: 'change-arctic-button',
    key: 'arctic',
  },
  {
    text: 'Geographic',
    iconClass: 'ui-icon icon-large',
    iconName: 'circle',
    id: 'change-geographic-button',
    key: 'geographic',
  },
  {
    text: 'Antarctic',
    iconClass: 'ui-icon icon-large',
    iconName: 'arrow-circle-down',
    id: 'change-antarctic-button',
    key: 'antarctic',
  },
];

const getInfoArray = function(projArray) {
  return projArray.map((el) => ({
    text: el.name,
    iconClass: ' ui-icon icon-large',
    iconName: el.style,
    id: `change-${el.id}-button`,
    key: el.id,
  }));
};

class ProjectionList extends Component {
  constructor(props) {
    super(props);
    this.onClick = this.onClick.bind(this);
  }

  onClick(id) {
    const {
      updateProjection, projection, onCloseModal, changeTimeScale, changeSmartInterval, layers,
    } = this.props;

    if (id !== projection) {
      updateProjection(id);
      const enableSmart = layers.filter((layer) => layer.projections && Object.keys(layer.projections).includes(id) && layer.visible && layer.id.includes('TEMPO')).length > 0;
      // Defaults to 1 day if new projection has no TEMPO layers present
      const timescale = enableSmart ? TIME_SCALE_TO_NUMBER.minute : TIME_SCALE_TO_NUMBER.day;
      changeSmartInterval(1, timescale, enableSmart);
      selectInterval(1, timescale, false, enableSmart);
      changeTimeScale(enableSmart ? TIME_SCALE_TO_NUMBER.hour : timescale);
    }

    googleTagManager.pushEvent({
      event: 'change_projection',
      projection: id,
    });
    onCloseModal();
  }

  render() {
    const { projection, projectionArray, isMobile } = this.props;
    return (
      <IconList
        list={projectionArray}
        active={projection}
        onClick={this.onClick}
        size={isMobile ? 'large' : 'small'}
      />
    );
  }
}

const mapStateToProps = (state) => {
  const {
    config, models, proj, screenSize, layers,
  } = state;
  const projArray = lodashGet(config, 'ui.projections');
  const projectionArray = projArray
    ? getInfoArray(projArray)
    : DEFAULT_PROJ_ARRAY;
  const isMobile = screenSize.isMobileDevice;
  return {
    models,
    isMobile,
    projection: proj.id,
    projectionArray,
    layers: layers.active.layers,
  };
};

const mapDispatchToProps = (dispatch) => ({
  updateProjection: (id) => {
    dispatch(changeProjection(id));
  },
  onCloseModal: () => {
    dispatch(onToggle());
  },
  changeTimeScale: (val) => {
    dispatch(changeTimeScale(val));
  },
  changeSmartInterval: (delta, timeScale, smartSelected) => {
    dispatch(changeSmartIntervalAction(delta, timeScale, smartSelected));
  },
});

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(ProjectionList);

ProjectionList.propTypes = {
  onCloseModal: PropTypes.func,
  isMobile: PropTypes.bool,
  projection: PropTypes.string,
  projectionArray: PropTypes.oneOfType([PropTypes.array, PropTypes.oneOf(['null'])]),
  updateProjection: PropTypes.func,
  changeTimeScale: PropTypes.func,
  changeSmartInterval: PropTypes.func,
  layers: PropTypes.array,
};
