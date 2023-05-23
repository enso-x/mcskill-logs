import React from 'react';
import styled, { css } from 'styled-components';
import { EditOutlined } from '@ant-design/icons';

import { HorizontalLayout, VerticalLayout } from '@/components/Styled';
import { ModalAddMember } from '@/components/mod-panel/modals/ModalAddMember';
import { InfinityIcon } from '@/components/mod-panel/icons/Infinity';
import { EUserRoles, IUser, ROLES } from '@/interfaces/User';
import { ModalDeleteMember } from '@/components/mod-panel/modals/ModalDeleteMember';

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

interface IOnlineIndicatorProps {
	$online: boolean;
}

const OnlineIndicator = styled.span<IOnlineIndicatorProps>`
	position: absolute;
	align-self: flex-start;
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
			<OnlineIndicator title={ isOnline.title } $online={ isOnline.status }/>
			<ButtonsContainer>
				{
					(user.role >= EUserRoles.st && user.role > moderator.role)
					|| user.role === EUserRoles.creator ? (
						<ModalAddMember user={ user } edit={ moderator }
						                buttonContent={ <EditOutlined/> }
						                onSubmit={ onUpdate }/>
					) : null
				}
				{
					(user.role >= EUserRoles.st && user.role > moderator.role)
					|| user.role === EUserRoles.creator ? (
						<ModalDeleteMember user={ moderator }
						                   onSubmit={ onUpdate }/>
					) : null
				}
			</ButtonsContainer>
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
