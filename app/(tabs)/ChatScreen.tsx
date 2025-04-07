import React, { useEffect, useState } from "react";
import { View, Text, ActivityIndicator, Alert } from "react-native";
import { useRoute } from "@react-navigation/native";
import { ChatScreenRouteProp } from "../datatypes";

type Player = {
  id: number;
  web_name: string;
  now_cost: number;
  predicted_points: number;
};

type ApiError = {
  message: string;
  details?: string;
};

export default function ChatScreen() {
  const route = useRoute<ChatScreenRouteProp>();
  const [transfers, setTransfers] = useState<Player[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);

  useEffect(() => {
    const fetchTransfers = async () => {
      try {
        if (!route.params?.budget) {
          throw new Error("Missing required parameters");
        }

        const response = await fetch(" https://9366-85-255-233-89.ngrok-free.app/predict", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            squad: route.params.squad || [],
            budget: route.params.budget,
            free_transfers: route.params.freeTransfers || 1,
            chips: route.params.chips || []
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to fetch transfers");
        }

        if (!data.best_transfers && !data.message) {
          throw new Error("Invalid response format from server");
        }

        setTransfers(data.best_transfers || []);
        
        if (data.message) {
          Alert.alert("Information", data.message);
        }
      } catch (err) {
        // Proper error type checking
        let errorMessage = "An unknown error occurred";
        let errorDetails = "";

        if (err instanceof Error) {
          errorMessage = err.message;
        } else if (typeof err === 'string') {
          errorMessage = err;
        } else if (err && typeof err === 'object' && 'message' in err) {
          errorMessage = (err as { message: string }).message;
        }

        console.error("API Error:", err);
        setError({ 
          message: errorMessage,
          details: errorDetails
        });
        Alert.alert("Error", errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchTransfers();
  }, [route.params]);

  if (!route.params?.budget) {
    return <Text>Error: Budget is required</Text>;
  }

  if (error) {
    return (
      <View style={{ padding: 20 }}>
        <Text style={{ color: 'red', fontWeight: 'bold' }}>Error:</Text>
        <Text>{error.message}</Text>
        {error.details && <Text>{error.details}</Text>}
      </View>
    );
  }

  return (
    <View style={{ padding: 20 }}>
      {loading ? (
        <ActivityIndicator size="large" />
      ) : transfers && transfers.length > 0 ? (
        <View>
          <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 10 }}>
            🔮 Recommended Transfers:
          </Text>
          {transfers.map((player) => (
            <View key={player.id} style={{ marginBottom: 8 }}>
              <Text>
                {player.web_name} (£{(player.now_cost / 10).toFixed(1)}m) - 
                Projected: {player.predicted_points?.toFixed(1) || 'N/A'} pts
              </Text>
            </View>
          ))}
        </View>
      ) : (
        <Text>No transfer suggestions available for your criteria</Text>
      )}
    </View>
  );
}