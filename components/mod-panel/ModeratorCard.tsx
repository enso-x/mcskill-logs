import React from 'react';
import styled from 'styled-components';
import { EditOutlined } from '@ant-design/icons';

import { HorizontalLayout, VerticalLayout, OnlineIndicator } from '@/components/Styled';
import { ModalAddMember } from '@/components/mod-panel/modals/ModalAddMember';
import { ModalDeleteMember } from '@/components/mod-panel/modals/ModalDeleteMember';
import { InfinityIcon } from '@/components/mod-panel/icons/Infinity';
import { EUserRoles, IUser, ROLES } from '@/interfaces/User';
import { IUserOnlineStatus } from '@/helpers/mod-panel/online';
import { getAverageUserRoleInfo } from '@/helpers/users';

const ButtonsContainer = styled(VerticalLayout)`
	gap: 8px;
	position: absolute;
	align-self: flex-end;
	opacity: 0;
`;

const ModeratorCardContainer = styled.div`
	display: flex;
	flex-direction: column;
	min-width: 240px;
	gap: 14px;
	align-items: center;
	padding: 16px;
	border: 1px solid #242424;
	border-radius: 8px;

	img {
		max-height: 128px;
	}

	&:hover {
		${ ButtonsContainer } {
			opacity: 1;
		}
	}
`;

const CardOnlineIndicator = styled(OnlineIndicator)`
	position: absolute;
	align-self: flex-start;
`;

const PointsContainer = styled(HorizontalLayout)`
	gap: 8px;
`;

interface IModeratorCardProps {
	user: IUser;
	moderator: IUser;
	onlineStatus: IUserOnlineStatus;
	onUpdate: () => void;
}

export function ModeratorCard({
	user,
	moderator,
	onlineStatus,
	onUpdate
}: IModeratorCardProps) {
	if (!user) return null;

	const userAverageRoleInfo = getAverageUserRoleInfo(user);
	const moderatorAverageRoleInfo = getAverageUserRoleInfo(moderator);

	const hasAccess = () => {
		return (userAverageRoleInfo.role >= EUserRoles.st && userAverageRoleInfo.role > moderatorAverageRoleInfo.role)
			|| userAverageRoleInfo.role === EUserRoles.creator;
	};

	return (
		<ModeratorCardContainer>
			<CardOnlineIndicator title={ onlineStatus.title } $online={ onlineStatus.isOnline }/>
			<ButtonsContainer>
				{
					hasAccess() ? (
						<ModalAddMember user={ user } edit={ moderator }
						                buttonContent={ <EditOutlined/> }
						                onSubmit={ onUpdate }/>
					) : null
				}
				{
					hasAccess() ? (
						<ModalDeleteMember user={ moderator }
						                   onSubmit={ onUpdate }/>
					) : null
				}
			</ButtonsContainer>
			<img
				src={ `https://mcskill.net/MineCraft/?name=${ moderator.username }&mode=1` }
				alt="User skin"/>
			<span
				className={ EUserRoles[moderatorAverageRoleInfo.role] }>{ ROLES[moderatorAverageRoleInfo.role] }</span>
			<span>{ moderator.username }</span>
			<PointsContainer>
				Баллы: { moderatorAverageRoleInfo.points >= 0 ? moderatorAverageRoleInfo.points : (
				<InfinityIcon/>
			) }
			</PointsContainer>
		</ModeratorCardContainer>
	);
}
