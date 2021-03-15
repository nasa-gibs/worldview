import React from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import EventTrack from './event-track';
import EventMarkers from './event-markers';

// const zoomLevelReference = {
//   Wildfires: 8,
//   Volcanoes: 6,
// };

class NaturalEvents extends React.Component {
  constructor(props) {
    super(props);

    this.state = {

    };
  }

  componentDidMount() {

  }

  componentDidUpdate(prevProps, prevState) {
    const {
      active,
      proj,
    } = this.props;

    if (active !== prevProps.active) {
      // onsidebarchange
    }
    if (proj !== prevProps.proj) {
      // onProjChange
    }
  }

  render() {
    return (
      <>
        <EventTrack />
        <EventMarkers />
      </>
    );
  }
}

function mapStateToProps(state) {
  const {
    events, config, map, proj, requestedEvents,
  } = state;
  return {
    map: map.ui.selected,
    config,
    proj,
    active: events.active,
    eventsRequestLoading: requestedEvents.isLoading,
    eventsData: requestedEvents.response,
  };
}

NaturalEvents.propTypes = {
  active: PropTypes.bool,
  config: PropTypes.object,
  map: PropTypes.object,
  proj: PropTypes.object,
};

export default connect(
  mapStateToProps,
)(NaturalEvents);
