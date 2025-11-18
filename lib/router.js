import { parseQuery, mount, h } from './utils.js';

export const routes = {};

export function navigate(path){
  location.hash = '#' + path;
}

export function register(path, handler){
  routes[path] = handler;
}

function fallback(){
  mount(document.getElementById('app'), h('div', {class:'section'}, ['Không tìm thấy trang']));
}

function extractHashParams(fragment){
  if (!fragment) return null;
  if (
    fragment.startsWith('access_token=') ||
    fragment.startsWith('error=') ||
    fragment.includes('type=')
  ) {
    return parseQuery(fragment);
  }
  return null;
}

export function handleRoute(){
  let fragment = location.hash.slice(1) || '/';
  let trailing = '';
  if (fragment.includes('#')) {
    const idx = fragment.indexOf('#');
    trailing = fragment.slice(idx+1);
    fragment = fragment.slice(0, idx) || '/';
  }

  let hashParams = extractHashParams(trailing);
  if (!hashParams && fragment && !fragment.startsWith('/')) {
    hashParams = extractHashParams(fragment);
    if (hashParams) fragment = '/';
  } else if (hashParams && (!fragment || fragment==='')) {
    fragment = '/';
  }

  const [base, query] = fragment.split('?');
  const fn = routes[base] || routes['/404'] || fallback;
  const params = parseQuery(query||'');

  if (hashParams) {
    const type = (hashParams.type || '').toLowerCase();
    if (type === 'signup' && routes['/confirm']) {
      const status = hashParams.error ? 'error' : 'success';
      const message = hashParams.error_description || hashParams.error || '';
      const queryParams = new URLSearchParams();
      queryParams.set('status', status);
      if (message) queryParams.set('message', message);
      const cleanHash = `#/confirm?${queryParams.toString()}`;
      if (location.hash !== cleanHash) {
        window.history.replaceState(window.history.state, '', cleanHash);
      }
      routes['/confirm']({ status, message });
      return;
    }

    if (routes['/login']) {
      if (base !== '/login') {
        routes['/login']({
          mode: 'recovery',
          hashParams,
          recoveryError: hashParams.error_description || hashParams.error || '',
        });
        return;
      }
      params.mode = 'recovery';
      params.hashParams = hashParams;
      params.recoveryError = hashParams.error_description || hashParams.error || '';
    }
  }

  fn(params);
}

export function initRouter(){
  window.addEventListener('hashchange', handleRoute);
  document.addEventListener('click', (e)=>{
    const btn = e.target.closest('[data-route]');
    if (btn) {
      const path = btn.getAttribute('data-route');
      navigate(path);
    }
  });
  handleRoute();
}

