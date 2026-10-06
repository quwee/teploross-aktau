// Concept A data: shared demo catalogue from shop.mjs plus local demo items.
// shop.mjs stays untouched because concepts B and C import it too.
import {products as shared, categories, money} from '../../shop.mjs';

export {categories, money};

const extra = [
  {id:'a-lem-20', name:'Лемакс Премиум-20', brand:'Лемакс', category:'boilers', kind:'Напольный газовый котёл', specs:'20 кВт · одноконтурный', power:20, price:249000, image:'lemaks.webp', tag:''},
  {id:'a-lem-30', name:'Лемакс Премиум-30', brand:'Лемакс', category:'boilers', kind:'Напольный газовый котёл', specs:'30 кВт · одноконтурный', power:30, price:329000, image:'lemaks.webp', tag:''},
  {id:'a-prime-v20', name:'Лемакс PRIME-V20', brand:'Лемакс', category:'boilers', kind:'Настенный газовый котёл', specs:'20 кВт · двухконтурный', power:20, price:445000, image:'wall-boiler.webp', tag:''},
  {id:'a-rad-8', name:'Royal Thermo Revolution 500 / 8', brand:'Royal Thermo', category:'radiators', kind:'Алюминиевый радиатор', specs:'8 секций · межосевое 500 мм', power:0, price:85000, image:'radiator.webp', tag:''},
  {id:'a-rad-10', name:'Royal Thermo Revolution 500 / 10', brand:'Royal Thermo', category:'radiators', kind:'Алюминиевый радиатор', specs:'10 секций · межосевое 500 мм', power:0, price:106000, image:'radiator.webp', tag:''},
  {id:'a-pump-32', name:'Grundfos UPS 32-60', brand:'Grundfos', category:'pumps', kind:'Циркуляционный насос', specs:'3 скорости · монтаж 180 мм', power:0, price:41000, image:'pump.webp', tag:''},
  {id:'a-water-80', name:'Thermex ER 80 V', brand:'Thermex', category:'water', kind:'Накопительный водонагреватель', specs:'80 литров · вертикальный', power:0, price:79000, image:'water-heater.webp', tag:''},
  {id:'a-water-50', name:'Thermex ER 50 V', brand:'Thermex', category:'water', kind:'Накопительный водонагреватель', specs:'50 литров · вертикальный', power:0, price:69000, image:'water-heater.webp', tag:''}
];

export const products = [...shared, ...extra];
export const brands = [...new Set(products.map(p => p.brand))];
export const byId = id => products.find(p => p.id === id);

export function cleanCart(value) {
  const src = value && typeof value === 'object' ? value : {};
  return Object.fromEntries(Object.entries(src).filter(([id, q]) => byId(id) && Number.isInteger(q) && q > 0 && q <= 99));
}

export const count = cart => Object.values(cart).reduce((s, q) => s + q, 0);
export const total = cart => products.reduce((s, p) => s + p.price * (cart[p.id] || 0), 0);

export const PICKUP = 'Самовывоз — Актау, 29А мкр, 24';
export const DELIVERY = 'Доставка по Актау';

export function orderText(cart, {name = '', method = 'pickup', install = false, comment = ''} = {}) {
  const rows = products.filter(p => cart[p.id]).map((p, i) =>
    `${i + 1}. ${p.name} — ${cart[p.id]} шт. × ${money(p.price)} = ${money(p.price * cart[p.id])}`);
  const lines = [
    'Здравствуйте, Тепло РОСС Актау! Хочу оформить заказ:', '', ...rows, '',
    `Итого на сайте: ${money(total(cart))} (цены для примера)`,
    `Получение: ${method === 'delivery' ? DELIVERY : PICKUP}`,
    `Нужна установка: ${install ? 'да' : 'нет'}`
  ];
  if (name.trim()) lines.push(`Имя: ${name.trim()}`);
  if (comment.trim()) lines.push(`Комментарий: ${comment.trim()}`);
  lines.push('', 'Подтвердите, пожалуйста, наличие и актуальную цену.');
  return lines.join('\n');
}

export const waUrl = text => 'https://wa.me/77772504300?text=' + encodeURIComponent(text);
export const orderUrl = (cart, details) => waUrl(orderText(cart, details));

export const PRICES = [50000, 100000, 250000, 500000];

export function filterProducts({category = 'all', brand = 'all', power = 'all', max = 0, query = '', sort = 'popular'} = {}) {
  const q = query.trim().toLowerCase();
  const list = products.filter(p =>
    (category === 'all' || p.category === category) &&
    (brand === 'all' || p.brand === brand) &&
    (power === 'all' || (p.power > 0 && (power === 'small' ? p.power <= 20 : p.power > 20))) &&
    (!max || p.price <= max) &&
    (`${p.name} ${p.brand} ${p.kind} ${p.specs}`).toLowerCase().includes(q));
  if (sort === 'low') list.sort((a, b) => a.price - b.price);
  if (sort === 'high') list.sort((a, b) => b.price - a.price);
  if (sort === 'name') list.sort((a, b) => a.name.localeCompare(b.name, 'ru'));
  return list;
}
