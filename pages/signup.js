import { h, mount } from '../lib/utils.js';
import { signUp, getSession } from '../lib/supabase.js';
import { navigate } from '../lib/router.js';

export async function renderSignup(params){
  const session = await getSession();
  if (session) { navigate('/'); return; }

  const wrap = h('div', { class:'page' });
  const form = h('form', { class:'section' }, [
    h('h3', {}, ['Đăng ký tài khoản']),
    h('div', { class:'row' }, [
      h('div', { class:'col-12' }, [ h('label', {}, ['Email']), h('input', { type:'email', id:'suEmail', required: true, placeholder:'you@example.com' }) ])
    ]),
    h('div', { class:'row' }, [
      h('div', { class:'col-12' }, [ h('label', {}, ['Mật khẩu']), h('input', { type:'password', id:'suPassword', required: true, placeholder:'••••••••' }) ])
    ]),
    h('div', { class:'controls' }, [
      h('button', { class:'btn primary', type:'submit' }, ['Đăng ký']),
      h('button', { class:'btn', type:'button', onclick: ()=> navigate('/login') }, ['Đăng nhập'])
    ]),
    h('div', { id:'suError', class:'danger-text', style:'display:none;margin-top:12px;' })
  ]);

  form.addEventListener('submit', async (e)=>{
    e.preventDefault();
    const email = document.getElementById('suEmail').value.trim();
    const password = document.getElementById('suPassword').value;
    const err = document.getElementById('suError'); err.style.display='none';
    try {
      await signUp(email, password);
      alert('Đăng ký thành công! Vui lòng kiểm tra email để xác minh (nếu được bật).');
      navigate('/login');
    } catch(ex){
      err.textContent = ex.message || 'Đăng ký thất bại';
      err.style.display='block';
    }
  });

  wrap.append(form);
  mount(document.getElementById('app'), wrap);
}


