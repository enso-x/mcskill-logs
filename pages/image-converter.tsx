import React, { ChangeEvent, useEffect, useRef, useState, ChangeEventHandler, useMemo } from 'react';
import styled, { createGlobalStyle } from 'styled-components';
import { NextPage } from 'next';

import { MenuFoldOutlined, MenuUnfoldOutlined, PlusOutlined, ReloadOutlined } from '@ant-design/icons';
import { Modal, Upload, Input, Checkbox, Slider, Button } from 'antd';
import type { RcFile, UploadProps } from 'antd/es/upload';
import type { UploadFile } from 'antd/es/upload/interface';
import { CheckboxChangeEvent } from 'antd/es/checkbox';

import { HorizontalLayout, VerticalLayout } from '@/components/Styled';

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
	position: relative;
	height: 100%;
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	overflow-x: hidden;

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

const FilterContainer = styled.div`
	position: fixed;
	top: 64px;
	left: 0;
	padding: 16px;
	border: 1px solid #424242;
	border-left: none;
	border-radius: 0 6px 6px 0;
	transition: transform 0.2s ease-in;
	z-index: 2;
	background: #141414;

	${ VerticalLayout } {
		position: relative;
		gap: 8px;

		.toggle-button {
			position: absolute;
			top: 0;
			right: -64px;
			font-size: 24px;
			height: auto;
		}
		
		.apply-button {
			flex: 1;
		}
		
		.reset-button {
			display: flex;
			justify-content: center;
			align-items: center;
			padding: 8px;
		}

		input[type="number"], input[type="text"] {
			padding: 4px;
			text-align: center;

			&::-webkit-outer-spin-button,
			&::-webkit-inner-spin-button {
				-webkit-appearance: none;
				margin: 0;
			}
		}

		${ HorizontalLayout } {
			gap: 8px;
		}

		${ VerticalLayout } {
			gap: 4px;
		}
	}
`;

const BetweenLayout = styled(HorizontalLayout)`
	justify-content: space-between;
`;

type TAnyFile = RcFile | File | Blob;

type TFiltersValues = {
	pixelated: boolean;
	grayscale: number;
	hue: number;
	brightness: number;
	contrast: number;
	invert: number;
	opacity: number;
	saturate: number;
	sepia: number;
};

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
	image.dataset.name = file.name;
	image.addEventListener('load', () => {
		resolve(image);
	});
	image.addEventListener('error', (e) => reject(e));
});

const mergeFilters = (filters1: TFiltersValues | null = null, filters2: TFiltersValues | null = null): TFiltersValues | null => {
	if (!filters1) {
		return null;
	}
	if (!filters2) {
		return { ...filters1 };
	}

	const result = { ...filters1 };

	if (filters2.hue) {
		result.hue += filters2.hue;
		result.hue %= 360;
	}
	if (filters2.brightness) {
		result.brightness = (filters2.brightness) - (1 - result.brightness);
	}
	if (filters2.contrast >= 0) {
		result.contrast = (filters2.contrast) - (1 - result.contrast);
	}
	if (filters2.saturate >= 0) {
		result.saturate = (filters2.saturate) - (1 - result.saturate);
	}

	return result;
};

const getActiveFilters = (filters: TFiltersValues | null = null) => {
	const activeFilters = [];
	if (filters) {
		if (filters.grayscale >= 0) {
			activeFilters.push(`grayscale(${ filters.grayscale })`);
		}
		if (filters.hue >= 0) {
			activeFilters.push(`hue-rotate(${ filters.hue }deg)`);
		}
		if (filters.brightness >= 0) {
			activeFilters.push(`brightness(${ filters.brightness })`);
		}
		if (filters.contrast >= 0) {
			activeFilters.push(`contrast(${ filters.contrast })`);
		}
		if (filters.invert >= 0) {
			activeFilters.push(`invert(${ filters.invert })`);
		}
		if (filters.opacity >= 0) {
			activeFilters.push(`opacity(${ filters.opacity })`);
		}
		if (filters.saturate >= 0) {
			activeFilters.push(`saturate(${ filters.saturate })`);
		}
		if (filters.sepia >= 0) {
			activeFilters.push(`sepia(${ filters.sepia })`);
		}
	}
	return activeFilters;
};

const getImagePreview = (image: HTMLImageElement, resolution = 200, filters: TFiltersValues | null = null): HTMLCanvasElement => {
	const isHorizontal = image.width > image.height;
	const scaleRatio = isHorizontal ? image.height / image.width : image.width / image.height;
	const canvas = document.createElement('canvas');
	canvas.width = isHorizontal ? resolution : resolution * scaleRatio;
	canvas.height = isHorizontal ? resolution * scaleRatio : resolution;

	const ctx = canvas.getContext('2d');
	if (ctx) {
		const activeFilters = getActiveFilters(filters);
		if (filters && filters.pixelated) {
			canvas.style.imageRendering = 'pixelated';
			ctx.imageSmoothingEnabled = false;
		}
		if (activeFilters.length) {
			ctx.filter = activeFilters.join(' ');
		}
		ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
	}
	return canvas;
};

const minMax = (value: number, min: number, max: number) => {
	return Math.max(Math.min(value, max), min);
};

interface ISliderWithInputProps {
	label: string;
	min: number;
	max: number;
	step: number;
	initialValue: number;
	onChange: (value: number) => void;
}

const SliderWithInput: React.FC<ISliderWithInputProps> = (props) => {
	const { label, min, max, step, initialValue, onChange } = props;
	const [ stringValue, setStringValue ] = useState((initialValue || 0).toString());
	const [ currentValue, setCurrentValue ] = useState(initialValue || 0);

	const handleChange = (value: number) => {
		setCurrentValue(value);
		setStringValue(value.toString());
		onChange?.(value);
	};

	const handleInputChange: ChangeEventHandler<HTMLInputElement> = (e) => {
		setStringValue(e.target.value);
		const newValue = parseFloat(e.target.value);
		if (isNaN(newValue)) {
			return;
		}

		const minMaxValue = minMax(newValue, min, max);
		setCurrentValue(minMaxValue);
		onChange?.(minMaxValue);
	};

	useEffect(() => {
		if (initialValue !== currentValue) {
			setCurrentValue(initialValue);
			setStringValue(initialValue.toString());
			onChange?.(initialValue);
		}
	}, [ initialValue ]);

	return (
		<VerticalLayout>
			<BetweenLayout>
				{ label }
				<Input style={ {
					width: 48
				} } type="number" step={ step } min={ min } max={ max } value={ stringValue }
				       onChange={ handleInputChange }/>
			</BetweenLayout>
			<Slider style={ {
				width: 140
			} } step={ step } min={ min } max={ max } value={ currentValue } onChange={ handleChange }/>
		</VerticalLayout>
	);
};

interface IFilterProps {
	onMount?: (values: TFiltersValues) => void;
	onChange?: (values: TFiltersValues) => void;
	onSubmit?: (values: TFiltersValues) => void;
	onReset?: (values: TFiltersValues) => void;
}

const FilterPanel: React.FC<IFilterProps> = (props) => {
	const { onMount, onChange, onSubmit, onReset } = props;
	const [ visible, setVisible ] = useState<boolean>(false);
	const [ pixelated, setPixelated ] = useState<boolean>(true);
	const [ grayscale, setGrayscale ] = useState<number>(0);
	const [ hue, setHue ] = useState<number>(0);
	const [ brightness, setBrightness ] = useState<number>(1);
	const [ contrast, setContrast ] = useState<number>(1);
	const [ invert, setInvert ] = useState<number>(0);
	const [ opacity, setOpacity ] = useState<number>(1);
	const [ saturate, setSaturate ] = useState<number>(1);
	const [ sepia, setSepia ] = useState<number>(0);

	const defaultValues: TFiltersValues = useMemo(() => {
		return ({
			pixelated,
			grayscale,
			hue,
			brightness,
			contrast,
			invert,
			opacity,
			saturate,
			sepia
		});
	}, []);

	const allValues: TFiltersValues = useMemo(() => {
		return ({
			pixelated,
			grayscale,
			hue,
			brightness,
			contrast,
			invert,
			opacity,
			saturate,
			sepia
		});
	}, [
		pixelated,
		grayscale,
		hue,
		brightness,
		contrast,
		invert,
		opacity,
		saturate,
		sepia
	]);

	const setDefaultValues = () => {
		setGrayscale(0);
		setHue(0);
		setBrightness(1);
		setContrast(1);
		setInvert(0);
		setOpacity(1);
		setSaturate(1);
		setSepia(0);
	};

	const toggleMenu = () => {
		setVisible(visibleState => !visibleState);
	};

	const handleSubmit = () => {
		onSubmit?.(allValues);
		setDefaultValues();
	};

	const handleReset = () => {
		onReset?.(defaultValues);
		setDefaultValues();
	};

	const handlePixelatedCheck = (e: CheckboxChangeEvent) => {
		setPixelated(e.target.checked);
	};

	useEffect(() => {
		onMount?.(allValues);
	}, []);

	useEffect(() => {
		onChange?.(allValues);
	}, [ allValues ]);

	return (
		<FilterContainer style={ {
			transform: `translateX(${ visible ? 0 : -100 }%)`
		} }>
			<VerticalLayout>
				<Button type="default" className="toggle-button" onClick={ toggleMenu }>
					{ visible ? <MenuFoldOutlined/> : <MenuUnfoldOutlined/> }
				</Button>
				<Checkbox checked={ pixelated } onChange={ handlePixelatedCheck }>Pixelated</Checkbox>
				<SliderWithInput label="Grayscale" min={0} max={1} step={0.01} initialValue={grayscale} onChange={setGrayscale}/>
				<SliderWithInput label="HUE" min={0} max={360} step={1} initialValue={hue} onChange={setHue}/>
				<SliderWithInput label="Brightness" min={0} max={2} step={0.01} initialValue={brightness} onChange={setBrightness}/>
				<SliderWithInput label="Contrast" min={0} max={2} step={0.01} initialValue={contrast} onChange={setContrast}/>
				<SliderWithInput label="Invert" min={0} max={1} step={0.01} initialValue={invert} onChange={setInvert}/>
				<SliderWithInput label="Opacity" min={0} max={1} step={0.01} initialValue={opacity} onChange={setOpacity}/>
				<SliderWithInput label="Saturate" min={0} max={2} step={0.01} initialValue={saturate} onChange={setSaturate}/>
				<SliderWithInput label="Sepia" min={0} max={1} step={0.01} initialValue={sepia} onChange={setSepia}/>
				<HorizontalLayout>
					<Button type="primary" className="apply-button" onClick={ handleSubmit }>
						Apply
					</Button>
					<Button type="default" className="reset-button" onClick={ handleReset }>
						<ReloadOutlined />
					</Button>
				</HorizontalLayout>
			</VerticalLayout>
		</FilterContainer>
	);
};

const ImageConverterPage: NextPage = () => {
	const [ needResolutions, setNeedResolutions ] = useState<string>('32, 200');
	const [ previewOpen, setPreviewOpen ] = useState(false);
	const [ previewImage, setPreviewImage ] = useState('');
	const [ previewTitle, setPreviewTitle ] = useState('');
	const [ previews, setPreviews ] = useState<HTMLCanvasElement[]>([]);
	const [ filters, setFilters ] = useState<TFiltersValues | null>(null);
	const [ fileList, setFileList ] = useState<UploadFile[]>([]);
	const [ imageList, setImageList ] = useState<HTMLImageElement[]>([]);

	const canvasContainerRef = useRef<HTMLDivElement | null>(null);
	const appliedFiltersRef = useRef<TFiltersValues | null>(null);
	const defaultFiltersRef = useRef<TFiltersValues | null>(null);
	const withSaveImageRef = useRef<boolean>(false);

	const debouncedFileList = useDebounce(fileList, 200);
	const debouncedImageList = useDebounce(imageList, 200);
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
		const imagePreview = getImagePreview(loadedImage, 84, filters);
		return imagePreview.toDataURL();
	};

	const handleChange: UploadProps['onChange'] = async ({ fileList: newFileList }) => {
		setFileList(newFileList);
	};

	const handleResolutionsChange = (e: ChangeEvent<HTMLInputElement>) => {
		setNeedResolutions(e.target.value);
	};

	const handleBeforeUpload = () => {
		return false;
	};

	const updateInitialImageList = () => {
		setImageList([]);
		debouncedFileList.forEach(async (file) => {
			const loadedImage = await loadImage(file.originFileObj!);
			setImageList(images => [...images, loadedImage]);
		});
	};

	const handleFiltersMount = (values: TFiltersValues) => {
		defaultFiltersRef.current = values;
		handleFiltersSubmit(values);
	};

	const handleFiltersChange = (values: TFiltersValues) => {
		appliedFiltersRef.current = values;
		previews.forEach(preview => {
			const resultFilters = getActiveFilters(values);
			preview.style.filter = resultFilters.join(' ');
		});
	};

	const handleFiltersSubmit = (values: TFiltersValues) => {
		// const appliedFilters = appliedFiltersRef.current;
		const resultFilters = mergeFilters(values/*, appliedFilters*/);
		setFilters(resultFilters);
		withSaveImageRef.current = true;
		appliedFiltersRef.current = resultFilters;
	};

	const handleFiltersReset = (values: TFiltersValues) => {
		setFilters(values);
		updateInitialImageList();
	};

	useEffect(() => {
		updateInitialImageList();
	}, [ debouncedFileList ]);

	useEffect(() => {
		setFilters(appliedFiltersRef.current);
	}, [ debouncedResolutions ]);

	useEffect(() => {
		if (canvasContainerRef && canvasContainerRef.current) {
			canvasContainerRef.current.innerHTML = '';
			setPreviews([]);
			debouncedImageList.forEach((loadedImage) => {
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
							canvasContainer.style.border = '1px solid #424242';
							canvasContainer.style.borderRadius = '8px';
							canvasContainer.style.padding = '8px';
							canvasContainer.style.gap = '8px';

							const imagePreview = getImagePreview(loadedImage, resolution, filters);
							setPreviews(previews => [ ...previews, imagePreview ]);

							const downloadBtn = document.createElement('a');
							const [ fileName, fileExt ] = loadedImage.dataset.name!.split('.');
							downloadBtn.download = `${ fileName }_${ imagePreview.width }x${ imagePreview.height }.${ fileExt }`;
							downloadBtn.innerHTML = 'Download';
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

			if (withSaveImageRef.current) {
				withSaveImageRef.current = false;
				for (let image of debouncedImageList) {
					image.src = getImagePreview(
						image,
						image.width > image.height ? image.width : image.height,
						filters
					).toDataURL();
				}
				if (filters !== defaultFiltersRef.current) {
					setFilters(defaultFiltersRef.current);
				}
			}
		}
	}, [ debouncedImageList, debouncedResolutions, filters ]);

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
				<FilterPanel onMount={ handleFiltersMount } onChange={ handleFiltersChange } onSubmit={ handleFiltersSubmit } onReset={ handleFiltersReset }/>
				<Upload
					action={ async (file) => {
						return '';
					} }
					beforeUpload={ handleBeforeUpload }
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
				<HorizontalLayout style={ {
					margin: '16px 0'
				} }>
					<Input style={ {
						width: '240px'
					} } placeholder="Resolutions" value={ needResolutions } onChange={ handleResolutionsChange }/>
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
