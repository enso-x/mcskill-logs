import React, { ChangeEvent, useState } from 'react';
import { Button, Popconfirm } from 'antd';
import styled from 'styled-components';

import { SERVERS } from '@/interfaces/Server';
import { EUserRoles, IUser, ROLES } from '@/interfaces/User';
import { useDebounce } from '@/helpers';
import { DeleteOutlined } from '@ant-design/icons';

const ContentContainer = styled.div`
	display: flex;
	flex-direction: column;
	gap: 16px;
	padding: 16px 0;

	.ant-select-show-search:where(.css-dev-only-do-not-override-a1szv).ant-select:not(.ant-select-customize-input) .ant-select-selector {
		cursor: pointer;
	}
`;

interface IModalDeleteMemberProps {
	user: IUser;
	onSubmit?: () => void;
}

export const ModalDeleteMember: React.FC<IModalDeleteMemberProps> = ({
	user,
	onSubmit
}) => {
	const [ open, setOpen ] = useState(false);
	const [ confirmLoading, setConfirmLoading ] = useState(false);

	const showPopconfirm = () => {
		setOpen(true);
	};

	const handleOk = async () => {
		setConfirmLoading(true);

		await fetch(`/api/users/delete?discord_id=${ user.discord_id }`, {
			method: 'DELETE'
		}).then(res => res.json());

		handleCancel();
		onSubmit?.();
	};

	const handleCancel = () => {
		setOpen(false);
		setConfirmLoading(false);
	};

	return (
		<Popconfirm
			placement="bottomRight"
			title="Удалить пользователя"
			description="Вы действительно хотите удалить этого пользователя?"
			okText="Удалить"
			cancelText="Отмена"
			open={ open }
			onConfirm={ handleOk }
			okButtonProps={ { loading: confirmLoading, danger: true } }
			onCancel={ handleCancel }
			zIndex={ 99 }
			overlayStyle={ {
				width: 'max-content',
				opacity: 1
			} }
			getPopupContainer={ (triggerNode: HTMLElement) => triggerNode.parentElement!.parentElement! }
			mouseLeaveDelay={ 2 }
		>
			<Button danger onClick={ showPopconfirm }>
				<DeleteOutlined/>
			</Button>
		</Popconfirm>
	);
};
