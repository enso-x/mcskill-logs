import React from 'react';
import styled, { css } from 'styled-components';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';

import { ServerMonitoring } from '@/components/ServerMonitoring';
import { EUserRoles } from '@/interfaces/User';
import { getAverageUserRoleInfo } from '@/helpers/users';

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

const ROUTES = [
	{
		id: 'route-0',
		label: 'Мод состав',
		url: '/mod-panel',
		role: EUserRoles.player
	},
	{
		id: 'route-1',
		label: 'Профиль',
		url: '/mod-panel/user/[discord_id]',
		role: EUserRoles.player
	},
	{
		id: 'route-2',
		label: 'Наказания',
		url: '/mod-panel/punishments',
		role: EUserRoles.helper
	},
	{
		id: 'route-3',
		label: 'Интервью',
		url: '/mod-panel/interview',
		role: EUserRoles.st
	},
	{
		id: 'route-4',
		label: 'Настройки',
		url: '/mod-panel/settings',
		role: EUserRoles.curator
	},
];

export function Navigation() {
	const router = useRouter();
	const { data: session } = useSession();

	if (!session) {
		return null;
	}

	const averageUserRoleInfo = session.user ? getAverageUserRoleInfo(session.user) : null;

	return (
		<Sidebar>
			<NavigationContainer>
			{
				ROUTES.filter(route => averageUserRoleInfo && route.role <= averageUserRoleInfo.role).map(route => {
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
