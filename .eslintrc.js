module.exports = {
  parserOptions: {
    parser: 'babel-eslint',
    ecmaVersion: 6,
    sourceType: 'module',
    ecmaFeatures: {
      impliedStrict: true
    }
  },
  extends: [
    'standard'
  ],
  plugins: [],
  rules: {
    'space-infix-ops': 'error'
  }
}
