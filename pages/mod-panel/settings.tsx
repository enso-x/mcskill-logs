import React, { ChangeEvent, useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';
import { NextPage } from 'next';
import { Button, Input, Tabs, Typography } from 'antd';

import { VerticalLayout } from '@/components/Styled';
import { ModPanelPage, ModPanelPageContent } from '@/components/mod-panel/ModPanelPage';
import { Loading, LoadingContainer } from '@/components/mod-panel/Loading';
import { EUserRoles } from '@/interfaces/User';
import { ISettings, IServerSettings } from '@/interfaces/Settings';
import { SERVERS } from '@/interfaces/Server';

const { Text } = Typography;

const InputLayout = styled(VerticalLayout)`
	gap: 8px;
`;

interface ISettingsForServerProps {
	serverSettings: IServerSettings;
	onSubmit?: (serverSettings: IServerSettings) => Promise<IServerSettings>;
}

const SettingsForServer = ({
	serverSettings,
	onSubmit
}: ISettingsForServerProps) => {
	const [ settings, setSettings ] = useState<IServerSettings>(serverSettings);

	const [ onlinePerWeek, setOnlinePerWeek ] = useState<string>(serverSettings.onlinePerWeek);
	const [ pointsPerWeekForTrainee, setPointsPerWeekForTrainee ] = useState<string>(serverSettings.pointsPerWeekForTrainee.toString());
	const [ pointsPerWeekForHelper, setPointsPerWeekForHelper ] = useState<string>(serverSettings.pointsPerWeekForHelper.toString());
	const [ pointsPerWeekForModerator, setPointsPerWeekForModerator ] = useState<string>(serverSettings.pointsPerWeekForModerator.toString());
	const [ overtimeMultiplier, setOvertimeMultiplier ] = useState<string>(serverSettings.overtimeMultiplier.toString());
	const [ saveInProgress, setSaveInProgress ] = useState<boolean>(false);

	const handleOnlinePerWeekChange = (e: ChangeEvent<HTMLInputElement>) => {
		setOnlinePerWeek(e.target.value);
	};

	const handlePointsPerWeekForTraineeChange = (e: ChangeEvent<HTMLInputElement>) => {
		setPointsPerWeekForTrainee(e.target.value);
	};

	const handlePointsPerWeekForHelperChange = (e: ChangeEvent<HTMLInputElement>) => {
		setPointsPerWeekForHelper(e.target.value);
	};

	const handlePointsPerWeekForModeratorChange = (e: ChangeEvent<HTMLInputElement>) => {
		setPointsPerWeekForModerator(e.target.value);
	};

	const handleOvertimeMultiplierChange = (e: ChangeEvent<HTMLInputElement>) => {
		setOvertimeMultiplier(e.target.value);
	};

	const hasChanges = () => {
		return settings && (
			settings.onlinePerWeek !== onlinePerWeek ||
			settings.pointsPerWeekForTrainee.toString() !== pointsPerWeekForTrainee ||
			settings.pointsPerWeekForHelper.toString() !== pointsPerWeekForHelper ||
			settings.pointsPerWeekForModerator.toString() !== pointsPerWeekForModerator ||
			settings.overtimeMultiplier.toString() !== overtimeMultiplier
		);
	};

	const updateSettings = async () => {
		setSaveInProgress(true);

		if (onSubmit) {
			const newServerSettings = await onSubmit({
				server: settings.server,
				onlinePerWeek,
				pointsPerWeekForTrainee: parseFloat(pointsPerWeekForTrainee),
				pointsPerWeekForHelper: parseFloat(pointsPerWeekForHelper),
				pointsPerWeekForModerator: parseFloat(pointsPerWeekForModerator),
				overtimeMultiplier: parseFloat(overtimeMultiplier)
			});

			setSettings(newServerSettings);
		}

		setSaveInProgress(false);
	};

	useEffect(() => {
		if (settings) {
			setOnlinePerWeek(settings.onlinePerWeek);
			setPointsPerWeekForTrainee(settings.pointsPerWeekForTrainee.toString());
			setPointsPerWeekForHelper(settings.pointsPerWeekForHelper.toString());
			setPointsPerWeekForModerator(settings.pointsPerWeekForModerator.toString());
			setOvertimeMultiplier(settings.overtimeMultiplier.toString());
		}
	}, [ settings ]);

	return (
		<VerticalLayout>
			<InputLayout>
				<Text>Онлайн за неделю</Text>
				<Input value={ onlinePerWeek } placeholder="Онлайн за неделю"
				       onChange={ handleOnlinePerWeekChange }/>
			</InputLayout>
			<InputLayout>
				<Text>Очки за неделю для Стажера</Text>
				<Input value={ pointsPerWeekForTrainee } placeholder="Очки за неделю для Стажера"
				       onChange={ handlePointsPerWeekForTraineeChange }/>
			</InputLayout>
			<InputLayout>
				<Text>Очки за неделю для Помощника</Text>
				<Input value={ pointsPerWeekForHelper } placeholder="Очки за неделю для Помощника"
				       onChange={ handlePointsPerWeekForHelperChange }/>
			</InputLayout>
			<InputLayout>
				<Text>Очки за неделю для Модератора</Text>
				<Input value={ pointsPerWeekForModerator } placeholder="Очки за неделю для Модератора"
				       onChange={ handlePointsPerWeekForModeratorChange }/>
			</InputLayout>
			<InputLayout>
				<Text>Множитель за овертайм</Text>
				<Input value={ overtimeMultiplier } placeholder="Множитель за овертайм"
				       onChange={ handleOvertimeMultiplierChange }/>
			</InputLayout>
			<Button type="primary" loading={ saveInProgress }
			        disabled={ !settings || !hasChanges() }
			        onClick={ updateSettings }>Сохранить</Button>
		</VerticalLayout>
	);
};

const ModPanelSettingsPage: NextPage = () => {
	const [ settings, setSettings ] = useState<ISettings>();
	const [ saveInProgress, setSaveInProgress ] = useState<boolean>(false);

	const updateSettings = async (newServerSettings: IServerSettings) => {
		setSaveInProgress(true);

		if (settings) {
			const newServersSettings = settings.servers.map(currentServerSettings => {
				if (currentServerSettings.server === newServerSettings.server) {
					return newServerSettings;
				}
				return currentServerSettings;
			});

			const [ newSettings ] = await fetch('/api/settings/update', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					servers: newServersSettings
				})
			}).then<ISettings[]>(res => res.json());

			setSettings(newSettings);

			const updatedSettings = newSettings.servers.find(serverSettings => serverSettings.server === newServerSettings.server);

			if (updatedSettings) {
				newServerSettings = updatedSettings;
			}
		}

		setSaveInProgress(false);

		return newServerSettings;
	};

	const tabItems = useMemo(() => {
		return settings && settings.servers.map(serverSettings => ({
			key: `${ serverSettings.server }`,
			label: SERVERS[serverSettings.server].label,
			disabled: saveInProgress,
			children: (
				<SettingsForServer serverSettings={ serverSettings } onSubmit={ updateSettings }/>
			)
		}));
	}, [ settings, saveInProgress ]);

	useEffect(() => {
		(async () => {
			const [ appSettings ] = await fetch('/api/settings/get').then<ISettings[]>(res => res.json());

			if (appSettings) {
				setSettings(appSettings);
			}
		})();
	}, []);

	return (
		<ModPanelPage needRole={ EUserRoles.curator }>
			{
				!settings ? (
					<LoadingContainer>
						<Loading/>
					</LoadingContainer>
				) : (
					<ModPanelPageContent>
						<Tabs items={ tabItems }/>
					</ModPanelPageContent>
				)
			}
		</ModPanelPage>
	);
};

export default ModPanelSettingsPage;
