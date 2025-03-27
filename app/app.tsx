import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { RootStackParamList } from "./datatypes";
import TeamSelection from "./pages/team_selection";
import ChatScreen from "./pages/chat_function";

const Stack = createStackNavigator<RootStackParamList>(); // Add type here

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="TeamSelection">
        <Stack.Screen name="TeamSelection" component={TeamSelection} options={{ title: "Select Your Squad" }} />
        <Stack.Screen name="ChatScreen" component={ChatScreen} options={{ title: "AI Chat" }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
