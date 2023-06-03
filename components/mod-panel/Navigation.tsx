import React from 'react';
import styled, { css } from 'styled-components';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';

import { ServerMonitoring } from '@/components/ServerMonitoring';
import { EUserRoles, IUser } from '@/interfaces/User';
import { getAverageUserRoleInfo, hasJuniorRole } from '@/helpers/users';

const Sidebar = styled.div`
	display: flex;
	flex-direction: column;
	justify-content: space-between;
	width: 240px;
	flex-shrink: 0;
	border-right: 1px solid var(--border-color);
`;

const NavigationContainer = styled.div`
	display: flex;
	flex-direction: column;
`;

interface ISidebarItemProps {
	$active?: boolean;
}

const SidebarItem = styled.div<ISidebarItemProps>`
	display: flex;
	flex-direction: column;
	
	a {
		padding: 16px 32px;
		color: #fff;

		${ (props) => props.$active ? css`background: var(--accent-color);` : '' }
	}

	&:not(:last-child) {
		border-bottom: 1px solid var(--border-color);
	}
`;

const getDefaultRouteFilter = (role: EUserRoles) => (user: IUser | null) => {
	const averageUserRole = user ? getAverageUserRoleInfo(user).role : EUserRoles.player;

	return averageUserRole >= role;
};

const ROUTES = [
	{
		id: 'user-list',
		label: 'Мод состав',
		url: '/mod-panel',
		filter: getDefaultRouteFilter(EUserRoles.player)
	},
	{
		id: 'profile',
		label: 'Профиль',
		url: '/mod-panel/user/[discord_id]',
		filter: getDefaultRouteFilter(EUserRoles.player)
	},
	{
		id: 'shop',
		label: 'Магазин',
		url: '/mod-panel/shop',
		filter: getDefaultRouteFilter(EUserRoles.helper)//(user: IUser | null) => user && hasJuniorRole(user)
	},
	{
		id: 'orders',
		label: 'Заказы',
		url: '/mod-panel/orders',
		filter: getDefaultRouteFilter(EUserRoles.trainee)
	},
	{
		id: 'punishments',
		label: 'Наказания',
		url: '/mod-panel/punishments',
		filter: getDefaultRouteFilter(EUserRoles.helper)
	},
	{
		id: 'interview',
		label: 'Интервью',
		url: '/mod-panel/interview',
		filter: getDefaultRouteFilter(EUserRoles.st)
	},
	{
		id: 'settings',
		label: 'Настройки',
		url: '/mod-panel/settings',
		filter: getDefaultRouteFilter(EUserRoles.curator)
	},
];

export function Navigation() {
	const router = useRouter();
	const { data: session } = useSession();

	if (!session) {
		return null;
	}

	return (
		<Sidebar>
			<NavigationContainer>
				{
					ROUTES.filter(route => route.filter(session.user)).map(route => {
						const isSameUrl = router.route === route.url;
						const url = isSameUrl ? router.asPath : route.url.replace('[discord_id]', session?.user.discord_id);
						return (
							<SidebarItem key={ route.id } $active={ isSameUrl }>
								<Link
									href={ url }>
									{ route.label }
								</Link>
							</SidebarItem>
						);
					})
				}
			</NavigationContainer>
			<ServerMonitoring/>
		</Sidebar>
	);
}
