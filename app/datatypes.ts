import { StackNavigationProp } from "@react-navigation/stack";
import { RouteProp } from "@react-navigation/native";

export type RootStackParamList = {
  TeamSelection: undefined;
  ChatScreen: {
    budget: number;
    freeTransfers: number;
    squad: number[];
    chips: string[];
  };
};
// Navigation Prop Type
export type TeamSelectionNavigationProp = StackNavigationProp<
  RootStackParamList,
  "TeamSelection"
>;

export type ChatScreenRouteProp = RouteProp<RootStackParamList, "ChatScreen">;

