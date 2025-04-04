// App.tsx
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import ChatScreen from './(tabs)/index';
import TeamSelector from './(tabs)/team_selector';

const Stack = createStackNavigator();

function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen name="ChatScreen" component={ChatScreen} />
        <Stack.Screen name="TeamSelector" component={TeamSelector} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default App;
