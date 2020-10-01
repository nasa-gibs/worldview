import safeLocalStorage from '../../util/local-storage';

const { SEARCH_TOKEN } = safeLocalStorage.keys;

export function getTokenDataFromStorage() {
  const tokenData = safeLocalStorage.getItem(SEARCH_TOKEN);
  if (tokenData) {
    return JSON.parse(tokenData);
  }
  return {};
}

export function getTokenFromStorage() {
  const tokenData = getTokenDataFromStorage();
  return tokenData.token;
}

function getTokenExpiryFromStorage() {
  const tokenData = getTokenDataFromStorage();
  return tokenData.expires;
}

export function isTokenExpired() {
  const time = Date.now();
  const expires = getTokenExpiryFromStorage();
  if (!expires) {
    return true;
  }
  return expires <= time;
}

function setTokenDataToStorage(tokenData) {
  safeLocalStorage.setItem(SEARCH_TOKEN, JSON.stringify(tokenData));
}

export function setTokenFromStorage() {
  return fetchToken().then((result) => {
    const req = JSON.parse(result);
    const expires = Date.now() + req.expires_in * 1000; // 7200 -> 7200000 -or- 2 hours
    const tokenData = {
      expires,
      token: req.access_token,
    };
    return tokenData;
  }).then((tokenData) => new Promise((resolve) => setTimeout(() => resolve(tokenData), 8000)))
    .then((tokenData) => {
      setTokenDataToStorage(tokenData);
      return tokenData;
    });
}

export function fetchTokenData() {
  const y = setTokenFromStorage();
  return {
    token: wrapPromise(y),
  };
}

// Suspense integrations like Relay implement
// a contract like this to integrate with React.
// Real implementations can be significantly more complex.
// Don't copy-paste this into your project!
function wrapPromise(promise) {
  let status = 'pending';
  let result;
  const suspender = promise.then(
    (r) => {
      status = 'success';
      result = r;
    },
    (e) => {
      status = 'error';
      result = e;
    },
  );
  return {
    read() {
      if (status === 'pending') {
        throw suspender;
      } else if (status === 'error') {
        throw result;
      } else if (status === 'success') {
        return result;
      }
    },
  };
}

// TODO: ADD ENV VARIABLES FOR CLIENT ID, CLIENT SECRET
const formdata = new FormData();

const requestOptions = {
  method: 'POST',
  body: formdata,
  redirect: 'follow',
};

function fetchToken() {
  return fetch('https://www.arcgis.com/sharing/rest/oauth2/token', requestOptions)
    .then((response) => response.text())
    .then((result) => result)
    .catch((error) => console.log('error', error));
}
