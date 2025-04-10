import React, { useEffect, useState } from "react";
import { View, Text, ActivityIndicator, ScrollView, StyleSheet, TouchableOpacity, Alert } from "react-native";
import { useRoute } from "@react-navigation/native";
import { ChatScreenRouteProp } from "../datatypes";


type Player = {
  id: number;
  web_name: string;
  now_cost: number;
  predicted_points: number;
  element_type: number;
  position: string;
  team_name: string;
};

type TransferSuggestion = {
  player_out: Player;
  player_in: Player;
  points_gain: number;
  cost_change: number;
};

export default function ChatScreen() {
  const route = useRoute<ChatScreenRouteProp>();
  const [squadPlayers, setSquadPlayers] = useState<Player[]>([]);
  const [transferSuggestions, setTransferSuggestions] = useState<TransferSuggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedPlayer, setExpandedPlayer] = useState<number | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
    
        // 1. First get squad analysis
        const squadResponse = await fetch(`https://f825-87-242-173-26.ngrok-free.app/analyse-squad`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify({
            squad: route.params?.squad || []
          }),
        });
    
        const squadData = await squadResponse.json();
        if (!squadResponse.ok) throw new Error(squadData.error || 'Squad analysis failed');
        setSquadPlayers(squadData.squad_players);
    
        // 2. Then get transfer suggestions 
        const transfersResponse = await fetch(`https://f825-87-242-173-26.ngrok-free.app/predict`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify({
            squad: route.params?.squad || [],
            budget: route.params?.budget || 0,
            free_transfers: route.params?.freeTransfers || 1
          }),
        });
    
        const transfersData = await transfersResponse.json();
        console.log("Transfer suggestions:", transfersData); // Debug log
    
        if (!transfersResponse.ok) {
          throw new Error(transfersData.error || 'Transfer prediction failed');
        }
    
        // Handle both response formats
        if (transfersData.suggestions) {
          setTransferSuggestions(transfersData.suggestions);
        } else if (transfersData.message) {
          Alert.alert("No Suggestions", transfersData.message);
          setTransferSuggestions([]);
        } else {
          throw new Error("Unexpected response format");
        }
    
      } catch (err) {
        console.error("API Error:", {
          error: err,
          requestData: {
            squad: route.params?.squad,
            budget: route.params?.budget,
            freeTransfers: route.params?.freeTransfers
          }
        });
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [route.params]);


  const toggleExpandPlayer = (playerId: number) => {
    setExpandedPlayer(expandedPlayer === playerId ? null : playerId);
  };

  const getSuggestionsForPlayer = (playerId: number) => {
    return transferSuggestions
      .filter(suggestion => suggestion.player_out.id === playerId)
      .sort((a, b) => b.points_gain - a.points_gain);
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" />
        <Text style={styles.loadingText}>Analyzing your squad...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Error: {error}</Text>
        <TouchableOpacity 
          style={styles.retryButton}
          onPress={() => window.location.reload()}
        >
          <Text style={styles.retryButtonText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>Squad Breakdown</Text>
      
      <View style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>Squad Summary</Text>
        <View style={styles.summaryRow}>
          <Text>Total Predicted Points:</Text>
          <Text style={styles.summaryValue}>
            {squadPlayers.reduce((sum, player) => sum + (player.predicted_points || 0), 0).toFixed(1)}
          </Text>
        </View>
        <View style={styles.summaryRow}>
          <Text>Remaining Budget:</Text>
          <Text style={styles.summaryValue}>£{route.params?.budget?.toFixed(1) || '0.0'}m</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text>Free Transfers:</Text>
          <Text style={styles.summaryValue}>{route.params?.freeTransfers || 1}</Text>
        </View>
      </View>

      <Text style={styles.subHeader}>Player-by-Player Analysis</Text>
      
      {squadPlayers.map(player => (
        <View key={player.id} style={styles.playerCard}>
          <TouchableOpacity onPress={() => toggleExpandPlayer(player.id)}>
            <View style={styles.playerHeader}>
              <Text style={styles.playerName}>
                {player.web_name} ({player.position})
              </Text>
              <Text style={styles.playerPoints}>
                {player.predicted_points?.toFixed(1) || '0.0'} pts
              </Text>
            </View>
          </TouchableOpacity>

          {expandedPlayer === player.id && (
            <View style={styles.suggestionsContainer}>
              <Text style={styles.suggestionsTitle}>Upgrade Suggestions:</Text>
              
              {getSuggestionsForPlayer(player.id).length > 0 ? (
                getSuggestionsForPlayer(player.id).map((suggestion, index) => (
                  <View key={index} style={styles.suggestionItem}>
                    <View style={styles.transferRow}>
                      <Text style={styles.transferOut}>➖ {suggestion.player_out.web_name}</Text>
                      <Text style={styles.transferIn}>➕ {suggestion.player_in.web_name}</Text>
                    </View>
                    <View style={styles.transferDetails}>
                      <Text>Extra cost: £{suggestion.cost_change.toFixed(1)}m</Text>
                      <Text style={styles.pointsGain}>
                        +{suggestion.points_gain.toFixed(1)} pts
                      </Text>
                    </View>
                  </View>
                ))
              ) : (
                <Text style={styles.noSuggestions}>No better options found within budget</Text>
              )}
            </View>
          )}
        </View>
      ))}

      <View style={styles.bestTransfersCard}>
        <Text style={styles.subHeader}>Top Overall Transfers</Text>
        {transferSuggestions.length > 0 ? (
          transferSuggestions
            .sort((a, b) => b.points_gain - a.points_gain)
            .slice(0, 3)
            .map((suggestion, index) => (
              <View key={index} style={styles.bestSuggestion}>
                <Text style={styles.bestTransferText}>
                  Replace <Text style={styles.bold}>{suggestion.player_out.web_name}</Text> with{' '}
                  <Text style={styles.bold}>{suggestion.player_in.web_name}</Text>
                </Text>
                <Text style={styles.bestTransferDetails}>
                  Cost: £{suggestion.cost_change.toFixed(1)}m • 
                  Points Gain: +{suggestion.points_gain.toFixed(1)}
                </Text>
              </View>
            ))
        ) : (
          <Text style={styles.noSuggestions}>No transfer suggestions available</Text>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
  },
  subHeader: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 20,
    marginBottom: 12,
    color: '#333',
  },
  loadingText: {
    marginTop: 16,
    textAlign: 'center',
  },
  errorText: {
    color: 'red',
    textAlign: 'center',
    marginTop: 16,
  },
  retryButton: {
    backgroundColor: '#1a73e8',
    padding: 12,
    borderRadius: 6,
    marginTop: 16,
    alignSelf: 'center',
  },
  retryButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  summaryCard: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryValue: {
    fontWeight: 'bold',
  },
  playerCard: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
  },
  playerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  playerName: {
    fontSize: 16,
    fontWeight: '500',
  },
  playerPoints: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1a73e8',
  },
  suggestionsContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  suggestionsTitle: {
    fontWeight: '500',
    marginBottom: 8,
  },
  suggestionItem: {
    backgroundColor: '#f9f9f9',
    borderRadius: 6,
    padding: 12,
    marginBottom: 8,
  },
  transferRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  transferOut: {
    color: '#d32f2f',
  },
  transferIn: {
    color: '#388e3c',
  },
  transferDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  pointsGain: {
    color: '#388e3c',
    fontWeight: 'bold',
  },
  noSuggestions: {
    fontStyle: 'italic',
    color: '#666',
  },
  bestTransfersCard: {
    backgroundColor: '#e8f5e9',
    borderRadius: 8,
    padding: 16,
    marginBottom: 20,
  },
  bestSuggestion: {
    backgroundColor: 'white',
    borderRadius: 6,
    padding: 12,
    marginBottom: 8,
  },
  bestTransferText: {
    marginBottom: 4,
  },
  bestTransferDetails: {
    fontSize: 12,
    color: '#666',
  },
  bold: {
    fontWeight: 'bold',
  },
});