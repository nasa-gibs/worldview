module.exports = {
  globDirectory: 'web/',
  globPatterns: [
    '**/*.{md,json,ico,png,svg,eot,ttf,jpg,html,css,js,gif,woff,woff2,snap,rss-20130412,json-20170530,cgi,cgi-error}',
  ],
  swDest: 'web/sw.js',
  ignoreURLParametersMatching: [
    /^utm_/,
    /^fbclid$/,
  ],
};
