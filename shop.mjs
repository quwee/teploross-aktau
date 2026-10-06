export const products = [
{id:'lem-16', name:'Лемакс Премиум-16', brand:'Лемакс', category:'boilers', kind:'Напольный газовый котёл', specs:'16 кВт · одноконтурный', power:16, price:219000, image:'lemaks.webp', tag:'Выбор покупателей'},
{id:'lem-25', name:'Лемакс Премиум-25', brand:'Лемакс', category:'boilers', kind:'Напольный газовый котёл', specs:'25 кВт · одноконтурный', power:25, price:289000, image:'lemaks.webp', tag:''},
{id:'baxi-24', name:'Лемакс PRIME-V10', brand:'Лемакс', category:'boilers', kind:'Настенный газовый котёл', specs:'10 кВт · двухконтурный', power:10, price:398000, image:'wall-boiler.webp', tag:'Отопление + горячая вода'},
{id:'rad-500', name:'Royal Thermo Revolution 500', brand:'Royal Thermo', category:'radiators', kind:'Алюминиевый радиатор', specs:'4 секции · межосевое 500 мм', power:0, price:42500, image:'radiator.webp', tag:''},
{id:'pump-25', name:'Grundfos UPS 25-40', brand:'Grundfos', category:'pumps', kind:'Циркуляционный насос', specs:'3 скорости · монтаж 180 мм', power:0, price:28500, image:'pump.webp', tag:''},
{id:'water-80', name:'Thermex ER 100 V', brand:'Thermex', category:'water', kind:'Накопительный водонагреватель', specs:'100 литров · вертикальный', power:0, price:89000, image:'water-heater.webp', tag:''},
{id:'tap-kitchen', name:'IDDIS Parker', brand:'IDDIS', category:'plumbing', kind:'Смеситель для умывальника', specs:'Хром · однорычажный', power:0, price:18500, image:'faucet.webp', tag:''},
{id:'lem-12', name:'Лемакс Премиум-12,5', brand:'Лемакс', category:'boilers', kind:'Напольный газовый котёл', specs:'12,5 кВт · одноконтурный', power:12.5, price:189000, image:'lemaks.webp', tag:''}
];
export const categories = [{id:'boilers',name:'Газовые котлы',image:'lemaks.webp',short:'Котлы'},{id:'radiators',name:'Радиаторы',image:'radiator.webp',short:'Радиаторы'},{id:'pumps',name:'Насосы',image:'pump.webp',short:'Насосы'},{id:'water',name:'Водонагреватели',image:'water-heater.webp',short:'Водонагреватели'},{id:'plumbing',name:'Сантехника',image:'faucet.webp',short:'Сантехника'}];
export const money = value => new Intl.NumberFormat('ru-RU').format(value) + ' ₸';
export function cleanCart(value) { return Object.fromEntries(Object.entries(value && typeof value === 'object' ? value : {}).filter(([id,q]) => products.some(p=>p.id===id) && Number.isInteger(q) && q>0 && q<=99)); }
export function total(cart) {return products.reduce((sum,p)=>sum+p.price*(cart[p.id]||0),0);}
export function orderUrl(cart) {
 const rows = products.filter(p=>cart[p.id]).map(p=>`• ${p.name} — ${cart[p.id]} шт. × ${money(p.price)} = ${money(p.price*cart[p.id])}`);
 const text = `Здравствуйте, Тепло РОСС Актау! Хочу уточнить заказ:\n\n${rows.join('\n')}\n\nИтого по макету: ${money(total(cart))}.\nЦены демонстрационные. Подтвердите, пожалуйста, актуальные цены и наличие.`;
 return 'https://wa.me/77772504300?text='+encodeURIComponent(text);
}
export function filterProducts({category='all',brand='all',power='all',max=500000,query='',sort='popular'}={}) {
 const list=products.filter(p=>(category==='all'||p.category===category)&&(brand==='all'||p.brand===brand)&&(power==='all'||(p.power>0&&(power==='small'?p.power<=20:p.power>20)))&&p.price<=max&&(p.name+' '+p.kind+' '+p.specs).toLowerCase().includes(query.trim().toLowerCase()));
 return sort==='low'?list.sort((a,b)=>a.price-b.price):sort==='high'?list.sort((a,b)=>b.price-a.price):list;
}
