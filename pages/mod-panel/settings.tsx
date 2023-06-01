import React, { ChangeEvent, useEffect, useState } from 'react';
import { NextPage } from 'next';
import { Button, Input, Typography } from 'antd';

import { ModPanelPage, ModPanelPageContent } from '@/components/mod-panel/ModPanelPage';
import { Loading, LoadingContainer } from '@/components/mod-panel/Loading';
import { EUserRoles } from '@/interfaces/User';
import { ISettings } from '@/models/Settings';

const { Text } = Typography;

const ModPanelSettingsPage: NextPage = () => {
	const [ settings, setSettings ] = useState<ISettings>();

	const [ onlinePerWeek, setOnlinePerWeek ] = useState<string>('00:00:00');
	const [ pointsPerWeekForTrainee, setPointsPerWeekForTrainee ] = useState<string>('0');
	const [ pointsPerWeekForHelper, setPointsPerWeekForHelper ] = useState<string>('0');
	const [ pointsPerWeekForModerator, setPointsPerWeekForModerator ] = useState<string>('0');
	const [ overtimeMultiplier, setOvertimeMultiplier ] = useState<string>('0');
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
		const [ newSettings ] = await fetch('/api/settings/update', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				onlinePerWeek,
				pointsPerWeekForTrainee: parseFloat(pointsPerWeekForTrainee),
				pointsPerWeekForHelper: parseFloat(pointsPerWeekForHelper),
				pointsPerWeekForModerator: parseFloat(pointsPerWeekForModerator),
				overtimeMultiplier: parseFloat(overtimeMultiplier)
			})
		}).then(res => res.json());

		setSettings(newSettings);
		setSaveInProgress(false);
	};

	useEffect(() => {
		(async () => {
			const [ appSettings ] = await fetch('/api/settings/get').then<ISettings[]>(res => res.json());

			if (appSettings) {
				setSettings(appSettings);
			}
		})();
	}, []);

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
		<ModPanelPage needRole={EUserRoles.curator}>
			{
				!settings ? (
					<LoadingContainer>
						<Loading/>
					</LoadingContainer>
				) : (
					<ModPanelPageContent>
						<Text>Онлайн за неделю</Text>
						<Input value={ onlinePerWeek } placeholder="Онлайн за неделю"
						       onChange={ handleOnlinePerWeekChange }/>
						<Text>Очки за неделю для Стажера</Text>
						<Input value={ pointsPerWeekForTrainee } placeholder="Очки за неделю для Стажера"
						       onChange={ handlePointsPerWeekForTraineeChange }/>
						<Text>Очки за неделю для Помощника</Text>
						<Input value={ pointsPerWeekForHelper } placeholder="Очки за неделю для Помощника"
						       onChange={ handlePointsPerWeekForHelperChange }/>
						<Text>Очки за неделю для Модератора</Text>
						<Input value={ pointsPerWeekForModerator } placeholder="Очки за неделю для Модератора"
						       onChange={ handlePointsPerWeekForModeratorChange }/>
						<Text>Множитель за овертайм</Text>
						<Input value={ overtimeMultiplier } placeholder="Множитель за овертайм"
						       onChange={ handleOvertimeMultiplierChange }/>
						<Button type="primary" loading={ saveInProgress }
						        disabled={ !settings || !hasChanges() }
						        onClick={ updateSettings }>Сохранить</Button>
					</ModPanelPageContent>
				)
			}
		</ModPanelPage>
	);
};

export default ModPanelSettingsPage;
