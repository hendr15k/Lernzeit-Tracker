const { test as base } = require('@playwright/test');

const test = base.extend({
  storageState: async ({}, use) => {
    await use({});
  },
});

module.exports = { test };
