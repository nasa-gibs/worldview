const { execSync } = require('child_process');
const loaderUtils = require('loader-utils');

module.exports = function(source) {
  const options = loaderUtils.getOptions(this);
  console.log(options);
  var scriptResult = execSync(options.script, {input: source});
  return scriptResult;
};
