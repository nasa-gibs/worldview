module.exports = {
  normalizeViewport(client, width, height) {
    client.windowSize('current', width, height);
    client
      .execute((width, height) => ({
        width: width === window.innerWidth ? 0 : window.outerWidth - window.innerWidth,
        height: height === window.innerHeight ? 0 : window.outerHeight - window.innerHeight,
      }), [width, height], (result) => {
        const padding = result.value;
        client.windowSize('current', width + padding.width, height + padding.height);
      });
  },
};
