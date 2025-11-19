// public/js/admin.js
// Minimal admin interface to Create / Read / Update / Delete menu items

const apiBase = '/api/menu';

async function fetchItems() {
  const res = await fetch(apiBase);
  if (!res.ok) throw new Error('Failed to load menu');
  return await res.json();
}

function el(tag, attrs = {}, children = '') {
  const node = document.createElement(tag);
  Object.entries(attrs).forEach(([k, v]) => node.setAttribute(k, v));
  if (typeof children === 'string') node.innerHTML = children;
  else if (Array.isArray(children)) children.forEach(c => node.appendChild(c));
  return node;
}

async function renderList() {
  const list = document.getElementById('itemsList');
  list.innerHTML = '<p>Loading...</p>';
  try {
    const items = await fetchItems();
    if (!items || items.length === 0) {
      list.innerHTML = '<p>No items found.</p>';
      return;
    }
    list.innerHTML = '';
    items.forEach(item => {
      const wrap = el('div', { class: 'admin-item' });
      const img = el('img', { src: item.image || '/images/placeholder.png', alt: item.name });
      img.style.width = '80px';
      const info = el('div', {}, [
        el('div', {}, `<strong>${escapeHtml(item.name)}</strong>`),
        el('div', {}, `${escapeHtml(item.price || '')}`)
      ]);
      const actions = el('div', {}, '');
      const editBtn = el('button', { class: 'small-btn btn-edit' }, 'Edit');
      const delBtn = el('button', { class: 'small-btn btn-delete' }, 'Delete');

      editBtn.addEventListener('click', () => openEditModal(item));
      delBtn.addEventListener('click', () => deleteItem(item._id));

      actions.appendChild(editBtn);
      actions.appendChild(delBtn);

      wrap.appendChild(img);
      wrap.appendChild(info);
      wrap.appendChild(actions);
      list.appendChild(wrap);
    });
  } catch (err) {
    list.innerHTML = `<p style="color:red">Error: ${escapeHtml(err.message)}</p>`;
  }
}

function escapeHtml(s = '') {
  return String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
}

/* CREATE */
document.getElementById('createBtn').addEventListener('click', async () => {
  const name = document.getElementById('a_name').value.trim();
  if (!name) return alert('Name required');
  const payload = {
    name,
    image: document.getElementById('a_image').value.trim(),
    price: document.getElementById('a_price').value.trim(),
    link: document.getElementById('a_link').value.trim(),
    description: document.getElementById('a_desc').value.trim()
  };
  try {
    const res = await fetch(apiBase, {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error('Create failed');
    await renderList();
    // clear form
    document.getElementById('a_name').value = '';
    document.getElementById('a_image').value = '';
    document.getElementById('a_price').value = '';
    document.getElementById('a_link').value = '';
    document.getElementById('a_desc').value = '';
    alert('Item created');
  } catch (err) {
    alert('Error: ' + err.message);
  }
});

/* DELETE */
async function deleteItem(id) {
  if (!confirm('Delete this item?')) return;
  try {
    const res = await fetch(`${apiBase}/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Delete failed');
    await renderList();
  } catch (err) {
    alert('Error: ' + err.message);
  }
}

/* EDIT modal */
function openEditModal(item) {
  document.getElementById('e_id').value = item._id;
  document.getElementById('e_name').value = item.name || '';
  document.getElementById('e_image').value = item.image || '';
  document.getElementById('e_price').value = item.price || '';
  document.getElementById('e_link').value = item.link || '';
  document.getElementById('e_desc').value = item.description || '';
  document.getElementById('editModal').classList.add('show');
}

document.getElementById('closeModal').addEventListener('click', () => {
  document.getElementById('editModal').classList.remove('show');
});

document.getElementById('saveEdit').addEventListener('click', async () => {
  const id = document.getElementById('e_id').value;
  if (!id) return alert('Missing item id');
  const payload = {
    name: document.getElementById('e_name').value.trim(),
    image: document.getElementById('e_image').value.trim(),
    price: document.getElementById('e_price').value.trim(),
    link: document.getElementById('e_link').value.trim(),
    description: document.getElementById('e_desc').value.trim()
  };

  try {
    console.log('Client -> PUT /api/menu/' + id, payload);
    const res = await fetch(`/api/menu/${encodeURIComponent(id)}`, {
      method: 'PUT',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify(payload)
    });

    const resText = await res.text(); // read raw body for better debug
    let resJson;
    try { resJson = JSON.parse(resText); } catch(e) { resJson = resText; }

    console.log('Server response status:', res.status, 'body:', resJson);

    if (!res.ok) {
      const message = (resJson && resJson.error) ? resJson.error : `HTTP ${res.status}`;
      alert('Error: Update failed — ' + message);
      return;
    }

    alert('Saved successfully');
    document.getElementById('editModal').classList.remove('show');
    await renderList();
  } catch (err) {
    console.error('Client PUT error:', err);
    alert('Error: Update failed — ' + err.message);
  }
});

// ensure admin list loads when the page is ready
document.addEventListener('DOMContentLoaded', () => {
  renderList();
});

