import React from 'react';
import Error from 'next/error';
import { signIn } from 'next-auth/react';
import { Button } from 'antd';

import { ErrorContainer } from '@/components/Styled';

export function NotAuthorized() {
	const handleLogin = async () => {
		await signIn('discord');
	};

	return (
		<ErrorContainer>
			<Error className="error" title="Не авторизован" statusCode={ 401 }/>
			<Button onClick={ handleLogin }>Войти</Button>
		</ErrorContainer>
	);
}