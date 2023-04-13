/* eslint-disable */
import assign from 'object-assign';

import { store } from './helpers';

export const MENU_SHOW = 'REACT_CONTEXTMENU_SHOW';
export const MENU_HIDE = 'REACT_CONTEXTMENU_HIDE';


export function dispatchGlobalEvent(eventName, opts, target = window) {
    // Compatibale with IE
    // @see http://stackoverflow.com/questions/26596123/internet-explorer-9-10-11-event-constructor-doesnt-work
    let event;

    if (typeof window.CustomEvent === 'function') {
        event = new window.CustomEvent(eventName, { detail: opts });
    } else {
        event = document.createEvent('CustomEvent');
        event.initCustomEvent(eventName, false, true, opts);
    }

    if (target) {
        target.dispatchEvent(event);
        assign(store, opts);
    }
}

export function showMenu(opts = {}, target) {
    dispatchGlobalEvent(MENU_SHOW, assign({}, opts, { type: MENU_SHOW }), target);
}

export function hideMenu(opts = {}, target) {
    dispatchGlobalEvent(MENU_HIDE, assign({}, opts, { type: MENU_HIDE }), target);
}
