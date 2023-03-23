const { execSync } = require('child_process');
const glob = require('glob');

const tag = process.argv[2];

if (!tag) {
  console.error('Please provide a tag to run the test.');
  process.exit(1);
}

const testMatchPattern = "**/?(*.)test.js";

const testFiles = glob.sync(testMatchPattern);

const filesContainingTag = testFiles.filter((file) => {
  const fileContent = require('fs').readFileSync(file, 'utf8');
  const regex = new RegExp(`\\[${tag}\\]`, 'g');
  return regex.test(fileContent);

});

if (filesContainingTag.length === 0) {
  console.error(`No tests found with tag '${tag}'.`);
  process.exit(1);
}

try {
  const command = `jest ${filesContainingTag.join(' ')} -t '${tag}'`;
  execSync(command, { stdio: 'inherit' });
} catch (error) {
  process.exit(error.status);
}
