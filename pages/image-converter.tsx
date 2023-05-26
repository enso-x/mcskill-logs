import React, { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import { NextPage } from 'next';

import { PlusOutlined } from '@ant-design/icons';
import { Modal, Upload } from 'antd';
import type { RcFile, UploadProps } from 'antd/es/upload';
import type { UploadFile } from 'antd/es/upload/interface';

import { HorizontalLayout } from '@/components/Styled';

import { Page } from '@/components/Page';

const Container = styled.div`
	height: 100%;
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;

	.ant-upload-wrapper.ant-upload-picture-card-wrapper {
		width: auto;
	}
`;

const getBase64 = (file: RcFile): Promise<string> =>
	new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.readAsDataURL(file);
		reader.onload = () => resolve(reader.result as string);
		reader.onerror = (error) => reject(error);
	});

const ImageConverterPage: NextPage = () => {
	const [ previewOpen, setPreviewOpen ] = useState(false);
	const [ previewImage, setPreviewImage ] = useState('');
	const [ previewTitle, setPreviewTitle ] = useState('');
	const [ fileList, setFileList ] = useState<UploadFile[]>([]);
	const canvasContainerRef = useRef<HTMLDivElement | null>(null);

	const handleCancel = () => setPreviewOpen(false);

	const handlePreview = async (file: UploadFile) => {
		if (!file.url && !file.preview) {
			file.preview = await getBase64(file.originFileObj as RcFile);
		}

		setPreviewImage(file.url || (file.preview as string));
		setPreviewOpen(true);
		setPreviewTitle(file.name || file.url!.substring(file.url!.lastIndexOf('/') + 1));
	};

	const handleChange: UploadProps['onChange'] = ({ fileList: newFileList }) =>
		setFileList(newFileList);

	useEffect(() => {
		if (canvasContainerRef && canvasContainerRef.current) {
			const getImageData = (file: UploadFile): Promise<string> => new Promise((resolve) => {
				const reader = new FileReader();
				reader.onload = () => {
					resolve(reader.result as string);
				};
				reader.readAsDataURL(file.originFileObj!);
			});

			fileList.forEach(async (file) => {
				const imageData = await getImageData(file);

				const image = new Image();
				image.src = imageData;

				if (image && canvasContainerRef.current) {
					canvasContainerRef.current.innerHTML = '';

					const canvas32Container = document.createElement('div');
					canvas32Container.style.display = 'flex';
					canvas32Container.style.border = '1px solid var(--border-color)';
					canvas32Container.style.borderRadius = '8px';
					canvas32Container.style.padding = '8px';

					const canvas200Container = document.createElement('div');
					canvas200Container.style.display = 'flex';
					canvas200Container.style.border = '1px solid var(--border-color)';
					canvas200Container.style.borderRadius = '8px';
					canvas200Container.style.padding = '8px';

					const canvas32 = document.createElement('canvas');
					canvas32.style.imageRendering = 'pixelated';
					canvas32.width = 32;
					canvas32.height = 32;
					const ctx32 = canvas32.getContext('2d');

					ctx32!.drawImage(image, 0, 0, 32, 32);
					canvas32Container.append(canvas32);

					const canvas200 = document.createElement('canvas');
					const ctx200 = canvas200.getContext('2d');
					canvas200.width = 200;
					canvas200.height = 200;

					ctx200!.drawImage(image, 0, 0, 200, 200);

					canvas200Container.append(canvas200);

					canvasContainerRef.current!.append(canvas32Container, canvas200Container);
				}
			});
		}
	}, [ fileList ])

	const uploadButton = (
		<div>
			<PlusOutlined/>
			<div style={ { marginTop: 8 } }>Upload</div>
		</div>
	);

	return (
		<Page title="Image Converter">
			<Container>
				<Upload
					action={ async (file) => {
						return '';
					} }
					listType="picture-card"
					fileList={ fileList }
					onPreview={ handlePreview }
					onChange={ handleChange }
				>
					{ fileList.length ? null : uploadButton }
				</Upload>
				<Modal open={ previewOpen } title={ previewTitle } footer={ null } onCancel={ handleCancel }>
					<img alt="example" style={ { width: '100%' } } src={ previewImage }/>
				</Modal>
				<HorizontalLayout ref={ canvasContainerRef }></HorizontalLayout>
			</Container>
		</Page>
	);
};

export default ImageConverterPage;

export const config = {
	runtime: 'nodejs'
};
