import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { changeProjection } from '../modules/projection/actions';
import IconList from '../components/util/list';

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
    const { updateProjection, models } = this.props;
    models.proj.select(id); // state migration crutch
    updateProjection(id);
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
    models: state.models.models,
    projection: state.projection.id
  };
}
const mapDispatchToProps = (dispatch, ownProps) => ({
  updateProjection: id => {
    dispatch(changeProjection(id));
  }
});

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(ProjectionList);

ProjectionList.propTypes = {
  openModal: PropTypes.func
};
