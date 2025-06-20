// ESLint configuration for scripts directory
module.exports = {
  env: {
    node: true,
    es2021: true,
  },
  extends: ['eslint:recommended'],
  parserOptions: {
    ecmaVersion: 12,
    sourceType: 'script', // Allow CommonJS
  },
  rules: {
    // Allow require() in scripts
    '@typescript-eslint/no-require-imports': 'off',
    // Allow console.log in scripts
    'no-console': 'off',
  },
  overrides: [
    {
      files: ['*.js'],
      rules: {
        '@typescript-eslint/no-require-imports': 'off',
        '@typescript-eslint/no-unused-vars': 'off',
      },
    },
  ],
};
