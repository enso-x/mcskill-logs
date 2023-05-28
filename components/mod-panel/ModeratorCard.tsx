import React, { useState } from 'react';
import styled from 'styled-components';
import { EditOutlined } from '@ant-design/icons';

import { HorizontalLayout, VerticalLayout, OnlineIndicator } from '@/components/Styled';
import { ModalAddMember } from '@/components/mod-panel/modals/ModalAddMember';
import { ModalDeleteMember } from '@/components/mod-panel/modals/ModalDeleteMember';
import { InfinityIcon } from '@/components/mod-panel/icons/Infinity';
import { EUserRoles, IUser, ROLES } from '@/interfaces/User';
import { IUserOnlineStatus } from '@/helpers/mod-panel/online';
import { getAverageUserRoleInfo } from '@/helpers/users';
import { MinecraftSkinViewer3D } from '@/components/mod-panel/MinecraftSkinViewer3D';

const ButtonsContainer = styled(VerticalLayout)`
	gap: 8px;
	position: absolute;
	align-self: flex-end;
	opacity: 0;
`;

const SkinContainer = styled.div`
	display: flex;

	> div {
		height: 128px;

		.mc-skin-viewer {
			transform: scale(0.34) translateY(40px);
		}
	}
`;

const ModeratorCardContainer = styled.div`
	display: flex;
	flex-direction: column;
	min-width: 240px;
	gap: 14px;
	align-items: center;
	padding: 16px;
	border: 1px solid var(--border-color);
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

	span {
		line-height: 24px;
	}
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

	const [ isCardHovered, setIsCardHovered ] = useState<boolean>(false);

	const userAverageRoleInfo = getAverageUserRoleInfo(user);
	const moderatorAverageRoleInfo = getAverageUserRoleInfo(moderator);

	const hasAccess = () => {
		return (userAverageRoleInfo.role >= EUserRoles.st && userAverageRoleInfo.role > moderatorAverageRoleInfo.role)
			|| userAverageRoleInfo.role === EUserRoles.creator;
	};

	const handleCardMouseEnter = () => {
		if (!isCardHovered) {
			setIsCardHovered(true);
		}
	};

	const handleCardMouseOut: React.MouseEventHandler<HTMLDivElement> = (e) => {
		if (e.currentTarget.contains(e.relatedTarget as Node)) return;
		setIsCardHovered(false);
	};

	return (
		<ModeratorCardContainer onMouseEnter={ handleCardMouseEnter } onMouseOut={ handleCardMouseOut }>
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
			<SkinContainer>
				<MinecraftSkinViewer3D username={ moderator.username } is2D={ !isCardHovered }/>
			</SkinContainer>
			<span
				className={ EUserRoles[moderatorAverageRoleInfo.role] }>{ ROLES[moderatorAverageRoleInfo.role] }</span>
			<span>{ moderator.username }</span>
			<PointsContainer>
				Баллы: { moderatorAverageRoleInfo.points >= 0 ? (
				<span>{ moderatorAverageRoleInfo.points }</span>
			) : (
				<InfinityIcon/>
			) }
			</PointsContainer>
		</ModeratorCardContainer>
	);
}
