import os
from google.cloud import discoveryengine_v1 as discoveryengine
from google.api_core.client_options import ClientOptions
import sys

# Setup
os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = "google_credentials.json"
PROJECT_ID = "951358013739"
LOCATION = "global"
ENGINE_ID = "studysync-agent_1778747204481"

def test_agent():
    print(f"--- TESTING GOOGLE AGENT: {ENGINE_ID} ---")
    try:
        client_options = ClientOptions(api_endpoint=f"{LOCATION}-discoveryengine.googleapis.com")
        client = discoveryengine.ConversationalSearchServiceClient(client_options=client_options)
        
        serving_config = f"projects/{PROJECT_ID}/locations/{LOCATION}/collections/default_collection/engines/{ENGINE_ID}/servingConfigs/default_serving_config"
        
        query = discoveryengine.Query(text="What are the best study skills?")
        request = discoveryengine.AnswerQueryRequest(
            serving_config=serving_config,
            query=query,
        )
        
        response = client.answer_query(request=request)
        print("\n✅ SUCCESS! AGENT RESPONDED:")
        print("-" * 30)
        # Using repr to avoid charmap errors in terminal
        print(repr(response.answer.answer_text))
        print("-" * 30)
        
    except Exception as e:
        print("\n❌ AGENT FAILED:")
        print(repr(e))

if __name__ == "__main__":
    test_agent()
