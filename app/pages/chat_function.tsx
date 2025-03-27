import React, { useEffect, useState } from "react";
import { View, Text, ActivityIndicator } from "react-native";
import { useRoute } from "@react-navigation/native";
import { ChatScreenRouteProp } from "../datatypes"; // Import type

// Define the structure of a player
type Player = {
  web_name: string;
  now_cost: number;
  predicted_points: number;
};

export default function ChatScreen() {
  const route = useRoute<ChatScreenRouteProp>();
  const { budget, freeTransfers, squad, chips } = route.params;

  // ✅ Explicitly type transfers as an array of Player objects OR null
  const [transfers, setTransfers] = useState<Player[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("https://fpl-improver.onrender.com", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ squad, budget, freeTransfers, chips }),
    })
      .then((res) => res.json())
      .then((data) => {
        setTransfers(data.best_transfers || []); // ✅ Ensure it's always an array
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