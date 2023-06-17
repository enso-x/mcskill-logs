import { EUserRoles, IUserServerRoleInfo, ROLES } from '@/interfaces/User';
import { GlitchText } from '@/components/mod-panel/GlitchText';
import React from 'react';

interface IUSerRoleProps {
	roleInfo: IUserServerRoleInfo;
	before?: React.ReactNode;
	after?: React.ReactNode;
}

export function UserRole({
	roleInfo,
	before,
	after
}: IUSerRoleProps) {
	return (roleInfo.role === EUserRoles.creator ? (
		<span>{ before }<GlitchText className={ EUserRoles[roleInfo.role] } text={ ROLES[roleInfo.role] }/>{ after }</span>
	) : (
		<span>{ before }<span className={ EUserRoles[roleInfo.role] }>{ ROLES[roleInfo.role] }</span>{ after }</span>
	));
}