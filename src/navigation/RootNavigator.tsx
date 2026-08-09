import React from 'react';

import { useAuth } from '../hooks/use-auth';
import AppStack from './AppStack';
import AuthStack from './AuthStack';

function RootNavigator() {
  const { session } = useAuth();

  return session ? <AppStack /> : <AuthStack />;
}

export default RootNavigator;
