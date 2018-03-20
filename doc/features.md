# Optional Features

These features require CGI scripts to execute on your server. In order for them
to function, make sure your server is configured to allow the execution of
CGI files. Next, enable these features in your configuration file.

## Data Download

This feature uses CGI scripts to query the CMR API on the server. To enable,
edit `options/common/features.json` and set `"dataDownload": true`.

## URL Shortening

This feature uses
[bit.ly](http://bit.ly) to shorten links. Follow these steps to enable it:

* Edit `options/common/features.json` and set `"urlShortening": true`.
* Get a login and API key from [bit.ly](http://bit.ly).
* Create `build/options/bitly.json` with the following contents (replacing `your_login` and `your_key` with the appropriate values);

```json
{
  "login": "your_login",
  "key": "your_key"
}
```

> Caution: Do not commit this file to a public repo, and make sure the `build/options` directory is not publicly accessible on your web server to protect the privacy of your API key.
