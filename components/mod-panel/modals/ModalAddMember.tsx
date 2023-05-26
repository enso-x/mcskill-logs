import React, { ChangeEvent, useEffect, useMemo, useState } from 'react';
import { Button, Input, Drawer, Select, Tabs } from 'antd';
import styled from 'styled-components';
import { PlusOutlined } from '@ant-design/icons';

import { useDebounce } from '@/helpers';
import { HorizontalLayout, VerticalLayout } from '@/components/Styled';
import { SERVERS } from '@/interfaces/Server';
import { EUserRoles, IUser, IUserServerRoleInfo, ROLES } from '@/interfaces/User';
import { getAverageUserRoleInfo, getUserRoleInfoForServer } from '@/helpers/users';
import { MinecraftSkin } from '@/components/mod-panel/MinecraftSkin';

const ContentContainer = styled.div`
	height: 100%;
	display: flex;
	flex-direction: column;
	gap: 16px;

	.ant-select-show-search:where(.css-dev-only-do-not-override-a1szv).ant-select:not(.ant-select-customize-input) .ant-select-selector {
		cursor: pointer;
	}

	.ant-input-group-addon {
		min-width: 140px;
		text-align: right;
	}
`;

const SkinContainer = styled.div`
	flex: 1;
	display: flex;
	justify-content: center;
	align-items: center;
`;

const DrawerControls = styled(HorizontalLayout)`
	justify-content: space-between;
	border-top: 2px solid var(--border-color);
	padding-top: 24px;
`;

interface IModalAddMemberProps {
	user: IUser;
	edit?: IUser;
	buttonContent?: React.ReactNode;
	selectedServers?: string[];
	onSubmit?: () => void;
}

export const ModalAddMember: React.FC<IModalAddMemberProps> = ({
	user,
	edit,
	selectedServers,
	buttonContent,
	onSubmit
}) => {
	const [ open, setOpen ] = useState(false);
	const [ confirmLoading, setConfirmLoading ] = useState(false);

	const [ username, setUsername ] = useState<string>(edit ? edit.username : '');
	const [ discordID, setDiscordID ] = useState<string>(edit ? edit.discord_id : '');
	const [ verbs, setVerbs ] = useState<string>(edit ? edit.verbs.toString() : '0');
	const [ warnings, setWarnings ] = useState<string>(edit ? edit.warnings.toString() : '0');
	const [ rolesInfo, setRolesInfo ] = useState<IUserServerRoleInfo[]>(edit && edit.roles ? edit.roles : []);
	const [ serverSelectValues, setServerSelectValues ] = useState<string[]>(rolesInfo.map(roleInfo => roleInfo.server));
	const [ roles, setRoles ] = useState<Record<string, number>>(rolesInfo.reduce((acc, next) => {
		acc[next.server] = next.role;
		return acc;
	}, {} as Record<string, number>));
	const [ points, setPoints ] = useState<Record<string, string>>(rolesInfo.reduce((acc, next) => {
		acc[next.server] = next.points.toString();
		return acc;
	}, {} as Record<string, string>));
	const debouncedUsername = useDebounce<string>(username, 200);

	const showModal = () => {
		setOpen(true);
	};

	const handleOk = async () => {
		setConfirmLoading(true);

		if (!username.length || !discordID.length || !rolesInfo.length || !verbs.length || !warnings.length) {
			setConfirmLoading(false);
			return;
		}

		const [ newUser ] = await fetch(edit ? `/api/users/edit` : `/api/users/create`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				username: username,
				discord_id: discordID,
				roles: rolesInfo,
				verbs: parseInt(verbs, 10),
				warnings: parseInt(warnings, 10)
			})
		}).then(res => res.json());

		if (newUser && newUser.roles.length) {
			handleCancel();
			onSubmit?.();
		} else {
			setConfirmLoading(false);
			return;
		}
	};

	const clearValues = () => {
		if (!edit) {
			setUsername('');
			setDiscordID('');
			setServerSelectValues([]);
			setRoles({});
			setPoints({});
			setRolesInfo([]);
		}
	};

	const handleCancel = () => {
		setOpen(false);
		setConfirmLoading(false);
		clearValues();
	};

	const handleUsernameChange = (e: ChangeEvent<HTMLInputElement>) => {
		setUsername(e.target.value.trim());
	};

	const handleDiscordIDChange = (e: ChangeEvent<HTMLInputElement>) => {
		setDiscordID(e.target.value.trim());
	};

	const handleVerbsChange = (e: ChangeEvent<HTMLInputElement>) => {
		setVerbs(e.target.value.trim());
	};

	const handleWarningsChange = (e: ChangeEvent<HTMLInputElement>) => {
		setWarnings(e.target.value.trim());
	};

	const handleServerSelectChange = (value: string[]) => {
		setServerSelectValues(value);
	};

	const handleRoleSelectChange = (server: string) => (value: string) => {
		setRoles((allRoles) => ({
			...allRoles,
			[server]: parseInt(value, 10)
		}));
	};

	const handlePointsChange = (server: string) => (e: ChangeEvent<HTMLInputElement>) => {
		setPoints(allPoints => ({
			...allPoints,
			[server]: e.target.value
		}));
	};

	useEffect(() => {
		const newRolesInfo = serverSelectValues.map(server => {
			const newRole = roles[server];
			const newPoints = parseInt(points[server], 10);
			return {
				server,
				role: newRole ? newRole : EUserRoles.player,
				points: !isNaN(newPoints) ? newPoints : 0
			};
		});
		setRolesInfo(newRolesInfo);
	}, [ serverSelectValues, roles, points ]);

	const isDisabled = (role: EUserRoles): boolean => {
		const userRole = user ? getAverageUserRoleInfo(user)?.role ?? EUserRoles.player : EUserRoles.player;
		const moderatorRole = edit ? getAverageUserRoleInfo(edit)?.role ?? EUserRoles.player : EUserRoles.player;
		return moderatorRole
			? userRole !== EUserRoles.creator && userRole < role || moderatorRole > userRole
			: false;
	};

	const allowedServers = useMemo(() => {
		return serverSelectValues.filter(server => {
			const userServerRole = getUserRoleInfoForServer(user, server)?.role ?? EUserRoles.player;
			const moderatorServerRole = edit ? getUserRoleInfoForServer(edit, server)?.role ?? EUserRoles.player : EUserRoles.player;

			return userServerRole >= EUserRoles.gm && (moderatorServerRole < userServerRole);
		}).sort();
	}, [ serverSelectValues ]);

	const tabItems = useMemo(() => {
		return allowedServers.map(server => {
			const userServerRole = getUserRoleInfoForServer(user, server);

			const availableRoles = userServerRole ? Object.entries(ROLES).filter(([ key ]) =>
				userServerRole.role === EUserRoles.creator ||
				parseInt(key, 10) < userServerRole.role
			).map(([ key, value ]) => ({
				label: value,
				value: key
			})) : [];

			return {
				key: server,
				label: SERVERS[server].label,
				children: (
					<VerticalLayout>
						<Select<string>
							key={ server }
							style={ { width: '100%' } }
							placeholder={ `Должность` }
							value={ roles[server]?.toString() ?? undefined }
							onChange={ handleRoleSelectChange(server) }
							options={ availableRoles }
						/>
						<Input placeholder="Кол-во баллов"
						       value={ points[server]?.toString() ?? '0' }
						       onChange={ handlePointsChange(server) } addonBefore="Кол-во баллов"/>
					</VerticalLayout>
				),
			};
		});
	}, [ user, allowedServers, roles, points ]);

	return (
		<>
			<Button type={ edit ? 'default' : 'primary' } onClick={ showModal }>
				{
					buttonContent ? buttonContent : <PlusOutlined/>
				}
			</Button>
			<Drawer
				title={ edit ? 'Изменить пользователя' : 'Добавить нового пользователя' }
				open={ open }
				width={ 540 }
				onClose={ handleCancel }
				closable={ false }
			>
				<ContentContainer>
					<Select
						mode="multiple"
						disabled={ isDisabled(EUserRoles.curator) }
						style={ { width: '100%' } }
						placeholder="Сервер"
						defaultValue={ [] }
						value={ serverSelectValues }
						onChange={ handleServerSelectChange }
						options={ Object.values(SERVERS).map((server) => {
							const userRole = getUserRoleInfoForServer(user, server.value)?.role ?? EUserRoles.player;
							const moderatorRole = edit ? getUserRoleInfoForServer(edit, server.value)?.role ?? EUserRoles.player : EUserRoles.player;

							return {
								disabled: userRole < EUserRoles.gm
									? true
									: moderatorRole >= userRole,
								label: server.label,
								value: server.value
							};
						}) }
					/>
					{
						allowedServers.length ? (
							<Tabs items={ tabItems }/>
						) : null
					}
					<Input placeholder="Никнейм" value={ username } disabled={ isDisabled(EUserRoles.gm) }
					       onChange={ handleUsernameChange } addonBefore="Никнейм"/>
					<Input placeholder="Discord ID" value={ discordID } disabled={ isDisabled(EUserRoles.gm) }
					       onChange={ handleDiscordIDChange } addonBefore="Discord ID"/>
					<Input placeholder="Устники" value={ verbs } disabled={ isDisabled(EUserRoles.st) }
					       onChange={ handleVerbsChange } addonBefore="Устники"/>
					<Input placeholder="Предупреждения" value={ warnings } disabled={ isDisabled(EUserRoles.st) }
					       onChange={ handleWarningsChange } addonBefore="Предупреждения"/>
					{ debouncedUsername && (
						<SkinContainer>
							<MinecraftSkin username={ debouncedUsername } mode={ 1 }/>
						</SkinContainer>
					) }
					<DrawerControls>
						<Button onClick={ handleCancel }>Отмена</Button>
						<Button onClick={ handleOk } type="primary" loading={ confirmLoading }>
							{ edit ? 'Изменить' : 'Создать' }
						</Button>
					</DrawerControls>
				</ContentContainer>
			</Drawer>
		</>
	);
};
