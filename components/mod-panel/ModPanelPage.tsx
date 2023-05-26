import React from 'react';
import styled from 'styled-components';

import { Page } from '@/components/Page';
import { NotAuthorized } from '@/components/mod-panel/errors/NotAuthorized';
import { Forbidden } from '@/components/mod-panel/errors/Forbidden';
import { Header } from '@/components/mod-panel/Header';
import { Navigation } from '@/components/mod-panel/Navigation';
import { EUserRoles, IUser } from '@/interfaces/User';
import { signOut, useSession } from 'next-auth/react';
import { getAverageUserRoleInfo } from '@/helpers/users';

const AppContainer = styled.div`
	display: flex;
	flex-direction: column;
	height: 100vh;
	background: #141414;
`;

const MainContainer = styled.div`
	display: flex;
	flex: 1;
	overflow: hidden;
`;

const Content = styled.div`
	flex: 1;
	overflow: hidden;
	display: flex;
	flex-direction: column;
`;

export const ModPanelPageControls = styled.div`
	display: flex;
	padding: 16px;
	justify-content: space-between;
	border-bottom: 1px solid var(--border-color);

	.ant-select-show-search:where(.css-dev-only-do-not-override-a1szv).ant-select:not(.ant-select-customize-input) .ant-select-selector {
		cursor: pointer;
	}
`;

export const ModPanelPageContent = styled.div`
	display: flex;
	flex-direction: column;
	gap: 16px;
	padding: 16px;
	overflow-y: auto;

	.ant-table-wrapper .ant-table-container {
		border-radius: 8px;
	}

	.ant-table-wrapper .ant-table-container table tr:not(thead > tr):last-child > *:last-child {
		border-end-end-radius: 8px;
	}

	.ant-table-wrapper .ant-table-container table tr:not(thead > tr):last-child > *:first-child {
		border-end-start-radius: 8px;
	}
`;

interface IModPanelPageProps extends React.PropsWithChildren {
	needRole?: EUserRoles;
}

export function ModPanelPage({
	children,
	needRole = EUserRoles.player
}: IModPanelPageProps) {
	const { data: session } = useSession();

	if (session === undefined) {
		return null;
	}

	const averageUserRoleInfo = session ? session.user ? getAverageUserRoleInfo(session.user) : null : null;

	return (
		<Page title={ 'Pixelmon Mod panel' }>
			{
				session === null ? (
					<NotAuthorized/>
				) : averageUserRoleInfo && averageUserRoleInfo.role < needRole ? (
					<Forbidden/>
				) : (
					<AppContainer>
						<Header/>
						<MainContainer>
							<Navigation/>
							<Content>
								{ children }
							</Content>
						</MainContainer>
					</AppContainer>
				)
			}
		</Page>
	);
}
