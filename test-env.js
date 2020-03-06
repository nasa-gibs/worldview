/* eslint-disable import/no-extraneous-dependencies */
import $ from 'jquery';
import fetchMock from 'fetch-mock';
import 'jest-canvas-mock';

global.$ = global.jQuery = $;
global.fetch = fetchMock;
