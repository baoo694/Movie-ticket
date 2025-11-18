import { h, mount, clear, qs, splitCsv, cryptoRandomId, generateRandomPassword, money } from '../lib/utils.js';
import { store, loadData } from '../lib/store.js';
import { navigate } from '../lib/router.js';
import {
  getSession, signOut, isAdmin, sendPasswordReset, signUp,
  upsertMovie, deleteMovie, upsertCinema, deleteCinema,
  upsertRoom, deleteRoom, upsertShowtime, deleteShowtime,
  savePricing, upsertCoupon, deleteCoupon,
  upsertAppUser
} from '../lib/supabase.js';

export async function renderAdmin(params){
  const session = await getSession();
  if (!session) {
    const next = encodeURIComponent('/admin');
    navigate(`/login?next=${next}`);
    return;
  }
  if (!isAdmin(session.user)) {
    alert('Bạn không có quyền truy cập trang quản trị.');
    navigate('/');
    return;
  }

  const wrap = h('div', { class:'page' });
  wrap.append(h('section', { class:'section' }, [
    h('h3', {}, ['Quản trị']),
    h('div', { class:'controls' }, [
      h('span', { class:'meta' }, [`Đang đăng nhập: ${session.user.email}`]),
      h('button', { class:'btn', onclick: async ()=>{ await signOut(); navigate('/login'); } }, ['Đăng xuất'])
    ])
  ]));

  // Movies
  wrap.append(entitySection('Phim', store.movies, [
    field('Tiêu đề','title'),
    field('Thể loại (phân tách bởi dấu ,)','genres'),
    fileField('Poster ảnh','poster'),
    selectField('Trạng thái','status', [{v:'now',t:'Đang chiếu'},{v:'soon',t:'Sắp chiếu'}])
  ], async (vals)=>{
    const m = {
      id: cryptoRandomId(),
      title: vals.title,
      genres: splitCsv(vals.genres),
      status: vals.status||'now',
      duration_min: 100,
      poster: vals.poster || ''
    };
    await upsertMovie(m).catch(e => console.warn('Upsert movie failed', e));
    await loadData();
    renderAdmin();
  }, async (id)=>{
    await deleteMovie(id).catch(e => console.warn('Delete movie failed', e));
    await loadData();
    renderAdmin();
  }, async (existing, vals)=>{
    const m = {
      id: existing.id,
      title: vals.title || existing.title,
      genres: vals.genres ? splitCsv(vals.genres) : (existing.genres || []),
      status: vals.status || existing.status || 'now',
      duration_min: existing.duration_min || 100,
      poster: vals.poster ? vals.poster : (existing.poster || '')
    };
    await upsertMovie(m).catch(e => console.warn('Update movie failed', e));
    await loadData();
    renderAdmin();
  }));

  // Cinemas
  wrap.append(entitySection('Rạp', store.cinemas, [
    field('Tên','name'),
    field('Địa chỉ','address')
  ], async (vals)=>{
    const c = { id: cryptoRandomId(), name: vals.name, address: vals.address };
    await upsertCinema(c).catch(e => console.warn('Upsert cinema failed', e));
    await loadData();
    renderAdmin();
  }, async (id)=>{
    await deleteCinema(id).catch(e => console.warn('Delete cinema failed', e));
    await loadData();
    renderAdmin();
  }, async (existing, vals)=>{
    const c = { id: existing.id, name: vals.name || existing.name, address: vals.address || existing.address };
    await upsertCinema(c).catch(e => console.warn('Update cinema failed', e));
    await loadData();
    renderAdmin();
  }));

  // Rooms
  wrap.append(entitySection('Phòng', store.rooms, [
    selectField('Rạp','cinemaId', store.cinemas.map(c=>({v:c.id,t:c.name}))),
    field('Tên phòng','name'),
    field('Số hàng','rows'),
    field('Số cột','cols'),
    field('Hàng VIP (CSV)','vipRows'),
    field('Hàng ghế đôi (CSV)','coupleRows'),
    field('Vị trí xe lăn (CSV, VD: A1,A2)','wheelSpots')
  ], async (vals)=>{
    const r = {
      id: cryptoRandomId(),
      cinemaId: vals.cinemaId,
      name: vals.name,
      rows: Number(vals.rows)||8,
      cols: Number(vals.cols)||12,
      vipRows: splitCsv(vals.vipRows),
      coupleRows: splitCsv(vals.coupleRows),
      wheelSpots: splitCsv(vals.wheelSpots)
    };
    await upsertRoom(r).catch(e => console.warn('Upsert room failed', e));
    await loadData();
    renderAdmin();
  }, async (id)=>{
    await deleteRoom(id).catch(e => console.warn('Delete room failed', e));
    await loadData();
    renderAdmin();
  }, async (existing, vals)=>{
    const r = {
      id: existing.id,
      cinemaId: vals.cinemaId || existing.cinemaId,
      name: vals.name || existing.name,
      rows: vals.rows ? Number(vals.rows) : existing.rows,
      cols: vals.cols ? Number(vals.cols) : existing.cols,
      vipRows: vals.vipRows ? splitCsv(vals.vipRows) : (existing.vipRows || []),
      coupleRows: vals.coupleRows ? splitCsv(vals.coupleRows) : (existing.coupleRows || []),
      wheelSpots: vals.wheelSpots ? splitCsv(vals.wheelSpots) : (existing.wheelSpots || [])
    };
    await upsertRoom(r).catch(e => console.warn('Update room failed', e));
    await loadData();
    renderAdmin();
  }));

  // Showtimes
  wrap.append(entitySection('Suất chiếu', store.showtimes, [
    selectField('Phim','movieId', store.movies.map(m=>({v:m.id,t:m.title}))),
    selectField('Rạp','cinemaId', store.cinemas.map(c=>({v:c.id,t:c.name}))),
    selectField('Phòng','roomId', store.rooms.map(r=>({v:r.id,t:r.name}))),
    field('Ngày (YYYY-MM-DD)','date'),
    field('Giờ (HH:mm)','time')
  ], async (vals)=>{
    const s = {
      id: cryptoRandomId(),
      movieId: vals.movieId,
      cinemaId: vals.cinemaId,
      roomId: vals.roomId,
      date: vals.date,
      time: vals.time
    };
    await upsertShowtime(s).catch(e => console.warn('Upsert showtime failed', e));
    await loadData();
    renderAdmin();
  }, async (id)=>{
    await deleteShowtime(id).catch(e => console.warn('Delete showtime failed', e));
    await loadData();
    renderAdmin();
  }, async (existing, vals)=>{
    const s = {
      id: existing.id,
      movieId: vals.movieId || existing.movieId,
      cinemaId: vals.cinemaId || existing.cinemaId,
      roomId: vals.roomId || existing.roomId,
      date: vals.date || existing.date,
      time: vals.time || existing.time
    };
    await upsertShowtime(s).catch(e => console.warn('Update showtime failed', e));
    await loadData();
    renderAdmin();
  }));

  // Pricing
  wrap.append((()=>{
    const p = store.pricing;
    const sec = h('section', { class:'section' }, [
      h('h3', {}, ['Giá ghế']),
      formGrid([
        inputRow('Thường', 'base', p.base),
        inputRow('VIP','vip', p.vip),
        inputRow('Đôi','couple', p.couple),
        inputRow('Xe lăn','wheel', p.wheel)
      ]),
      h('div', { class:'controls' }, [
        h('button', { class:'btn primary', onclick: async ()=>{
          const pricing = {
            base: Number(qs('[name=base]').value)||p.base,
            vip: Number(qs('[name=vip]').value)||p.vip,
            couple: Number(qs('[name=couple]').value)||p.couple,
            wheel: Number(qs('[name=wheel]').value)||p.wheel,
          };
          await savePricing(pricing).catch(e => console.warn('Save pricing failed', e));
          await loadData();
          alert('Đã lưu giá ghế');
          renderAdmin();
        } }, ['Lưu'])
      ])
    ]);
    return sec;
  })());

  // Coupons
  wrap.append(entitySection('Mã giảm giá', store.coupons, [
    field('Mã','code'),
    selectField('Loại','type',[{v:'percent',t:'% phần trăm'},{v:'amount',t:'Số tiền'}]),
    field('Giá trị','value'),
    field('Tối thiểu','minTotal')
  ], async (vals)=>{
    const c = {
      code: (vals.code||'').toUpperCase(),
      type: vals.type,
      value: Number(vals.value)||0,
      minTotal: Number(vals.minTotal)||0,
      expiresAt: null
    };
    await upsertCoupon(c).catch(e => console.warn('Upsert coupon failed', e));
    await loadData();
    renderAdmin();
  }, async (code)=>{
    await deleteCoupon(code).catch(e => console.warn('Delete coupon failed', e));
    await loadData();
    renderAdmin();
  }, async (existing, vals)=>{
    const c = {
      code: (vals.code || existing.code).toUpperCase(),
      type: vals.type || existing.type,
      value: vals.value ? Number(vals.value) : existing.value,
      minTotal: vals.minTotal ? Number(vals.minTotal) : existing.minTotal,
      expiresAt: existing.expiresAt || null
    };
    await upsertCoupon(c).catch(e => console.warn('Update coupon failed', e));
    await loadData();
    renderAdmin();
  }));

  wrap.append(userManagementSection());

  mount(document.getElementById('app'), wrap);

  function inputRow(label, name, val){
    const row = h('div', { class:'row' });
    row.append(h('div', { class:'col-6' }, [
      h('label', {}, [label]),
      h('input', { name, type:'number', value: val })
    ]));
    return row;
  }

  function formGrid(children){
    const f = h('form');
    children.forEach(ch=> f.append(ch));
    return f;
  }
}

function field(label, name){ return { kind:'text', label, name }; }
function selectField(label, name, options){ return { kind:'select', label, name, options }; }
function fileField(label, name){ return { kind:'file', label, name }; }

function userManagementSection(){
  const sec = h('section', { class:'section' });
  sec.append(h('h3', {}, ['Người dùng']));

  const form = h('form', { class:'page' });
  const grid = h('div', { class:'row' });

  const inputs = {
    email: createInput('Email', 'email', 'email'),
    fullName: createInput('Họ tên', 'fullName'),
    phone: createInput('Số điện thoại', 'phone'),
    password: null, // Sẽ tạo sau với button generate
    role: createSelect('Vai trò', 'role', [
      { value:'user', label:'Khách hàng' },
      { value:'admin', label:'Quản trị' }
    ]),
    status: createSelect('Trạng thái', 'status', [
      { value:'active', label:'Đang hoạt động' },
      { value:'inactive', label:'Ngưng hoạt động' }
    ]),
    notes: createTextarea('Ghi chú', 'notes')
  };
  
  // Tạo password field với button generate
  (() => {
    const col = h('div', { class:'col-4' });
    col.append(h('label', {}, ['Mật khẩu (bắt buộc)']));
    const pwdWrap = h('div', { style:'display:flex;gap:8px;align-items:flex-end;' });
    const pwdInput = h('input', { type:'password', id:'userPassword', required: true, placeholder:'Nhập hoặc tự động tạo' });
    const genBtn = h('button', { 
      type:'button', 
      class:'btn', 
      style:'white-space:nowrap;',
      onclick: ()=>{
        pwdInput.value = generateRandomPassword(12);
        pwdInput.type = 'text';
        setTimeout(()=>{ pwdInput.type = 'password'; }, 2000);
      }
    }, ['Tự tạo']);
    pwdWrap.append(pwdInput, genBtn);
    col.append(pwdWrap);
    grid.append(col);
    inputs.password = pwdInput;
    inputs.password._col = col;
  })();

  function createInput(label, name, type='text'){
    const col = h('div', { class:'col-4' });
    col.append(h('label', {}, [label]));
    const input = h('input', { type, name });
    col.append(input);
    grid.append(col);
    return input;
  }

  function createSelect(label, name, options){
    const col = h('div', { class:'col-4' });
    col.append(h('label', {}, [label]));
    const select = h('select', { name });
    options.forEach(opt => select.append(h('option', { value: opt.value }, [opt.label])));
    col.append(select);
    grid.append(col);
    return select;
  }

  function createTextarea(label, name){
    const col = h('div', { class:'col-12' });
    col.append(h('label', {}, [label]));
    const textarea = h('textarea', { name, rows:3 });
    col.append(textarea);
    grid.append(col);
    return textarea;
  }

  form.append(grid);

  let editingUser = null;
  let lastRenderedUsers = [];

  function setCreateMode(isCreate){
    const lock = !isCreate;
    inputs.email.readOnly = lock;
    inputs.email.classList.toggle('is-disabled', lock);
    inputs.role.disabled = lock;
    inputs.status.disabled = lock;
    inputs.notes.readOnly = lock;
    if (inputs.password && inputs.password._col) {
      inputs.password._col.style.display = isCreate ? '' : 'none';
      if (isCreate) inputs.password.value = '';
    }
    submitBtn.textContent = isCreate ? 'Thêm mới' : 'Cập nhật';
    cancelBtn.style.display = isCreate ? 'none' : 'inline-flex';
  }
  const actionBar = h('div', { class:'controls' });
  const submitBtn = h('button', { class:'btn primary', type:'submit' }, ['Thêm mới']);
  const cancelBtn = h('button', { class:'btn', type:'button', style:'display:none;' }, ['Hủy']);
  actionBar.append(submitBtn, cancelBtn);
  form.append(actionBar);
  setCreateMode(true);

  cancelBtn.addEventListener('click', ()=>{
    editingUser = null;
    form.reset();
    inputs.email.value = '';
    inputs.fullName.value = '';
    inputs.phone.value = '';
    inputs.role.value = 'user';
    inputs.status.value = 'active';
    inputs.notes.value = '';
    setCreateMode(true);
  });

  form.addEventListener('submit', async (evt)=>{
    evt.preventDefault();
    let email = inputs.email.value.trim();
    if (!email) {
      alert('Vui lòng nhập email');
      return;
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      alert('Email không hợp lệ. Vui lòng nhập đúng định dạng email.');
      return;
    }
    
    email = email.toLowerCase(); // Normalize to lowercase
    
    // Nếu là user mới, bắt buộc tạo Auth user
    if (!editingUser) {
      let password = inputs.password.value.trim();
      // Tự động generate password nếu để trống
      if (!password) {
        password = generateRandomPassword(12);
        inputs.password.value = password;
      }
      
      // Validate password length
      if (password.length < 6) {
        alert('Mật khẩu phải có ít nhất 6 ký tự.');
        return;
      }
      
      let userId = cryptoRandomId();
      let createdPassword = password;
      let authUserCreated = false;
      
      try {
        const data = await signUp(email, password);
        if (data && data.user && data.user.id) {
          userId = data.user.id; // Dùng ID từ Auth
          authUserCreated = true;
        }
      } catch (e) {
        console.warn('Create auth user failed', e);
        const errorMsg = e.message || e.error?.message || String(e);
        const lowerMsg = errorMsg.toLowerCase();
        if (
          lowerMsg.includes('already registered') ||
          lowerMsg.includes('already exists') ||
          lowerMsg.includes('user already registered') ||
          lowerMsg.includes('invalid')
        ) {
          alert(
            `⚠️ Không thể tạo tài khoản Auth cho email: ${email}.\n\n` +
            `Lỗi: ${errorMsg}\n` +
            `User sẽ cần tự đăng ký hoặc dùng "Đặt lại mật khẩu" để kích hoạt tài khoản.`
          );
        } else {
          alert(`❌ Không thể tạo tài khoản Auth.\n\nEmail: ${email}\nLỗi: ${errorMsg}`);
          return;
        }
      }
      
      const payload = {
        id: userId,
        email,
        fullName: inputs.fullName.value.trim(),
        phone: inputs.phone.value.trim(),
        role: inputs.role.value || 'user',
        status: inputs.status.value || 'active',
        notes: inputs.notes.value.trim()
      };
      
      try {
        await upsertAppUser(payload);
      } catch (e) {
        console.warn('Upsert user failed', e);
        alert('Không thể lưu người dùng. Vui lòng thử lại.');
        return;
      }
      
      await loadData();
      // Hiển thị thông báo cho admin
      if (authUserCreated) {
        alert(`✅ Đã thêm người dùng và tạo tài khoản Auth thành công!\n\nEmail: ${email}\nMật khẩu: ${createdPassword}\n\n⚠️ Vui lòng lưu lại mật khẩu này để cung cấp cho người dùng.`);
      } else {
        alert(`✅ Đã thêm người dùng vào hệ thống.\n\nEmail: ${email}\n\n⚠️ Lưu ý: Email này có thể đã tồn tại trong hệ thống Auth.\n\n💡 Giải pháp:\n- Nếu user đã có tài khoản: Họ có thể đăng nhập bình thường\n- Nếu chưa có: Sử dụng nút "Đặt lại MK" để gửi email reset password cho user`);
      }
      renderAdmin();
    } else {
      // Chỉnh sửa user hiện có - chỉ cập nhật họ tên & số điện thoại
      const payload = {
        id: editingUser.id,
        email: editingUser.email,
        fullName: inputs.fullName.value.trim() || editingUser.fullName || '',
        phone: inputs.phone.value.trim() || editingUser.phone || '',
        role: editingUser.role,
        status: editingUser.status,
        notes: editingUser.notes
      };
      try {
        await upsertAppUser(payload);
        await loadData();
        alert('Đã cập nhật thông tin họ tên và số điện thoại');
        editingUser = null;
        setCreateMode(true);
        renderAdmin();
      } catch (e) {
        console.warn('Upsert user failed', e);
        alert('Không thể lưu người dùng. Vui lòng thử lại.');
      }
    }
  });

  const searchBox = h('input', { class:'control', placeholder:'Tìm theo email, tên hoặc số điện thoại' });
  const exportBtn = h('button', { class:'btn', type:'button', onclick: exportUsers }, ['Xuất Excel']);
  const searchWrap = h('div', { class:'controls user-tools' }, [searchBox, exportBtn]);

  const table = h('table', { class:'table' });
  const thead = h('thead');
  const headRow = h('tr');
  ['EMAIL','HỌ TÊN','SỐ ĐIỆN THOẠI','VAI TRÒ','TRẠNG THÁI','GHI CHÚ','TẠO LÚC','HÀNH ĐỘNG'].forEach(txt=>{
    headRow.append(h('th', {}, [txt]));
  });
  thead.append(headRow);
  const tbody = h('tbody');
  table.append(thead, tbody);

  function fillForm(user){
    editingUser = user;
    inputs.email.value = user.email || '';
    inputs.fullName.value = user.fullName || '';
    inputs.phone.value = user.phone || '';
    inputs.role.value = user.role || 'user';
    inputs.status.value = user.status || 'active';
    inputs.notes.value = user.notes || '';
    setCreateMode(false);
  }

  async function handleReset(email){
    if (!email) {
      alert('Người dùng không có email hợp lệ.');
      return;
    }
    try {
      await sendPasswordReset(email);
      alert(`Đã gửi email đặt lại mật khẩu tới ${email}`);
    } catch (err) {
      console.warn('Send reset failed', err);
      alert('Không thể gửi email đặt lại mật khẩu.');
    }
  }

  function formatDate(val){
    if (!val) return '';
    try {
      const d = new Date(val);
      if (Number.isNaN(d.getTime())) return '';
      return d.toLocaleString('vi-VN');
    } catch {
      return '';
    }
  }

  function renderRows(){
    clear(tbody);
    const keyword = (searchBox.value || '').trim().toLowerCase();
    const users = (store.users || []).slice().sort((a,b)=>(b.createdAt||'').localeCompare(a.createdAt||''));
    const filtered = keyword ? users.filter(u=>{
      const hay = `${u.email||''} ${u.fullName||''} ${u.phone||''}`.toLowerCase();
      return hay.includes(keyword);
    }) : users;
    lastRenderedUsers = filtered;
    if (!filtered.length){
      const empty = h('tr');
      empty.append(h('td', { colspan:8, style:'text-align:center;' }, ['Không có người dùng.']));
      tbody.append(empty);
      return;
    }
    filtered.forEach(u=>{
      const tr = h('tr');
      tr.append(
        h('td', {}, [u.email || '']),
        h('td', {}, [u.fullName || '']),
        h('td', {}, [u.phone || '']),
        h('td', {}, [u.role || 'user']),
        h('td', {}, [u.status || 'active']),
        h('td', {}, [u.notes || '']),
        h('td', {}, [formatDate(u.createdAt)]),
        h('td', {}, [
          h('button', { class:'btn', style:'margin-right:8px', onclick: ()=> fillForm(u) }, ['Sửa']),
          h('button', { class:'btn', style:'margin-right:8px', onclick: ()=> handleReset(u.email) }, ['Đặt lại MK']),
          h('button', { class:'btn', onclick: ()=> showHistory(u) }, ['Xem vé'])
        ])
      );
      tbody.append(tr);
    });
  }

  function exportUsers(){
    const users = lastRenderedUsers.length ? lastRenderedUsers : (store.users || []);
    if (!users.length) {
      alert('Không có dữ liệu người dùng để xuất.');
      return;
    }
    const headers = ['Email','Họ tên','Số điện thoại','Vai trò','Trạng thái','Ghi chú','Tạo lúc'];
    const rows = users.map(u=> [
      u.email || '',
      u.fullName || '',
      u.phone || '',
      u.role || 'user',
      u.status || 'active',
      u.notes || '',
      formatDate(u.createdAt)
    ]);
    const csvLines = [
      headers.join(','),
      ...rows.map(r=> r.map(value => `"${String(value??'').replace(/"/g,'""')}"`).join(','))
    ];
    const blob = new Blob([csvLines.join('\n')], { type:'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `users-${new Date().toISOString().slice(0,10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  searchBox.addEventListener('input', renderRows);

  function showHistory(user){
    const email = (user.email || '').toLowerCase();
    const root = document.getElementById('modal-root');
    if (!root) {
      alert('Không tìm thấy modal root.');
      return;
    }
    const modal = h('div', { class:'modal' });
    const close = ()=>{
      root.classList.remove('active');
      root.setAttribute('aria-hidden','true');
      clear(root);
    };
    const header = h('header', {}, [
      h('div', {}, [`Lịch sử vé - ${user.email || ''}`]),
      h('button', { class:'btn', onclick: close }, ['Đóng'])
    ]);
    const content = h('div', { class:'content', style:'gap:16px;' });
    if (!email) {
      content.append(h('div', { class:'meta' }, ['Không tìm thấy email người dùng để tra cứu.']));
    } else {
      const tickets = (store.tickets || []).filter(t=> ((t.user_email || t.userEmail || '').toLowerCase() === email));
      if (!tickets.length) {
        content.append(h('div', { class:'meta' }, ['Chưa có vé nào được ghi nhận cho người dùng này.']));
      } else {
        const table = h('table', { class:'table compact' });
        const head = h('thead');
        head.append(h('tr', {}, [
          h('th', {}, ['Mã vé']),
          h('th', {}, ['Phim / Rạp / Phòng']),
          h('th', {}, ['Suất']),
          h('th', {}, ['Ghế']),
          h('th', {}, ['Thanh toán'])
        ]));
        table.append(head);
        const body = h('tbody');
        for (const t of tickets){
          const stId = t.showtime_id || t.showtimeId;
          const st = store.showtimes.find(s=>s.id===stId);
          const mv = store.movies.find(m=>m.id===(st?.movie_id || st?.movieId));
          const cn = store.cinemas.find(c=>c.id===(st?.cinema_id || st?.cinemaId));
          const rm = store.rooms.find(r=>r.id===(st?.room_id || st?.roomId));
          body.append(h('tr', {}, [
            h('td', {}, [t.code]),
            h('td', {}, [`${mv?.title || ''} / ${cn?.name || ''} / ${rm?.name || ''}`]),
            h('td', {}, [`${st?.date || ''} ${st?.time || ''}`]),
            h('td', {}, [(t.seats || []).join(', ')]),
            h('td', {}, [money(t.total_paid || t.totalPaid || 0)])
          ]));
        }
        table.append(body);
        content.append(table);
      }
    }
    modal.append(header, content);
    clear(root);
    root.append(modal);
    root.classList.add('active');
    root.setAttribute('aria-hidden','false');
  }

  cancelBtn.click();
  renderRows();

  sec.append(form, h('hr'), searchWrap, table);
  return sec;
}

function entitySection(title, items, fields, onCreate, onDelete, onUpdate){
  const sec = h('section', { class:'section' }, [ h('h3', {}, [title]) ]);
  const form = h('form', { class:'page' });
  const rows = h('div', { class:'row' });
  const inputs = {};
  let editItem = null; // current item being edited
  for (const f of fields){
    const col = h('div', { class:'col-4' });
    col.append(h('label', {}, [f.label]));
    if (f.kind==='select') {
      const sel = h('select', { name:f.name });
      for (const o of f.options) sel.append(h('option', { value:o.v }, [o.t]));
      inputs[f.name] = sel;
      col.append(sel);
    } else if (f.kind==='file') {
      const fileInput = h('input', { 
        type: 'file', 
        name: f.name,
        accept: 'image/*',
        style: 'padding:6px;'
      });
      const preview = h('div', { 
        style: 'margin-top:8px;display:none;'
      });
      const previewImg = h('img', { 
        style: 'max-width:120px;max-height:160px;object-fit:contain;border-radius:6px;border:1px solid var(--border);'
      });
      preview.append(previewImg);
      
      fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
          if (file.size > 5 * 1024 * 1024) { // 5MB limit
            alert('Ảnh quá lớn! Vui lòng chọn ảnh nhỏ hơn 5MB.');
            e.target.value = '';
            preview.style.display = 'none';
            inputs[f.name]._dataUrl = null;
            return;
          }
          const reader = new FileReader();
          reader.onload = (event) => {
            previewImg.src = event.target.result;
            preview.style.display = 'block';
            inputs[f.name]._dataUrl = event.target.result;
          };
          reader.readAsDataURL(file);
        } else {
          preview.style.display = 'none';
          inputs[f.name]._dataUrl = null;
        }
      });
      
      inputs[f.name] = fileInput;
      inputs[f.name]._preview = preview;
      col.append(fileInput, preview);
    } else {
      const inp = h('input', { name: f.name });
      inputs[f.name] = inp;
      col.append(inp);
    }
    rows.append(col);
  }
  const actions = h('div', { class:'controls' }, [
    h('button', { class:'btn primary', onclick: async (e)=>{
      e.preventDefault();
      const vals = {};
      for (const [k,inp] of Object.entries(inputs)) {
        // Handle file inputs - use data URL if available
        if (inp.type === 'file' && inp._dataUrl) {
          vals[k] = inp._dataUrl;
        } else {
          vals[k] = inp.value;
        }
      }
      if (editItem && onUpdate) {
        await onUpdate(editItem, vals);
      } else {
        await onCreate(vals);
      }
      // Reset form
      form.reset();
      // Clear previews
      for (const [k,inp] of Object.entries(inputs)) {
        if (inp.type === 'file' && inp._preview) {
          inp._preview.style.display = 'none';
          inp._dataUrl = null;
        }
      }
      editItem = null;
      primaryBtn.textContent = 'Thêm';
      cancelBtn.style.display = 'none';
    } }, ['Thêm'])
  ]);
  const primaryBtn = actions.firstChild;
  const cancelBtn = h('button', { class:'btn', style:'display:none', onclick:(e)=>{ e.preventDefault(); form.reset(); editItem=null; primaryBtn.textContent='Thêm'; cancelBtn.style.display='none'; for (const [k,inp] of Object.entries(inputs)) { if (inp.type==='file' && inp._preview){ inp._preview.style.display='none'; inp._dataUrl=null; } } } }, ['Hủy']);
  actions.append(cancelBtn);
  form.append(rows, actions);

  const table = h('table');
  const thead = h('thead');
  const headRow = h('tr');
  for (const f of fields) headRow.append(h('th', {}, [f.name]));
  headRow.append(h('th', {}, ['']));
  thead.append(headRow);
  table.append(thead);
  const tbody = h('tbody');
  for (const it of items){
    const tr = h('tr');
    for (const f of fields){
      let v = it[f.name];
      // Try camelCase version if snake_case not found
      if (v === undefined) {
        const camelName = f.name.replace(/_([a-z])/g, (_, l) => l.toUpperCase());
        v = it[camelName];
      }
      // If this field is a select, display its label text instead of raw value
      if (f.kind === 'select' && Array.isArray(f.options)) {
        const match = f.options.find(o => o && o.v === v);
        if (match && match.t !== undefined) {
          v = match.t;
        }
      }
      if (f.name==='poster' && typeof v === 'string' && v) {
        tr.append(h('td', {}, [
          h('img', { src:v, alt:'poster', style:'width:56px;height:80px;object-fit:cover;border-radius:6px;border:1px solid var(--border);' })
        ]));
      } else {
        tr.append(h('td', {}, [ Array.isArray(v)? v.join(', '): String(v??'') ]));
      }
    }
    // Get ID - try both camelCase and snake_case
    const idVal = it.id ?? it.code ?? it.movie_id ?? it.movieId ?? it.cinema_id ?? it.cinemaId ?? it.room_id ?? it.roomId ?? it.showtime_id ?? it.showtimeId;
    tr.append(h('td', {}, [
      h('button', { class:'btn', style:'margin-right:8px', onclick:(e)=>{
        e.preventDefault();
        editItem = it;
        // Fill inputs with existing values
        for (const f of fields){
          const key = f.name;
          let v = it[key];
          if (v === undefined) {
            const camelName = key.replace(/_([a-z])/g, (_, l) => l.toUpperCase());
            v = it[camelName];
          }
          const inp = inputs[key];
          if (!inp) continue;
          if (f.kind==='file') {
            // preview existing image if available
            if (v) {
              if (inp._preview && inp._preview.firstChild) {
                inp._preview.firstChild.src = v;
                inp._preview.style.display = 'block';
              }
            }
          } else if (Array.isArray(v)) {
            inp.value = v.join(', ');
          } else {
            inp.value = v ?? '';
          }
        }
        primaryBtn.textContent = 'Lưu';
        cancelBtn.style.display = 'inline-block';
        window.scrollTo({ top: sec.offsetTop, behavior: 'smooth' });
      } }, ['Sửa']),
      h('button', { class:'btn danger', onclick: async (e)=>{
        e.preventDefault();
        if (!idVal) {
          console.error('No ID found for item:', it);
          alert('Không tìm thấy ID để xóa!');
          return;
        }
        if (!confirm('Bạn có chắc chắn muốn xóa?')) return;
        try {
          console.log('Deleting with ID:', idVal);
          await onDelete(idVal);
          console.log('Delete successful');
        } catch(err) {
          console.error('Delete error:', err);
          alert('Lỗi khi xóa: ' + (err.message || err));
        }
      } }, ['Xoá'])
    ]));
    tbody.append(tr);
  }
  table.append(tbody);

  sec.append(form, table);
  return sec;
}

