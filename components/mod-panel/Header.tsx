import React from 'react';
import styled from 'styled-components';
import { signOut, useSession } from 'next-auth/react';
import { Avatar, Button } from 'antd';
import { LogoutOutlined } from '@ant-design/icons';

import { InfinityIcon } from '@/components/mod-panel/icons/Infinity';
import { HorizontalLayout } from '@/components/Styled';
import { EUserRoles, ROLES } from '@/interfaces/User';

const HeaderContainer = styled.div`
	display: grid;
	grid-template-columns: 1fr 1fr 1fr;
	align-items: center;
	height: 64px;
	border-bottom: 2px solid #242424;
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

	const handleLogout = async () => {
		await signOut();
	};

	return (
		<HeaderContainer>
			<HeaderUserInfo>
				<Avatar
					src={ `https://mcskill.net/MineCraft/?name=${ user.username }&mode=5` }
					alt={ user.username } size={ 32 }/>
				<span>{ user.username }</span>
				<span>[<span className={ EUserRoles[user.role] }>{ ROLES[user.role] }</span>]</span>
				<PointsContainer>
					Баллы: { user.points >= 0 ? user.points : (
						<InfinityIcon/>
					) }
				</PointsContainer>
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