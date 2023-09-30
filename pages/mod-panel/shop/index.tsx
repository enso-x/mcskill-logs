import React, { useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';
import { NextPage } from 'next';
import { useSession } from 'next-auth/react';
import { Input, Select, Tabs } from 'antd';

import { HorizontalLayout, VerticalLayout } from '@/components/Styled';
import { Loading, LoadingContainer } from '@/components/mod-panel/Loading';
import { ModPanelPage, ModPanelPageContent, ModPanelPageControls } from '@/components/mod-panel/ModPanelPage';
import { ConfirmModal } from '@/components/mod-panel/modals/ConfirmModal';
import { Currency, Price } from '@/components/mod-panel/Price';
import { getUserRoleInfoForServer } from '@/helpers/users';
import { EUserRoles, IUser } from '@/interfaces/User';
import { EOrderType } from '@/interfaces/Order';
import { ISiteShopCategory, ISiteShopGroupItem, ISiteShopItem } from '@/interfaces/Shop';
import { SERVERS } from '@/interfaces/Server';
import { SERVICES } from '@/data/mod-panel/services';
import { STONE_TYPE, STONES } from '@/data/mod-panel/stones';
import { siteShopItemAdapter } from '@/data/mod-panel/shop/adapters';
import { IShopItem } from '@/data/mod-panel/shop/interfaces';

const ModPanelPageContentStyled = styled(ModPanelPageContent)`
	height: 100%;

	.ant-tabs {
		flex: 1;
		overflow: auto;
		font-family: "Exo 2", sans-serif;
	}

	.ant-tabs-content-holder {
		overflow: auto;
		
		&::-webkit-scrollbar {
			width: 12px;
		}
		
		&::-webkit-scrollbar-thumb {
			width: 6px;
			border: 4px solid transparent;
			background-color: rgba(255, 255, 255, 0);
			background-clip: content-box;
			border-radius: 6px;
			transition: background-color 0.2s ease-in-out;
		}
		
		&:hover::-webkit-scrollbar-thumb {
			background-color: rgba(255, 255, 255, .1);
		}
	}
`;

const ItemsContainer = styled.div`
	display: flex;
	flex: 1;
	flex-wrap: wrap;
	gap: 16px;
`;

const ItemCard = styled.div`
	display: flex;
	flex-direction: column;
	border: 1px solid var(--border-color);
	border-radius: 8px;
	padding: 16px;
	gap: 16px;
	width: 200px;
	height: 300px;
`;

const ItemGroupCard = styled(ItemCard)`
	height: 360px;
`;

const ItemCardImage = styled.img<{$big?: boolean}>`
	width: ${props => props.$big ? '128px' : '64px'};
	height: ${props => props.$big ? '128px' : '64px'};
	image-rendering: pixelated;
	align-self: center;
`;

const ItemCardGroupImage = styled.img`
	width: 128px;
	height: 128px;
	image-rendering: pixelated;
	align-self: center;
`;

const ItemCardName = styled.span`
	flex: 1;
	display: flex;
	gap: 8px;
	justify-content: center;
	text-align: center;
`;

const ItemCardVertical = styled(VerticalLayout)`
	gap: 8px;
`;

const ValueContainer = styled.span`
	display: inline-flex;
	align-items: center;
	gap: 8px;

	span {
		display: inline-flex;
		align-items: center;
		gap: 4px;
		color: #58abff;
	}
`;

interface IShopGroupItemProps {
	user: IUser | null;
	shopGroup: ISiteShopGroupItem;
	selectedServer: string;
	buttonsDisabled: boolean;
	beforeSubmit?: () => void;
	onSubmit?: () => void;
}

const ShopGroupItem = ({
	user,
	shopGroup,
	selectedServer,
	buttonsDisabled,
	beforeSubmit,
	onSubmit
}: IShopGroupItemProps) => {
	const userRoleForSelectedServer = useMemo(() => {
		return user && getUserRoleInfoForServer(user, selectedServer);
	}, [ user, selectedServer ]);

	const prices = useMemo(() => {
		return [
			{
				key: 'month',
				label: 'Месяц',
				disabled: !(shopGroup.price_month_discount || shopGroup.price_month),
				value: shopGroup.price_month_discount || shopGroup.price_month
			},
			{
				key: 'year',
				label: 'Год',
				disabled: !(shopGroup.price_year_discount || shopGroup.price_year),
				value: shopGroup.price_year_discount || shopGroup.price_year
			},
			{
				key: 'forever',
				label: 'Навсегда',
				disabled: !(shopGroup.price_perm_discount || shopGroup.price_perm),
				value: shopGroup.price_perm_discount || shopGroup.price_perm
			}
		];
	}, [ shopGroup ]);

	const [ selectedPrice, setSelectedPrice ] = useState<number | undefined>(prices.find(price => !price.disabled)?.value);

	const handleDurationSelectChange = (value: number) => {
		setSelectedPrice(value);
	};

	const handleOrderButtonClick = async () => {
		if (!user || !userRoleForSelectedServer || !selectedPrice || userRoleForSelectedServer.points < selectedPrice) {
			return;
		}

		beforeSubmit?.();

		const [ newOrder ] = await fetch('/api/orders/create', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				username: user.username,
				server: selectedServer,
				item: `${shopGroup.site_name} (${ prices.find(price => price.value === selectedPrice)!.label })`,
				image: `https://mcskill.net/templates/shop/assets/images/groups/${ shopGroup.img }`,
				count: 1,
				price: selectedPrice,
				type: EOrderType.group
			})
		}).then(res => res.json());

		if (newOrder && user) {
			const [ newUser ] = await fetch('/api/users/edit', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					id: user._id,
					roles: user.roles.map(role => {
						if (role.server === selectedServer) {
							role.points -= selectedPrice;
						}
						return role;
					})
				})
			}).then(res => res.json());

			if (newUser && newUser.roles.length) {
				onSubmit?.();
			}
		}
	};

	return (
		<ItemGroupCard key={ shopGroup.group_id }>
			<ItemCardGroupImage
				src={ `https://mcskill.net/templates/shop/assets/images/groups/${ shopGroup.img }` }
				alt="Group image"/>
			<ItemCardName dangerouslySetInnerHTML={ { __html: shopGroup.site_name } }/>
			<ItemCardVertical>
				<Select<number>
					style={ { width: '100%', cursor: 'pointer', flexShrink: 0 } }
					placeholder="Длительность"
					value={ selectedPrice }
					onChange={ handleDurationSelectChange }
					options={ prices }
					getPopupContainer={ () => document.body }
				/>
				<ValueContainer>
					Цена: <span>{ selectedPrice } <Currency/></span>
				</ValueContainer>
			</ItemCardVertical>
			<ConfirmModal title="Подтвердить заказ?" content={(
				<VerticalLayout>
					<ItemCardGroupImage
						src={ `https://mcskill.net/templates/shop/assets/images/groups/${ shopGroup.img }` }
						alt="Group image"/>
					<HorizontalLayout style={{
						alignSelf: 'center'
					}}>
						<span>
							<span dangerouslySetInnerHTML={{ __html: shopGroup.site_name }} />
							{' '}
							({ prices.find(price => price.value === selectedPrice)!.label })
						</span>
					</HorizontalLayout>
				</VerticalLayout>
			)} onSubmit={ handleOrderButtonClick } buttonContent="Заказать" buttonProps={{
				disabled: buttonsDisabled || !userRoleForSelectedServer || (!!selectedPrice && userRoleForSelectedServer.points < selectedPrice)
			}}/>
		</ItemGroupCard>
	);
};

interface IShopItemProps {
	user: IUser | null;
	item: IShopItem;
	type: EOrderType;
	selectedServer: string;
	buttonsDisabled: boolean;
	beforeSubmit?: () => void;
	onSubmit?: () => void;
}

const ShopItem = ({
	user,
	item,
	type,
	selectedServer,
	buttonsDisabled,
	beforeSubmit,
	onSubmit
}: IShopItemProps) => {
	const [ amount, setAmount ] = useState<string>('1');

	const userRoleForSelectedServer = useMemo(() => {
		return user && getUserRoleInfoForServer(user, selectedServer);
	}, [ user, selectedServer ]);

	const itemPrice = useMemo(() => {
		const newPrice = item.price * parseInt(amount, 10);

		return isNaN(newPrice) ? item.price : newPrice;
	}, [ amount ]);

	const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setAmount(e.target.value);
	};

	const handleOrderButtonClick = async () => {
		if (!user || !userRoleForSelectedServer || userRoleForSelectedServer.points < itemPrice) {
			return;
		}

		beforeSubmit?.();

		const [ newOrder ] = await fetch('/api/orders/create', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				username: user.username,
				server: selectedServer,
				item: item.name,
				image: item.img,
				count: parseInt(amount, 10) * item.amount,
				price: itemPrice,
				type: type
			})
		}).then(res => res.json());

		if (newOrder && user) {
			const [ newUser ] = await fetch('/api/users/edit', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					id: user._id,
					roles: user.roles.map(role => {
						if (role.server === selectedServer) {
							role.points -= itemPrice;
						}
						return role;
					})
				})
			}).then(res => res.json());

			if (newUser && newUser.roles.length) {
				onSubmit?.();
			}
		}
	};

	return (
		<ItemCard key={ item.id }>
			<ItemCardImage src={ item.img } alt="Item image"/>
			<ItemCardName>{ item.name }</ItemCardName>
			<ItemCardVertical>
				{
					item.multiple_buy && (
						<Input placeholder="Кол-во" value={ amount } onInput={ handleAmountChange } addonBefore="Кол-во" addonAfter={ `x${item.amount}` }/>
					)
				}
				<ValueContainer>
					Цена: <span>{ itemPrice.toFixed(2) } <Currency/></span>
				</ValueContainer>
			</ItemCardVertical>
			<ConfirmModal title="Подтвердить заказ?" content={(
				<VerticalLayout>
					<ItemCardImage $big src={item.img} alt="Item image"/>
					<span style={{
						alignSelf: 'center'
					}}>
						{item.name} x{amount}
					</span>
				</VerticalLayout>
			)} onSubmit={ handleOrderButtonClick } buttonContent="Заказать" buttonProps={{
				disabled: !item.active || buttonsDisabled || !userRoleForSelectedServer || userRoleForSelectedServer.points < itemPrice
			}}/>
		</ItemCard>
	);
};

const ModPanelShopPage: NextPage = () => {
	const { data: session, update: updateSession } = useSession();
	const [ selectedServer, setSelectedServer ] = useState<string>(SERVERS.server1.value);
	const [ filterString, setFilterString ] = useState<string>('');
	const [ categories, setCategories ] = useState<ISiteShopCategory[]>([]);
	const [ items, setItems ] = useState<ISiteShopItem[]>([]);
	const [ groups, setGroups ] = useState<ISiteShopGroupItem[]>([]);
	const [ buttonsDisabled, setButtonsDisabled ] = useState<boolean>(false);

	const user = useMemo(() => {
		return session && session.user;
	}, [ session ]);

	const userRoleForSelectedServer = useMemo(() => {
		return user && getUserRoleInfoForServer(user, selectedServer);
	}, [ user, selectedServer ]);

	const baseFilter = (itemName: string) => {
		return itemName.toLowerCase().includes(filterString.toLowerCase());
	};

	const basePanelItemFilter = (items: IShopItem[]) => {
		return items.filter(item => baseFilter(item.name));
	};

	const beforeSubmitBuy = () => {
		setButtonsDisabled(true);
	};

	const onSubmitBuy = async () => {
		await updateSession();
		setButtonsDisabled(false);
	};

	const tabItems = useMemo(() => {
		return categories ? categories.map(shopCategory => shopCategory.id === 'groups' ? ({
			key: `${ shopCategory.sysname }`,
			label: shopCategory.name,
			children: (
				<ItemsContainer>
					{
						groups.filter(shopGroup => (
							shopGroup.price_month_discount ||
							shopGroup.price_month ||
							shopGroup.price_year_discount ||
							shopGroup.price_year ||
							shopGroup.price_perm_discount ||
							shopGroup.price_perm
						) && baseFilter(shopGroup.site_name)).map(shopGroup => (
							<ShopGroupItem key={ shopGroup.group_id } user={ user } shopGroup={ shopGroup }
							               selectedServer={ selectedServer } buttonsDisabled={ buttonsDisabled }
							               beforeSubmit={ beforeSubmitBuy } onSubmit={ onSubmitBuy }/>
						))
					}
				</ItemsContainer>
			)
		}) : shopCategory.id === 'services' ? ({
			key: `${ shopCategory.sysname }`,
			label: shopCategory.name,
			children: (
				<ItemsContainer>
					{
						basePanelItemFilter(SERVICES).map(item => (
							<ShopItem key={ item.id } user={ user }
							          item={ item } type={ EOrderType.service }
							          selectedServer={ selectedServer } buttonsDisabled={ buttonsDisabled }
							          beforeSubmit={ beforeSubmitBuy } onSubmit={ onSubmitBuy }/>
						))
					}
				</ItemsContainer>
			)
		}) : shopCategory.id === 'stones' ? ({
			key: `${ shopCategory.sysname }`,
			label: shopCategory.name,
			children: (
				<VerticalLayout>
					<Tabs items={[
						{
							key: `${ STONE_TYPE.Functional }`,
							label: 'Функциональные',
							children: (
								<ItemsContainer>
									{
										basePanelItemFilter(STONES).filter(item => item.data.type === STONE_TYPE.Functional).map(item => (
											<ShopItem key={ item.id } user={ user }
											          item={ item } type={ EOrderType.item }
											          selectedServer={ selectedServer } buttonsDisabled={ buttonsDisabled }
											          beforeSubmit={ beforeSubmitBuy } onSubmit={ onSubmitBuy }/>
										))
									}
								</ItemsContainer>
							)
						},
						{
							key: `${ STONE_TYPE.Form }`,
							label: 'Формы',
							children: (
								<ItemsContainer>
									{
										basePanelItemFilter(STONES).filter(item => item.data.type === STONE_TYPE.Form).map(item => (
											<ShopItem key={ item.id } user={ user }
											          item={ item } type={ EOrderType.item }
											          selectedServer={ selectedServer } buttonsDisabled={ buttonsDisabled }
											          beforeSubmit={ beforeSubmitBuy } onSubmit={ onSubmitBuy }/>
										))
									}
								</ItemsContainer>
							)
						}
					]}/>
				</VerticalLayout>
			)
		}) : ({
			key: `${ shopCategory.sysname }`,
			label: shopCategory.name,
			children: (
				<ItemsContainer>
					{
						items.filter(shopItem => shopItem.catid.includes(shopCategory.id) && parseInt(shopItem.enabled, 10) && baseFilter(shopItem.name)).map(shopItem => (
							<ShopItem key={ shopItem.id } user={ user }
							          item={ siteShopItemAdapter(shopItem) } type={ EOrderType.item }
							          selectedServer={ selectedServer } buttonsDisabled={ buttonsDisabled }
							          beforeSubmit={ beforeSubmitBuy } onSubmit={ onSubmitBuy }/>
						))
					}
				</ItemsContainer>
			)
		})) : [];
	}, [ categories, items, groups, userRoleForSelectedServer, filterString ]);

	const handleServerSelectChange = (value: string) => {
		setSelectedServer(value);
	};

	const handleFilterStringChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setFilterString(e.target.value);
	};

	useEffect(() => {
		(async () => {
			const categories = await fetch('/api/shop/getCategories').then<ISiteShopCategory[]>(res => res.json());
			const items = await fetch('/api/shop/getItems').then<ISiteShopItem[]>(res => res.json());
			const groups = await fetch('/api/shop/getGroups').then<ISiteShopGroupItem[]>(res => res.json());

			if (categories && categories.length) {
				categories.unshift({
					id: 'groups',
					enabled: '1',
					name: 'Привелегии',
					sysname: '88.__groupsandpriveleges',
					type: 'item',
					tabid: '1',
					sort: '0'
				});

				categories.unshift({
					id: 'stones',
					enabled: '1',
					name: 'Камни',
					sysname: '88.__moderatorstones',
					type: 'item',
					tabid: '1',
					sort: '0'
				});

				categories.unshift({
					id: 'services',
					enabled: '1',
					name: 'Услуги',
					sysname: '88.__moderatorservices',
					type: 'item',
					tabid: '1',
					sort: '0'
				});

				categories.unshift({
					id: '',
					enabled: '1',
					name: 'Все предметы',
					sysname: '88.__allcategories',
					type: 'item',
					tabid: '1',
					sort: '0'
				});

				setCategories(categories);
			}

			if (items && items.length) {
				setItems(items);
			}

			if (groups && groups.length) {
				setGroups(groups);
			}
		})();
	}, []);

	useEffect(() => {
		if (user && user.roles.length) {
			setSelectedServer(user.roles[0].server);
		}
	}, [ user ]);

	return (
		<ModPanelPage needRole={ EUserRoles.trainee }>
			{
				!categories || !items || !user ? (
					<LoadingContainer>
						<Loading/>
					</LoadingContainer>
				) : (
					<>
						<ModPanelPageControls>
							<HorizontalLayout>
								<Select<string>
									style={ { width: '240px', cursor: 'pointer', flexShrink: 0 } }
									placeholder="Сервер"
									value={ selectedServer }
									onChange={ handleServerSelectChange }
									options={ Object.values(SERVERS).filter(server => server.active).map(server => {
										const userHasServerRole = user.roles.some(role => role.server === server.value);

										return {
											disabled: !userHasServerRole,
											label: server.label,
											value: server.value
										};
									}) }
								/>
								<Input placeholder="Фильтр по имени" onInput={ handleFilterStringChange }/>
							</HorizontalLayout>
							<HorizontalLayout>
								<ValueContainer>
									Доступные баллы: <Price value={ userRoleForSelectedServer?.points ?? 0 } addonBefore="(" addonAfter=")"/>
								</ValueContainer>
							</HorizontalLayout>
						</ModPanelPageControls>
						<ModPanelPageContentStyled>
							<Tabs items={ tabItems }/>
						</ModPanelPageContentStyled>
					</>
				)
			}
		</ModPanelPage>
	);
};

export default ModPanelShopPage;
