# Optional Features

These features are not enabled by default. See each section below on how
to enable the feature if desired.

## Data Download

The data download feature requires a CGI script to execute queries to ECHO
on behalf of Worldview. For this reason, it is not enabled by default.
If you understand the implications of this feature and wish to enable it,
edit the ``conf/web/brand/features.json`` file in the active brand
directory and change to:

    "dataDownload": true

Rebuild Worldview and the CGI script should be included in the
``service`` directory. If your system administrator has disabled
``.htaccess`` files, configure apache to allow the execution of this
CGI script.

## URL Shortening

The URL shortening feature uses the service provided by
[bit.ly](http://bit.ly). You will need to obtain an API key to use this
serivce. Once you have obtained a key, copy ``conf/bitly_config.sample.py`` to
``conf/bity_config.py``, edit the file, and fill in the proper values.

This feature also requires a CGI script to execute queries to bit.ly
on behalf of Worldview. For this reason, it is not enabled by default.
If you understand the implications of this feature and wish to enable it,
edit the ``conf/web/brand/features.json`` file in the active brand
directory and change to:

    "urlShortening": true

Rebuild Worldview and the CGI script should be included in the
``service`` directory. If your system administrator has disabled
``.htaccess`` files, configure apache to allow the execution of this
CGI script.


