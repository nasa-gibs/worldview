const { TextEncoder, TextDecoder } = require('util')
const fetchMock = require('jest-fetch-mock')
fetchMock.enableMocks()
fetchMock.dontMock()

globalThis.TextEncoder = TextEncoder
globalThis.TextDecoder = TextDecoder
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
