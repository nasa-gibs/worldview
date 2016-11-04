# Optional Features

These features are not enabled by default. See each section below on how
to enable the feature if desired.

## Data Download

The data download feature requires a CGI script to execute queries to CMR
on behalf of Worldview. For this reason, it is not enabled by default.
If you understand the implications of this feature and wish to enable it,
edit the ``options/features.json`` file and change to:

    "dataDownload": true

Rebuild Worldview and the CGI script should be included in the
``service`` directory. If your system administrator has disabled
``.htaccess`` files, configure apache to allow the execution of this
CGI script.

## URL Shortening

The URL shortening feature uses the service provided by
[bit.ly](http://bit.ly). You will need to obtain an API key to use this
service. Once you have obtained a key, create a ``options/bitly.json``
file using the following as a template:

```json
{
    "login": "my_login",
    "key": "xh367ahdfjwna"
}
```

This feature also requires a CGI script to execute queries to bit.ly
on behalf of Worldview. For this reason, it is not enabled by default.
If you understand the implications of this feature and wish to enable it,
edit the ``options/features.json`` file and change to:

    "urlShortening": true

Rebuild Worldview and the CGI script should be included in the
``service`` directory. If your system administrator has disabled
``.htaccess`` files, configure apache to allow the execution of this
CGI script.
