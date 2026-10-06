import {products, categories, brands, byId, money, cleanCart, count, total, orderText, waUrl, PICKUP, DELIVERY} from './data.mjs';
import {emptyState, setCategory, resetFilters, filterCatalog, filtersHTML, appliedHTML, sortHTML, activeCount, bindFilters} from '../catalog.mjs';

const KEY = 'teploross-a-vitrina-cart';
const IMG = '../../assets/';
const $ = s => document.querySelector(s);
const esc = s => String(s).replace(/[&<>"']/g, c => `&#${c.charCodeAt(0)};`);
const pr = new Intl.PluralRules('ru');
const plural = (n, forms) => `${n} ${forms[['one', 'few', 'many'].indexOf(pr.select(n))] ?? forms[2]}`;
const catName = id => categories.find(c => c.id === id)?.name ?? '';
const specs = p => p.specs.split(' · ');
const icon = id => `<svg aria-hidden="true"><use href="#${id}"/></svg>`;

let cart = {};
try { cart = cleanCart(JSON.parse(localStorage.getItem(KEY) || '{}')); } catch { cart = {}; }
const filters = emptyState();
const checkout = {step: 1, name: '', method: 'pickup', install: false, comment: ''};

function save() {
  try { localStorage.setItem(KEY, JSON.stringify(cart)); } catch { /* private mode: cart lives in memory */ }
}

/* ---------- static pieces built from data ---------- */
function buildStatic() {
  const n = id => products.filter(p => p.category === id).length;
  $('#mega-list').innerHTML = categories.map(c =>
    `<li><a href="#catalog" data-cat="${c.id}" data-img="${c.image}"><span>${c.name}</span><small>${plural(n(c.id), ['модель', 'модели', 'моделей'])}</small></a></li>`).join('')
    + `<li><a href="#catalog" data-cat="all"><span>Весь каталог</span><small>${plural(products.length, ['товар', 'товара', 'товаров'])}</small></a></li>`;
  $('#menu-list').innerHTML = categories.map(c =>
    `<li><a href="#catalog" data-cat="${c.id}" data-close>${c.name}<small>${n(c.id)}</small></a></li>`).join('');
  $('#footer-cats').innerHTML = categories.map(c => `<li><a href="#catalog" data-cat="${c.id}">${c.name}</a></li>`).join('');

  const notes = {boilers: 'Напольные и настенные, Лемакс', radiators: 'Алюминиевые секционные', pumps: 'Циркуляционные для отопления', water: 'Накопительные', plumbing: 'Смесители'};
  $('#bento').innerHTML = categories.map(c =>
    `<a class="tile tile-${c.id}" href="#catalog" data-cat="${c.id}">
      <span class="tile-text"><span class="tile-title">${c.name}</span><span class="tile-note">${notes[c.id] ?? ''}</span></span>
      <span class="tile-count">${plural(n(c.id), ['модель', 'модели', 'моделей'])}</span>
      <img src="${IMG}${c.image}" alt="" loading="lazy">
    </a>`).join('')
    + `<a class="tile tile-store" href="#visit"><img src="${IMG}store.webp" alt="" loading="lazy"><span class="tile-text"><span class="tile-title">Магазин на 29А мкр, 24</span><span class="tile-note">Самовывоз и консультация на месте</span></span></a>`;

  document.querySelectorAll('[data-price]').forEach(el => { el.textContent = money(byId(el.dataset.price).price); });
}

/* ---------- catalog ---------- */
const chip = (group, value, label, active) =>
  `<button type="button" class="chip" data-${group}="${esc(value)}" aria-pressed="${active}">${esc(label)}</button>`;

function renderFilters() {
  $('#cat-chips').innerHTML = chip('cat', 'all', 'Все товары', filters.cat === 'all')
    + categories.map(c => chip('cat', c.id, c.name, filters.cat === c.id)).join('');
  $('#filters').innerHTML = filtersHTML(products, filters, {catName});
  $('#sort-box').innerHTML = sortHTML(filters, 'sort');
  $('#applied').innerHTML = appliedHTML(filters, money);
  const n = activeCount(filters);
  $('[data-filter-count]').textContent = n ? `· ${n}` : '';
  if (document.activeElement !== $('#q')) $('#q').value = filters.q;
}

function card(p) {
  const [a, b] = specs(p);
  return `<article class="card">
    <div class="card-media"><img src="${IMG}${p.image}" alt="" loading="lazy" width="600" height="600"></div>
    ${p.tag ? `<p class="card-tag">${esc(p.tag)}</p>` : ''}
    <div class="card-body">
      <p class="card-kind">${esc(p.kind)}</p>
      <h3 class="card-title"><button type="button" class="card-link" data-open="${p.id}">${esc(p.name)}</button></h3>
      <ul class="card-specs"><li>${esc(a)}</li><li>${esc(b)}</li></ul>
      <div class="card-foot">
        <p class="price">${money(p.price)}</p>
        <button type="button" class="add" data-add="${p.id}" aria-label="В корзину: ${esc(p.name)}">${cart[p.id] ? `В корзине · ${cart[p.id]}` : 'В корзину'}</button>
      </div>
    </div>
  </article>`;
}

function renderCatalog() {
  renderFilters();
  const list = filterCatalog(products, filters);
  $('#result-count').textContent = `${plural(list.length, ['товар', 'товара', 'товаров'])}`;
  $('#sheet-apply').textContent = `Показать ${plural(list.length, ['товар', 'товара', 'товаров'])}`;
  $('#grid').innerHTML = list.length ? list.map(card).join('') :
    `<div class="empty"><p class="h3">Ничего не нашлось</p><p>Попробуйте другой запрос или сбросьте фильтры. Нужной модели может не быть на сайте — спросите в WhatsApp.</p>
     <div class="hero-cta"><button class="btn btn-ink" type="button" data-fx-reset>Сбросить фильтры</button>
     <a class="link-arrow" href="${waUrl(`Здравствуйте! Ищу: ${filters.q || 'оборудование'}. Есть в наличии?`)}" target="_blank" rel="noopener">Спросить в WhatsApp ${icon('i-arrow')}</a></div></div>`;
}

function goCatalog(cat) {
  setCategory(filters, cat);
  renderCatalog();
  const el = $('#catalog');
  el.scrollIntoView({behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth'});
  el.focus({preventScroll: true});
}

/* filters live inline on desktop, in a bottom sheet on mobile */
const mobile = matchMedia('(max-width: 899px)');
function placeFilters() {
  (mobile.matches ? $('#sheet-body') : $('#filters-home')).append($('#filters'));
  if (!mobile.matches && $('#filter-sheet').open) $('#filter-sheet').close();
}
mobile.addEventListener('change', placeFilters);

/* ---------- product dialog ---------- */
function openProduct(id) {
  const p = byId(id);
  if (!p) return;
  const [a, b] = specs(p);
  $('#product-body').innerHTML = `
    <button class="icon-btn modal-close" type="button" data-close aria-label="Закрыть">${icon('i-close')}</button>
    <div class="pd">
      <div class="pd-media"><img src="${IMG}${p.image}" alt="${esc(p.name)}" width="900" height="900"></div>
      <div class="pd-info">
        <p class="eyebrow">${esc(catName(p.category))} · ${esc(p.brand)}</p>
        <h2 id="product-title" class="h1">${esc(p.name)}</h2>
        <p class="pd-kind">${esc(p.kind)}</p>
        <dl class="pd-specs">
          <div><dt>Бренд</dt><dd>${esc(p.brand)}</dd></div>
          <div><dt>Характеристика</dt><dd>${esc(a)}</dd></div>
          <div><dt>Исполнение</dt><dd>${esc(b)}</dd></div>
        </dl>
        <p class="price price-xl">${money(p.price)}</p>
        <p class="small">Цена для примера. Наличие подтвердит менеджер.</p>
        <div class="pd-buy">
          <button type="button" class="btn btn-red" data-add="${p.id}" data-keep>${cart[p.id] ? `В корзине · ${cart[p.id]} — добавить ещё` : 'В корзину'}</button>
          <a class="btn btn-line" href="${waUrl(`Здравствуйте! Интересует ${p.name}. Есть в наличии?`)}" target="_blank" rel="noopener">Спросить в WhatsApp</a>
        </div>
        <ul class="pd-service">
          <li>Самовывоз: Актау, 29А мкр, 24</li>
          <li>Установка и запуск — по запросу</li>
          <li>Гарантия производителя <span class="tbc">[срок уточнить]</span></li>
        </ul>
      </div>
    </div>`;
  $('#product').showModal();
}

/* ---------- cart drawer: 1 cart → 2 delivery → 3 WhatsApp ---------- */
function steps() {
  const names = ['Корзина', 'Получение', 'WhatsApp'];
  return `<ol class="steps">${names.map((n, i) =>
    `<li${checkout.step === i + 1 ? ' aria-current="step"' : ''}${checkout.step > i + 1 ? ' class="done"' : ''}><span>${i + 1}</span>${n}</li>`).join('')}</ol>`;
}

function cartRows() {
  return products.filter(p => cart[p.id]).map(p => `
    <li class="line">
      <img src="${IMG}${p.image}" alt="" width="96" height="96">
      <div class="line-main">
        <p class="line-name">${esc(p.name)}</p>
        <p class="small">${esc(p.specs)}</p>
        <div class="line-ctrl">
          <div class="qty" role="group" aria-label="Количество: ${esc(p.name)}">
            <button type="button" data-dec="${p.id}" aria-label="Уменьшить" ${cart[p.id] <= 1 ? 'disabled' : ''}>−</button>
            <output aria-live="polite">${cart[p.id]}</output>
            <button type="button" data-inc="${p.id}" aria-label="Увеличить" ${cart[p.id] >= 99 ? 'disabled' : ''}>+</button>
          </div>
          <button type="button" class="text-btn" data-remove="${p.id}">Удалить</button>
        </div>
      </div>
      <p class="price">${money(p.price * cart[p.id])}</p>
    </li>`).join('');
}

function renderCart() {
  const n = count(cart);
  document.querySelectorAll('[data-cart-count]').forEach(el => { el.textContent = n; el.hidden = !n && el.classList.contains('badge'); });
  document.querySelectorAll('[data-cart-total]').forEach(el => { el.textContent = money(total(cart)); });
  document.querySelectorAll('.cart-btn').forEach(el => el.setAttribute('aria-label', n ? `Корзина, ${plural(n, ['товар', 'товара', 'товаров'])}` : 'Корзина пуста'));
  $('.sticky-cart').hidden = !n;
  document.body.classList.toggle('has-sticky', !!n);
  if (!n) checkout.step = 1;

  const head = `<div class="drawer-head"><h2 id="cart-title" class="h3">Корзина${n ? ` <span class="muted">${n}</span>` : ''}</h2>
    <button class="icon-btn" type="button" data-close aria-label="Закрыть корзину">${icon('i-close')}</button></div>`;
  let body;
  if (!n) {
    body = `<div class="drawer-empty"><p class="display-s">Корзина пуста</p>
      <p>Добавьте оборудование из каталога или напишите нам — подберём под ваш дом.</p>
      <button class="btn btn-red" type="button" data-close data-goto="all">Перейти в каталог</button>
      <a class="link-arrow" href="https://wa.me/77772504300" target="_blank" rel="noopener">Консультация в WhatsApp ${icon('i-arrow')}</a></div>`;
  } else if (checkout.step === 1) {
    body = `${steps()}<ul class="lines">${cartRows()}</ul>
      <div class="drawer-foot">
        <div class="sum"><span>Итого</span><span class="price price-l">${money(total(cart))}</span></div>
        <p class="small">Цены для примера. Финальную сумму подтвердит менеджер в WhatsApp.</p>
        <button class="btn btn-red btn-wide" type="button" data-step="2">Оформить заказ</button>
      </div>`;
  } else if (checkout.step === 2) {
    body = `${steps()}<form class="checkout" id="checkout-form">
      <fieldset><legend>Как получить заказ</legend>
        <label class="radio"><input type="radio" name="method" value="pickup" ${checkout.method === 'pickup' ? 'checked' : ''}><span><strong>Самовывоз</strong><small>${PICKUP.replace('Самовывоз — ', '')}</small></span></label>
        <label class="radio"><input type="radio" name="method" value="delivery" ${checkout.method === 'delivery' ? 'checked' : ''}><span><strong>${DELIVERY}</strong><small>Условия и стоимость <span class="tbc">[уточнить]</span></small></span></label>
      </fieldset>
      <label class="check"><input type="checkbox" name="install" ${checkout.install ? 'checked' : ''}><span>Нужна установка</span></label>
      <div class="field"><label for="c-name">Имя <span class="muted">необязательно</span></label><input id="c-name" name="name" autocomplete="name" maxlength="60" value="${esc(checkout.name)}"></div>
      <div class="field"><label for="c-comment">Комментарий <span class="muted">необязательно</span></label><textarea id="c-comment" name="comment" rows="3" maxlength="300" placeholder="Например: площадь дома 120 м², удобное время звонка">${esc(checkout.comment)}</textarea></div>
      <div class="drawer-foot">
        <div class="sum"><span>Итого</span><span class="price price-l">${money(total(cart))}</span></div>
        <div class="row"><button class="btn btn-line" type="button" data-step="1">Назад</button><button class="btn btn-red grow" type="submit">Проверить заказ</button></div>
      </div></form>`;
  } else {
    const text = orderText(cart, checkout);
    body = `${steps()}<div class="review">
      <p>Мы подготовили сообщение. Нажмите кнопку — откроется WhatsApp, останется только отправить.</p>
      <pre class="message" tabindex="0" aria-label="Текст сообщения">${esc(text)}</pre></div>
      <div class="drawer-foot">
        <a class="btn btn-red btn-wide" href="${waUrl(text)}" target="_blank" rel="noopener">Отправить в WhatsApp ${icon('i-arrow')}</a>
        <div class="row"><button class="btn btn-line grow" type="button" data-step="2">Назад</button><button class="text-btn" type="button" data-action="clear">Очистить корзину</button></div>
      </div>`;
  }
  $('#cart-body').innerHTML = head + body;
}

function setQty(id, q) {
  if (q > 0) cart[id] = Math.min(q, 99); else delete cart[id];
  save();
  renderCart();
  renderCatalog();
}

let toastTimer;
function toast(msg) {
  const t = $('#toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 2600);
}

function openCart() { renderCart(); $('#cart').showModal(); }

/* ---------- mega menu ---------- */
const megaBtn = $('#mega-btn'), mega = $('#mega');
function setMega(open) { mega.hidden = !open; megaBtn.setAttribute('aria-expanded', open); }
megaBtn.addEventListener('click', () => setMega(mega.hidden));
$('#header').addEventListener('mouseleave', () => setMega(false));
megaBtn.addEventListener('mouseenter', () => { if (matchMedia('(hover: hover)').matches) setMega(true); });
mega.addEventListener('mouseover', swapMegaImg);
mega.addEventListener('focusin', swapMegaImg);
function swapMegaImg(e) {
  const a = e.target.closest('[data-img]');
  if (!a) return;
  $('#mega-img').src = IMG + a.dataset.img;
  $('#mega-cap').textContent = catName(a.dataset.cat);
}
document.addEventListener('keydown', e => { if (e.key === 'Escape' && !mega.hidden) { setMega(false); megaBtn.focus(); } });
document.addEventListener('focusin', e => { if (!mega.hidden && !$('#header').contains(e.target)) setMega(false); });

/* ---------- events ---------- */
document.addEventListener('click', e => {
  const t = e.target.closest('button, a');
  if (!t) {
    if (e.target.tagName === 'DIALOG') e.target.close(); // backdrop click
    if (!mega.hidden && !$('#header').contains(e.target)) setMega(false);
    return;
  }
  const d = t.dataset;
  if (!mega.hidden && !mega.contains(t) && t !== megaBtn) setMega(false);
  if (d.close !== undefined) t.closest('dialog')?.close();
  if (d.cat && t.matches('.chip')) { setCategory(filters, d.cat); renderCatalog(); refocus(`#cat-chips [data-cat="${d.cat}"]`); }
  else if (d.cat) { e.preventDefault(); setMega(false); goCatalog(d.cat); }
  else if (d.goto) goCatalog(d.goto);
  else if (d.open) openProduct(d.open);
  else if (d.add) {
    const p = byId(d.add);
    setQty(p.id, (cart[p.id] || 0) + 1);
    toast(`${p.name} — в корзине`);
    if (d.keep !== undefined) t.textContent = `В корзине · ${cart[p.id]} — добавить ещё`;
    else document.querySelector(`[data-add="${p.id}"]:not([data-keep])`)?.focus();
  }
  else if (d.inc) setQty(d.inc, cart[d.inc] + 1);
  else if (d.dec) setQty(d.dec, cart[d.dec] - 1);
  else if (d.remove) { const name = byId(d.remove).name; setQty(d.remove, 0); toast(`${name} удалён из корзины`); $('#cart-body [data-close]')?.focus(); }
  else if (d.step) { checkout.step = +d.step; renderCart(); $('#cart-body').querySelector('input:checked, .btn-red')?.focus(); }
  else if (d.action === 'cart') openCart();
  else if (d.action === 'search') { goCatalog(filters.cat); $('#q').focus({preventScroll: true}); }
  else if (d.action === 'clear') { cart = {}; save(); renderCart(); renderCatalog(); }
});
const refocus = sel => document.querySelector(sel)?.focus();


$('#cart').addEventListener('submit', e => {
  e.preventDefault();
  const f = new FormData(e.target);
  Object.assign(checkout, {step: 3, method: f.get('method'), install: f.has('install'), name: f.get('name'), comment: f.get('comment')});
  renderCart();
  $('#cart .btn-red')?.focus();
});
$('#cart').addEventListener('input', e => {
  const f = e.target.form;
  if (!f) return;
  const data = new FormData(f);
  Object.assign(checkout, {method: data.get('method'), install: data.has('install'), name: data.get('name'), comment: data.get('comment')});
});

$('#q').addEventListener('input', e => { filters.q = e.target.value; renderCatalog(); });
bindFilters(document.body, filters, renderCatalog);
$('#filters-open').addEventListener('click', () => $('#filter-sheet').showModal());
$('#menu-open').addEventListener('click', () => $('#menu').showModal());

addEventListener('storage', e => { if (e.key === KEY) { try { cart = cleanCart(JSON.parse(e.newValue || '{}')); } catch { cart = {}; } renderCart(); renderCatalog(); } });

buildStatic();
placeFilters();
renderCatalog();
renderCart();
