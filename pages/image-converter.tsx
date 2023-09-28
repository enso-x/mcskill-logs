import React, { ChangeEvent, useEffect, useRef, useState } from 'react';
import styled, { createGlobalStyle } from 'styled-components';
import { NextPage } from 'next';

import { PlusOutlined } from '@ant-design/icons';
import { Modal, Upload, Input, Checkbox } from 'antd';
import type { RcFile, UploadProps } from 'antd/es/upload';
import type { UploadFile } from 'antd/es/upload/interface';
import { CheckboxChangeEvent } from 'antd/es/checkbox';

import { HorizontalLayout } from '@/components/Styled';

import { Page } from '@/components/Page';
import { useDebounce } from '@/helpers';

const GlobalStyles = createGlobalStyle`
	.ant-modal-body {
		display: flex;
		justify-content: center;
		align-items: center;
		
		img {
			width: auto !important;
		}
	}
`;

const Container = styled.div`
	height: 100%;
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;

	.ant-upload-wrapper.ant-upload-picture-card-wrapper {
		width: auto;
	}
	
	.ant-upload-list {
		display: flex;
		gap: 16px;
		
		.ant-upload-list-item-container {
			margin: 0 !important;
		}
	}
`;

const CanvasLayout = styled(HorizontalLayout)`
	flex-wrap: wrap;
	justify-content: center;
	min-height: 0;
`;

type TAnyFile = RcFile | File | Blob;

const getBase64 = (file: TAnyFile): Promise<string> =>
	new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.readAsDataURL(file);
		reader.onload = () => resolve(reader.result as string);
		reader.onerror = (error) => reject(error);
	});

const loadImage = (file: TAnyFile): Promise<HTMLImageElement> => new Promise(async (resolve, reject) => {
	const imageData = await getBase64(file);
	const image = new Image();
	image.src = imageData;
	image.addEventListener('load', () => {
		resolve(image);
	});
	image.addEventListener('error', (e) => reject(e));
});

const getImagePreview = (image: HTMLImageElement, pixelated = false, resolution = 200): HTMLCanvasElement => {
	const canvas = document.createElement('canvas');
	if (pixelated) {
		canvas.style.imageRendering = 'pixelated';
	}
	canvas.width = resolution;
	canvas.height = resolution;

	const ctx = canvas.getContext('2d');
	if (ctx) {
		if (pixelated) {
			ctx.imageSmoothingEnabled = false;
		}
		ctx.drawImage(image, 0, 0, resolution, resolution);
	}
	return canvas;
};

const ImageConverterPage: NextPage = () => {
	const [ needResolutions, setNeedResolutions ] = useState<string>('32, 200');
	const [ previewOpen, setPreviewOpen ] = useState(false);
	const [ previewImage, setPreviewImage ] = useState('');
	const [ previewTitle, setPreviewTitle ] = useState('');
	const [ fileList, setFileList ] = useState<UploadFile[]>([]);
	const [ pixelated, setPixelated ] = useState<boolean>(true);
	const canvasContainerRef = useRef<HTMLDivElement | null>(null);

	const debouncedFileList = useDebounce(fileList, 200);
	const debouncedResolutions = useDebounce(needResolutions, 200);

	const handleCancel = () => setPreviewOpen(false);

	const handlePreview = async (file: UploadFile) => {
		if (file.thumbUrl) {
			setPreviewImage(file.url || file.thumbUrl);
			setPreviewOpen(true);
			setPreviewTitle(file.name || file.url!.substring(file.url!.lastIndexOf('/') + 1));
		}
	};

	const handlePreviewFile = async (file: TAnyFile) => {
		const loadedImage = await loadImage(file);
		const imagePreview = getImagePreview(loadedImage, pixelated);
		return imagePreview.toDataURL();
	};

	const handleChange: UploadProps['onChange'] = async ({ fileList: newFileList }) => {
		setFileList(newFileList);
	};

	const handlePixelatedCheck = (e: CheckboxChangeEvent) => {
		setPixelated(e.target.checked);
	};

	const handleResolutionsChange = (e: ChangeEvent<HTMLInputElement>) => {
		setNeedResolutions(e.target.value);
	};

	useEffect(() => {
		if (canvasContainerRef && canvasContainerRef.current) {
			canvasContainerRef.current.innerHTML = '';
			debouncedFileList.forEach(async (file) => {
				const loadedImage = await loadImage(file.originFileObj!);
				const resolutions = debouncedResolutions.split(',').map(value => parseInt(value.trim(), 10));

				const contentContainer = document.createElement('div');
				contentContainer.style.display = 'flex';
				contentContainer.style.alignItems = 'center';
				contentContainer.style.gap = '8px';

				resolutions.forEach(resolution => {
					if (!isNaN(resolution)) {
						if (loadedImage && canvasContainerRef.current && resolutions.length) {
							const container = document.createElement('div');
							container.style.display = 'flex';
							container.style.flexDirection = 'column';
							container.style.alignItems = 'center';
							container.style.gap = '8px';

							const canvasContainer = document.createElement('div');
							canvasContainer.style.display = 'flex';
							canvasContainer.style.flexDirection = 'column';
							canvasContainer.style.alignItems = 'center';
							canvasContainer.style.border = '1px solid var(--border-color)';
							canvasContainer.style.borderRadius = '8px';
							canvasContainer.style.padding = '8px';
							canvasContainer.style.gap = '8px';

							const downloadBtn = document.createElement('a');
							const [fileName, fileExt] = file.name.split('.');
							downloadBtn.download = `${fileName}_${resolution}x${resolution}.${fileExt}`;
							downloadBtn.innerHTML = 'Download';

							const imagePreview = getImagePreview(loadedImage, pixelated, resolution);
							downloadBtn.href = imagePreview.toDataURL();

							canvasContainer.append(imagePreview);
							container.append(canvasContainer);
							container.append(downloadBtn);
							contentContainer.append(container);
						}
					}
				});

				canvasContainerRef.current!.append(contentContainer);
			});
		}
	}, [ debouncedFileList, debouncedResolutions, pixelated ]);

	const uploadButton = (
		<div>
			<PlusOutlined/>
			<div style={ { marginTop: 8 } }>Upload</div>
		</div>
	);

	return (
		<Page title="Image Converter">
			<GlobalStyles/>
			<Container>
				<Upload
					action={ async (file) => {
						return '';
					} }
					listType="picture-card"
					multiple={ true }
					fileList={ fileList }
					previewFile={ handlePreviewFile }
					onPreview={ handlePreview }
					onChange={ handleChange }
				>
					{ fileList.length ? null : uploadButton }
				</Upload>
				<Modal open={ previewOpen } title={ previewTitle } footer={ null } onCancel={ handleCancel }>
					<img alt="example" style={ { width: '100%' } } src={ previewImage }/>
				</Modal>
				<HorizontalLayout style={{
					margin: '16px 0'
				}}>
					<Input style={{
						width: '240px'
					}} placeholder="Resolutions" value={ needResolutions } onChange={ handleResolutionsChange }/>
					<Checkbox checked={pixelated} onChange={handlePixelatedCheck}>Pixelated</Checkbox>
				</HorizontalLayout>
				<CanvasLayout ref={ canvasContainerRef }></CanvasLayout>
			</Container>
		</Page>
	);
};

export default ImageConverterPage;

export const config = {
	runtime: 'nodejs'
};
