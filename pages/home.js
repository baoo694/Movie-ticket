import { h, mount } from '../lib/utils.js';
import { navigate } from '../lib/router.js';
import { movieCard } from '../components/movie-card.js';
import { store } from '../lib/store.js';

export function renderHome(){
  let mode = 'now'; // 'now' | 'soon'
  const wrap = h('div', { class:'page' });

  const hero = h('section', { class:'section' }, [
    h('h3', {}, ['Đặt vé xem phim trực tuyến']),
    h('p', { class:'meta' }, ['Tìm phim đang chiếu, chọn ghế, thanh toán và nhận vé điện tử.']),
    h('div', {}, [ h('button', { class:'btn primary', 'data-route':'/catalog' }, ['Bắt đầu đặt vé']) ])
  ]);

  const listSec = h('section', { class:'section' });
  const tabs = h('div', { class:'controls', style:'margin-bottom:12px;' });
  const btnNow = h('button', { class:'btn primary' }, ['Đang chiếu']);
  const btnSoon = h('button', { class:'btn' }, ['Sắp chiếu']);
  tabs.append(btnNow, btnSoon);
  const gridWrap = h('div');
  listSec.append(tabs, gridWrap);

  function repaint(){
    btnNow.className = mode==='now' ? 'btn primary' : 'btn';
    btnSoon.className = mode==='soon' ? 'btn primary' : 'btn';
    const movies = store.movies.filter(m=> m.status === (mode==='now' ? 'now' : 'soon'));
    const cards = movies.map(m=> movieCard(m, { ctaLabel:'Lịch chiếu', onClick: ()=> navigate(`/showtimes?movieId=${m.id}`) }));
    gridWrap.innerHTML = '';
    gridWrap.append(h('div', { class:'grid' }, cards));
  }

  btnNow.addEventListener('click', ()=>{ mode='now'; repaint(); });
  btnSoon.addEventListener('click', ()=>{ mode='soon'; repaint(); });

  repaint();

  wrap.append(hero, listSec);
  mount(document.getElementById('app'), wrap);
}

// removed two-column section; using tabs above

