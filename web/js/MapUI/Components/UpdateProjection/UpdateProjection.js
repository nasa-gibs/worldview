import React, { useEffect } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';

const UpdateProjection = (props) => {
  const {
    config,
    map,
  } = props

  useEffect(() => {
    console.log('update projection');
    console.log(map)
  })

  function updateProjection(start) {
    if (uiCopy.selected) {
    // Keep track of center point on projection switch
      uiCopy.selected.previousCenter = uiCopy.selected.center;
      hideMap(uiCopy.selected);
    }
    uiCopy.selected = uiCopy.proj[proj.id];
    const map = uiCopy.selected;

    const isProjectionRotatable = proj.id !== 'geographic' && proj.id !== 'webmerc';
    const currentRotation = isProjectionRotatable ? map.getView().getRotation() : 0;
    const rotationStart = isProjectionRotatable ? models.map.rotation : 0;

    store.dispatch({
      type: UPDATE_MAP_UI,
      ui: uiCopy,
      rotation: start ? rotationStart : currentRotation,
    });
    reloadLayers();

    // If the browser was resized, the inactive map was not notified of
    // the event. Force the update no matter what and reposition the center
    // using the previous value.
    showMap(map);
    map.updateSize();

    if (uiCopy.selected.previousCenter) {
      uiCopy.selected.setCenter(uiCopy.selected.previousCenter);
    }
    // This is awkward and needs a refactoring
    if (start) {
      const projId = proj.selected.id;
      let extent = null;
      let callback = null;
      if (models.map.extent) {
        extent = models.map.extent;
      } else if (!models.map.extent && projId === 'geographic') {
        extent = getLeadingExtent(config.pageLoadTime);
        callback = () => {
          const view = map.getView();
          const extent = view.calculateExtent(map.getSize());
          store.dispatch({ type: FITTED_TO_LEADING_EXTENT, extent });
        };
      }
      if (projId !== 'geographic') {
        callback = () => {
          const view = map.getView();
          view.setRotation(rotationStart);
        };
      }
      if (extent) {
        map.getView().fit(extent, {
          constrainResolution: false,
          callback,
        });
      } else if (rotationStart && projId !== 'geographic') {
        callback();
      }
    }
    updateExtent();
    onResize();
    // handleActiveMapMarker(start);
  }

  return (
    <>
    </>
  );
}

const mapStateToProps = (state) => {
  const { proj, map } = state
  return {
    proj, map
  }
}

export default connect(
  mapStateToProps,
)(UpdateProjection)