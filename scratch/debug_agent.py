import requests
import json
import os
from google.oauth2 import service_account
from google.auth.transport.requests import Request

# --- CONFIGURATION ---
PROJECT_ID = "951358013739"
LOCATION = "global"
ENGINE_ID = "studysync-ultra_1778762807542"
CREDENTIALS_PATH = r"c:\Users\KIIT0001\Desktop\Projects\google cloud rapid agent\backend\google_credentials.json"

def get_access_token():
    creds = service_account.Credentials.from_service_account_file(
        CREDENTIALS_PATH,
        scopes=['https://www.googleapis.com/auth/cloud-platform']
    )
    creds.refresh(Request())
    return creds.token

def test_answer_endpoint(query):
    access_token = get_access_token()
    url = f"https://discoveryengine.googleapis.com/v1alpha/projects/{PROJECT_ID}/locations/{LOCATION}/collections/default_collection/engines/{ENGINE_ID}/servingConfigs/default_serving_config:answer"
    
    payload = {
        "query": {"text": query}
    }
    headers = {
        "Authorization": f"Bearer {access_token}",
        "Content-Type": "application/json"
    }

    print(f"\n--- Testing ANSWER endpoint with query: '{query}' ---")
    response = requests.post(url, json=payload, headers=headers)
    print(f"Status: {response.status_code}")
    print(json.dumps(response.json(), indent=2))

def test_search_endpoint(query):
    access_token = get_access_token()
    # Search uses a different path and method
    url = f"https://discoveryengine.googleapis.com/v1alpha/projects/{PROJECT_ID}/locations/{LOCATION}/collections/default_collection/engines/{ENGINE_ID}/servingConfigs/default_search:search"
    
    payload = {
        "query": query,
        "pageSize": 5
    }
    headers = {
        "Authorization": f"Bearer {access_token}",
        "Content-Type": "application/json"
    }

    print(f"\n--- Testing SEARCH endpoint with query: '{query}' ---")
    response = requests.post(url, json=payload, headers=headers)
    print(f"Status: {response.status_code}")
    # Search response can be huge, just print if results exist
    res = response.json()
    results = res.get('results', [])
    print(f"Results found: {len(results)}")
    if results:
        print("First result snippet:", results[0].get('document', {}).get('derivedStructData', {}).get('snippets', [{}])[0].get('snippet', 'No snippet'))

if __name__ == "__main__":
    test_query = "What are the benefits of note-taking?"
    test_search_endpoint(test_query)
    test_answer_endpoint(test_query)
