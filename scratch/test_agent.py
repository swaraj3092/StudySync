import requests
import json

url = "http://127.0.0.1:5000/api/chat/send"
data = {
    "message": "What are some common study skills mentioned in the document?",
    "userId": "test_user"
}
headers = {
    "Content-Type": "application/json"
}

try:
    response = requests.post(url, data=json.dumps(data), headers=headers)
    print(f"Status Code: {response.status_code}")
    print("Response:")
    print(json.dumps(response.json(), indent=2))
except Exception as e:
    print(f"Error: {e}")
