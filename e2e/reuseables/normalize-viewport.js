module.exports = {
  normalizeViewport (client, width, height) {
    client.windowSize('current', width, height)
    client
      .execute(
        (width, height) => ({
          width: width === window.innerWidth ? 0 : window.outerWidth - window.innerWidth,
          height: height === window.innerHeight ? 0 : window.outerHeight - window.innerHeight
        }),
        [width, height],
        (result) => {
          const padding = result
          const newHeight = padding.height ? height + padding.height : height
          const newWidth = padding.width ? width + padding.width : width
          client.windowSize('current', newWidth, newHeight)
        }
      )
  }
}
