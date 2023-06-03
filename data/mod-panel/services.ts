export interface IShopServiceItem {
	id: string;
	name: string;
	price: number;
	img?: string;
}

export const SERVICES: IShopServiceItem[] = [
	{
		id: 'pokeball-change',
		name: 'Смена покебола у покемона',
		img: '/pixelmon/services/pokeball-change.png',
		price: 5
	},
	{
		id: 'nature-change',
		name: 'Смена характера покемона',
		img: '/pixelmon/services/nature-change.png',
		price: 10
	},
	{
		id: 'ability-change',
		name: 'Смена способности покемона (не хид)',
		img: '/pixelmon/services/ability-change.png',
		price: 10
	},
	{
		id: 'size-change',
		name: 'Смена размера покемона',
		img: '/pixelmon/services/size-change.png',
		price: 10
	},
	{
		id: 'form-change',
		name: 'Смена формы покемона на Зомби, Дух, Радужную, Эшен (Этерномакс запрещён)',
		img: '/pixelmon/services/form-change.png',
		price: 20
	},
	{
		id: 'shiny-change',
		name: 'Шайни форма',
		img: '/pixelmon/services/shiny-change.png',
		price: 40
	},
	{
		id: 'galar-change',
		name: 'Смена формы на Галарскую / Алола форму и другие формы',
		img: '/pixelmon/services/galar-change.png',
		price: 40
	},
	{
		id: 'rare-skin-change',
		name: 'Смена скина покемона на редкий (Изменённый, Страйк, Валентианов, Альтер и т.п.)',
		img: '/pixelmon/services/rare-skin-change.png',
		price: 40
	},
	{
		id: 'hid-change',
		name: 'Скрытая способность',
		img: '/pixelmon/services/hid-change.png',
		price: 40
	},
	{
		id: 'ivs-change',
		name: 'ИВС на выбор',
		img: '/pixelmon/services/ivs-change.png',
		price: 50
	},
	{
		id: 'moves-and-level-change',
		name: 'Нужная сборка атак + уровень',
		img: '/pixelmon/services/moves-and-level-change.png',
		price: 50
	},
	{
		id: 'transfer-between-servers',
		name: 'Перенос покемона между серверами',
		img: '/pixelmon/services/transfer-between-servers.png',
		price: 50
	},
	{
		id: 'transfer-on-wipe',
		name: 'Перенос покемона на следующий вайп',
		img: '/pixelmon/services/transfer-on-wipe.png',
		price: 60
	},
	{
		id: 'moderator-head',
		name: 'Голова мод состава (исключая админ состав)',
		img: '/pixelmon/services/moderator-head.png',
		price: 500
	}
];
