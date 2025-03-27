import React, { useState } from "react";
import { View, Text, TextInput, Button, FlatList } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { TeamSelectionNavigationProp } from "../datatypes"; // Import the type

export default function TeamSelection() {
  const navigation = useNavigation<TeamSelectionNavigationProp>(); // ✅ Correctly typed navigation

  const [budget, setBudget] = useState("100");
  const [freeTransfers, setFreeTransfers] = useState("2");
  const [squad, setSquad] = useState<number[]>([]);
  const [chips, setChips] = useState<string[]>([]);

  // Example FPL player list
  const players = [
    { id: 1, name: "Haaland", cost: 12.0 },
    { id: 2, name: "Saka", cost: 9.0 },
    { id: 3, name: "Trippier", cost: 6.5 },
  ];

  return (
    <View style={{ padding: 20 }}>
      <Text>Set Your Budget (£m):</Text>
      <TextInput keyboardType="numeric" value={budget} onChangeText={setBudget} />

      <Text>Free Transfers:</Text>
      <TextInput keyboardType="numeric" value={freeTransfers} onChangeText={setFreeTransfers} />

      <Text>Select Your Current Squad:</Text>
      <FlatList
        data={players}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <Button
            title={item.name + " (£" + item.cost + "m)"}
            onPress={() => setSquad([...squad, item.id])}
          />
        )}
      />

      <Button
        title="Get AI Transfer Advice"
        onPress={() =>
          navigation.navigate("ChatScreen", {
            budget: Number(budget), // Convert to number
            freeTransfers: Number(freeTransfers), // Convert to number
            squad: squad, // Already an array of numbers
            chips: chips, // Already an array of strings
          })
        }
      />
    </View>
  );
}