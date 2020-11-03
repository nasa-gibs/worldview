import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { get as lodashGet } from 'lodash';
import googleTagManager from 'googleTagManager';
import changeProjection from '../modules/projection/actions';
import { onToggle } from '../modules/modal/actions';
import { resetProductPickerState } from '../modules/product-picker/actions';
import IconList from '../components/util/list';

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
      updateProjection, projection, config, onCloseModal,
    } = this.props;

    if (id !== projection) {
      updateProjection(id, config);
    }

    googleTagManager.pushEvent({
      event: 'change_projection',
      projection: id,
    });
    onCloseModal();
  }

  render() {
    const { projection, projectionArray } = this.props;
    return (
      <IconList
        list={projectionArray}
        active={projection}
        onClick={this.onClick}
        size="small"
      />
    );
  }
}

const mapStateToProps = (state) => {
  const projArray = lodashGet(state, 'config.ui.projections');
  const projectionArray = projArray
    ? getInfoArray(projArray)
    : DEFAULT_PROJ_ARRAY;
  return {
    models: state.models,
    config: state.config,
    projection: state.proj.id,
    projectionArray,
  };
};

const mapDispatchToProps = (dispatch, ownProps) => ({
  updateProjection: (id, config) => {
    dispatch(changeProjection(id));
    dispatch(resetProductPickerState(id));
  },
  onCloseModal: () => {
    dispatch(onToggle());
  },
});

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(ProjectionList);

ProjectionList.propTypes = {
  config: PropTypes.object,
  onCloseModal: PropTypes.func,
  projection: PropTypes.string,
  projectionArray: PropTypes.array,
  updateProjection: PropTypes.func,
};
