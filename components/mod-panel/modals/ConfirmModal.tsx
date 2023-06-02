import React, { useState } from 'react';
import { Button, Modal } from 'antd';
import { BaseButtonProps } from 'antd/es/button/button';

interface IConfirmModalProps {
	title: string;
	content: React.ReactNode;
	onSubmit?: () => Promise<void>;
	buttonContent?: React.ReactNode;
	buttonProps?: Partial<BaseButtonProps>;
}

export function ConfirmModal({
	title,
	content,
	onSubmit,
	buttonContent,
	buttonProps
}: IConfirmModalProps) {
	const [ open, setOpen ] = useState(false);
	const [ confirmLoading, setConfirmLoading ] = useState(false);

	const showModal = () => {
		setOpen(true);
	};

	const handleOk = async () => {
		setConfirmLoading(true);

		await onSubmit?.();

		setOpen(false);
		setConfirmLoading(false);
	};

	const handleCancel = () => {
		setOpen(false);
	};

	return (
		<>
			<Button onClick={ showModal } { ...buttonProps }>
				{
					buttonContent ? buttonContent : 'OK'
				}
			</Button>
			<Modal
				title={ title }
				open={ open }
				onOk={ handleOk }
				confirmLoading={ confirmLoading }
				onCancel={ handleCancel }
			>
				{ content }
			</Modal>
		</>
	);
}
