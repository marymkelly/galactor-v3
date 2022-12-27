module.exports = {
  root: true,
  env: {
    es6: true,
    node: true,
  },
  extends: ["eslint:recommended", "google"],
  rules: {
    "quotes": ["error", "double"],
    "max-len": "off",
    "require-jsdoc": "off",
  },
  parser: "@babel/eslint-parser",
};
