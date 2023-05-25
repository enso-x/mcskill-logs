import { useState, useEffect } from 'react';
import styled from 'styled-components';
import { Button } from 'antd';
import { FileTextOutlined } from '@ant-design/icons';

import { HorizontalLayout, OnlineIndicator, VerticalLayout } from '@/components/Styled';
import { SERVERS } from '@/interfaces/Server';

interface IServerInfo {
	id: number;
	last_wipe: string;
	mainserver_id: string;
	online: number;
	onmaintenance: number;
	players_max: number;
	players_now: number;
	shop_desc: string;
	short_description: string;
	shortname: string;
	status: number;
	tag: string;
	title: string;
	url: string;
	version: string;
}

const Container = styled(VerticalLayout)`
	padding: 8px;
	gap: 8px;
`;

const ServerInfoContainer = styled(VerticalLayout)`
	padding: 8px;
	border: 1px solid #242424;
	border-radius: 8px;
	gap: 8px;
`;

const ServerContent = styled(HorizontalLayout)`
	gap: 8px;
	justify-content: space-between;
	border-bottom: 1px solid #242424;
	padding-bottom: 8px;
`;

const ServerOnlineIndicator = styled(OnlineIndicator)``;

export function ServerMonitoring() {
	const [ serversInfo, setServersInfo ] = useState<IServerInfo[]>([]);

	const fetchServersInfo = async () => {
		const servers = await fetch('/api/monitoring').then(res => res.json());
		if (servers) {
			setServersInfo(servers);
		}
	};

	useEffect(() => {
		fetchServersInfo();
	}, []);

	return serversInfo && serversInfo.length ? (
		<Container>
			{
				serversInfo.map((serverInfo, i) => (
					<ServerInfoContainer key={ serverInfo.id }>
						<ServerContent>
							<span>
								{ serverInfo.title }
							</span>
							<ServerOnlineIndicator $online={ Boolean(serverInfo.online) }/>
						</ServerContent>
						<ServerContent>
							<span>Текущий онлайн:</span>
							<span>{ serverInfo.players_now } / { serverInfo.players_max }</span>
						</ServerContent>
						<Button href={ `/files/${ encodeURIComponent(Object.values(SERVERS).find(server => server.id === serverInfo.url)!.logs_url + '/') }` } target="__blank" icon={<FileTextOutlined />}>Логи</Button>
					</ServerInfoContainer>
				))
			}
		</Container>
	) : null;
}
