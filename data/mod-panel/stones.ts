import { IShopItem } from '@/data/mod-panel/shop/interfaces';

export enum STONE_TYPE {
	Functional = 'functional',
	Form = 'form'
}

export const STONES: IShopItem[] = [
	// Функциональные камни
	{
		id: 'copy-stone',
		name: 'Камень клонирования',
		img: '/pixelmon/stones/copy_stone_240x240.png',
		price: 150,
		amount: 1,
		multiple_buy: false,
		active: true,
		data: {
			type: STONE_TYPE.Functional
		}
	},
	{
		id: 'happiness-stone',
		name: 'Камень счастья',
		img: '/pixelmon/stones/happiness_stone_240x240.png',
		price: 5,
		amount: 1,
		multiple_buy: false,
		active: true,
		data: {
			type: STONE_TYPE.Functional
		}
	},
	{
		id: 'lock-ivs-stone',
		name: 'Камень фиксации IVS',
		img: '/pixelmon/stones/lock_ivs_stone_240x240.png',
		price: 200,
		amount: 1,
		multiple_buy: false,
		active: true,
		data: {
			type: STONE_TYPE.Functional
		}
	},
	{
		id: 'max-ivs-stone',
		name: 'Камень повышения EVS',
		img: '/pixelmon/stones/max_evs_stone_240x240.png',
		price: 5,
		amount: 1,
		multiple_buy: false,
		active: true,
		data: {
			type: STONE_TYPE.Functional
		}
	},
	{
		id: 'max-lvl-stone',
		name: 'Камень максимального уровня',
		img: '/pixelmon/stones/max_lvl_stone_240x240.png',
		price: 10,
		amount: 1,
		multiple_buy: false,
		active: true,
		data: {
			type: STONE_TYPE.Functional
		}
	},
	{
		id: 'reset-evs-stone',
		name: 'Камень сброса EVS',
		img: '/pixelmon/stones/reset_evs_stone_240x240.png',
		price: 10,
		amount: 1,
		multiple_buy: false,
		active: true,
		data: {
			type: STONE_TYPE.Functional
		}
	},
	{
		id: 'shiny-stone',
		name: 'Камень шайни',
		img: '/pixelmon/stones/shiny_stone_240x240.png',
		price: 40,
		amount: 1,
		multiple_buy: false,
		active: true,
		data: {
			type: STONE_TYPE.Functional
		}
	},
	{
		id: 'size-stone-bigger',
		name: 'Камень увеличения размера покемона',
		img: '/pixelmon/stones/size_stone_bigger_240x240.png',
		price: 10,
		amount: 1,
		multiple_buy: false,
		active: true,
		data: {
			type: STONE_TYPE.Functional
		}
	},
	{
		id: 'size-stone-smaller',
		name: 'Камень уменьшения размера покемона',
		img: '/pixelmon/stones/size_stone_smaller_240x240.png',
		price: 10,
		amount: 1,
		multiple_buy: false,
		active: true,
		data: {
			type: STONE_TYPE.Functional
		}
	},
	// Камни смены формы
	{
		id: 'form-stone-alter',
		name: 'Камень смены формы: Альтер',
		img: '/pixelmon/stones/form-stones/form_alter_stone_240x240.png',
		price: 40,
		amount: 1,
		multiple_buy: false,
		active: true,
		data: {
			type: STONE_TYPE.Form
		}
	},
	{
		id: 'form-stone-ashen',
		name: 'Камень смены формы: Эшен',
		img: '/pixelmon/stones/form-stones/form_ashen_stone_240x240.png',
		price: 20,
		amount: 1,
		multiple_buy: false,
		active: true,
		data: {
			type: STONE_TYPE.Form
		}
	},
	{
		id: 'form-stone-drowned',
		name: 'Камень смены формы: Утопленная',
		img: '/pixelmon/stones/form-stones/form_drowned_stone_240x240.png',
		price: 20,
		amount: 1,
		multiple_buy: false,
		active: true,
		data: {
			type: STONE_TYPE.Form
		}
	},
	{
		id: 'form-stone-pink',
		name: 'Камень смены формы: Розовая',
		img: '/pixelmon/stones/form-stones/form_pink_stone_240x240.png',
		price: 20,
		amount: 1,
		multiple_buy: false,
		active: true,
		data: {
			type: STONE_TYPE.Form
		}
	},
	{
		id: 'form-stone-rainbow',
		name: 'Камень смены формы: Радужная',
		img: '/pixelmon/stones/form-stones/form_rainbow_stone_240x240.png',
		price: 20,
		amount: 1,
		multiple_buy: false,
		active: true,
		data: {
			type: STONE_TYPE.Form
		}
	},
	{
		id: 'form-stone-spirit',
		name: 'Камень смены формы: Дух',
		img: '/pixelmon/stones/form-stones/form_spirit_stone_240x240.png',
		price: 20,
		amount: 1,
		multiple_buy: false,
		active: true,
		data: {
			type: STONE_TYPE.Form
		}
	},
	{
		id: 'form-stone-strike',
		name: 'Камень смены формы: Ударная',
		img: '/pixelmon/stones/form-stones/form_strike_stone_240x240.png',
		price: 40,
		amount: 1,
		multiple_buy: false,
		active: true,
		data: {
			type: STONE_TYPE.Form
		}
	},
	{
		id: 'form-stone-summer',
		name: 'Камень смены формы: Летняя',
		img: '/pixelmon/stones/form-stones/form_summer_stone_240x240.png',
		price: 30,
		amount: 1,
		multiple_buy: false,
		active: true,
		data: {
			type: STONE_TYPE.Form
		}
	},
	{
		id: 'form-stone-valencian',
		name: 'Камень смены формы: Валенсиан',
		img: '/pixelmon/stones/form-stones/form_valencian_stone_240x240.png',
		price: 40,
		amount: 1,
		multiple_buy: false,
		active: true,
		data: {
			type: STONE_TYPE.Form
		}
	},
	{
		id: 'form-stone-valentine',
		name: 'Камень смены формы: Валентин',
		img: '/pixelmon/stones/form-stones/form_valentine_stone_240x240.png',
		price: 30,
		amount: 1,
		multiple_buy: false,
		active: true,
		data: {
			type: STONE_TYPE.Form
		}
	},
	{
		id: 'form-stone-zombie',
		name: 'Камень смены формы: Зомби',
		img: '/pixelmon/stones/form-stones/form_zombie_stone_240x240.png',
		price: 10,
		amount: 1,
		multiple_buy: false,
		active: true,
		data: {
			type: STONE_TYPE.Form
		}
	},
];
