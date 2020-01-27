/* eslint no-template-curly-in-string: "off" */
const shell = require('shelljs');
const args = process.argv.slice(2);
const sinceArg = args[0];
const rubyArg = args[1];

const GITHUB_CHANGELOG_GENERATOR_TOKEN = process.env.GITHUB_CHANGELOG_GENERATOR_TOKEN;

if (!GITHUB_CHANGELOG_GENERATOR_TOKEN) {
  console.log('\u{1b}[33mA GitHub token is required to make the required number of requests to the GitHub API for release note generation.\u{1b}[0m');
} else {
  console.log('\u{1b}[32mA GitHub release note generation initiated. This will take a few minutes to complete.\u{1b}[0m');

  let cmdPrefix;
  // run docker command by default, but allow ruby using command line argument
  if (rubyArg === 'ruby') {
    cmdPrefix = 'github_changelog_generator';
  } else {
    cmdPrefix = 'docker run -it --rm -v /${PWD}:/wkDir ferrarimarco/github-changelog-generator';
  }

  // add --since v3.4.0 tag to limit compiled release notes
  // NOTE: A complete API request of entire commit history is still required due to GitHub's API, so this won't save you much time
  const sinceOption = sinceArg ? `--since-tag ${sinceArg} ` : '';

  const cmd = `${cmdPrefix} -u nasa-gibs -p worldview --no-author --bugs-label '## Technical Updates / Bugs:' \
--security-label '## External Dependency Updates:' --security-labels 'external dependency' --removed-label \
'## Story Changes:' --removed-labels 'story,Story' --deprecated-label '## Layer Changes:' --deprecated-labels \
'layer,Layer' ${sinceOption}--token ${GITHUB_CHANGELOG_GENERATOR_TOKEN}`;

  shell.exec(cmd);
}
