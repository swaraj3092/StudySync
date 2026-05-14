import os
import requests
from google.auth.transport.requests import Request
from google.oauth2 import service_account
import json

# Setup
PROJECT_ID = "studysync-ai-platform"
LOCATION = "global"
ENGINE_ID = "studysync-agent_1778747219824"
os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = "google_credentials.json"

def test_deep_knowledge():
    print(f"--- DEEP KNOWLEDGE TEST ---")
    try:
        # 1. Get Token
        creds = service_account.Credentials.from_service_account_file(
            os.environ["GOOGLE_APPLICATION_CREDENTIALS"],
            scopes=['https://www.googleapis.com/auth/cloud-platform']
        )
        creds.refresh(Request())
        access_token = creds.token

        # 2. Build URL
        api_url = f"https://discoveryengine.googleapis.com/v1/projects/{PROJECT_ID}/locations/{LOCATION}/collections/default_collection/engines/{ENGINE_ID}/servingConfigs/default_serving_config:answer"

        # 3. Specific Question from Wikipedia
        payload = {
            "query": {"text": "What are the specific study skills mentioned on Wikipedia?"}
        }
        headers = {
            "Authorization": f"Bearer {access_token}",
            "Content-Type": "application/json"
        }

        # 4. Call
        response = requests.post(api_url, json=payload, headers=headers)
        result = response.json()

        print("\n1. Summary Result:")
        print(repr(result.get("answer", {}).get("answerText", "NO SUMMARY GENERATED")))

        print("\n2. Search Results (Evidence):")
        results = result.get("answer", {}).get("citations", [])
        if results:
            print(f"✅ Found {len(results)} source citations!")
        else:
            print("❌ No sources found. The Data Store might be empty or still indexing.")

    except Exception as e:
        print(f"Error: {repr(e)}")

if __name__ == "__main__":
    test_deep_knowledge()
