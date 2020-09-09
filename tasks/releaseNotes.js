// This script will generate an updated CHANGELOG.md
// Configuration options can be found in the file .github_changelog_generator
//
// Accepts two arguments:
//    --ruby    Boolean.  If provided and true, will try to run locally in Ruby.  Otherwise,
//              will spin up a docker container.
//    --since   If provided, will only generate notes based on changes since the provided tag
//    --branch  The branch from which to pull the history that notes will be generated from.
//              If no branch provided, master is used.

// Expects the following environment variables to be defined:
//    GIT_HOME - Local parent directory of the /worldview dir
//    GITHUB_CHANGELOG_GENERATOR_TOKEN - Github API access token used to request repo history from GitHub.
//                                       Go to https://github.com/settings/tokens to create one.

/* eslint-disable no-console */
/* eslint no-template-curly-in-string: "off" */
const shell = require('shelljs');

const args = process.argv;
const argStore = {};
args.forEach((val) => {
  if (val.match(/=/)) {
    const splitArg = val.split('=');
    const key = splitArg[0];
    const value = splitArg[1];
    argStore[key] = value;
  }
});

const { GITHUB_CHANGELOG_GENERATOR_TOKEN, GIT_HOME } = process.env;

if (!GITHUB_CHANGELOG_GENERATOR_TOKEN) {
  console.log('\u{1b}[33mA GitHub token is required to make the required number of requests to the GitHub API for release note generation.\u{1b}[0m');
} else {
  console.log('\u{1b}[32mA GitHub release note generation initiated. This will take a few minutes to complete.\u{1b}[0m');

  const localWorldviewDir = `${GIT_HOME}/worldview`;
  const dockerContainerDir = '/usr/local/src/your-app';
  const cmdPrefix = argStore.ruby
    ? 'github_changelog_generator'
    : `docker run -i --rm -v ${localWorldviewDir}:${dockerContainerDir} ferrarimarco/github-changelog-generator`;

  // NOTE: A complete API request of entire commit history is still required
  // due to GitHub's API, so this won't save you much time
  const sinceOption = argStore.since ? ` --since-tag ${argStore.since}` : '';
  const branchOption = argStore.branch ? ` --release-branch ${argStore.branch}` : '';

  const cmd = `${cmdPrefix} \
  --security-label '## External Dependency Updates:' --security-labels 'external dependency' \
  --removed-label '## Story Changes:' --removed-labels 'story,Story' \
  --deprecated-label '## Layer Changes:' --deprecated-labels 'layer,Layer' \
  ${sinceOption}${branchOption} --token ${GITHUB_CHANGELOG_GENERATOR_TOKEN}`;

  shell.exec(cmd);
}
