import { h, mount } from '../lib/utils.js';
import { navigate } from '../lib/router.js';

export function renderConfirm(params = {}) {
  const status = (params.status || 'success').toLowerCase();
  const message = params.message || (status === 'success'
    ? 'Email của bạn đã được xác thực. Vui lòng đăng nhập để tiếp tục.'
    : 'Không thể xác thực email. Vui lòng thử lại hoặc yêu cầu email mới.');

  const wrap = h('div', { class: 'page' });
  const section = h('section', { class: 'section auth-card' });
  section.append(
    h('h3', {}, [status === 'success' ? 'Xác thực thành công' : 'Xác thực thất bại']),
    h('p', { class: 'meta', style: 'margin:12px 0;' }, [message]),
    h('div', { class: 'controls' }, [
      h('button', { class: 'btn primary', onclick: ()=> navigate('/login') }, ['Đến trang đăng nhập'])
    ])
  );
  wrap.append(section);
  mount(document.getElementById('app'), wrap);
}


