import styled from 'styled-components';

interface IMinecraftFaceViewerContainerProps {
	username: string;
}

const MinecraftFaceViewerContainer = styled.div<IMinecraftFaceViewerContainerProps>`
	display: inline-flex;
	
	.mc-face-viewer {
		background-image: url("/api/users/getSkin?username=${ props => props.username }&mode=full");
	}
`;

interface IMinecraftFaceViewerProps {
	username: string;
}

export function MinecraftFaceViewer({
	username
}: IMinecraftFaceViewerProps) {
	return (
		<MinecraftFaceViewerContainer username={ username }>
			<div className="mc-face-viewer mc-face-viewer-4x"/>
		</MinecraftFaceViewerContainer>
	);
}
