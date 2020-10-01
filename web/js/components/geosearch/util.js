import CoordinateParser from 'coordinate-parser';
// import safeLocalStorage from '../../util/local-storage';

// const { SEARCH_TOKEN } = safeLocalStorage.keys;

// export function getTokenDataFromStorage() {
//   const tokenData = safeLocalStorage.getItem(SEARCH_TOKEN);
//   if (tokenData) {
//     return JSON.parse(tokenData);
//   }
//   return {};
// }

// export function getTokenFromStorage() {
//   const tokenData = getTokenDataFromStorage();
//   return tokenData.token;
// }

// function getTokenExpiryFromStorage() {
//   const tokenData = getTokenDataFromStorage();
//   return tokenData.expires;
// }

// export function isTokenExpired() {
//   const time = Date.now();
//   const expires = getTokenExpiryFromStorage();
//   if (!expires) {
//     return true;
//   }
//   return expires <= time;
// }

// function setTokenDataToStorage(tokenData) {
//   safeLocalStorage.setItem(SEARCH_TOKEN, JSON.stringify(tokenData));
// }

// TEMP TOKEN FUNC USED IN COMPONENT
// function Token() {
//   // Try to read user info, although it might not have loaded yet
//   let token;
//   if (isTokenExpired()) {
//     token = tokenData.token.read();
//   } else {
//     token = getTokenFromStorage();
//   }
//   return <h1>{token.access_token}</h1>;
// }

export default function isValidCoordinates(position) {
  try {
    const validatedCoordinates = new CoordinateParser(position);
    return validatedCoordinates;
  } catch (error) {
    return false;
  }
}
