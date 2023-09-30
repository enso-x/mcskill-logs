export interface IShopItem {
	id: string;
	name: string;
	price: number;
	amount: number;
	multiple_buy: boolean;
	active: boolean;
	img: string;
	data?: any;
}
