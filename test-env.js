import $ from 'jquery';
import fetchMock from 'fetch-mock';

global.$ = global.jQuery = $;
global.fetch = fetchMock;
