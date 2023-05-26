import React from 'react';
import styled from 'styled-components';
import { signOut, useSession } from 'next-auth/react';
import { Avatar, Button } from 'antd';
import { LogoutOutlined } from '@ant-design/icons';

import { InfinityIcon } from '@/components/mod-panel/icons/Infinity';
import { HorizontalLayout } from '@/components/Styled';
import { EUserRoles, ROLES } from '@/interfaces/User';
import { getAverageUserRoleInfo } from '@/helpers/users';

const HeaderContainer = styled.div`
	display: grid;
	grid-template-columns: 1fr 1fr 1fr;
	align-items: center;
	height: 64px;
	border-bottom: 1px solid var(--border-color);
	padding: 8px 16px;
`;

const HeaderUserInfo = styled.div`
	display: flex;
	align-items: center;
	gap: 16px;
`;

const HeaderTitle = styled.div`
	display: flex;
	justify-content: center;
	align-items: center;
	gap: 16px;

	span {
		font-size: 24px;
		font-family: monospace;
		white-space: nowrap;
	}
`;

const HeaderLogo = styled.img`
	max-height: 48px;
`;

const HeaderControls = styled.div`
	display: flex;
	justify-content: flex-end;
	align-items: center;
	gap: 16px;
`;

const PointsContainer = styled(HorizontalLayout)`
	gap: 8px;
`;

export function Header() {
	const { data: session, status, update } = useSession();

	if (!session) {
		return null;
	}

	const { user } = session;
	const averageUserRoleInfo = user ? getAverageUserRoleInfo(user) : null;

	const handleLogout = async () => {
		await signOut();
	};

	return (
		<HeaderContainer>
			<HeaderUserInfo>
				<Avatar
					src={ `/api/users/getSkin?username=${ user.username }&mode=5` }
					alt={ user.username } size={ 32 }/>
				<span>{ user.username }</span>
				{
					averageUserRoleInfo ? (
						<>
							<span>[<span className={ EUserRoles[averageUserRoleInfo.role] }>{ ROLES[averageUserRoleInfo.role] }</span>]</span>
							<PointsContainer>
								Баллы: { averageUserRoleInfo.points >= 0 ? averageUserRoleInfo.points : (
								<InfinityIcon/>
							) }
							</PointsContainer>
						</>
					) : null
				}
			</HeaderUserInfo>
			<HeaderTitle>
				<HeaderLogo src="/images/logo.png"/>
				<span>Pixelmon Mod panel</span>
			</HeaderTitle>
			<HeaderControls>
				<Button danger onClick={ handleLogout }>
					Выйти <LogoutOutlined/>
				</Button>
			</HeaderControls>
		</HeaderContainer>
	);
}