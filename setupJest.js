const fetchMock = require('jest-fetch-mock')
fetchMock.enableMocks()
fetchMock.dontMock()

globalThis.IS_REACT_ACT_ENVIRONMENT = true;
