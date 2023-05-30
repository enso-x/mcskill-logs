import React, { useEffect, useState } from 'react';
import styled, { css } from 'styled-components';
import { Button } from 'antd';
import { EditOutlined, FieldTimeOutlined } from '@ant-design/icons';

import { HorizontalLayout, VerticalLayout, OnlineIndicator } from '@/components/Styled';
import { ModalAddMember } from '@/components/mod-panel/modals/ModalAddMember';
import { ModalDeleteMember } from '@/components/mod-panel/modals/ModalDeleteMember';
import { InfinityIcon } from '@/components/mod-panel/icons/Infinity';
import { EUserRoles, IUser, ROLES } from '@/interfaces/User';
import { DURATION_LOGS_STORAGE_KEY, IUserOnlineStatus } from '@/helpers/mod-panel/online';
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

interface IModeratorCardContainerProps {
	verbs: number;
	warnings: number;
}

const ModeratorCardContainer = styled.div<IModeratorCardContainerProps>`
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

	${ props => props.warnings ? css`
		border: 1px solid ${ props.warnings === 1 ? '#560000' : '#9a0000' };
		${ props.warnings === 2 ? 'background: #1e0000;' : null }
		${ props.warnings === 3 ? css`
			background: #1e0000;

			&::after {
				content: '!';
				display: flex;
				justify-content: center;
				align-items: center;
				width: 24px;
				height: 24px;
				background: #9a0000;
				border-radius: 4px;
				position: absolute;
				bottom: 8px;
				left: 8px;
			}
		` : null }
	` : props.verbs ? css`
		border: 1px solid ${ props.verbs === 1 ? '#5e4600' : '#9a7200' };
		${ props.verbs === 2 ? 'background: #1e1600;' : null }
		${ props.verbs === 3 ? css`
			background: #1e1600;

			&::after {
				content: '!';
				display: flex;
				justify-content: center;
				align-items: center;
				width: 24px;
				height: 24px;
				background: #9a7200;
				border-radius: 4px;
				position: absolute;
				bottom: 8px;
				left: 8px;
			}
		` : null }
	` : null }
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
	const [ durationLogs, setDurationLogs ] = useState<string>('');

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

	const handleDurationLogsClick = () => {
		const link = document.createElement('a');
		link.setAttribute('href', `data:text/plain;charset=utf-8,${ durationLogs }`);
		link.setAttribute('download', `${ moderator.username }.log`);
		link.style.display = 'none';
		document.body.append(link);
		link.click();
		link.remove();
	};

	useEffect(() => {
		const durationLogsData = localStorage.getItem(DURATION_LOGS_STORAGE_KEY + moderator.username);
		if (durationLogsData && durationLogsData.length) {
			setDurationLogs(durationLogsData);
		}
		return () => {
			setIsCardHovered(false);
		};
	}, [ moderator ]);

	return (
		<ModeratorCardContainer onMouseEnter={ handleCardMouseEnter } onMouseOut={ handleCardMouseOut }
		                        verbs={ moderator.verbs } warnings={ moderator.warnings }>
			<CardOnlineIndicator title={ onlineStatus.title } $online={ onlineStatus.isOnline }/>
			<ButtonsContainer>
				{
					hasAccess() && durationLogs.length ? (
						<Button onClick={ handleDurationLogsClick }>
							<FieldTimeOutlined/>
						</Button>
					) : null
				}
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
