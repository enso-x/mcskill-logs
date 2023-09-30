import { ISiteShopGroupItem, ISiteShopItem } from '@/interfaces/Shop';
import { IShopItem } from '@/data/mod-panel/shop/interfaces';
import { EStoneType } from '@/data/mod-panel/stones';

export const baseNameFilter = (filterString: string) => (itemName: string): boolean => {
	return itemName.toLowerCase().includes(filterString.toLowerCase());
};

const makeFilter = <T>(filter: (baseFilter: ReturnType<typeof baseNameFilter>, value: T, index: number, array: T[]) => boolean) => (filterString: string) => (items: T[]) => {
	return items.filter((item, index, arr) => filter(baseNameFilter(filterString), item, index, arr));
};

export const baseShopItemFilter = makeFilter<IShopItem>((baseFilter, item) => {
	return baseFilter(item.name);
});

export const stoneItemFilter = (stoneType: EStoneType) => makeFilter<IShopItem>((baseFilter, item) => {
	return item.data.type === stoneType && baseFilter(item.name);
});

export const siteShopItemFilter = (categoryId: string) => makeFilter<ISiteShopItem>((baseFilter, item) => {
	return (
		item.catid.includes(categoryId) &&
		Boolean(parseInt(item.enabled, 10)) &&
		!(
			parseInt(item.pricerub, 10) === 0 &&
			parseInt(item.priceem, 10) >= 0
		) &&
		baseFilter(item.name)
	);
});

export const siteGroupItemFilter = makeFilter<ISiteShopGroupItem>((baseFilter, group) => {
	return (
		Boolean(
			group.price_month_discount ||
			group.price_month ||
			group.price_year_discount ||
			group.price_year ||
			group.price_perm_discount ||
			group.price_perm
		) && baseFilter(group.site_name)
	);
});
