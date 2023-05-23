import React from 'react';
import styled, { css } from 'styled-components';
import { useRouter } from 'next/router';

import { EUserRoles } from '@/interfaces/User';
import { useSession } from 'next-auth/react';

const Sidebar = styled.div`
	display: flex;
	flex-direction: column;
	width: 240px;
	flex-shrink: 0;
	border-right: 2px solid #242424;
`;

interface ISidebarItemProps {
	$active?: boolean;
}

const SidebarItem = styled.a<ISidebarItemProps>`
	padding: 16px 32px;
	color: #fff;

	${ (props) => props.$active ? css`background: var(--accent-color);` : '' }
	&:not(:last-child) {
		border-bottom: 1px solid #242424;
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
];

export function Navigation() {
	const router = useRouter();
	const { data: session } = useSession();

	if (!session) {
		return null;
	}

	return (
		<Sidebar>
			{
				ROUTES.filter(route => route.role <= session?.user.role).map(route => (
					<SidebarItem key={ route.id }
					             $active={ router.route === route.url }
					             href={ router.route === route.url ? undefined : route.url }
					>
						{ route.label }
					</SidebarItem>
				))
			}
		</Sidebar>
	);
}
