/* eslint-disable */
import { MENU_SHOW, MENU_HIDE } from './actions';
import { uniqueId, hasOwnProp, canUseDOM } from './helpers';

class GlobalEventListener {
    constructor() {
        this.callbacks = {};

        if (canUseDOM) {
            window.addEventListener(MENU_SHOW, this.handleShowEvent);
            window.addEventListener(MENU_HIDE, this.handleHideEvent);
        }
    }

    handleShowEvent = (event) => {
        for (const id in this.callbacks) {
            if (hasOwnProp(this.callbacks, id)) this.callbacks[id].show(event);
        }
    }

    handleHideEvent = (event) => {
        for (const id in this.callbacks) {
            if (hasOwnProp(this.callbacks, id)) this.callbacks[id].hide(event);
        }
    }

    register = (showCallback, hideCallback) => {
        const id = uniqueId();

        this.callbacks[id] = {
            show: showCallback,
            hide: hideCallback
        };

        return id;
    }

    unregister = (id) => {
        if (id && this.callbacks[id]) {
            delete this.callbacks[id];
        }
    }
}

export default new GlobalEventListener();
