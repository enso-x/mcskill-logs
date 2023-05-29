import { useEffect, useState, FC } from 'react';
import styled from 'styled-components';
import { LoadingOutlined } from '@ant-design/icons';
import { Spin } from 'antd';

interface IMinecraftSkinViewerContainerProps {
	imageData: string;
}

const MinecraftSkinViewerContainer = styled.div<IMinecraftSkinViewerContainerProps>`
	display: flex;
	justify-content: center;
	align-items: center;

	.mc-skin-viewer * {
		background-image: url(${ props => props.imageData });
	}
`;

const antIcon = <LoadingOutlined style={ { fontSize: 24 } } spin/>;

interface IBlockPartsProps {
	className: string;
	is2D?: boolean;
}

const BlockParts: FC<IBlockPartsProps> = ({
	className,
	is2D
}) => {
	return is2D ? (
		<div className={ className }>
			<div className="front"></div>
			<div className="accessory">
				<div className="front"></div>
			</div>
		</div>
	) : (
		<div className={ className }>
			<div className="top"></div>
			<div className="left"></div>
			<div className="front"></div>
			<div className="right"></div>
			<div className="back"></div>
			<div className="bottom"></div>
			<div className="accessory">
				<div className="top"></div>
				<div className="left"></div>
				<div className="front"></div>
				<div className="right"></div>
				<div className="back"></div>
				<div className="bottom"></div>
			</div>
		</div>
	);
};

interface IMinecraftSkinViewer3DProps {
	username: string;
	is2D?: boolean;
}

export function MinecraftSkinViewer3D({
	username,
	is2D,
}: IMinecraftSkinViewer3DProps) {
	const [ skinType, setSkinType ] = useState<string>('');
	const [ skinData, setSkinData ] = useState<string>('');

	useEffect(() => {
		(async () => {
			const reader = new FileReader();
			const imageBlob = await fetch(`/api/users/getSkin?username=${ username }&mode=full`).then(res => res.blob());
			reader.onload = () => {
				const imageData = reader.result as string;
				setSkinData(imageData);
				const image = new Image();
				image.onload = () => {
					const imageScale = image.width / 64;

					const canvas = document.createElement('canvas');
					canvas.width = image.width;
					canvas.height = image.height;
					canvas.style.imageRendering = 'pixelated';

					const ctx = canvas.getContext('2d');
					if (ctx) {
						ctx.drawImage(image, 0, 0, image.width, image.height);
						const pixelData = ctx.getImageData(50 * imageScale, 16 * imageScale, 2 * imageScale, 4 * imageScale);
						setSkinType(pixelData.data.every(byte => byte === 0) ? 'slim' : '');
					}
				};
				image.src = imageData;
			};
			reader.readAsDataURL(imageBlob);
		})();
	}, [ username ]);

	return (
		<MinecraftSkinViewerContainer imageData={ skinData }>
			{
				skinData.length ? (
					<div className={ `mc-skin-viewer mc-skin-viewer-11x legacy legacy-cape ${ skinType } ${is2D ? '' : 'spin'}` }>
						<div className="player">
							<BlockParts className="head" is2D={is2D}/>
							<BlockParts className="body" is2D={is2D}/>
							<BlockParts className="left-arm" is2D={is2D}/>
							<BlockParts className="right-arm" is2D={is2D}/>
							<BlockParts className="left-leg" is2D={is2D}/>
							<BlockParts className="right-leg" is2D={is2D}/>
							{/*<div className="cape">*/ }
							{/*	<div className="top"></div>*/ }
							{/*	<div className="left"></div>*/ }
							{/*	<div className="front"></div>*/ }
							{/*	<div className="right"></div>*/ }
							{/*	<div className="back"></div>*/ }
							{/*	<div className="bottom"></div>*/ }
							{/*</div>*/ }
						</div>
					</div>
				) : (
					<Spin indicator={ antIcon }/>
				)
			}
		</MinecraftSkinViewerContainer>
	);
}
