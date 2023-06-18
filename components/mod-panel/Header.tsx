import React from 'react';
import styled from 'styled-components';
import { signOut, useSession } from 'next-auth/react';
import { Avatar, Button } from 'antd';
import { LogoutOutlined } from '@ant-design/icons';

import { MinecraftFaceViewer } from '@/components/mod-panel/MinecraftFaceViewer';
import { UserRole } from '@/components/mod-panel/UserRole';
import { Price } from '@/components/mod-panel/Price';
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
	max-height: 42px;
`;

const HeaderControls = styled.div`
	display: flex;
	justify-content: flex-end;
	align-items: center;
	gap: 16px;
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
					src={ <MinecraftFaceViewer username={ user.username }/> }
					alt={ user.username } size={ 34 }/>
				<span>{ user.username }</span>
				{
					averageUserRoleInfo ? (
						<>
							<UserRole roleInfo={averageUserRoleInfo} addonBefore="[" addonAfter="]"/>
							<Price value={ averageUserRoleInfo.points } addonBefore="(" addonAfter=")"/>
						</>
					) : null
				}
			</HeaderUserInfo>
			<HeaderTitle>
				<HeaderLogo src="/images/logo.svg"/>
			</HeaderTitle>
			<HeaderControls>
				<Button danger onClick={ handleLogout }>
					Выйти <LogoutOutlined/>
				</Button>
			</HeaderControls>
		</HeaderContainer>
	);
}