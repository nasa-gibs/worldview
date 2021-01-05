/* eslint-disable import/no-extraneous-dependencies */
import fetchMock from 'fetch-mock';
import 'jest-canvas-mock';

// eslint-disable-next-line no-multi-assign

global.fetch = fetchMock;
