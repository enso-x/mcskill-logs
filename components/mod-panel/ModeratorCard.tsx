import React from 'react';
import styled from 'styled-components';
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

const PointsContainer = styled(HorizontalLayout)`
	gap: 8px;
`;

interface IModeratorCardProps {
	user: IUser;
	moderator: IUser;
	onUpdate: () => void;
}

export function ModeratorCard({
	user,
	moderator,
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
