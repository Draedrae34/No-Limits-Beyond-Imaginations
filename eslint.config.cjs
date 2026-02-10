const ignorePaths = [
  "node_modules/**",
  "node_modules_dist/**",
  "Important_html/**",
  "destination/**",
  "docs/**",
  "Logo/**",
  "js (copy 1)/**",
  "gtm.js",
  "pom.xml",
  "lazy.min.js",
  "portal-transition.js",
  "printful_client.py",
  "R&T Know Limitations Quantum Assistant.py",
  "web_assets/**",
  "api/vendor/**",
  "scripts/test-purchase.js",
  "env/**",
  ".venv/**",
  "__pycache__/**",
  "remembrance/photos/**",
];

module.exports = [
  {
    ignores: ignorePaths,
  },
  {
    files: ["**/*.js"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
    },
    rules: {
      "no-unused-vars": ["warn", { vars: "all", args: "after-used", ignoreRestSiblings: true }],
      "no-console": "off",
      semi: ["error", "always"],
    },
  },
];
