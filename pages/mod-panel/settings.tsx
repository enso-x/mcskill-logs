import React, { ChangeEvent, useEffect, useState } from 'react';
import styled from 'styled-components';
import { NextPage } from 'next';
import { useSession } from 'next-auth/react';
import { JWT } from 'next-auth/jwt';
import { Button, Select, Input, Typography } from 'antd';

const { Text } = Typography;

import { protectedRoute } from '@/middleware/protectedRoute';
import Page from '@/components/Page';
import { Header } from '@/components/mod-panel/Header';
import { Navigation } from '@/components/mod-panel/Navigation';
import { NotAuthorized } from '@/components/mod-panel/errors/NotAuthorized';
import { EUserRoles, IUser } from '@/interfaces/User';
import { ISettings } from '@/models/Settings';
import { Forbidden } from '@/components/mod-panel/errors/Forbidden';

const AppContainer = styled.div`
	display: flex;
	flex-direction: column;
	height: 100vh;
	background: #141414;
`;

const MainContainer = styled.div`
	display: flex;
	flex: 1;
	overflow: hidden;
`;

const Content = styled.div`
	flex: 1;
	overflow: hidden;
	display: flex;
	flex-direction: column;
`;

const ContentContainer = styled.div`
	display: flex;
	gap: 16px;
	padding: 16px;
	flex-wrap: wrap;
	align-items: flex-start;
	overflow-y: auto;
`;

interface ModPanelPageProps {
	discord: JWT;
	user: IUser;
	settings: ISettings;
}

const ModPanelPage: NextPage<ModPanelPageProps> = ({
	discord,
	user,
	settings: appSettings
}) => {
	const { update: updateSession } = useSession();
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
		<Page>
			{
				!user ? (
					<NotAuthorized/>
				) : user.role < EUserRoles.curator ? (
					<Forbidden/>
				) : (
					<AppContainer>
						<Header/>
						<MainContainer>
							<Navigation/>
							<Content>
								<ContentContainer>
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
								</ContentContainer>
							</Content>
						</MainContainer>
					</AppContainer>
				)
			}
		</Page>
	);
};

export const getServerSideProps = protectedRoute<ModPanelPageProps>(async (context) => {
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

export default ModPanelPage;

export const config = {
	runtime: 'nodejs'
};
