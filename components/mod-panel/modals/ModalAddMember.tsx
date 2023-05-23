import React, { ChangeEvent, useState } from 'react';
import { Button, Modal, Select, Input } from 'antd';
import styled from 'styled-components';

import { SERVERS } from '@/interfaces/Server';
import { IUser, ROLES } from '@/interfaces/User';
import { useDebounce } from '@/helpers';
import { PlusOutlined } from '@ant-design/icons';

const ContentContainer = styled.div`
	display: flex;
	flex-direction: column;
	gap: 16px;
	padding: 16px 0;

	.ant-select-show-search:where(.css-dev-only-do-not-override-a1szv).ant-select:not(.ant-select-customize-input) .ant-select-selector {
		cursor: pointer;
	}
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
	const [ points, setPoints ] = useState<string>(edit ? edit.points.toString() : '0');
	const [ serverSelectValues, setServerSelectValues ] = useState<string[]>(edit ? edit.servers : selectedServers ?? []);
	const [ roleSelectValues, setRoleSelectValues ] = useState<string[]>(edit ? [edit.role.toString()] : []);
	const debouncedUsername = useDebounce<string>(username, 200);

	const showModal = () => {
		setOpen(true);
	};

	const handleOk = async () => {
		setConfirmLoading(true);

		if (!username.length || !discordID.length || !points.length || !roleSelectValues.length) {
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
				role: roleSelectValues instanceof Array ? roleSelectValues[0] : roleSelectValues,
				points: points,
				servers: serverSelectValues
			})
		}).then(res => res.json());

		if (newUser && newUser.role) {
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
			setPoints('0');
			setServerSelectValues([]);
			setRoleSelectValues([]);
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

	const handlePointsChange = (e: ChangeEvent<HTMLInputElement>) => {
		setPoints(e.target.value.trim());
	};

	const handleServerSelectChange = (value: string[]) => {
		setServerSelectValues(value);
	};

	const handleRoleSelectChange = (value: string[]) => {
		setRoleSelectValues(value);
	};

	return (
		<>
			<Button type={ edit ? "default" : "primary" } onClick={ showModal }>
				{
					buttonContent ? buttonContent : <PlusOutlined />
				}
			</Button>
			<Modal
				title={ edit ? "Изменить пользователя" : "Добавить нового пользователя" }
				open={ open }
				onOk={ handleOk }
				confirmLoading={ confirmLoading }
				onCancel={ handleCancel }
			>
				<ContentContainer>
					<Select
						mode="multiple"
						style={ { width: '100%' } }
						placeholder="Сервер"
						defaultValue={ [] }
						value={ serverSelectValues }
						onChange={ handleServerSelectChange }
						options={ Object.values(SERVERS).map((server) => ({
							label: server.label,
							value: server.value
						})) }
					/>
					<Select
						style={ { width: '100%' } }
						placeholder="Должность"
						defaultValue={ [] }
						value={ roleSelectValues }
						onChange={ handleRoleSelectChange }
						options={ Object.entries(ROLES).filter(([ key, value ]) => user.role === 999 || parseInt(key, 10) < user.role).map(([ key, value ]) => ({
							label: value,
							value: key
						})) }
					/>
					<Input placeholder="Никнейм" value={ username } onChange={ handleUsernameChange }/>
					<Input placeholder="Discord ID" value={ discordID } onChange={ handleDiscordIDChange }/>
					<Input placeholder="Кол-во баллов" value={ points } onChange={ handlePointsChange }/>
					{ debouncedUsername && (
						<img style={{
							width: '128px',
							alignSelf: 'center'
						}} src={ `https://mcskill.net/MineCraft/?name=${ debouncedUsername }&mode=1` } alt="Skin preview"/>
					) }
				</ContentContainer>
			</Modal>
		</>
	);
};
