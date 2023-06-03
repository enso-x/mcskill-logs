import React, { useState } from 'react';
import styled from 'styled-components';
import moment from 'moment';
import dayjs from 'dayjs';
import { Button, Drawer, Select, DatePicker, Typography } from 'antd';
import { PlusOutlined } from '@ant-design/icons';

import { HorizontalLayout, VerticalLayout } from '@/components/Styled';
import { IUser } from '@/interfaces/User';
import { getUsernames } from '@/helpers/users';
import { IVacation } from '@/interfaces/Vacation';

const { RangePicker } = DatePicker;
const { Text } = Typography;

const InputLayout = styled(VerticalLayout)`
	gap: 8px;
`;

const ContentContainer = styled.div`
	height: 100%;
	display: flex;
	flex-direction: column;
	gap: 16px;
	overflow: auto;

	.ant-select-show-search:where(.css-dev-only-do-not-override-a1szv).ant-select:not(.ant-select-customize-input) .ant-select-selector {
		cursor: pointer;
	}

	.ant-input-group-addon {
		min-width: 140px;
		text-align: right;
	}
`;

const EmptySpace = styled.div`
	flex: 1;
`;

const DrawerControls = styled(HorizontalLayout)`
	justify-content: space-between;
	border-top: 1px solid var(--border-color);
	padding-top: 24px;
`;

interface IModalAddMemberProps {
	allUsers: IUser[];
	vacation?: IVacation;
	buttonContent?: React.ReactNode;
	onSubmit?: () => void;
}

export const ModalAddVacation: React.FC<IModalAddMemberProps> = ({
	allUsers,
	vacation,
	buttonContent,
	onSubmit
}) => {
	const [ open, setOpen ] = useState(false);
	const [ confirmLoading, setConfirmLoading ] = useState(false);

	const [ username, setUsername ] = useState<string>(vacation ? vacation.username : '');
	const [ from, setFrom ] = useState<Date>(vacation ? new Date(vacation.from) : new Date());
	const [ to, setTo ] = useState<Date>(vacation ? new Date(vacation.to) : new Date());

	const showModal = () => {
		setOpen(true);
	};

	const handleOk = async () => {
		setConfirmLoading(true);

		if (!username.length || !from || !to) {
			setConfirmLoading(false);
			return;
		}

		const [ newVacation ] = await fetch(vacation ? `/api/vacations/edit` : `/api/vacations/create`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				id: vacation?._id ?? '',
				username: username,
				from: from,
				to: to
			})
		}).then(res => res.json());

		if (newVacation) {
			handleCancel();
			onSubmit?.();
		} else {
			setConfirmLoading(false);
			return;
		}
	};

	const clearValues = () => {
		if (!vacation) {
			setUsername('');
			setFrom(new Date());
			setTo(new Date());
		}
	};

	const handleCancel = () => {
		setOpen(false);
		setConfirmLoading(false);
		clearValues();
	};

	const handleUsernameChange = (value: string) => {
		setUsername(value);
	};

	const handleRangeChange = (_: any, dates: string[]) => {
		const startDate = moment(dates[0]).startOf('day').toDate();
		const endDate = moment(dates[1]).endOf('day').toDate();

		setFrom(startDate);
		setTo(endDate);
	};

	return (
		<>
			<Button type={ vacation ? 'default' : 'primary' } onClick={ showModal }>
				{
					buttonContent ? buttonContent : <PlusOutlined/>
				}
			</Button>
			<Drawer
				title={ vacation ? 'Редактирование отпуска' : 'Добавить отпуск' }
				open={ open }
				width={ 540 }
				onClose={ handleCancel }
				closable={ false }
			>
				<ContentContainer>
					<InputLayout>
						<Text>Модератор</Text>
						<Select<string>
							style={ { width: '100%' } }
							placeholder="Модератор"
							value={ username }
							onChange={ handleUsernameChange }
							options={ getUsernames(allUsers).map((username) => ({
								label: username,
								value: username
							})) }
						/>
					</InputLayout>
					<InputLayout>
						Длительность отпуска
						<RangePicker value={ [ dayjs(from), dayjs(to) ] } onChange={ handleRangeChange }
						             format="YYYY-MM-DD"/>
					</InputLayout>
					<EmptySpace/>
					<DrawerControls>
						<Button onClick={ handleCancel }>Отмена</Button>
						<Button onClick={ handleOk } type="primary" loading={ confirmLoading }>
							{ vacation ? 'Изменить' : 'Добавить' }
						</Button>
					</DrawerControls>
				</ContentContainer>
			</Drawer>
		</>
	);
};
