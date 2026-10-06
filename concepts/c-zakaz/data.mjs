// Concept C data and cart logic. shop.mjs stays untouched: its cart helpers only know the base products.
import {products as base, categories, money} from '../../shop.mjs';
export {categories, money};

const extra = [
 {id:'c-lem-20', name:'Лемакс Премиум-20', brand:'Лемакс', category:'boilers', kind:'Напольный газовый котёл', specs:'20 кВт · одноконтурный', power:20, price:249000, image:'lemaks.webp', tag:''},
 {id:'c-rad-350', name:'Royal Thermo Revolution 350', brand:'Royal Thermo', category:'radiators', kind:'Алюминиевый радиатор', specs:'6 секций · межосевое 350 мм', power:0, price:54000, image:'radiator.webp', tag:''},
 {id:'c-rad-500-8', name:'Royal Thermo Revolution 500 / 8', brand:'Royal Thermo', category:'radiators', kind:'Алюминиевый радиатор', specs:'8 секций · межосевое 500 мм', power:0, price:82000, image:'radiator.webp', tag:'Хит сезона'},
 {id:'c-pump-32', name:'Grundfos UPS 32-60', brand:'Grundfos', category:'pumps', kind:'Циркуляционный насос', specs:'3 скорости · монтаж 180 мм', power:0, price:46000, image:'pump.webp', tag:''},
 {id:'c-water-50', name:'Thermex ER 50 V', brand:'Thermex', category:'water', kind:'Накопительный водонагреватель', specs:'50 литров · вертикальный', power:0, price:64000, image:'water-heater.webp', tag:''},
 {id:'c-tap-bath', name:'IDDIS Parker для ванны', brand:'IDDIS', category:'plumbing', kind:'Смеситель для ванны', specs:'Хром · с душевым набором', power:0, price:27500, image:'faucet.webp', tag:''}
];
export const products = [...base, ...extra];
export const brands = [...new Set(products.map(p => p.brand))];
export const hits = products.filter(p => p.tag);
export const byId = id => products.find(p => p.id === id);

export const MAX_QTY = 99;
export function cleanCart(value) {
 return Object.fromEntries(Object.entries(value && typeof value === 'object' ? value : {})
  .filter(([id, q]) => byId(id) && Number.isInteger(q) && q > 0 && q <= MAX_QTY));
}
// Returns a new cart. qty <= 0 removes the line, qty above MAX_QTY is clamped.
export function setQty(cart, id, qty) {
 const next = {...cart};
 if (!byId(id) || !(qty > 0)) delete next[id];
 else next[id] = Math.min(MAX_QTY, Math.floor(qty));
 return next;
}
export const count = cart => Object.values(cart).reduce((a, b) => a + b, 0);
export const total = cart => products.reduce((s, p) => s + p.price * (cart[p.id] || 0), 0);
export const lines = cart => products.filter(p => cart[p.id]).map(p => ({...p, qty: cart[p.id], sum: p.price * cart[p.id]}));

export const delivery = {pickup:'Самовывоз: Актау, 29А мкр, 24', city:'Доставка по Актау (условия уточнить)'};
export function orderText(cart, {receive = 'pickup', install = false} = {}) {
 const rows = lines(cart).map(l => `• ${l.name} — ${l.qty} шт. × ${money(l.price)} = ${money(l.sum)}`);
 return [
  'Здравствуйте, Тепло РОСС Актау! Хочу оформить заказ:', '', ...rows, '',
  `Итого по сайту: ${money(total(cart))}`,
  `Получение: ${delivery[receive] || delivery.pickup}`,
  install ? 'Нужен монтаж — рассчитайте, пожалуйста.' : null,
  'Подтвердите, пожалуйста, актуальные цены и наличие.'
 ].filter(s => s !== null).join('\n');
}
export const WA = 'https://wa.me/77772504300';
export const waUrl = text => `${WA}?text=${encodeURIComponent(text)}`;
export const orderUrl = (cart, opts) => waUrl(orderText(cart, opts));

const norm = s => s.trim().toLowerCase().replace(/ё/g, 'е');

export function filterProducts({category = 'all', brands: picked = [], max = Infinity, power = 'all', query = '', sort = 'popular'} = {}) {
 const q = norm(query);
 const list = products.filter(p =>
  (category === 'all' || p.category === category) &&
  (!picked.length || picked.includes(p.brand)) &&
  p.price <= max &&
  (power === 'all' || (p.power > 0 && (power === 'small' ? p.power <= 20 : p.power > 20))) &&
  (!q || norm(`${p.name} ${p.brand} ${p.kind} ${p.specs}`).includes(q)));
 if (sort === 'low') return list.sort((a, b) => a.price - b.price);
 if (sort === 'high') return list.sort((a, b) => b.price - a.price);
 return list.sort((a, b) => !!b.tag - !!a.tag); // stable: hits first, catalog order otherwise
}

// Autocomplete: matching categories first, then up to 5 products.
export function suggest(query) {
 const q = norm(query);
 if (q.length < 2) return [];
 const cats = categories.filter(c => norm(c.name).includes(q)).map(c => ({type:'category', id:c.id, label:c.name}));
 const items = filterProducts({query:q}).slice(0, 5).map(p => ({type:'product', id:p.id, label:p.name, hint:money(p.price)}));
 return [...cats, ...items];
}
