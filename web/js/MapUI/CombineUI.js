import React, { useEffect } from 'react';
import PropTypes from 'prop-types';
import util from '../util/util';
import mapui from '../map/ui';
import {
  REDUX_ACTION_DISPATCHED,
  MAP_MOUSE_OUT,
  MAP_MOVE_END,
  MAP_MOUSE_MOVE,
  MAP_SINGLE_CLICK,
  MAP_CONTEXT_MENU,
} from '../util/constants';
import MapUIContext from './MapUIContext'
import MapUI from './MapUI';

const { events } = util;

const CombineUI = ({ models, config, store }) => {
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

  const ui = {};

  useEffect(() => {
    const combineUiFunction = () => {

      const subscribeToStore = function () {
        const state = store.getState();
        const action = state.lastAction;
        return events.trigger(REDUX_ACTION_DISPATCHED, action);
      };
      store.subscribe(subscribeToStore);

      // This is where we should start to break out components.
      // Instead of feeding all of these parameters to one function, we can pass them
      // to components
      ui.map = mapui(models, config, store, ui);
      ui.supportsPassive = false;
      try {
        const opts = Object.defineProperty({}, 'passive', {
          // eslint-disable-next-line getter-return
          get() {
            ui.supportsPassive = true;
          },
        });
        window.addEventListener('testPassive', null, opts);
        window.removeEventListener('testPassive', null, opts);
      } catch (e) {
        util.warn(e);
      }

      registerMapMouseHandlers(ui.map.proj);

      // Sink all focus on inputs if click unhandled
      document.addEventListener('click', (e) => {
        if (e.target.nodeName !== 'INPUT') {
          document.querySelectorAll('input').forEach((el) => el.blur());
        }
      });
      document.activeElement.blur();
      document.querySelectorAll('input').forEach((el) => el.blur());

      console.log(ui)

      return ui;
    };

    combineUiFunction();
  }, []);

  return (
    <MapUI  />
  );
};

export default CombineUI;

CombineUI.propTypes = {
  config: PropTypes.object,
  models: PropTypes.object,
  store: PropTypes.object,
};
