import requests
import json

url = "http://127.0.0.1:5000/api/chat/send"
payload = {
    "message": "What are the first steps to learn machine learning?",
    "userId": "dev_guest_user"
}
headers = {"Content-Type": "application/json"}

print(f"--- Sending query: '{payload['message']}' ---")
response = requests.post(url, json=payload, headers=headers)
print(f"Status Code: {response.status_code}")
print(f"Response:\n{json.dumps(response.json(), indent=2)}")
