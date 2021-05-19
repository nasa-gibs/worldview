# Embedding Worldview

To embed NASA Worldview in your page, navigate to the share toolbar, select the `embed` tab, and copy the code that wraps the current Worldview instance in an `<iframe>` inline element. Add this HTML code to your website to embed Worldview. You will need to wrap the `<iframe>` code in a wrapper element (e.g., `<div>`) with your desired `width`, `height`, and any additional style changes.

See [https://developer.mozilla.org/en-US/docs/Web/HTML/Element/iframe](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/iframe) for more information on the `<iframe>` inline element including an explanation of its attributes.

**Example `<iframe>` code:**

```<iframe src="https://worldview.earthdata.nasa.gov/?em=true" role="application" sandbox="allow-scripts allow-same-origin allow-forms allow-popups" width="100%" height="100%" allow="fullscreen; autoplay;" loading="lazy"></iframe>```

**Note:** Certain application features and button/tab interactions are not available in embed mode. We recommend to limit the number of layers you share - hidden layers will be filtered out and are not included. A helpful tip is to provide detailed captions to assist the user in better understanding the science concepts that you are presenting.
