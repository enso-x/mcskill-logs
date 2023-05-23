import React, { useState } from 'react';
import { Button, Popconfirm } from 'antd';
import { DeleteOutlined } from '@ant-design/icons';

import { IUser } from '@/interfaces/User';

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
