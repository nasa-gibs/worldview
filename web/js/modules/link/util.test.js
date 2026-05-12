import {
  facebookUrlParams,
  twitterUrlParams,
  redditUrlParams,
  emailUrlParams,
  encode,
  getPermalink,
  wrapWithIframe,
} from './util';

jest.mock('../date/util', () => ({
  serializeDate: jest.fn(() => '2024-01-15T00:00:00Z'),
}));

jest.mock('./constants', () => ({
  ENCODING_EXCEPTIONS: [],
}));

describe('facebookUrlParams', () => {
  test('returns correctly encoded Facebook share URL', () => {
    const result = facebookUrlParams('123', 'https://example.com', 'https://redirect.com', 'popup');
    expect(result).toBe(
      `https://www.facebook.com/dialog/share?app_id=${encodeURIComponent('123')}&href=${encodeURIComponent('https://example.com')}&redirect_uri=${encodeURIComponent('https://redirect.com')}&display=${encodeURIComponent('popup')}`,
    );
  });

  test('encodes special characters in all params', () => {
    const result = facebookUrlParams('app&id', 'url with spaces', 'redir?x=1', 'dis play');
    expect(result).toContain(encodeURIComponent('app&id'));
    expect(result).toContain(encodeURIComponent('url with spaces'));
    expect(result).toContain(encodeURIComponent('redir?x=1'));
    expect(result).toContain(encodeURIComponent('dis play'));
  });
});

describe('twitterUrlParams', () => {
  test('returns correctly encoded Twitter share URL', () => {
    const result = twitterUrlParams('https://example.com', 'Check this out!');
    expect(result).toBe(
      `https://twitter.com/intent/tweet?url=${encodeURIComponent('https://example.com')}&text=${encodeURIComponent('Check this out!')}`,
    );
  });
});

describe('redditUrlParams', () => {
  test('returns correctly encoded Reddit share URL', () => {
    const result = redditUrlParams('https://example.com', 'Interesting Title');
    expect(result).toBe(
      `https://www.reddit.com/r/nasa/submit?url=${encodeURIComponent('https://example.com')}&title=${encodeURIComponent('Interesting Title')}`,
    );
  });

  test('encodes special characters', () => {
    const result = redditUrlParams('https://ex.com?q=test', 'Title & More');
    expect(result).toContain(encodeURIComponent('https://ex.com?q=test'));
    expect(result).toContain(encodeURIComponent('Title & More'));
  });
});

describe('emailUrlParams', () => {
  test('returns correctly encoded mailto URL', () => {
    const result = emailUrlParams('Hello World', 'Check this link');
    expect(result).toBe(
      `mailto:?subject=${encodeURIComponent('Hello World')}&body=${encodeURIComponent('Check this link')}`,
    );
  });

  test('encodes special characters', () => {
    const result = emailUrlParams('Subject & More', 'Body with\nnewline');
    expect(result).toContain(encodeURIComponent('Subject & More'));
    expect(result).toContain(encodeURIComponent('Body with\nnewline'));
  });
});

describe('encode', () => {
  jest.mock('lodash', () => ({
    each: jest.fn((collection, iteratee) => {
      for (const key in collection) {
        if (Object.prototype.hasOwnProperty.call(collection, key)) {
          iteratee(collection[key], key);
        }
      }
    }),
  }));
  test('returns encodeURIComponent result when no exceptions apply', () => {
    expect(encode('hello world')).toBe(encodeURIComponent('hello world'));
  });

  test('encodes special URI characters', () => {
    expect(encode('a=b&c=d')).toBe(encodeURIComponent('a=b&c=d'));
  });
});

describe('wrapWithIframe', () => {
  test('wraps value in an iframe tag', () => {
    const result = wrapWithIframe('https://example.com');
    expect(result).toBe(
      '<iframe src="https://example.com" role="application" sandbox="allow-modals allow-scripts allow-same-origin allow-forms allow-popups" width="100%" height="100%" allow="fullscreen; autoplay;" loading="lazy"></iframe>',
    );
  });

  test('uses the provided src value', () => {
    const result = wrapWithIframe('https://other.com/path');
    expect(result).toContain('src="https://other.com/path"');
  });
});

describe('getPermalink', () => {
  test('adds time param when no querystring and t= not present', () => {
    const result = getPermalink('', new Date('2024-01-15'), false);
    expect(result).toContain('?t=');
  });

  test('appends time param to existing querystring without t=', () => {
    // setHref(`${BASE_URL}?layers=MODIS`);
    const result = getPermalink('?layers=MODIS', new Date('2024-01-15'), false);
    expect(result).toContain('t=');
    expect(result).toContain('layers=MODIS');
  });

  test('adds em=true when isEmbed is true', () => {
    const result = getPermalink('', new Date(), true);
    expect(result).toContain('em=true');
  });

  test('changes em=true to em=false when isEmbed is false', () => {
    const result = getPermalink('?em=true', new Date(), false);
    expect(result).toContain('em=false');
  });

  test('removes &kiosk=true from permalink', () => {
    const result = getPermalink('?layers=MODIS&kiosk=true&t=2024', new Date(), false);
    expect(result).not.toContain('kiosk=true');
  });

  test('removes ?kiosk=true (only param) from permalink', () => {
    const result = getPermalink('?kiosk=true&t=2024', new Date(), false);
    expect(result).not.toContain('kiosk=true');
  });

  test('removes &kiosk=true (only param) from permalink', () => {
    const result = getPermalink('?kiosk=true&t=2024', new Date(), false);
    expect(result).not.toContain('kiosk=true');
  });

  test('removes &e2e=true from permalink', () => {
    const result = getPermalink('?layers=MODIS&e2e=true&t=2024', new Date(), false);
    expect(result).not.toContain('e2e=true');
  });

  test('removes ?e2e=true (only param) from permalink', () => {
    const result = getPermalink('?e2e=true&t=2024', new Date(), false);
    expect(result).not.toContain('?e2e=true&');
  });

  test('removes eic= pattern from permalink', () => {
    const result = getPermalink('?layers=MODIS&eic=AB&t=2024', new Date(), false);
    expect(result).not.toContain('eic=');
  });

  test('cleans up trailing & after eic removal', () => {
    const result = getPermalink('?t=2024&eic=AB', new Date(), false);
    expect(result).not.toMatch(/&$/);
    expect(result).not.toContain('eic=');
  });

  test('cleans up double && after eic removal', () => {
    const result = getPermalink('?layers=MODIS&eic=AB&t=2024', new Date(), false);
    expect(result).not.toContain('&&');
  });
});
