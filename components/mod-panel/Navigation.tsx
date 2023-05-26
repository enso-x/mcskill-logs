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
	border-right: 2px solid var(--border-color);
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
		label: 'Наказания',
		url: '/mod-panel/punishments',
		role: EUserRoles.helper
	},
	{
		id: 'route-2',
		label: 'Интервью',
		url: '/mod-panel/interview',
		role: EUserRoles.st
	},
	{
		id: 'route-3',
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
				ROUTES.filter(route => averageUserRoleInfo && route.role <= averageUserRoleInfo.role).map(route => (
					<SidebarItem key={ route.id } $active={ router.route === route.url }>
						<Link href={ route.url }>
							{ route.label }
						</Link>
					</SidebarItem>
				))
			}
			</NavigationContainer>
			<ServerMonitoring/>
		</Sidebar>
	);
}
