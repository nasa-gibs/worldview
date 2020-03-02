import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { changeProjection } from '../modules/projection/actions';
import { onToggle } from '../modules/modal/actions';
import { resetProductPickerState } from '../modules/product-picker/actions';
import IconList from '../components/util/list';
import { get as lodashGet } from 'lodash';
import googleTagManager from 'googleTagManager';

const DEFAULT_PROJ_ARRAY = [
  {
    text: 'Arctic',
    iconClass: 'ui-icon icon-large',
    iconName: 'faArrowCircleUp',
    id: 'change-arctic-button',
    key: 'arctic'
  },
  {
    text: 'Geographic',
    iconClass: 'ui-icon icon-large',
    iconName: 'faCircle',
    id: 'change-geographic-button',
    key: 'geographic'
  },
  {
    text: 'Antarctic',
    iconClass: 'ui-icon icon-large',
    iconName: 'faArrowCircleDown',
    id: 'change-antarctic-button',
    key: 'antarctic'
  }
];
const getInfoArray = function(projArray) {
  return projArray.map(el => {
    return {
      text: el.name,
      iconClass: ' ui-icon icon-large',
      iconName: el.style,
      id: 'change-' + el.id + '-button',
      key: el.id
    };
  });
};
class ProjectionList extends Component {
  updateProjection(id) {
    const { updateProjection, config, onCloseModal } = this.props;
    updateProjection(id, config);
    onCloseModal();
    googleTagManager.pushEvent({
      event: 'change_projection',
      projection: id
    });
  }

  render() {
    const { projection, projectionArray } = this.props;
    return (
      <IconList
        list={projectionArray}
        active={projection}
        onClick={this.updateProjection.bind(this)}
        size="small"
      />
    );
  }
}
function mapStateToProps(state) {
  const projArray = lodashGet(state, 'config.ui.projections');
  const projectionArray = projArray
    ? getInfoArray(projArray)
    : DEFAULT_PROJ_ARRAY;
  return {
    models: state.models,
    config: state.config,
    projection: state.proj.id,
    projectionArray
  };
}
const mapDispatchToProps = (dispatch, ownProps) => ({
  updateProjection: (id, config) => {
    dispatch(changeProjection(id));
    dispatch(resetProductPickerState(id));
  },
  onCloseModal: () => {
    dispatch(onToggle());
  }
});

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(ProjectionList);

ProjectionList.propTypes = {
  config: PropTypes.object,
  models: PropTypes.object,
  onCloseModal: PropTypes.func,
  projection: PropTypes.string,
  projectionArray: PropTypes.array,
  updateProjection: PropTypes.func
};
