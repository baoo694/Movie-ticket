import { h, mount, cryptoRandomId } from '../lib/utils.js';
import { signIn, signUp, sendPasswordReset, getSession, upsertAppUser, updatePassword, getClient } from '../lib/supabase.js';
import { navigate } from '../lib/router.js';

export async function renderLogin(params){
  let mode = params?.mode || (params?.type === 'recovery' ? 'recovery' : 'login');
  if (mode==='recovery' && params?.hashParams) {
    await storeRecoverySession(params.hashParams);
  }

  const session = await getSession();
  if (session && mode!=='recovery') {
    navigate(params?.next || '/');
    return;
  }

  const recoveryErrorMsg = params?.recoveryError;

  function draw(){
    const wrap = h('div', { class:'auth-wrap' });
    const card = h('div', { class:'auth-card' });
    const form = h('form');
    const title = mode==='login' ? 'Sign In' : mode==='signup' ? 'Create Account' : mode==='recovery' ? 'Set new password' : 'Reset password';
    card.append(h('div', { class:'auth-title' }, [title]));
    if (mode==='login') card.append(h('div', { class:'auth-subtitle' }, ['Enter your credentials to access your account']));
    if (mode==='recovery') card.append(h('div', { class:'auth-subtitle' }, ['Nhập mật khẩu mới cho tài khoản của bạn.']));
    if (mode==='recovery' && recoveryErrorMsg) {
      card.append(h('div', { class:'danger-text', style:'margin:12px 0;' }, [recoveryErrorMsg]));
    }

    if (mode==='signup') {
      form.append(h('label', {}, ['Full name']));
      form.append(h('div', { class:'input-with-icon' }, [
        h('input', { type:'text', id:'authFullName', required: true, placeholder:'Nguyễn Văn A' })
      ]));

      form.append(h('label', {}, ['Phone number']));
      form.append(h('div', { class:'input-with-icon' }, [
        h('input', { type:'tel', id:'authPhone', required: true, placeholder:'0901234567', pattern:'[0-9+\\- ]{6,15}' })
      ]));
    }

    if (mode !== 'recovery') {
      form.append(h('label', {}, ['Email Address']));
      form.append(h('div', { class:'input-with-icon' }, [
        h('input', { type:'email', id:'authEmail', required: true, placeholder:'you@example.com' })
      ]));
    }

    // password (except reset)
    if (mode!=='reset') {
      form.append(h('label', {}, [mode==='recovery' ? 'New password' : 'Password']));
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
      if (mode==='recovery') {
        form.append(h('label', {}, ['Confirm new password']));
        const confirmWrap = h('div', { class:'input-with-icon' }, [
          h('input', { type:'password', id:'authPasswordConfirm', required: true, placeholder:'••••••••' })
        ]);
        form.append(confirmWrap);
      }
    }

    if (mode==='login') {
      const row = h('div', { class:'auth-row', style:'justify-content: flex-end;' }, [
        h('button', { type:'button', class:'text-link', onclick: ()=>{ mode='reset'; rerender(); } }, ['Forgot password?'])
      ]);
      form.append(row);
    }

    const actions = h('div', { class:'auth-actions' });
    const actionLabel = mode==='login'
      ? 'Sign In'
      : mode==='signup'
        ? 'Create account'
        : mode==='recovery'
          ? 'Update password'
          : 'Send reset email';
    actions.append(h('button', { class:'btn primary', type:'submit', style:'width:100%' }, [ actionLabel ]));

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
    } else if (mode==='recovery') {
      const bottom = h('div', { class:'auth-bottom' }, [ h('button', { class:'text-link', type:'button', onclick: ()=>{ mode='login'; rerender(); } }, ['Back to sign in'])]);
      card.append(bottom);
    }

    const errorDiv = h('div', { id:'authError', class:'danger-text', style:'display:none;margin-top:12px;' });

    form.append(actions, errorDiv);

    form.addEventListener('submit', async (e)=>{
      e.preventDefault();
      const emailInput = document.getElementById('authEmail');
      const email = emailInput ? emailInput.value.trim() : '';
      const passEl = document.getElementById('authPassword');
      const password = passEl ? passEl.value : '';
      const confirmInput = document.getElementById('authPasswordConfirm');
      const confirmPassword = confirmInput ? confirmInput.value : '';
      const fullName = mode==='signup' ? document.getElementById('authFullName').value.trim() : '';
      const phone = mode==='signup' ? document.getElementById('authPhone').value.trim() : '';
      errorDiv.style.display='none';
      try {
        if (mode==='login') {
          await signIn(email, password);
          navigate(params?.next || '/');
        } else if (mode==='signup') {
          const { user } = await signUp(email, password);
          const newUserId = user?.id || cryptoRandomId();
          await upsertAppUser({
            id: newUserId,
            email,
            fullName,
            phone,
            role: 'user',
            status: 'active'
          });
          alert('Đăng ký thành công! Vui lòng đăng nhập.');
          mode='login';
          rerender();
        } else if (mode==='reset') {
          await sendPasswordReset(email);
          alert('Đã gửi email đặt lại mật khẩu.');
          mode='login';
          rerender();
        } else if (mode==='recovery') {
          if (password.length < 6) throw new Error('Mật khẩu phải có ít nhất 6 ký tự.');
          if (password !== confirmPassword) throw new Error('Mật khẩu xác nhận không khớp.');
          await updatePassword(password);
          alert('Đã cập nhật mật khẩu. Vui lòng đăng nhập lại.');
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

async function storeRecoverySession(hashParams){
  if (!hashParams) return;
  try {
    const client = getClient();
    if (!client) return;
    if (hashParams.access_token && hashParams.refresh_token) {
      await client.auth.setSession({
        access_token: hashParams.access_token,
        refresh_token: hashParams.refresh_token
      });
    }
    const current = new URL(window.location.href);
    current.hash = '#/login?mode=recovery';
    window.history.replaceState(window.history.state, '', current);
  } catch (err) {
    console.warn('Failed to store recovery session', err);
  }
}
