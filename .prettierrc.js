// Documentation for this file: https://prettier.io/docs/en/configuration.html

module.exports = {
  printWidth: 80,
  semi: true,
  tabWidth: 4,
  singleQuote: true,
  trailingComma: 'all',
  overrides: [
    {
      files: ['*.yml', '*.yaml'],
      options: {
        tabWidth: 2,
        singleQuote: false,
      },
    },
    {
      files: ['*.js'],
      options: {
        tabWidth: 2,
        singleQuote: true,
      },
    },
    {
      files: ['*.json'],
      options: {
        tabWidth: 2,
      },
    },
    {
      files: ['*.sh'],
      options: {
        tabWidth: 2,
        singleQuote: false,
      },
    },
  ],
};
