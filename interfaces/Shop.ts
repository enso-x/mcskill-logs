export interface ISiteShopCategory {
	enabled: string;
	id: string;
	name: string;
	sort: string;
	sysname: string;
	tabid: string;
	type: string;
}

export interface ISiteShopItem {
	id: string;
	enabled: string;
	name: string;
	type: string;
	description: string;
	itemname: string;
	img: string;
	amount: string;
	stacksize: string;
	extra: string;
	pricerub: string;
	priceem: string;
	creator: string;
	currency: string;
	price: string;
	sort: string;
	catid: string;
	discount: string | null;
}

export interface ISiteShopGroupItem {
	group_id: number;
	site_name: string;
	shortstory: string;
	img: string;
	pex_name: string;
	upgrade: number;
	desc: string;
	price_month: number;
	price_em_month: number;
	price_perm: number;
	price_year: number;
	transfer: number;
	price_month_discount: number;
	price_perm_discount: number;
	price_year_discount: number;
	discount_month: number;
	discount_perm: number;
	discount_year: number;
	sell_em_month: number;
	sell_month: number;
	sell_year: number;
	sell_perm: number;
	sort: number;
	price_month_ex: number;
	price_year_ex: number;
	price_perm_ex: number;
	status: string;
	expiry: number;
	purchase: {
		status: boolean;
		expiry: number;
	}
}
