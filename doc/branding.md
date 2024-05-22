# Branding

To add custom branding to Worldview,
[create a custom configuration](config/configuration.md) and modify it:

## Customizing

Update the following fields in `config/default/common/brand.json` with custom branding:

* `packageName`: Application name used to create builds, (i.e. `worldview`).
* `name`: Application name shown to end users (i.e. `NASA Worldview`).
* `email`: Email address for support requests.

Naming can be more specific by omitting the `name` field and using
the following instead:

* `officialName`: Full name of the application (i.e. `NASA Worldview`).
* `shortName`: Short name of the application (i.e. `Worldview`).

To add a logo, replace `config/default/common/brand/images/wv-logo.png` with an image
that is 247x45 pixels.

To customize the descriptions on the "About" modal, edit the markdown files in `config/default/common/brand/about`.  These can contain either markdown syntax or HTML code, but markdown is recommended.

## Rebuilding

After making changes to a custom configuration, run `npm run build` again to
rebuild the app.
