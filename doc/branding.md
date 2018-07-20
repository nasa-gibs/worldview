# Branding

To add custom branding to Worldview,
[create a custom configuration](configuration.md) and modify it:

## Customizing

Update the following fields in `options/common/brand.json` with custom branding:

* `packageName`: Application name used to create builds, (i.e. `worldview`).
* `name`: Application name shown to end users (i.e. `EOSDIS Worldview`).
* `email`: Email address for support requests.

Naming can be more specific by omitting the `name` field and using
the following instead:

* `officalName`: Full name of the application (i.e. `EOSDIS Worldview`).
* `shortName`: Short name of the application (i.e. `Worldview`).

To add a logo, replace `options/common/brand/images/wv-logo.png` with an image
that is 247x45 pixels.

## Rebuilding

After making changes to a custom configuration, run `npm run build` again to
rebuild the app.
