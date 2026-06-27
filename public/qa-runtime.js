(function () {
  if (typeof window === 'undefined') {
    return;
  }

  var SAFE_HOSTS = { '127.0.0.1': true, 'localhost': true, '::1': true };
  var LOCAL_AUTH_ACCOUNT_KEY = 'score-energy-local-auth-account';
  var LOCAL_AUTH_SESSION_KEY = 'score-energy-local-auth-session';
  var JOURNEY_FALLBACK_STORAGE_KEY = 'score-energy-mvp-journey-fallback-identity';
  var JOURNEY_STATE_PREFIX = 'score-energy:mvp-journey:v1:';
  var LEGACY_STATE_PREFIX = 'score-energy-mvp-core-flow';
  var LOCAL_INVOICE_PREFIX = 'score-energy-local-invoices:';
  var LOCAL_QA_FORCE_LOCAL_KEY = 'score-energy-local-qa-force-local';
  var LOCAL_QA_SEED_VERSION_KEY = 'score-energy-local-qa-seed-version';
  var SEED_RUNTIME_URL = '/qa-runtime.seed.json';

  window.__SCORE_QA_FORCE_LOCAL__ = false;

  if (!SAFE_HOSTS[window.location.hostname]) {
    return;
  }

  var payload = null;

  try {
    var request = new XMLHttpRequest();
    request.open('GET', SEED_RUNTIME_URL, false);
    request.send(null);

    if (request.status >= 200 && request.status < 300 && request.responseText) {
      payload = JSON.parse(request.responseText);
    }
  } catch (_error) {
    payload = null;
  }

  if (!payload || !payload.seedVersion || !payload.userId) {
    return;
  }

  window.__SCORE_QA_FORCE_LOCAL__ = true;

  try {
    window.localStorage.setItem(LOCAL_QA_FORCE_LOCAL_KEY, 'true');

    var appliedVersion = window.localStorage.getItem(LOCAL_QA_SEED_VERSION_KEY);
    if (appliedVersion === payload.seedVersion) {
      return;
    }

    var removedKeys = [];
    var removeStorageKey = function (storageKey) {
      if (window.localStorage.getItem(storageKey) !== null) {
        window.localStorage.removeItem(storageKey);
        removedKeys.push(storageKey);
      }
    };

    var existingAccountRaw = window.localStorage.getItem(LOCAL_AUTH_ACCOUNT_KEY);
    var previousUserId = null;

    if (existingAccountRaw) {
      try {
        var existingAccount = JSON.parse(existingAccountRaw);
        if (existingAccount && typeof existingAccount.id === 'string') {
          previousUserId = existingAccount.id;
        }
      } catch (_error) {
        previousUserId = null;
      }
    }

    removeStorageKey(LOCAL_AUTH_SESSION_KEY);
    removeStorageKey(JOURNEY_FALLBACK_STORAGE_KEY);
    removeStorageKey(JOURNEY_STATE_PREFIX + payload.userId);
    removeStorageKey(LEGACY_STATE_PREFIX + ':' + payload.userId);
    removeStorageKey(LOCAL_INVOICE_PREFIX + payload.userId);

    if (previousUserId && previousUserId !== payload.userId) {
      removeStorageKey(JOURNEY_STATE_PREFIX + previousUserId);
      removeStorageKey(LEGACY_STATE_PREFIX + ':' + previousUserId);
      removeStorageKey(LOCAL_INVOICE_PREFIX + previousUserId);
    }

    window.localStorage.setItem(
      LOCAL_AUTH_ACCOUNT_KEY,
      JSON.stringify({
        id: payload.userId,
        email: payload.email,
        password: payload.password,
        createdAt: payload.createdAt,
      })
    );
    window.localStorage.setItem(LOCAL_QA_SEED_VERSION_KEY, payload.seedVersion);
    window.sessionStorage.clear();
    window.__SCORE_QA_SEED_CONTEXT__ = {
      applied: true,
      removedKeys: removedKeys,
      seedVersion: payload.seedVersion,
      userId: payload.userId,
    };
  } catch (_error) {
    window.__SCORE_QA_SEED_CONTEXT__ = {
      applied: false,
      seedVersion: payload.seedVersion,
      userId: payload.userId,
    };
  }
})();
