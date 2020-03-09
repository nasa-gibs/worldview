/* eslint-disable import/no-extraneous-dependencies */
import $ from 'jquery';
import fetchMock from 'fetch-mock';
import 'jest-canvas-mock';

// eslint-disable-next-line no-multi-assign
global.$ = global.jQuery = $;
global.fetch = fetchMock;
