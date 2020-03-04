import browser from './browser';

const unmocked = {};

beforeAll(() => {
  unmocked.navigator = browser.tests.navigator;
  unmocked.safari = browser.tests.safari;
  unmocked.safariVersion = browser.tests.safariVersion;
  unmocked.window = browser.tests.window;
  unmocked.getWindowDimensions = browser.tests.getWindowDimensions;
});
afterEach(() => {
  browser.tests.navigator = unmocked.navigator;
  browser.tests.safari = unmocked.safari;
  browser.tests.safariVersion = unmocked.safariVersion;
  browser.tests.window = unmocked.window;
  browser.tests.getWindowDimensions = unmocked.getWindowDimensions;
});

describe('browser', () => {
  const tests = [{
    name: 'safari',
    fn: 'safari',
    answer: true,
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_7_3) AppleWebKit/534.55.3 (KHTML, like Gecko) Version/5.1.3 Safari/534.53.10',
  }, {
    name: 'not safari',
    fn: 'safari',
    answer: false,
    userAgent: 'Mozilla/5.0 (Windows NT 6.2; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/32.0.1667.0 Safari/537.36',
  }, {
    name: 'safari version',
    fn: 'safariVersion',
    answer: 5,
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_7_3) AppleWebKit/534.55.3 (KHTML, like Gecko) Version/5.1.3 Safari/534.53.10',
  }, {
    name: 'internet explorer',
    fn: 'ie',
    answer: true,
    userAgent: 'Mozilla/5.0 (MSIE 9.0; Windows NT 6.1; Trident/5.0)',
  }, {
    name: 'not internet explorer',
    fn: 'ie',
    answer: false,
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.8; rv:26.0) Gecko/20100101 Firefox/26.0',
  }];

  tests.forEach((t) => {
    test(t.name, () => {
      browser.tests.navigator = () => ({ userAgent: t.userAgent });
      expect(browser.tests[t.fn]()).toEqual(t.answer);
    });
  });
});

test('cors', () => {
  browser.tests.safari = () => true;
  browser.tests.safariVersion = () => 7;
  expect(browser.tests.cors()).toBe(true);
});

test('non-working cors on Safari <= 6', () => {
  browser.tests.safari = () => true;
  browser.tests.safariVersion = () => 6;
  expect(browser.tests.cors()).toBe(false);
});

test('local storage', () => {
  expect(browser.tests.localStorage()).toBeTruthy();
});

test('no local storage', () => {
  browser.tests.window = () => undefined;
  expect(browser.tests.localStorage()).toBeFalsy();
});

describe('device sizes', () => {
  const tests = [
    {
      size: [1000, 1000], small: false, constrained: false, name: 'large',
    },
    {
      size: [200, 200], small: true, constrained: true, name: 'small',
    },
    {
      size: [1000, 300], small: false, constrained: true, name: 'constrained',
    },
  ];
  tests.forEach((t) => {
    test(t.name, () => {
      browser.tests.getWindowDimensions = () => t.size;
      expect(browser.tests.small()).toBe(t.small);
      expect(browser.tests.constrained()).toBe(t.constrained);
    });
  });
});
