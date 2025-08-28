const eslintRecommended = require("eslint/conf/eslint-recommended");

module.exports = [
  {
    ...eslintRecommended,
    ignores: ["node_modules", "dist"],
    languageOptions: {
      ecmaVersion: 2020,
      sourceType: "module",
    },
    rules: {},
  },
];
