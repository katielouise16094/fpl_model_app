import React, { useEffect, useState } from "react";
import { View, Text, FlatList, TouchableOpacity, Alert } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { TeamSelectionNavigationProp } from "../datatypes";


type Player = {
  id: number;
  web_name: string;
  now_cost: number;
  element_type: number; // 1 = GK, 2 = DEF, 3 = MID, 4 = FWD
  team: number; // Club ID
  team_name: string;
};

export default function TeamSelection() {
  const navigation = useNavigation<TeamSelectionNavigationProp>();
  const [players, setPlayers] = useState<Player[]>([]);
  const [selectedSquad, setSelectedSquad] = useState<Player[]>([]);
  const [positionFilter, setPositionFilter] = useState<number>(1);
  const [freeTransfers, setFreeTransfers] = useState<string>("2");
  const [remainingBudget, setRemainingBudget] = useState<string>("100.0");
  const [chips, setChips] = useState<string[]>([]);

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
  const positionLimits: { [key: number]: number } = { 1: 2, 2: 5, 3: 5, 4: 3 };


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
    setSelectedSquad(selectedSquad.filter((p) => p.id !== player.id));
  };

  const nextPosition = () => {
    if (selectedSquad.filter((p) => p.element_type === positionFilter).length < positionLimits[positionFilter]) {
      Alert.alert("Incomplete Selection", `You need to pick all ${positionNames[positionFilter]}s.`);
      return;
    }
    if (positionFilter < 4) {
      setPositionFilter(positionFilter + 1);
    } else {
      Alert.alert("Squad Complete", "You have selected your full squad.");
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#3C9F5A", padding: 20 }}>
      <Text style={{ fontSize: 20, fontWeight: "bold", color: "white", marginBottom: 10 }}>
        ⚽ Select Your {positionNames[positionFilter]}s
      </Text>

      <FlatList
        data={players.filter((p) => p.element_type === positionFilter)}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={{
              backgroundColor: "#ffffff",
              borderRadius: 10,
              padding: 10,
              marginBottom: 5,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
            }}
            onPress={() => addPlayer(item)}
          >
            <Text style={{ fontSize: 16, fontWeight: "bold" }}>{item.web_name}</Text>
            <Text style={{ fontSize: 14 }}>{item.team_name}</Text>
            <Text style={{ fontSize: 14 }}>£{item.now_cost}m</Text>
          </TouchableOpacity>
        )}
      />

      {/* Formation Display */}
      <View style={{ backgroundColor: "#2E7D32", padding: 15, borderRadius: 10, marginTop: 20 }}>
        <Text style={{ fontSize: 18, fontWeight: "bold", color: "white", textAlign: "center" }}>
          Current Formation
        </Text>
        {Object.keys(positionNames).map((pos) => {
          const playersInPosition = selectedSquad.filter((p) => p.element_type === Number(pos));
          return (
            <View key={pos} style={{ flexDirection: "row", justifyContent: "center", marginVertical: 5 }}>
              {playersInPosition.map((p) => (
                <TouchableOpacity
                  key={p.id}
                  style={{ backgroundColor: "white", padding: 10, borderRadius: 5, marginHorizontal: 5 }}
                  onPress={() => removePlayer(p)}
                >
                  <Text style={{ fontSize: 12, fontWeight: "bold" }}>{p.web_name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          );
        })}
      </View>
        
      {/* Buttons */}
      {positionFilter < 4 ? (
        <TouchableOpacity
          style={{
            backgroundColor: "#e90052",
            padding: 10,
            borderRadius: 10,
            marginTop: 10,
          }}
          onPress={nextPosition}
        >
          <Text style={{ fontSize: 16, fontWeight: "bold", textAlign: "center" }}>
            Next: Select {positionNames[positionFilter + 1]}s
          </Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          style={{
            backgroundColor: "#4CAF50",
            padding: 10,
            borderRadius: 10,
            marginTop: 10,
          }}
          onPress={() => {
            navigation.navigate("ChatScreen", {
              budget: parseFloat(remainingBudget),
              freeTransfers: parseInt(freeTransfers),
              squad: selectedSquad.map((p) => p.id),
              chips: chips,
            });
            console.log(remainingBudget)
          }}
        >
          <Text style={{ fontSize: 16, fontWeight: "bold", textAlign: "center", color: "white" }}>
            Get AI Transfer Advice
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}
