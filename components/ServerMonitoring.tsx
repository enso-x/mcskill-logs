import { useState, useEffect } from 'react';
import styled from 'styled-components';
import { Button, Collapse } from 'antd';
import { FileTextOutlined } from '@ant-design/icons';

const { Panel } = Collapse;

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
	padding: 16px;
	gap: 8px;

	.ant-collapse > .ant-collapse-item > .ant-collapse-header {
		align-items: center;
	}

	.ant-collapse-item > .ant-collapse-content > .ant-collapse-content-box {
		display: flex;
		flex-direction: column;
		gap: 12px;
	}
`;

const ServerContent = styled(HorizontalLayout)`
	gap: 8px;
	justify-content: space-between;
	border-bottom: 1px solid var(--border-color);
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
			<Collapse size="small" expandIcon={ () => null }>
				{
					serversInfo.map((serverInfo, i) => (
						<Panel key={ serverInfo.id } header={ serverInfo.title }
						       extra={ <ServerOnlineIndicator $online={ Boolean(serverInfo.online) }/> }>
							<ServerContent>
								<span>Текущий онлайн:</span>
								<span>{ serverInfo.players_now } / { serverInfo.players_max }</span>
							</ServerContent>
							<Button
								href={ `/files/${ encodeURIComponent(Object.values(SERVERS).find(server => server.id === serverInfo.url)!.logs_url + '/') }` }
								target="__blank" icon={ <FileTextOutlined/> }>Логи</Button>
						</Panel>
					))
				}
			</Collapse>
		</Container>
	) : null;
}
