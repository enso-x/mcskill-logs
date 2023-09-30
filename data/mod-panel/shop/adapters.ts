import { ISiteShopItem } from '@/interfaces/Shop';
import { IShopItem } from '@/data/mod-panel/shop/interfaces';

export const siteShopItemAdapter = (item: ISiteShopItem): IShopItem => {
	return {
		id: item.id,
		name: item.name,
		price: parseInt(item.pricerub, 10),
		amount: parseInt(item.amount, 10),
		multiple_buy: true,
		active: Boolean(parseInt(item.enabled, 10)),
		img: item.img,
	};
};
