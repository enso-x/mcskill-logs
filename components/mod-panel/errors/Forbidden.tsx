import React from 'react';
import Error from 'next/error';
import { signOut } from 'next-auth/react';
import { Button } from 'antd';

import { ErrorContainer } from '@/components/Styled';

export function Forbidden() {
	const handleLogout = async () => {
		await signOut();
	};

	return (
		<ErrorContainer>
			<Error className="error" title="Нет доступа" statusCode={ 403 }/>
			<Button onClick={ handleLogout }>Выйти</Button>
		</ErrorContainer>
	);
}