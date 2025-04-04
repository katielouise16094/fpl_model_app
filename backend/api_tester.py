import requests

url = "http://127.0.0.1:5000/predict"
data = {
    "squad": [1, 2, 3, 4, 5],  # Example player IDs in your squad
    "budget": 100.0,           # Example remaining budget
    "free_transfers": 2,       # Example free transfers remaining
    "chips": ["wildcard"]      # Example chips in play
}

response = requests.post(url, json=data)

# Print the JSON response from the API
print(response.json())
