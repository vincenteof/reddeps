module.exports = {
  parser: '@typescript-eslint/parser',
  extends: [
    'eslint:recommended',
    'plugin:import/recommended',
    'plugin:import/typescript',
    'plugin:prettier/recommended',
    'plugin:@typescript-eslint/recommended',
  ],
  settings: {
    'import/resolver': {
      typescript: {
        alwaysTryTypes: true,
        project: 'packages/*/tsconfig.json',
      },
      node: {
        extensions: ['.js'],
      },
    },
  },
  parserOptions: {
    ecmaVersion: 6,
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true,
    },
  },
  env: {
    browser: true,
    node: true,
  },
  rules: {
    'valid-jsdoc': 1,
    'no-unused-vars': 'off',
    '@typescript-eslint/no-unused-vars': ['error'],
    'no-redeclare': 'off',
    '@typescript-eslint/no-redeclare': ['error'],
  },
  plugins: ['@typescript-eslint', 'import'],
  globals: {
    JSX: true,
  },
}
