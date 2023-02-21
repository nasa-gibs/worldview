import { each as lodashEach } from 'lodash';
import { serializeDate } from '../date/util';
import { ENCODING_EXCEPTIONS } from './constants';
// Facebook: https://developers.facebook.com/docs/sharing/reference/share-dialog#redirect
export function facebookUrlParams(appId, href, redirectUri, display) {
  return (
    `${'https://www.facebook.com/dialog/share?'
    + 'app_id='}${
      encodeURIComponent(appId)
    }&href=${
      encodeURIComponent(href)
    }&redirect_uri=${
      encodeURIComponent(redirectUri)
    }&display=${
      encodeURIComponent(display)}`
  );
}

// Twitter: https://dev.twitter.com/web/tweet-button/parameters#web-intent-example
export function twitterUrlParams(url, text) {
  return (
    `${'https://twitter.com/intent/tweet?'
    + 'url='}${
      encodeURIComponent(url)
    }&text=${
      encodeURIComponent(text)}`
  );
}

// Reddit: https://www.reddit.com/r/nasa/submit?url=[URL]&title=[TITLE]
export function redditUrlParams(url, title) {
  return (
    `${'https://www.reddit.com/r/nasa/submit?'
    + 'url='}${
      encodeURIComponent(url)
    }&title=${
      encodeURIComponent(title)}`
  );
}

// Email: mailto:?subject=[SUBJECT]&body=[BODY]
export function emailUrlParams(subject, body) {
  return (
    `${'mailto:?'
    + 'subject='}${
      encodeURIComponent(subject)
    }&body=${
      encodeURIComponent(body)}`
  );
}

export function getShareLink(type, url) {
  const shareMessage = 'Check out what I found in NASA @NAME@!';
  const twMessage = 'Check out what I found in #NASAWorldview -';
  const emailBody = `${shareMessage} - ${url}`;

  switch (type) {
    case 'twitter':
      return twitterUrlParams(url, twMessage);
    case 'facebook':
      return facebookUrlParams('121285908450463', url, url, 'popup');
    case 'reddit':
      return redditUrlParams(url, shareMessage);
    case 'email':
      return emailUrlParams(shareMessage, emailBody);
    default:
      return undefined;
  }
}

export function encode(value) {
  let encoded = encodeURIComponent(value);
  lodashEach(ENCODING_EXCEPTIONS, (exception) => {
    encoded = encoded.replace(exception.match, exception.replace);
  });
  return encoded;
}

export function getPermalink(queryString, selectedDate, isEmbed) {
  const url = window.location.href;
  const prefix = url.split('?')[0];

  // if no time query string parameter, add to permalink
  const isTimeInQueryString = queryString.includes('t=');
  let timeParam = '';
  if (!isTimeInQueryString) {
    const serialized = serializeDate(selectedDate);
    const encoded = encode(serialized);
    timeParam = `t=${encoded}`;
  }

  // add to permalink based on existing querystring
  let permalink = prefix;
  if (!queryString) {
    permalink += `?${timeParam}`;
  } else if (!isTimeInQueryString) {
    permalink += `${queryString}&${timeParam}`;
  } else {
    permalink = url;
  }

  if (isEmbed) {
    permalink += '&em=true';
  } else if (permalink.includes('em=')) {
    permalink = permalink.replace('em=true', 'em=false');
  }

  return permalink;
}

export function wrapWithIframe(value) { return `<iframe src="${value}" role="application" sandbox="allow-modals allow-scripts allow-same-origin allow-forms allow-popups" width="100%" height="100%" allow="fullscreen; autoplay;" loading="lazy"></iframe>`; }

export function wrapWithObject(value) { return `<object type="text/html" data="${value}" width="100%" height="100%" role="application"></object>`; }
