# Release Notes
To create automated release notes, Worldview uses [github-changelog-generator](https://github.com/github-changelog-generator/github-changelog-generator).
See [CHANGELOG.md](CHANGELOG.md) for a complete repository release change history.

## Changelog Generation
You will need to [create your own authentication token](https://github.com/github-changelog-generator/github-changelog-generator#github-token) to use the changelog generator due to the large amount of requests made to GitHub. To run manually, replace `INSERT_GITHUB_TOKEN_HERE` below with your individual token. To use npm script `npm run notes`, add a local environment variable named `GITHUB_CHANGELOG_GENERATOR_TOKEN` with your access token.

*Note: For individual release notes, add option *`--since-tag v3.3.1`**

**Running with CLI [*will need Ruby installed](https://github.com/github-changelog-generator/github-changelog-generator#installation):**
```
github_changelog_generator -u nasa-gibs -p worldview
--no-author --bugs-label '## Technical Updates / Bugs:'
--enhancement-label '## Implemented enhancements:'
--issues-label '## Closed issues:'
--pr-label '## Merged pull requests:'
--security-label '## External Dependency Updates:'
--security-labels 'external dependency'
--removed-label '## Story Changes:'
--removed-labels 'story,Story'
--deprecated-label '## Layer Changes:'
--deprecated-labels 'layer,Layer'
--token INSERT_GITHUB_TOKEN_HERE
```

**Running with Docker:**
```
docker run -it --rm -v /${PWD}:/wkDir
ferrarimarco/github-changelog-generator -u nasa-gibs -p worldview
--no-author --bugs-label '## Technical Updates / Bugs:'
--enhancement-label '## Implemented enhancements:'
--issues-label '## Closed issues:'
--pr-label '## Merged pull requests:'
--security-label '## External Dependency Updates:'
--security-labels 'external dependency'
--removed-label '## Story Changes:'
--removed-labels 'story,Story'
--deprecated-label '## Layer Changes:'
--deprecated-labels 'layer,Layer'
--token INSERT_GITHUB_TOKEN_HERE
```
