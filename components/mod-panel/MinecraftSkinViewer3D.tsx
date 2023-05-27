import { useEffect, useState } from 'react';
import styled from 'styled-components';
import { LoadingOutlined } from '@ant-design/icons';
import { Spin } from 'antd';

interface IMinecraftSkinViewerContainerProps {
	imageData: string;
}

const MinecraftSkinViewerContainer = styled.div<IMinecraftSkinViewerContainerProps>`
	.mc-skin-viewer * {
		background-image: url(${props => props.imageData});
	}
`;

const antIcon = <LoadingOutlined style={{ fontSize: 24 }} spin />;

interface IMinecraftSkinViewer3DProps {
	username: string;
}

export function MinecraftSkinViewer3D({
	username
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
	}, []);

	return (
		<MinecraftSkinViewerContainer imageData={ skinData }>
			{
				skinData.length ? (
					<div className={ `mc-skin-viewer mc-skin-viewer-11x legacy legacy-cape ${ skinType } spin` }>
						<div className="player">
							<div className="head">
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
							<div className="body">
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
							<div className="left-arm">
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
							<div className="right-arm">
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
							<div className="left-leg">
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
							<div className="right-leg">
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
					<Spin indicator={antIcon} />
				)
			}
		</MinecraftSkinViewerContainer>
	);
}
