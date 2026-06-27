declare global {
  interface Window {
    __SCORE_QA_FORCE_LOCAL__?: boolean;
  }
}

const LOCAL_QA_FORCE_LOCAL_KEY = 'score-energy-local-qa-force-local';
const LOCAL_QA_HOSTS = new Set(['127.0.0.1', 'localhost', '::1']);

const isBrowser = () => typeof window !== 'undefined';

export const isLocalQaHost = () =>
  isBrowser() && LOCAL_QA_HOSTS.has(window.location.hostname);

export const isLocalQaForcedRuntime = () => {
  if (!isLocalQaHost()) {
    return false;
  }

  const forcedByWindow = window.__SCORE_QA_FORCE_LOCAL__ === true;

  try {
    return forcedByWindow || window.localStorage.getItem(LOCAL_QA_FORCE_LOCAL_KEY) === 'true';
  } catch (_error) {
    return forcedByWindow;
  }
};

export const LOCAL_QA_RUNTIME_KEYS = {
  forceLocal: LOCAL_QA_FORCE_LOCAL_KEY,
};
