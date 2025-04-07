import React, { useEffect, useState } from "react";
import { View, Text, ActivityIndicator } from "react-native";
import { useRoute } from "@react-navigation/native";
import { ChatScreenRouteProp } from "../datatypes";

type Player = {
  web_name: string;
  now_cost: number;
  predicted_points: number;
};

export default function ChatScreen() {
  const route = useRoute<ChatScreenRouteProp>();
  console.log(route.params);

  if (!route.params || !route.params.budget) {
    return <Text>Error: Budget is not defined</Text>;
  }

  const budget = route.params.budget;
  console.log(budget);

  const [transfers, setTransfers] = useState<Player[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("https://9366-85-255-233-89.ngrok-free.app/predict", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ squad: route.params.squad, budget, freeTransfers: route.params.freeTransfers, chips: route.params.chips }),
    })
      .then((res) => res.json())
      .then((data) => {
        setTransfers(data.best_transfers || []);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching transfers:", error);
        setLoading(false);
      });
  }, []);

  return (
    <View style={{ padding: 20 }}>
      {loading ? (
        <ActivityIndicator size="large" />
      ) : transfers && transfers.length > 0 ? (
        <View>
          <Text>🔮 AI-Recommended Transfers:</Text>
          {transfers.map((player, index) => (
            <Text key={index}>
              🔥 {player.web_name} (£{player.now_cost / 10}m) - {player.predicted_points} pts
            </Text>
          ))}
        </View>
      ) : (
        <Text>No transfer suggestions available</Text>
      )}
    </View>
  );
}
