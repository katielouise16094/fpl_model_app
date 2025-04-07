import React, { useEffect, useState } from "react";
import { 
  View, 
  Text, 
  FlatList, 
  TouchableOpacity, 
  Alert, 
  TextInput, 
  StyleSheet,
  Keyboard,
  TouchableWithoutFeedback,
  ScrollView
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { TeamSelectionNavigationProp } from "../datatypes";

type Player = {
  id: number;
  web_name: string;
  now_cost: number;
  element_type: number;
  team: number;
  team_name: string;
};

export default function TeamSelection() {
  const navigation = useNavigation<TeamSelectionNavigationProp>();
  const [players, setPlayers] = useState<Player[]>([]);
  const [selectedSquad, setSelectedSquad] = useState<Player[]>([]);
  const [currentPosition, setCurrentPosition] = useState<number>(1);
  const [freeTransfers, setFreeTransfers] = useState<string>("1");
  const [remainingBudget, setRemainingBudget] = useState<string>("0.0");
  const [showBudgetInput, setShowBudgetInput] = useState(false);

  // Calculate total squad value
  const squadValue = selectedSquad.reduce((sum, player) => sum + player.now_cost, 0);

  useEffect(() => {
    fetch("https://fantasy.premierleague.com/api/bootstrap-static/")
      .then((res) => res.json())
      .then((data) => {
        const teamNames = Object.fromEntries(
          data.teams.map((team: any) => [team.id, team.name])
        );

        setPlayers(
          data.elements.map((p: any) => ({
            id: p.id,
            web_name: p.web_name,
            now_cost: p.now_cost / 10,
            element_type: p.element_type,
            team: p.team,
            team_name: teamNames[p.team],
          }))
        );
      })
      .catch((error) => console.error("Error fetching FPL data:", error));
  }, []);

  const positionNames: Record<number, string> = { 1: "GK", 2: "DEF", 3: "MID", 4: "FWD" };
  const positionLimits: Record<number, number> = { 1: 2, 2: 5, 3: 5, 4: 3 };

  const addPlayer = (player: Player) => {
    const positionCount = selectedSquad.filter((p) => p.element_type === player.element_type).length;
    const clubCount = selectedSquad.filter((p) => p.team === player.team).length;

    if (selectedSquad.some((p) => p.id === player.id)) {
      Alert.alert("Duplicate Player", "You have already selected this player.");
      return;
    }
    if (positionCount >= positionLimits[player.element_type]) {
      Alert.alert("Position Limit Reached", `You can't select more ${positionNames[player.element_type]}s.`);
      return;
    }
    if (clubCount >= 3) {
      Alert.alert("Club Limit Reached", "You can only pick 3 players from the same club.");
      return;
    }

    setSelectedSquad([...selectedSquad, player]);
  };

  const removePlayer = (player: Player) => {
    const newSquad = selectedSquad.filter((p) => p.id !== player.id);
    setSelectedSquad(newSquad);
    
    // If removing a player from a completed position, go back to that position
    const playersInPosition = newSquad.filter(p => p.element_type === player.element_type).length;
    if (playersInPosition < positionLimits[player.element_type]) {
      setCurrentPosition(player.element_type);
    }
  };

  const handlePositionComplete = () => {
    if (currentPosition < 4) {
      setCurrentPosition(currentPosition + 1);
    } else {
      setShowBudgetInput(true);
    }
  };

  const handleGetAdvice = () => {
    Keyboard.dismiss();
    
    if (isNaN(parseFloat(remainingBudget))) {
      Alert.alert("Invalid Budget", "Please enter a valid remaining budget");
      return;
    }
    if (selectedSquad.length < 15) {
      Alert.alert("Incomplete Squad", "Please select a full squad of 15 players.");
      return;
    }

    navigation.navigate("ChatScreen", {
      budget: parseFloat(remainingBudget),
      freeTransfers: parseInt(freeTransfers) || 1,
      squad: selectedSquad.map((p) => p.id),
      chips: [],
    });
  };

  const PositionSelector = ({ position }: { position: number }) => (
    <View style={styles.positionTab}>
      <Text style={[
        styles.positionTabText,
        currentPosition === position && styles.positionTabActive
      ]}>
        {positionNames[position]} ({selectedSquad.filter(p => p.element_type === position).length}/{positionLimits[position]})
      </Text>
    </View>
  );

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={styles.container}>
        <Text style={styles.header}>Build Your Squad</Text>
        
        <View style={styles.positionTabs}>
          {[1, 2, 3, 4].map(position => (
            <TouchableOpacity 
              key={position} 
              onPress={() => setCurrentPosition(position)}
            >
              <PositionSelector position={position} />
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.squadValue}>
          Squad Value: £{squadValue.toFixed(1)}m
        </Text>

        <FlatList
          data={players.filter((p) => p.element_type === currentPosition)}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.playerItem}
              onPress={() => addPlayer(item)}
            >
              <Text style={styles.playerName}>{item.web_name}</Text>
              <Text style={styles.playerTeam}>{item.team_name}</Text>
              <Text style={styles.playerPrice}>£{item.now_cost.toFixed(1)}m</Text>
            </TouchableOpacity>
          )}
        />

        {!showBudgetInput ? (
          <View style={styles.bottomSection}>
            <Text style={styles.formationHeader}>Your Squad ({selectedSquad.length}/15)</Text>
            <ScrollView horizontal style={styles.formationRow}>
              {selectedSquad.map((player) => (
                <TouchableOpacity
                  key={player.id}
                  style={styles.selectedPlayer}
                  onPress={() => removePlayer(player)}
                >
                  <Text style={styles.selectedPlayerText}>
                    {player.web_name} ({positionNames[player.element_type]})
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <TouchableOpacity
              style={[
                styles.actionButton,
                selectedSquad.filter(p => p.element_type === currentPosition).length < positionLimits[currentPosition] && 
                styles.actionButtonDisabled
              ]}
              onPress={handlePositionComplete}
              disabled={selectedSquad.filter(p => p.element_type === currentPosition).length < positionLimits[currentPosition]}
            >
              <Text style={styles.actionButtonText}>
                {currentPosition < 4 ? 
                  `Done with ${positionNames[currentPosition]}s →` : 
                  "Complete Squad"}
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.bottomSection}>
            <Text style={styles.budgetLabel}>Enter your remaining budget (£m):</Text>
            <TextInput
              style={styles.budgetInput}
              keyboardType="numeric"
              value={remainingBudget}
              onChangeText={setRemainingBudget}
              placeholder="e.g. 2.5"
              onSubmitEditing={Keyboard.dismiss}
            />

            <Text style={styles.budgetLabel}>Free transfers available:</Text>
            <TextInput
              style={styles.budgetInput}
              keyboardType="numeric"
              value={freeTransfers}
              onChangeText={setFreeTransfers}
              placeholder="e.g. 1"
              onSubmitEditing={Keyboard.dismiss}
            />

            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleGetAdvice}
            >
              <Text style={styles.actionButtonText}>Get Transfer Advice</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#02cc6c",
    padding: 16,
  },
  header: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 16,
    textAlign: "center",
    color: "#333",
  },
  positionTabs: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  positionTab: {
    padding: 10,
    borderRadius: 8,
    backgroundColor: "#02cc6b",
  },
  positionTabText: {
    fontWeight: "500",
    color: "#fff",
  },
  positionTabActive: {
    color: "#1a73e8",
    fontWeight: "bold",
  },
  squadValue: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 12,
    textAlign: "center",
    color: "#1a73e8",
  },
  playerItem: {
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 16,
    marginBottom: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    elevation: 2,
  },
  playerName: {
    fontSize: 16,
    fontWeight: "bold",
    flex: 2,
  },
  playerTeam: {
    fontSize: 14,
    flex: 2,
    textAlign: "center",
    color: "#666",
  },
  playerPrice: {
    fontSize: 14,
    flex: 1,
    textAlign: "right",
    fontWeight: "bold",
    color: "#1a73e8",
  },
  bottomSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
  },
  formationHeader: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 8,
    color: "#333",
  },
  formationRow: {
    marginBottom: 16,
    maxHeight: 100,
  },
  selectedPlayer: {
    backgroundColor: "#e3f2fd",
    padding: 8,
    borderRadius: 6,
    marginRight: 8,
    marginBottom: 8,
  },
  selectedPlayerText: {
    fontSize: 12,
    color: "#0d47a1",
  },
  budgetLabel: {
    fontSize: 16,
    marginBottom: 8,
    color: "#fff",
  },
  budgetInput: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
  },
  actionButton: {
    backgroundColor: "#e90052",
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
  },
  actionButtonDisabled: {
    backgroundColor: "#90caf9",
  },
  actionButtonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
});