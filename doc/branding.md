# Branding

By default, the build process will:

* Name the application "Example Map"
* Not provide a logo in the upper left hand corner
* Contain an "About" page with only the version and name of the application.
* Have a default support email address of support@example.com

## Customizing

Customization is easy as modifying or changing some files in the ``options``
directory.

*Please Note*: The ``options`` directory is contained in the ``.gitignore`` file
so that you can make a separate repository for the customizations.

Edit the ``options/brand.json`` file and make changes as necessary using the
guidance below:

* ``packageName``: Name used to create tar files, base directories and web
roots (e.g., supermap)
* ``name``: Name of the application presented to the end users (e.g.,
Super Map of the World)
* ``email``: Email address that should be presented to the end user for
support requests.

Naming can be more specific by omitting the ``name`` property and using
the following instead:

* ``officalName``: Name of the application when used in a formal setting
(e.g, TLA's Super Map of the World)
* ``longName``: Full, but not official, name of the application (e.g. Super
Map of the World)
* ``shortName``: Abbreviated, short name of the application (e.g. Super Map)

To add a logo, replace the following file with an image that is 247 pixels by
45 pixels:

    options/brand/images/wv-logo.png

To create an "About" page, edit the following file:

    optoins/brands/pages/about.html

## Rebuilding

Build again and the customizations should now be included:

    grunt
