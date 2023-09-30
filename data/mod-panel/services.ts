import { IShopItem } from '@/data/mod-panel/shop/interfaces';

export const SERVICES: IShopItem[] = [
	{
		id: 'pokeball-change',
		name: 'Смена покебола у покемона',
		img: '/pixelmon/services/pokeball-change.png',
		price: 5,
		amount: 1,
		multiple_buy: false,
		active: true
	},
	{
		id: 'nature-change',
		name: 'Смена характера покемона',
		img: '/pixelmon/services/nature-change.png',
		price: 10,
		amount: 1,
		multiple_buy: false,
		active: true
	},
	{
		id: 'ability-change',
		name: 'Смена способности покемона (не хид)',
		img: '/pixelmon/services/ability-change.png',
		price: 10,
		amount: 1,
		multiple_buy: false,
		active: true
	},
	{
		id: 'size-change',
		name: 'Смена размера покемона',
		img: '/pixelmon/services/size-change.png',
		price: 10,
		amount: 1,
		multiple_buy: false,
		active: true
	},
	{
		id: 'form-change',
		name: 'Смена формы покемона на Зомби, Дух, Радужную, Эшен (Этерномакс запрещён)',
		img: '/pixelmon/services/form-change.png',
		price: 20,
		amount: 1,
		multiple_buy: false,
		active: true
	},
	{
		id: 'shiny-change',
		name: 'Шайни форма',
		img: '/pixelmon/services/shiny-change.png',
		price: 40,
		amount: 1,
		multiple_buy: false,
		active: true
	},
	{
		id: 'galar-change',
		name: 'Смена формы на Галарскую / Алола форму и другие формы',
		img: '/pixelmon/services/galar-change.png',
		price: 40,
		amount: 1,
		multiple_buy: false,
		active: true
	},
	{
		id: 'rare-skin-change',
		name: 'Смена скина покемона на редкий (Изменённый, Страйк, Валентианов, Альтер и т.п.)',
		img: '/pixelmon/services/rare-skin-change.png',
		price: 40,
		amount: 1,
		multiple_buy: false,
		active: true
	},
	{
		id: 'hid-change',
		name: 'Скрытая способность',
		img: '/pixelmon/services/hid-change.png',
		price: 40,
		amount: 1,
		multiple_buy: false,
		active: true
	},
	{
		id: 'ivs-change',
		name: 'ИВС на выбор',
		img: '/pixelmon/services/ivs-change.png',
		price: 50,
		amount: 1,
		multiple_buy: false,
		active: true
	},
	{
		id: 'moves-and-level-change',
		name: 'Нужная сборка атак + уровень',
		img: '/pixelmon/services/moves-and-level-change.png',
		price: 50,
		amount: 1,
		multiple_buy: false,
		active: true
	},
	{
		id: 'transfer-between-servers',
		name: 'Перенос покемона между серверами',
		img: '/pixelmon/services/transfer-between-servers.png',
		price: 50,
		amount: 1,
		multiple_buy: false,
		active: true
	},
	{
		id: 'transfer-on-wipe',
		name: 'Перенос покемона на следующий вайп',
		img: '/pixelmon/services/transfer-on-wipe.png',
		price: 60,
		amount: 1,
		multiple_buy: false,
		active: true
	},
	{
		id: 'moderator-head',
		name: 'Голова мод состава (исключая админ состав)',
		img: '/pixelmon/services/moderator-head.png',
		price: 500,
		amount: 1,
		multiple_buy: false,
		active: true
	}
];
