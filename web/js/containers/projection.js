import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { changeProjection } from '../modules/projection/actions';
import IconList from '../components/util/list';
import googleTagManager from 'googleTagManager';

const infoArray = [
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

class ProjectionList extends Component {
  updateProjection(id) {
    const { updateProjection, models, config } = this.props;
    models.proj.select(id); // migration crutch
    updateProjection(id, config);
    googleTagManager.pushEvent({
      event: 'change_projection',
      projection: id
    });
  }
  render() {
    const { projection } = this.props;
    return (
      <IconList
        list={infoArray}
        active={projection}
        onClick={this.updateProjection.bind(this)}
        size="small"
      />
    );
  }
}
function mapStateToProps(state) {
  return {
    models: state.models,
    config: state.config,
    projection: state.proj.id
  };
}
const mapDispatchToProps = (dispatch, ownProps) => ({
  updateProjection: (id, config) => {
    dispatch(changeProjection(id, config));
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
  config: PropTypes.object
};
