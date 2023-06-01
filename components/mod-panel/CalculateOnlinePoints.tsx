import React, { useEffect, useMemo, useState } from 'react';
import { Button, Checkbox } from 'antd';
import { CheckboxChangeEvent } from 'antd/es/checkbox';

import {
	getAverageUserRoleInfo,
	getJuniorUsernamesForServer,
	getUserHasAccess,
	getUserRoleInfoForServer
} from '@/helpers/users';
import { timeToSeconds, getCurrentWeek, momentDurationToString } from '@/helpers/datetime';
import { onlineAPI } from '@/helpers/mod-panel';
import { EUserRoles, IUser } from '@/interfaces/User';
import { ISettings } from '@/models/Settings';
import { SERVERS } from '@/interfaces/Server';

interface ICalculateOnlinePointsProps {
	user: IUser | undefined;
	users: IUser[];
	selectedUsers: string[];
	afterSubmit?: () => Promise<void>;
}

export const useCalculateOnlinePoints = ({
	user,
	users,
	selectedUsers,
	afterSubmit
}: ICalculateOnlinePointsProps) => {
	const [ settings, setSettings ] = useState<ISettings>();
	const [ isDebugMode, setIsDebugMode ] = useState<boolean>(false);
	const [ calculateInProgress, setCalculateInProgress ] = useState<boolean>(false);

	const handleCalculatePointsClick = async () => {
		if (!settings) return;

		setCalculateInProgress(true);

		onlineAPI.clearPreviousDurationLogsFromLocalStorage();

		let clipboardText = `\`\`\`asciidoc\n`;

		for (let server of Object.values(SERVERS)) {
			const onlineForRecentWeek = await onlineAPI.fetchOnlineForRecentWeekForServer(server, getJuniorUsernamesForServer(server, users), isDebugMode);
			clipboardText += `[ ${ server.label } ]\n`;

			for (let [ username, value ] of Object.entries(onlineForRecentWeek)) {
				const duration = (value as any).duration;
				const moderator = users.find(user => user.username === username);

				if (!moderator) continue;

				const moderatorRoleInfo = getUserRoleInfoForServer(moderator, server.value);
				const pointsPerWeekByRole = moderatorRoleInfo ?
					moderatorRoleInfo.role === EUserRoles.trainee ? settings.pointsPerWeekForTrainee :
						moderatorRoleInfo.role === EUserRoles.helper ? settings.pointsPerWeekForHelper :
							moderatorRoleInfo.role === EUserRoles.moder ? settings.pointsPerWeekForModerator :
								settings.pointsPerWeekForTrainee : settings.pointsPerWeekForTrainee;
				const userOnlineSeconds = duration.as('seconds');
				const earnedPoints = userOnlineSeconds > timeToSeconds(settings.onlinePerWeek ?? '21:00:00')
					? onlineAPI.calculatePointsForOnlineTime(userOnlineSeconds, pointsPerWeekByRole, settings.onlinePerWeek, settings.overtimeMultiplier)
					: selectedUsers.includes(moderator.discord_id) ? pointsPerWeekByRole : 0;

				if (!isDebugMode) {
					await onlineAPI.updateUserPointsForServer(moderator, server.value, earnedPoints);
				}

				clipboardText += `${ username }: ${ momentDurationToString(duration) } (+${ earnedPoints })\n`;
			}
			clipboardText += `\n`;
		}
		clipboardText += `\`\`\``;

		await navigator.clipboard.writeText(clipboardText);

		if (!isDebugMode) {
			const [ newSettings ] = await fetch('/api/settings/update', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					lastWeek: getCurrentWeek()
				})
			}).then(res => res.json());

			setSettings(newSettings);
		}

		await afterSubmit?.();

		setCalculateInProgress(false);
	};

	const handleDebugModeChange = (e: CheckboxChangeEvent) => {
		setIsDebugMode(e.target.checked);
	};

	useEffect(() => {
		(async () => {
			const [ appSettings ] = await fetch('/api/settings/get').then(res => res.json());
			setSettings(appSettings);
		})();
	}, []);

	const hasAccess = getUserHasAccess(user, null);

	const canCalculatePoints = useMemo<boolean>(() => {
		if (!user || !settings) return false;

		return isDebugMode || settings.lastWeek < getCurrentWeek() && hasAccess(EUserRoles.curator);
	}, [ user, settings, isDebugMode ]);

	const calculatePointsControls = useMemo(() => {
		return !user ? null : (
			<>
				{
					hasAccess(EUserRoles.curator) && (
						<Checkbox checked={ isDebugMode }
						          onChange={ handleDebugModeChange }>
							Режим отладки подсчета очков
						</Checkbox>
					)
				}
				{
					canCalculatePoints && (
						<Button type="primary" loading={ calculateInProgress }
						        onClick={ handleCalculatePointsClick }>
							Начислить очки за неделю
						</Button>
					)
				}
			</>
		);
	}, [ user, canCalculatePoints, isDebugMode, calculateInProgress ]);

	return { canCalculatePoints, calculatePointsControls };
};
