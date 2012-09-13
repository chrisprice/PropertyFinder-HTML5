// jQuery is pulled from a CDN for performance when loaded
// in the browser so we need to reference it here so that
// intellisense will recognise it.

/// <reference path="jquery-1.8.1.js" />

// Require.js is included directly when loaded in the browser
// (only while developing) so we need to reference it here so
// that intellisense will recognise it.

/// <reference path="lib/require.js" />

// Tell require.js where this projects scripts are located.

requirejs.config({
  baseUrl: '~/Scripts/'
});
