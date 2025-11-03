import { h, mount } from '../lib/utils.js';
import { signIn, signUp, sendPasswordReset, getSession } from '../lib/supabase.js';
import { navigate } from '../lib/router.js';

export async function renderLogin(params){
  const session = await getSession();
  if (session) {
    navigate(params?.next || '/');
    return;
  }

  let mode = 'login';

  function draw(){
    const wrap = h('div', { class:'auth-wrap' });
    const card = h('div', { class:'auth-card' });
    const form = h('form');
    const title = mode==='login' ? 'Sign In' : mode==='signup' ? 'Create Account' : 'Reset password';
    card.append(h('div', { class:'auth-title' }, [title]));
    if (mode==='login') card.append(h('div', { class:'auth-subtitle' }, ['Enter your credentials to access your account']));

    // email
    form.append(h('label', {}, ['Email Address']));
    form.append(h('div', { class:'input-with-icon' }, [
      h('input', { type:'email', id:'authEmail', required: true, placeholder:'you@example.com' })
    ]));

    // password (except reset)
    if (mode!=='reset') {
      form.append(h('label', {}, ['Password']));
      const pwdWrap = h('div', { class:'input-with-icon' }, [
        h('input', { type:'password', id:'authPassword', required: mode!=='reset', placeholder:'••••••••' }),
      ]);
      const eyeBtn = h('button', { type:'button', class:'input-icon-btn', onclick: ()=>{
        const inp = document.getElementById('authPassword');
        if (!inp) return;
        inp.type = inp.type === 'password' ? 'text' : 'password';
      } }, ['👁️']);
      pwdWrap.append(eyeBtn);
      form.append(pwdWrap);
    }

    if (mode==='login') {
      const row = h('div', { class:'auth-row', style:'justify-content: flex-end;' }, [
        h('button', { type:'button', class:'text-link', onclick: ()=>{ mode='reset'; rerender(); } }, ['Forgot password?'])
      ]);
      form.append(row);
    }

    const actions = h('div', { class:'auth-actions' });
    actions.append(h('button', { class:'btn primary', type:'submit', style:'width:100%' }, [ mode==='login' ? 'Sign In' : mode==='signup' ? 'Create account' : 'Send reset email' ]));

    const links = h('div', { class:'controls' });
    if (mode==='login') {
      const bottom = h('div', { class:'auth-bottom' }, ["Don't have an account? ", h('button', { class:'text-link', type:'button', onclick: ()=>{ mode='signup'; rerender(); } }, ['Create one'])]);
      card.append(bottom);
    } else if (mode==='signup') {
      const bottom = h('div', { class:'auth-bottom' }, ['Already have an account? ', h('button', { class:'text-link', type:'button', onclick: ()=>{ mode='login'; rerender(); } }, ['Sign in'])]);
      card.append(bottom);
    } else if (mode==='reset') {
      const bottom = h('div', { class:'auth-bottom' }, [ h('button', { class:'text-link', type:'button', onclick: ()=>{ mode='login'; rerender(); } }, ['Back to sign in'])]);
      card.append(bottom);
    }

    const errorDiv = h('div', { id:'authError', class:'danger-text', style:'display:none;margin-top:12px;' });

    form.append(actions, errorDiv);

    form.addEventListener('submit', async (e)=>{
      e.preventDefault();
      const email = document.getElementById('authEmail').value.trim();
      const passEl = document.getElementById('authPassword');
      const password = passEl ? passEl.value : '';
      errorDiv.style.display='none';
      try {
        if (mode==='login') {
          await signIn(email, password);
          navigate(params?.next || '/');
        } else if (mode==='signup') {
          await signUp(email, password);
          alert('Đăng ký thành công! Vui lòng đăng nhập.');
          mode='login';
          rerender();
        } else {
          await sendPasswordReset(email, location.origin);
          alert('Đã gửi email đặt lại mật khẩu.');
          mode='login';
          rerender();
        }
      } catch(err){
        errorDiv.textContent = err.message || 'Thao tác thất bại';
        errorDiv.style.display='block';
      }
    });

    card.append(form);
    wrap.append(card);
    mount(document.getElementById('app'), wrap);
  }

  function rerender(){ draw(); }
  rerender();
}
