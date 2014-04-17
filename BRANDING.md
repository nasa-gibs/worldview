# Branding

By default, the build process will:

* Name the application "My Map"
* Not provide a logo in the upper left hand corner
* Contain an "About" page with only the version and name of the application.
* Have a default support email address of support@example.com

## Customizing

To customize, copy the default branding directory to another directory
and make changes there. For example:

    cp -R etc/brand.default etc/brand.custom

*Please Note*: Additional brand directories are in the ``.gitignore`` file
so that you can make a separate repository for the customizations.

Now edit the ``etc/brand.custom/brand/options.json`` file and make changes
as necessary using the guidance below:

* ``packageName``: Name used to create tar files, base directories and web
roots (e.g, supermap)
* ``officalName``: Name of the application when used in a formal setting
(e.g, TLA's Super Map of the World)
* ``longName``: Full, but not offical, name of the application (e.g. Super
Map of the World)
* ``shortName``: Abbreviated, short name of the application (e.g. Super Map)
* ``version``: Version of the application suitible for display to an
end user.
* ``release``: Used to mark a new revision when the version number should
not be changed.
* ``support``: Email address that should be presented to the end user for
support requests.

The ``url`` and ``description`` fields are used for generating the
documentation and don't need to be changed.

To add a logo, replace the following file with an image that is 247 pixels by
45 pixels:

    etc/brand.custom/src/images/brand/wv-logo.png

To create an "About" page, edit the following file:

    etc/brand.custom/src/pages/brand/about.html

## Rebuilding

Inform the build process to use the "custom" brand directory with the
following:

    mkdir -p brand
    echo '{"brand": "custom"}' > brand/brand.json

Build again and the customizations should now be incldued:

    grunt



