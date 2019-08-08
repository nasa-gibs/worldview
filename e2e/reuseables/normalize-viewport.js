module.exports = {
  normalizeViewport: function(client, width, height) {
    client.windowSize('current', width, height);
    client
      .execute(function(width, height) {
        return {
          width: width === window.innerWidth ? 0 : window.outerWidth - window.innerWidth,
          height: height === window.innerHeight ? 0 : window.outerHeight - window.innerHeight
        };
      }, [width, height], function(result) {
        const padding = result.value;
        client.windowSize('current', width + padding.width, height + padding.height);
      });
  }
};
