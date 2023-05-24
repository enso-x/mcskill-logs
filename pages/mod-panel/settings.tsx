import React, { ChangeEvent, useState } from 'react';
import { NextPage } from 'next';
import { JWT } from 'next-auth/jwt';
import { Button, Input, Typography } from 'antd';

import { protectedRoute } from '@/middleware/protectedRoute';
import { ModPanelPage, ModPanelPageContent } from '@/components/mod-panel/ModPanelPage';
import { EUserRoles, IUser } from '@/interfaces/User';
import { ISettings } from '@/models/Settings';

const { Text } = Typography;

interface ModPanelSettingsPageProps {
	discord: JWT;
	user: IUser;
	settings: ISettings;
}

const ModPanelSettingsPage: NextPage<ModPanelSettingsPageProps> = ({
	discord,
	user,
	settings: appSettings
}) => {
	const [ settings, setSettings ] = useState<ISettings>(appSettings);
	const [ onlinePerWeek, setOnlinePerWeek ] = useState<string>(settings.onlinePerWeek);
	const [ pointsPerWeekForTrainee, setPointsPerWeekForTrainee ] = useState<string>(settings.pointsPerWeekForTrainee.toString());
	const [ pointsPerWeekForHelper, setPointsPerWeekForHelper ] = useState<string>(settings.pointsPerWeekForHelper.toString());
	const [ pointsPerWeekForModerator, setPointsPerWeekForModerator ] = useState<string>(settings.pointsPerWeekForModerator.toString());
	const [ overtimeMultiplier, setOvertimeMultiplier ] = useState<string>(settings.overtimeMultiplier.toString());
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
		return settings.onlinePerWeek !== onlinePerWeek ||
			   settings.pointsPerWeekForTrainee.toString() !== pointsPerWeekForTrainee ||
			   settings.pointsPerWeekForHelper.toString() !== pointsPerWeekForHelper ||
			   settings.pointsPerWeekForModerator.toString() !== pointsPerWeekForModerator ||
			   settings.overtimeMultiplier.toString() !== overtimeMultiplier;
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

	return (
		<ModPanelPage user={user} needRole={EUserRoles.curator}>
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
				        disabled={ !hasChanges() }
				        onClick={ updateSettings }>Сохранить</Button>
			</ModPanelPageContent>
		</ModPanelPage>
	);
};

export const getServerSideProps = protectedRoute<ModPanelSettingsPageProps>(async (context) => {
	const { siteFetch } = context;
	const [ settings ] = await siteFetch<ISettings[]>('/api/settings/get');

	return ({
		props: {
			discord: context.session?.discord ?? null,
			user: context.session?.user ?? null,
			settings
		}
	});
});

export default ModPanelSettingsPage;

export const config = {
	runtime: 'nodejs'
};
