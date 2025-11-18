import { h, mount, clear, cryptoRandomId } from '../lib/utils.js';
import { navigate } from '../lib/router.js';
import { getSession, upsertAppUser } from '../lib/supabase.js';
import { store, loadData } from '../lib/store.js';

export async function renderProfile(params = {}) {
  const session = await getSession();
  if (!session) {
    const next = encodeURIComponent('/profile');
    navigate(`/login?next=${next}`);
    return;
  }

  await loadData();

  const email = (session.user.email || '').toLowerCase();
  let currentUser = (store.users || []).find(u => (u.email || '').toLowerCase() === email);

  if (!currentUser) {
    currentUser = {
      id: session.user.id || cryptoRandomId(),
      email,
      fullName: '',
      phone: '',
      role: 'user',
      status: 'active',
      notes: ''
    };
  }

  const wrap = h('div', { class: 'page' });

  const section = h('section', { class: 'section profile' }, [
    h('h3', { style: 'margin-bottom:6px;' }, ['Hồ sơ cá nhân']),
    h('p', { class: 'meta', style: 'margin-top:0;' }, ['Bạn có thể xem và cập nhật thông tin liên hệ của mình tại đây.'])
  ]);

  const form = h('form', { class: 'profile-form' });

  const emailField = formGroup('Email', h('input', { type: 'email', value: currentUser.email, disabled: true }));
  const nameInput = h('input', { type: 'text', value: currentUser.fullName || '', placeholder: 'Nguyễn Văn A', required: true });
  const phoneInput = h('input', { type: 'tel', value: currentUser.phone || '', placeholder: '0901234567' });

  form.append(
    emailField,
    formGroup('Họ và tên', nameInput),
    formGroup('Số điện thoại', phoneInput),
    h('div', { class: 'controls' }, [
      h('button', { class: 'btn primary', type: 'submit' }, ['Lưu thay đổi'])
    ])
  );

  section.append(form);
  wrap.append(section);
  mount(document.getElementById('app'), wrap);

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const payload = {
      id: currentUser.id,
      email: currentUser.email,
      fullName: nameInput.value.trim(),
      phone: phoneInput.value.trim(),
      role: currentUser.role || 'user',
      status: currentUser.status || 'active',
      notes: currentUser.notes || ''
    };
    try {
      await upsertAppUser(payload);
      await loadData();
      alert('Đã cập nhật hồ sơ cá nhân.');
    } catch (err) {
      console.warn('Update profile failed:', err);
      alert('Không thể cập nhật hồ sơ. Vui lòng thử lại.');
    }
  });
}

function formGroup(label, inputEl) {
  const group = h('div', { class: 'profile-group' });
  group.append(
    h('label', {}, [label]),
    inputEl
  );
  return group;
}

