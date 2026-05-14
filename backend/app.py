import sys
import os
import sys
import io

# Force UTF-8 globally for Windows
if sys.platform == "win32":
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')

# Add the current directory to sys.path to allow relative imports for routes
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from flask import Flask
from flask_cors import CORS
import phoenix as px
from openinference.instrumentation.google_generativeai import GoogleGenerativeAiInstrumentor

# Initialize Arize Phoenix for AI Observability
# Switches to Cloud mode if PHOENIX_API_KEY is found, otherwise uses Local mode
try:
    api_key = os.getenv("PHOENIX_API_KEY")
    if api_key:
        from opentelemetry.exporter.otlp.proto.http.trace_exporter import OTLPSpanExporter
        from opentelemetry.sdk.trace import TracerProvider
        from opentelemetry.sdk.trace.export import BatchSpanProcessor
        
        # Configure Cloud Export
        endpoint = "https://app.phoenix.arize.com/v1/traces"
        exporter = OTLPSpanExporter(endpoint=endpoint, headers={"api_key": api_key})
        tracer_provider = TracerProvider()
        tracer_provider.add_span_processor(BatchSpanProcessor(exporter))
        
        GoogleGenerativeAiInstrumentor().instrument(tracer_provider=tracer_provider)
        print("✦ Arize Phoenix Cloud: CONNECTED")
    else:
        # Local Mode
        px.launch_app()
        GoogleGenerativeAiInstrumentor().instrument()
        print("✦ Arize Phoenix Local: ACTIVE (No API Key found)")
except Exception as e:
    print(f"✦ Arize Phoenix failed to start: {e}")

from routes.sessions import sessions_bp
from routes.notes import notes_bp
from routes.tasks import tasks_bp
from routes.chat import chat_bp
from routes.flashcards import flashcards_bp

app = Flask(__name__)
CORS(app)

# Register Blueprints with /api prefix
app.register_blueprint(sessions_bp, url_prefix='/api/sessions')
app.register_blueprint(notes_bp, url_prefix='/api/notes')
app.register_blueprint(tasks_bp, url_prefix='/api/tasks')
app.register_blueprint(chat_bp, url_prefix='/api/chat')
app.register_blueprint(flashcards_bp, url_prefix='/api/flashcards')

@app.route('/')
def index():
    return {"message": "StudySync API is running", "version": "1.0.0"}

if __name__ == '__main__':
    # Using port 5000 as requested
    app.run(host='0.0.0.0', port=5000, debug=False)
