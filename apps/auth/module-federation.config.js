module.exports = {
  name: 'auth',
  exposes: {
    './Module': 'apps/auth/src/app/remote-entry/entry.module.ts',
  },
};
