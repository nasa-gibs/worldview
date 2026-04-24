import browser from './browser';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function setUserAgent(userAgent) {
  Object.defineProperty(navigator, 'userAgent', {
    value: userAgent,
    writable: true,
    configurable: true,
  });
}

function setVendor(vendor) {
  Object.defineProperty(navigator, 'vendor', {
    value: vendor,
    writable: true,
    configurable: true,
  });
}

// Re-import a fresh module instance with the current navigator values
function freshDetect() {
  jest.resetModules();
  return require('./browser').default;
}

// ---------------------------------------------------------------------------
// mobileAndTabletDevice — desktop user agents (should return false)
// ---------------------------------------------------------------------------

describe('mobileAndTabletDevice — desktop browsers', () => {
  afterEach(() => jest.resetModules());

  it('returns false for a standard Chrome desktop user agent', () => {
    setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
      '(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    );
    expect(freshDetect().mobileAndTabletDevice).toBe(false);
  });

  it('returns false for a standard Firefox desktop user agent', () => {
    setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/120.0',
    );
    expect(freshDetect().mobileAndTabletDevice).toBe(false);
  });

  it('returns false for a Safari macOS user agent', () => {
    setUserAgent(
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/605.1.15 ' +
      '(KHTML, like Gecko) Version/17.0 Safari/605.1.15',
    );
    expect(freshDetect().mobileAndTabletDevice).toBe(false);
  });

  it('returns false for an empty user agent', () => {
    setUserAgent('');
    expect(freshDetect().mobileAndTabletDevice).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// mobileAndTabletDevice — mobile user agents (should return true)
// ---------------------------------------------------------------------------

describe('mobileAndTabletDevice — mobile browsers', () => {
  afterEach(() => jest.resetModules());

  it('returns true for an iPhone user agent', () => {
    setUserAgent(
      'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) ' +
      'AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
    );
    expect(freshDetect().mobileAndTabletDevice).toBe(true);
  });

  it('returns true for an Android mobile user agent', () => {
    setUserAgent(
      'Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 ' +
      '(KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
    );
    expect(freshDetect().mobileAndTabletDevice).toBe(true);
  });

  it('returns true for an iPad user agent', () => {
    setUserAgent(
      'Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15 ' +
      '(KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
    );
    expect(freshDetect().mobileAndTabletDevice).toBe(true);
  });

  it('returns true for a BlackBerry user agent', () => {
    setUserAgent('BlackBerry9700/5.0.0.862 Profile/MIDP-2.1 Configuration/CLDC-1.1');
    expect(freshDetect().mobileAndTabletDevice).toBe(true);
  });

  it('returns true for a Windows Phone / IEMobile user agent', () => {
    setUserAgent(
      'Mozilla/5.0 (compatible; MSIE 10.0; Windows Phone 8.0; Trident/6.0; ' +
      'IEMobile/10.0; ARM; Touch; NOKIA; Lumia 920)',
    );
    expect(freshDetect().mobileAndTabletDevice).toBe(true);
  });

  it('returns true for an Opera Mini user agent', () => {
    setUserAgent(
      'Opera/9.80 (Android 4.1.2; Mobile; Opera Mini/7.6.40234/37.9069; U; en)',
    );
    expect(freshDetect().mobileAndTabletDevice).toBe(true);
  });

  it('returns true for a Kindle Silk user agent', () => {
    setUserAgent(
      'Mozilla/5.0 (Linux; U; en-us; KFAPWI Build/JDQ39) AppleWebKit/535.19 ' +
      '(KHTML, like Gecko) Silk/3.13 Safari/535.19 Silk-Accelerated=true',
    );
    expect(freshDetect().mobileAndTabletDevice).toBe(true);
  });

  it('returns true for a Samsung Galaxy (Android) user agent', () => {
    setUserAgent(
      'Mozilla/5.0 (Linux; Android 12; SM-G991B) AppleWebKit/537.36 ' +
      '(KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
    );
    expect(freshDetect().mobileAndTabletDevice).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// mobileAndTabletDevice — 4-char prefix regex matches (substr 0..4)
// ---------------------------------------------------------------------------

describe('mobileAndTabletDevice — 4-char prefix matches', () => {
  afterEach(() => jest.resetModules());

  it('returns true for user agent starting with "1207"', () => {
    setUserAgent('1207 some old feature phone');
    expect(freshDetect().mobileAndTabletDevice).toBe(true);
  });

  it('returns true for user agent starting with "6310"', () => {
    setUserAgent('6310 Nokia device');
    expect(freshDetect().mobileAndTabletDevice).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// navigator.vendor fallback
// ---------------------------------------------------------------------------

describe('navigator.vendor fallback', () => {
  afterEach(() => jest.resetModules());

  it('uses navigator.vendor when userAgent is empty', () => {
    setUserAgent('');
    setVendor('Apple Computer, Inc.'); // does not match mobile pattern
    expect(freshDetect().mobileAndTabletDevice).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Module shape
// ---------------------------------------------------------------------------

describe('module shape', () => {
  it('exports an object', () => {
    expect(typeof browser).toBe('object');
  });

  it('exposes mobileAndTabletDevice as a boolean', () => {
    expect(typeof browser.mobileAndTabletDevice).toBe('boolean');
  });

  it('exposes a tests object', () => {
    expect(typeof browser.tests).toBe('object');
  });

  it('exposes tests.mobileAndTabletDevice as a function', () => {
    expect(typeof browser.tests.mobileAndTabletDevice).toBe('function');
  });

  it('tests.mobileAndTabletDevice returns a boolean', () => {
    expect(typeof browser.tests.mobileAndTabletDevice()).toBe('boolean');
  });
});
