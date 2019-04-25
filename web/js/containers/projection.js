import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { changeProjection } from '../modules/projection/actions';
import { onToggle } from '../modules/modal/actions';
import IconList from '../components/util/list';
import { get as lodashGet } from 'lodash';
import googleTagManager from 'googleTagManager';

const DEFAULT_PROJ_ARRAY = [
  {
    text: 'Arctic',
    iconClass: 'ui-icon icon-large fa fa-arrow-circle-up fa-fw',
    id: 'change-arctic-button',
    key: 'arctic'
  },
  {
    text: 'Geographic',
    iconClass: 'ui-icon icon-large fa fa-circle fa-fw',
    id: 'change-geographic-button',
    key: 'geographic'
  },
  {
    text: 'Antarctic',
    iconClass: 'ui-icon icon-large fa fa-arrow-circle-down fa-fw',
    id: 'change-antarctic-button',
    key: 'antarctic'
  }
];
const getInfoArray = function(projArray) {
  return projArray.map(el => {
    return {
      text: el.name,
      iconClass: el.style + ' ui-icon icon-large',
      id: 'change-' + el.id + '-button',
      key: el.id
    };
  });
};
class ProjectionList extends Component {
  updateProjection(id) {
    const { updateProjection, models, config, onCloseModal } = this.props;
    models.proj.select(id); // migration crutch
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
    dispatch(changeProjection(id, config));
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
  openModal: PropTypes.func,
  updateProjection: PropTypes.func,
  models: PropTypes.object,
  projection: PropTypes.string,
  config: PropTypes.object,
  onCloseModal: PropTypes.func,
  projectionArray: PropTypes.array
};
