import React from 'react';
import styled, { css } from 'styled-components';
import { EditOutlined } from '@ant-design/icons';

import { HorizontalLayout } from '@/components/Styled';
import { ModalAddMember } from '@/components/mod-panel/modals/ModalAddMember';
import { InfinityIcon } from '@/components/mod-panel/icons/Infinity';
import { EUserRoles, IUser, ROLES } from '@/interfaces/User';

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

	button {
		position: absolute;
		opacity: 0;
		align-self: flex-end;
	}

	&:hover {
		button {
			opacity: 1;
		}
	}
`;

interface IOnlineIndicatorProps {
	$online: boolean;
}

const OnlineIndicator = styled.span<IOnlineIndicatorProps>`
	position: absolute;
	left: 16px;
	display: block;
	width: 12px;
	height: 12px;
	border-radius: 50%;
	background: #242424;
	
	${ (props) => props.$online ? css`
		background: #6aff36;
		border: 1px solid #1c6800;
		box-shadow: 0 0 4px #6aff36;
	` : css`
		background: #ff3636;
		border: 1px solid #680000;
		box-shadow: 0 0 4px #ff3636;
	` }
`;

const PointsContainer = styled(HorizontalLayout)`
	gap: 8px;
`;

interface IModeratorCardProps {
	user: IUser;
	moderator: IUser;
	isOnline: {
		title: string;
		status: boolean;
	};
	onUpdate: () => void;
}

export function ModeratorCard({
	user,
	moderator,
	isOnline,
	onUpdate
}: IModeratorCardProps) {
	return (
		<ModeratorCardContainer>
			{
				(user.role >= EUserRoles.st && user.role > moderator.role)
				|| user.role === EUserRoles.creator ? (
					<ModalAddMember user={ user } edit={ moderator }
					                buttonContent={ <EditOutlined/> }
					                onSubmit={ onUpdate }/>
				) : null
			}
			<OnlineIndicator title={ isOnline.title } $online={ isOnline.status }/>
			<img
				src={ `https://mcskill.net/MineCraft/?name=${ moderator.username }&mode=1` }
				alt="User skin"/>
			<span
				className={ EUserRoles[moderator.role] }>{ ROLES[moderator.role] }</span>
			<span>{ moderator.username }</span>
			<PointsContainer>
				Баллы: { moderator.points >= 0 ? moderator.points : (
				<InfinityIcon/>
			) }
			</PointsContainer>
		</ModeratorCardContainer>
	);
}