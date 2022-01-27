module.exports = {
  globDirectory: 'web/',
  globPatterns: [
    '**/*.{html,md,json,ico,png,svg,eot,ttf,jpg,css,js,gif,woff,woff2,snap,webmanifest,rss-20130412,json-20170530,cgi,cgi-error,backup}',
  ],
  swDest: 'web/sw.js',
  ignoreURLParametersMatching: [
    /^utm_/,
    /^fbclid$/,
  ],
  // Define runtime caching rules.
  runtimeCaching: [{
    // Match any request that ends with .png, .jpg, .jpeg or .svg.
    urlPattern: /\.(?:png|jpg|jpeg|svg)$/,

    // Apply a cache-first strategy.
    handler: 'CacheFirst',

    options: {
      // Use a custom cache name.
      cacheName: 'images',

      // Only cache 10 images.
      expiration: {
        maxEntries: 10,
      },
    },
  }],
};
