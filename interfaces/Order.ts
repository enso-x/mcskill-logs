export enum EOrderStatus {
	created = 'created',
	resolved = 'resolved',
	cancelled = 'cancelled'
}

export enum EOrderType {
	item = 'item',
	group = 'group',
	service = 'service'
}

export const ORDER_STATUSES: Record<EOrderStatus, string> = {
	[EOrderStatus.created]: 'Создан',
	[EOrderStatus.resolved]: 'Завершен',
	[EOrderStatus.cancelled]: 'Отменен',
};

export const ORDER_TYPES: Record<EOrderType, string> = {
	[EOrderType.item]: 'Предмет',
	[EOrderType.group]: 'Привелегия',
	[EOrderType.service]: 'Услуга',
};

export interface IOrder {
	_id: string;
	username: string;
	server: string;
	item: string;
	image: string;
	count: number;
	price: number;
	type: EOrderType;
	status: EOrderStatus;
	timestamp: Date;
}
