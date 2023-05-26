import React, { ChangeEvent, useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import { NextPage } from 'next';

import { PlusOutlined } from '@ant-design/icons';
import { Modal, Upload, Input } from 'antd';
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
	const [ needResolutions, setNeedResolutions ] = useState<string>('32, 200');
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

	const handleResolutionsChange = (e: ChangeEvent<HTMLInputElement>) => {
		setNeedResolutions(e.target.value);
	};

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

				const resolutions = needResolutions.split(',').map(value => parseInt(value.trim(), 10));

				if (image && canvasContainerRef.current && resolutions.length) {
					canvasContainerRef.current.innerHTML = '';

					resolutions.forEach(resolution => {
						if(!isNaN(resolution)) {
							const canvasContainer = document.createElement('div');
							canvasContainer.style.display = 'flex';
							canvasContainer.style.border = '1px solid var(--border-color)';
							canvasContainer.style.borderRadius = '8px';
							canvasContainer.style.padding = '8px';

							const canvas = document.createElement('canvas');
							if (resolution <= 64) {
								canvas.style.imageRendering = 'pixelated';
							}
							canvas.width = resolution;
							canvas.height = resolution;

							const ctx = canvas.getContext('2d');

							if (ctx) {
								ctx.drawImage(image, 0, 0, resolution, resolution);
							}

							canvasContainer.append(canvas);
							canvasContainerRef.current!.append(canvasContainer);
						}
					});
				}
			});
		}
	}, [ fileList, needResolutions ])

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
				<Input style={{
					width: '240px'
				}} placeholder="Resolutions" value={ needResolutions } onChange={ handleResolutionsChange }/>
				<HorizontalLayout ref={ canvasContainerRef }></HorizontalLayout>
			</Container>
		</Page>
	);
};

export default ImageConverterPage;

export const config = {
	runtime: 'nodejs'
};
