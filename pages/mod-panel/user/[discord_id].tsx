import React, { useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';
import { NextPage } from 'next';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { Card, Descriptions, Tabs } from 'antd';
import { EditOutlined } from '@ant-design/icons';

import { HorizontalLayout, OnlineIndicator, VerticalLayout } from '@/components/Styled';
import { Loading, LoadingContainer } from '@/components/mod-panel/Loading';
import { ModPanelPage, ModPanelPageContent } from '@/components/mod-panel/ModPanelPage';
import { MinecraftSkinViewer3D } from '@/components/mod-panel/MinecraftSkinViewer3D';
import { ModalAddMember } from '@/components/mod-panel/modals/ModalAddMember';
import { UserRole } from '@/components/mod-panel/UserRole';
import { Price } from '@/components/mod-panel/Price';
import { getAverageUserRoleInfo, getUserHasAccess } from '@/helpers/users';
import { onlineAPI } from '@/helpers/mod-panel';
import { IUserOnlineStatus, TUserServerOnlineStatus } from '@/helpers/mod-panel/online';
import { EUserRoles, IUser } from '@/interfaces/User';
import { SERVERS } from '@/interfaces/Server';

const SkinContainer = styled.div`
	display: flex;
	justify-content: center;
	align-items: center;
	min-width: 360px;
`;

const ModPanelPageContentStyled = styled(ModPanelPageContent)`
	flex: 1;
`;

const TabItemDescriptions = styled.div`
	.ant-descriptions .ant-descriptions-item-content span {
		display: flex;
		line-height: 24px;
	}
`;

const ModPanelUserPage: NextPage = () => {
	const router = useRouter();
	const { data: session, update: updateSession } = useSession();
	const [ moderator, setModerator ] = useState<IUser | null>(null);
	const [ onlineStatus, setOnlineStatus ] = useState<IUserOnlineStatus>({
		title: 'Offline',
		isOnline: false
	});

	const tabItems = useMemo(() => {
		return moderator ? moderator.roles.map(role => ({
			key: `${ role.server }-${ role.role }`,
			label: SERVERS[role.server].label,
			children: (
				<TabItemDescriptions>
					<Descriptions bordered column={ 1 } labelStyle={ {
						width: 240
					} }>
						<Descriptions.Item label="Роль">
							<UserRole roleInfo={ role }/>
						</Descriptions.Item>
						<Descriptions.Item label="Кол-во баллов">
							<Price value={ role.points }/>
						</Descriptions.Item>
					</Descriptions>
				</TabItemDescriptions>
			)
		})) : [];
	}, [ moderator ]);

	const updateModerator = async () => {
		const [ moderator ] = await fetch(`/api/users/getByDiscordID?id=${ router.query.discord_id }`).then<IUser[]>(res => res.json());

		if (moderator) {
			setModerator(moderator);
			if (moderator.discord_id === session?.user.discord_id) {
				await updateSession();
			}
		}
	};

	const fetchOnlineStatus = async () => {
		const serverStatuses: TUserServerOnlineStatus = {};
		if (moderator) {
			for (let server of Object.values(SERVERS)) {
				if (!server.active) continue;
				serverStatuses[server.value] = await onlineAPI.fetchUsersOnlineStatusForServer(server, [ moderator.username ]);
			}
			const status = onlineAPI.getUserOnlineStatus(moderator, serverStatuses);
			setOnlineStatus(status);
		}
	};

	useEffect(() => {
		if (router.query && router.query.discord_id) {
			(async () => {
				await updateModerator();
			})();
		}
	}, [ router ]);

	useEffect(() => {
		(async () => {
			await fetchOnlineStatus();
		})();
	}, [ moderator ]);

	const hasAccess = getUserHasAccess(session?.user, moderator);

	return (
		<ModPanelPage>
			{
				!session ? (
					<LoadingContainer>
						<Loading/>
					</LoadingContainer>
				) : (
					<>
						<ModPanelPageContentStyled className={moderator && getAverageUserRoleInfo(moderator).role === EUserRoles.creator ? 'glitch-content' : ''}>
							{
								!moderator ? (
									<LoadingContainer>
										<Loading/>
									</LoadingContainer>
								) : (
									<Card title={
										<HorizontalLayout>
											<span>{ moderator.username }</span>
										</HorizontalLayout>
									} extra={
										hasAccess(EUserRoles.st) ? (
											<ModalAddMember user={ session.user } edit={ moderator }
											                buttonContent={ <EditOutlined/> }
											                onSubmit={ updateModerator }/>
										) : null
									}>
										<HorizontalLayout>
											<SkinContainer>
												<MinecraftSkinViewer3D username={ moderator.username }/>
											</SkinContainer>
											<VerticalLayout style={ {
												flex: '1',
												alignSelf: 'flex-start',
												overflow: 'auto'
											} }>
												<Descriptions bordered column={ 1 } labelStyle={ {
													width: 240
												} }>
													<Descriptions.Item
														label="Статус">
														<HorizontalLayout>
															<OnlineIndicator $online={ onlineStatus.isOnline }/>
															<span>{ onlineStatus.title }</span>
														</HorizontalLayout>
													</Descriptions.Item>
													<Descriptions.Item
														label="Никнейм">{ moderator.username }</Descriptions.Item>
													<Descriptions.Item
														label="Discord ID">{ moderator.discord_id }</Descriptions.Item>
													<Descriptions.Item
														label="Устники">{ moderator.verbs }</Descriptions.Item>
													<Descriptions.Item
														label="Предупреждения">{ moderator.warnings }</Descriptions.Item>
												</Descriptions>
												<Tabs items={ tabItems }/>
											</VerticalLayout>
										</HorizontalLayout>
									</Card>
								)
							}
						</ModPanelPageContentStyled>
					</>
				)
			}
		</ModPanelPage>
	);
};

export default ModPanelUserPage;
