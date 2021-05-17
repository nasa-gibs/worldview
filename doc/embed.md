# Embed mode

To embed NASA Worldview in your page, navigate to the share toolbar, select the `embed` tab, and copy the code that wraps the current Worldview instance in an `<iframe>` inline element. Add this HTML code to your website to embed Worldview. You will need to wrap the `<iframe>` code in a wrapper with your desired `width`, `height`, and any additional style changes.

See [https://developer.mozilla.org/en-US/docs/Web/HTML/Element/iframe](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/iframe) for more information on the `<iframe>` inline element and an explanation of the its attributes.

**Example `<iframe>` code:**

```<iframe src="https://worldview.earthdata.nasa.gov/?em=true" role="application" sandbox="allow-scripts allow-same-origin allow-forms allow-popups" width="100%" height="100%" allow="fullscreen; autoplay;" loading="lazy"></iframe>```

**Note:** Certain application features and interactions are not available in embed mode. Please try to think of a way to share your concept using the available features. We recommend to not share more layers than necessary and to provide detailed captions to help the user better understand the science concepts you are presenting.
