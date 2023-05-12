import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import Cache from 'cachai';
import PQueue from 'p-queue';
import util from '../util/util';
import MapRunningData from '../map/runningdata';
import {
  REDUX_ACTION_DISPATCHED,
  MAP_MOUSE_OUT,
  MAP_MOVE_END,
  MAP_MOUSE_MOVE,
  MAP_SINGLE_CLICK,
  MAP_CONTEXT_MENU,
} from '../util/constants';
import mapCompare from '../map/compare/compare';
import mapLayerBuilder from '../map/layerbuilder';
import MapUI from './mapUI';

const { events } = util;

function CombineUI(props) {
  const {
    models,
    config,
    store,
  } = props;

  const registerMapMouseHandlers = (maps) => {
    Object.values(maps).forEach((map) => {
      const element = map.getTargetElement();
      const crs = map.getView().getProjection().getCode();

      element.addEventListener('mouseleave', (event) => {
        events.trigger(MAP_MOUSE_OUT, event);
      });
      map.on('moveend', (event) => {
        events.trigger(MAP_MOVE_END, event, map, crs);
      });
      map.on('pointermove', (event) => {
        events.trigger(MAP_MOUSE_MOVE, event, map, crs);
      });
      map.on('singleclick', (event) => {
        events.trigger(MAP_SINGLE_CLICK, event, map, crs);
      });
      map.on('contextmenu', (event) => {
        events.trigger(MAP_CONTEXT_MENU, event, map, crs);
      });
    });
  };

  const cache = new Cache(400);
  const layerQueue = new PQueue({ concurrency: 3 });
  const compareMapUi = mapCompare(store);
  const runningdata = new MapRunningData(compareMapUi, store);
  const { createLayer, layerKey } = mapLayerBuilder(config, cache, store);

  const [ui, setUI] = useState({
    cache,
    mapIsbeingDragged: false,
    mapIsbeingZoomed: false,
    proj: {}, // One map for each projection
    selected: null, // The map for the selected projection
    selectedVectors: {},
    markers: [],
    runningdata,
    layerKey,
    createLayer,
    processingPromise: null,
  });

  const uiProperties = {};

  const combineUiFunction = () => {
    const subscribeToStore = function () {
      const state = store.getState();
      const action = state.lastAction;
      return events.trigger(REDUX_ACTION_DISPATCHED, action);
    };
    store.subscribe(subscribeToStore);

    uiProperties.map = ui;
    uiProperties.supportsPassive = false;
    try {
      const opts = Object.defineProperty({}, 'passive', {
        // eslint-disable-next-line getter-return
        get() {
          uiProperties.supportsPassive = true;
        },
      });
      window.addEventListener('testPassive', null, opts);
      window.removeEventListener('testPassive', null, opts);
    } catch (e) {
      util.warn(e);
    }

    registerMapMouseHandlers(uiProperties.map.proj);

    // Sink all focus on inputs if click unhandled
    document.addEventListener('click', (e) => {
      if (e.target.nodeName !== 'INPUT') {
        document.querySelectorAll('input').forEach((el) => el.blur());
      }
    });
    document.activeElement.blur();
    document.querySelectorAll('input').forEach((el) => el.blur());

    return uiProperties;
  };

  useEffect(() => {
    if (ui.proj) {
      combineUiFunction();
    }
  }, [ui]);

  return (
    <MapUI
      models={models}
      compareMapUi={compareMapUi}
      config={config}
      ui={ui}
      setUI={setUI}
      layerQueue={layerQueue}
    />
  );
}

export default CombineUI;

CombineUI.propTypes = {
  config: PropTypes.object,
  models: PropTypes.object,
  store: PropTypes.object,
};
