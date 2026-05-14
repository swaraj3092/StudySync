import os
from google.cloud import discoveryengine_v1 as discoveryengine
from google.api_core.client_options import ClientOptions
import sys

# Final Verified Setup
os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = "google_credentials.json"
PROJECT_ID = "studysync-ai-platform"
LOCATION = "global"
ENGINE_ID = "studysync-agent_1778747219824"

def test_agent():
    print(f"--- TESTING VERIFIED GOOGLE AGENT: {ENGINE_ID} ---")
    try:
        client_options = ClientOptions(api_endpoint=f"{LOCATION}-discoveryengine.googleapis.com")
        client = discoveryengine.ConversationalSearchServiceClient(client_options=client_options)
        
        serving_config = f"projects/{PROJECT_ID}/locations/{LOCATION}/collections/default_collection/engines/{ENGINE_ID}/servingConfigs/default_serving_config"
        
        query = discoveryengine.Query(text="What are study skills?")
        request = discoveryengine.AnswerQueryRequest(
            serving_config=serving_config,
            query=query,
        )
        
        response = client.answer_query(request=request)
        print("\n✅ SUCCESS! AGENT IS ALIVE:")
        print("-" * 30)
        print(repr(response.answer.answer_text[:100]))
        print("-" * 30)
        
    except Exception as e:
        print("\n❌ AGENT STILL UNREACHABLE:")
        print(repr(e))

if __name__ == "__main__":
    test_agent()
