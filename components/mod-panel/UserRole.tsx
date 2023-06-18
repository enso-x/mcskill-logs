import { EUserRoles, IUserServerRoleInfo, ROLES } from '@/interfaces/User';
import { GlitchText } from '@/components/mod-panel/GlitchText';
import React from 'react';

interface IUSerRoleProps {
	roleInfo: IUserServerRoleInfo;
	addonBefore?: React.ReactNode;
	addonAfter?: React.ReactNode;
}

export function UserRole({
	roleInfo,
	addonBefore,
	addonAfter
}: IUSerRoleProps) {
	return (roleInfo.role === EUserRoles.creator ? (
		<span>
			{ addonBefore }
			<GlitchText className={ EUserRoles[roleInfo.role] } text={ ROLES[roleInfo.role] }/>
			{ addonAfter }
		</span>
	) : (
		<span>
			{ addonBefore }
			<span className={ EUserRoles[roleInfo.role] }>
				{ ROLES[roleInfo.role] }
			</span>
			{ addonAfter }
		</span>
	));
}