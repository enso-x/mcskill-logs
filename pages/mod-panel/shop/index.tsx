import React, { useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';
import { NextPage } from 'next';
import { useSession } from 'next-auth/react';
import { Input, Select, Tabs } from 'antd';

import { HorizontalLayout, VerticalLayout } from '@/components/Styled';
import { Loading, LoadingContainer } from '@/components/mod-panel/Loading';
import { ModPanelPage, ModPanelPageControls, ModPanelPageContent } from '@/components/mod-panel/ModPanelPage';
import { ConfirmModal } from '@/components/mod-panel/modals/ConfirmModal';
import { Currency, Price } from '@/components/mod-panel/Price';
import { getUserRoleInfoForServer } from '@/helpers/users';
import { EUserRoles, IUser } from '@/interfaces/User';
import { EOrderType } from '@/interfaces/Order';
import { IShopCategory, IShopGroupItem, IShopItem } from '@/interfaces/Shop';
import { SERVERS } from '@/interfaces/Server';

import { IShopServiceItem, SERVICES } from '@/data/mod-panel/services';

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

const ItemCardImage = styled.img`
	width: 64px;
	height: 64px;
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
	shopGroup: IShopGroupItem;
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
				<p>
					<span dangerouslySetInnerHTML={{ __html: shopGroup.site_name }} />
					{' '}
					({ prices.find(price => price.value === selectedPrice)!.label })
				</p>
			)} onSubmit={ handleOrderButtonClick } buttonContent="Заказать" buttonProps={{
				disabled: buttonsDisabled || !userRoleForSelectedServer || (!!selectedPrice && userRoleForSelectedServer.points < selectedPrice)
			}}/>
		</ItemGroupCard>
	);
};

interface IShopServiceItemProps {
	user: IUser | null;
	serviceItem: IShopServiceItem;
	selectedServer: string;
	buttonsDisabled: boolean;
	beforeSubmit?: () => void;
	onSubmit?: () => void;
}

const ShopServiceItem = ({
	user,
	serviceItem,
	selectedServer,
	buttonsDisabled,
	beforeSubmit,
	onSubmit
}: IShopServiceItemProps) => {
	const userRoleForSelectedServer = useMemo(() => {
		return user && getUserRoleInfoForServer(user, selectedServer);
	}, [ user, selectedServer ]);

	const handleOrderButtonClick = async () => {
		if (!user || !userRoleForSelectedServer || userRoleForSelectedServer.points < serviceItem.price) {
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
				item: serviceItem.name,
				image: serviceItem.img,
				count: 1,
				price: serviceItem.price,
				type: EOrderType.service
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
							role.points -= serviceItem.price;
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
		<ItemCard key={ serviceItem.id }>
			<ItemCardImage src={ serviceItem.img } alt="Service image"/>
			<ItemCardName>{ serviceItem.name }</ItemCardName>
			<ItemCardVertical>
				<ValueContainer>
					Цена: <span>{ serviceItem.price.toFixed(2) } <Currency/></span>
				</ValueContainer>
			</ItemCardVertical>
			<ConfirmModal title="Подтвердить заказ?" content={(
				<p>
					{serviceItem.name} x{1}
				</p>
			)} onSubmit={ handleOrderButtonClick } buttonContent="Заказать" buttonProps={{
				disabled: buttonsDisabled || !userRoleForSelectedServer || userRoleForSelectedServer.points < serviceItem.price
			}}/>
		</ItemCard>
	);
};

interface IShopItemProps {
	user: IUser | null;
	shopItem: IShopItem;
	selectedServer: string;
	buttonsDisabled: boolean;
	beforeSubmit?: () => void;
	onSubmit?: () => void;
}

const ShopItem = ({
	user,
	shopItem,
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
		const newPrice = parseFloat(shopItem.pricerub) * parseInt(amount, 10);

		return isNaN(newPrice) ? parseFloat(shopItem.pricerub) : newPrice;
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
				item: shopItem.name,
				image: shopItem.img,
				count: parseInt(amount, 10) * parseInt(shopItem.amount, 10),
				price: itemPrice,
				type: EOrderType.item
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
		<ItemCard key={ shopItem.id }>
			<ItemCardImage src={ shopItem.img } alt="Item image"/>
			<ItemCardName>{ shopItem.name }</ItemCardName>
			<ItemCardVertical>
				<Input placeholder="Кол-во" value={ amount } onInput={ handleAmountChange } addonBefore="Кол-во" addonAfter={ `x${shopItem.amount}` }/>
				<ValueContainer>
					Цена: <span>{ itemPrice.toFixed(2) } <Currency/></span>
				</ValueContainer>
			</ItemCardVertical>
			<ConfirmModal title="Подтвердить заказ?" content={(
				<p>
					{shopItem.name} x{amount}
				</p>
			)} onSubmit={ handleOrderButtonClick } buttonContent="Заказать" buttonProps={{
				disabled: buttonsDisabled || !userRoleForSelectedServer || userRoleForSelectedServer.points < itemPrice
			}}/>
		</ItemCard>
	);
};

const ModPanelShopPage: NextPage = () => {
	const { data: session, update: updateSession } = useSession();
	const [ selectedServer, setSelectedServer ] = useState<string>(SERVERS.server1.value);
	const [ filterString, setFilterString ] = useState<string>('');
	const [ categories, setCategories ] = useState<IShopCategory[]>([]);
	const [ items, setItems ] = useState<IShopItem[]>([]);
	const [ groups, setGroups ] = useState<IShopGroupItem[]>([]);
	const [ buttonsDisabled, setButtonsDisabled ] = useState<boolean>(false);

	const user = useMemo(() => {
		return session && session.user;
	}, [ session ]);

	const userRoleForSelectedServer = useMemo(() => {
		return user && getUserRoleInfoForServer(user, selectedServer);
	}, [ user, selectedServer ]);

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
						) && shopGroup.site_name.toLowerCase().includes(filterString.toLowerCase())).map(shopGroup => (
							<ShopGroupItem key={ shopGroup.group_id } user={ user } shopGroup={ shopGroup }
							               selectedServer={ selectedServer } buttonsDisabled={ buttonsDisabled }
							               beforeSubmit={ () => {
								               setButtonsDisabled(true);
							               } } onSubmit={ async () => {
								await updateSession();
								setButtonsDisabled(false);
							} }/>
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
						SERVICES.filter(serviceItem => serviceItem.name.toLowerCase().includes(filterString.toLowerCase())).map(serviceItem => (
							<ShopServiceItem key={ serviceItem.id } user={ user } serviceItem={ serviceItem }
							          selectedServer={ selectedServer } buttonsDisabled={ buttonsDisabled }
							          beforeSubmit={ () => {
								          setButtonsDisabled(true);
							          } } onSubmit={ async () => {
								await updateSession();
								setButtonsDisabled(false);
							} }/>
						))
					}
				</ItemsContainer>
			)
		}) : ({
			key: `${ shopCategory.sysname }`,
			label: shopCategory.name,
			children: (
				<ItemsContainer>
					{
						items.filter(shopItem => shopItem.catid.includes(shopCategory.id) && parseInt(shopItem.enabled, 10) && shopItem.name.toLowerCase().includes(filterString.toLowerCase())).map(shopItem => (
							<ShopItem key={ shopItem.id } user={ user } shopItem={ shopItem }
							          selectedServer={ selectedServer } buttonsDisabled={ buttonsDisabled }
							          beforeSubmit={ () => {
								          setButtonsDisabled(true);
							          } } onSubmit={ async () => {
								await updateSession();
								setButtonsDisabled(false);
							} }/>
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
			const categories = await fetch('/api/shop/getCategories').then<IShopCategory[]>(res => res.json());
			const items = await fetch('/api/shop/getItems').then<IShopItem[]>(res => res.json());
			const groups = await fetch('/api/shop/getGroups').then<IShopGroupItem[]>(res => res.json());

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
