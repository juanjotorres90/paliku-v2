/** @type {import('@commitlint/types').UserConfig} */
module.exports = {
  extends: ['@commitlint/config-conventional'],
  // Optionally restrict scopes to repo packages:
  // rules: {
  //   'scope-enum': [2, 'always', ['web', 'docs', 'api', 'ui', 'db', 'validators', 'deps']],
  // },
  rules: {
    'header-max-length': [0, 'always', 300],
  },
};
