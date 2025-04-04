import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import TeamSelection from "./pages/team_selection";
import ChatScreen from "./pages/chat_function";
import { RootStackParamList } from "./datatypes"; // Import the types

const Stack = createStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <NavigationContainer> {/* Only one NavigationContainer */}
      <Stack.Navigator initialRouteName="TeamSelection">
        <Stack.Screen name="TeamSelection" component={TeamSelection} options={{ title: "Select Your Squad" }} />
        <Stack.Screen name="ChatScreen" component={ChatScreen} options={{ title: "AI Chat" }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}