import {
  facebookUrlParams,
  twitterUrlParams,
  redditUrlParams,
  emailUrlParams,
  encode,
  getPermalink,
  wrapWithIframe,
} from './util';

jest.mock('lodash', () => ({
  each: jest.fn((collection, iteratee) => collection.forEach(iteratee)),
}));

jest.mock('../date/util', () => ({
  serializeDate: jest.fn((date) => date.toISOString()),
}));

jest.mock('./constants', () => ({
  ENCODING_EXCEPTIONS: [],
}));

const { serializeDate } = require('../date/util');
const { ENCODING_EXCEPTIONS } = require('./constants');

beforeEach(() => {
  jest.clearAllMocks();
  ENCODING_EXCEPTIONS.length = 0;
});

describe('facebookUrlParams', () => {
  it('returns a correctly formed Facebook share URL', () => {
    const result = facebookUrlParams('123', 'https://example.com', 'https://redirect.com', 'popup');
    expect(result).toBe(
      'https://www.facebook.com/dialog/share?app_id=123&href=https%3A%2F%2Fexample.com&redirect_uri=https%3A%2F%2Fredirect.com&display=popup',
    );
  });

  it('encodes special characters in all parameters', () => {
    const result = facebookUrlParams('app 1', 'https://a.com?x=1&y=2', 'https://r.com', 'page');
    expect(result).toContain('app_id=app%201');
    expect(result).toContain('href=https%3A%2F%2Fa.com%3Fx%3D1%26y%3D2');
  });
});

describe('twitterUrlParams', () => {
  it('returns a correctly formed Twitter intent URL', () => {
    const result = twitterUrlParams('https://example.com', 'Check this out');
    expect(result).toBe(
      'https://twitter.com/intent/tweet?url=https%3A%2F%2Fexample.com&text=Check%20this%20out',
    );
  });

  it('encodes special characters in url and text', () => {
    const result = twitterUrlParams('https://a.com?q=1&r=2', 'Hello & World');
    expect(result).toContain('url=https%3A%2F%2Fa.com%3Fq%3D1%26r%3D2');
    expect(result).toContain('text=Hello%20%26%20World');
  });
});

describe('redditUrlParams', () => {
  it('returns a correctly formed Reddit submit URL', () => {
    const result = redditUrlParams('https://example.com', 'Cool Title');
    expect(result).toBe(
      'https://www.reddit.com/r/nasa/submit?url=https%3A%2F%2Fexample.com&title=Cool%20Title',
    );
  });

  it('encodes special characters in url and title', () => {
    const result = redditUrlParams('https://a.com?x=1', 'Title & More');
    expect(result).toContain('url=https%3A%2F%2Fa.com%3Fx%3D1');
    expect(result).toContain('title=Title%20%26%20More');
  });
});

describe('emailUrlParams', () => {
  it('returns a correctly formed mailto URL', () => {
    const result = emailUrlParams('Check this out', 'https://example.com');
    expect(result).toBe(
      'mailto:?subject=Check%20this%20out&body=https%3A%2F%2Fexample.com',
    );
  });

  it('encodes special characters in subject and body', () => {
    const result = emailUrlParams('Subject & More', 'Body with spaces & symbols');
    expect(result).toContain('subject=Subject%20%26%20More');
    expect(result).toContain('body=Body%20with%20spaces%20%26%20symbols');
  });
});

describe('encode', () => {
  it('returns URI-encoded value when no exceptions', () => {
    const result = encode('hello world');
    expect(result).toBe('hello%20world');
  });

  it('applies each encoding exception replacement', () => {
    ENCODING_EXCEPTIONS.push({ match: /%20/g, replace: '+' });
    const result = encode('hello world');
    expect(result).toBe('hello+world');
  });

  it('applies multiple encoding exceptions in order', () => {
    ENCODING_EXCEPTIONS.push({ match: /%20/g, replace: '+' });
    ENCODING_EXCEPTIONS.push({ match: /\+/g, replace: '-' });
    const result = encode('hello world');
    expect(result).toBe('hello-world');
  });

  it('encodes special characters', () => {
    const result = encode('a=b&c=d');
    expect(result).toBe('a%3Db%26c%3Dd');
  });
});

describe('wrapWithIframe', () => {
  it('returns an iframe tag with the given src', () => {
    const result = wrapWithIframe('https://example.com');
    expect(result).toContain('src="https://example.com"');
  });

  it('includes expected sandbox attributes', () => {
    const result = wrapWithIframe('https://example.com');
    expect(result).toContain('sandbox="allow-modals allow-scripts allow-same-origin allow-forms allow-popups"');
  });

  it('includes width and height of 100%', () => {
    const result = wrapWithIframe('https://example.com');
    expect(result).toContain('width="100%"');
    expect(result).toContain('height="100%"');
  });

  it('includes allow fullscreen and autoplay', () => {
    const result = wrapWithIframe('https://example.com');
    expect(result).toContain('allow="fullscreen; autoplay;"');
  });

  it('includes lazy loading', () => {
    const result = wrapWithIframe('https://example.com');
    expect(result).toContain('loading="lazy"');
  });

  it('includes role="application"', () => {
    const result = wrapWithIframe('https://example.com');
    expect(result).toContain('role="application"');
  });
});

describe('getPermalink', () => {
  const selectedDate = new Date('2024-01-15T00:00:00.000Z');

  beforeEach(() => {
    serializeDate.mockReturnValue('2024-01-15T00:00:00.000Z');
  });

  it('builds a permalink with time param when no queryString and t= not present', () => {
    const result = getPermalink('', selectedDate, false);
    expect(result).toContain('?t=');
  });

  it('appends time param when queryString exists but has no t=', () => {
    const result = getPermalink('?v=1,2,3,4', selectedDate, false);
    expect(result).toContain('&t=');
    expect(result).toContain('?v=1,2,3,4');
  });

  it('appends &em=true when isEmbed is true', () => {
    const result = getPermalink('', selectedDate, true);
    expect(result).toContain('&em=true');
  });

  it('appends &em=true when isEmbed is false', () => {
    const result = getPermalink('&em=false', selectedDate, false);
    expect(result).toContain('&em=false');
  });

  it('removes &kiosk=true from permalink', () => {
    const result = getPermalink('?t=2024&kiosk=true', selectedDate, false);
    expect(result).not.toContain('kiosk=true');
  });

  it('removes ?kiosk=true (only param) from permalink', () => {
    const result = getPermalink('?kiosk=true', selectedDate, false);
    expect(result).not.toContain('kiosk=true');
  });

  it('removes &e2e=true from permalink', () => {
    const result = getPermalink('?t=2024&e2e=true', selectedDate, false);
    expect(result).not.toContain('e2e=true');
  });

  it('removes ?e2e=true (only param) from permalink', () => {
    const result = getPermalink('?e2e=true', selectedDate, false);
    expect(result).not.toContain('e2e=true');
  });

  it('removes eic= and its two trailing characters', () => {
    const result = getPermalink('?t=2024&eic=AB', selectedDate, false);
    expect(result).not.toContain('eic=AB');
  });

  it('cleans up trailing & after eic= removal', () => {
    const result = getPermalink('?t=2024&eic=AB', selectedDate, false);
    expect(result).not.toMatch(/&$/);
  });

  it('cleans up double && after eic= removal', () => {
    const result = getPermalink('?t=2024&eic=AB&v=1', selectedDate, false);
    expect(result).not.toContain('&&');
  });
});
