from flask import Flask, request, jsonify
from flask_cors import CORS
import boto3
import logging
import json
import os
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
CORS(app, resources={r"/api/*": {
    "origins": "http://localhost:3000",
    "methods": ["GET", "POST", "OPTIONS"],
    "allow_headers": ["Content-Type"]
}})

logging.basicConfig(
    format='[%(asctime)s] p%(process)s {%(filename)s:%(lineno)d} %(levelname)s - %(message)s',
    level=logging.INFO
)
logger = logging.getLogger(__name__)

def get_bedrock_client():
    session = boto3.Session(
        aws_access_key_id=os.getenv('AWS_ACCESS_KEY_ID'),
        aws_secret_access_key=os.getenv('AWS_SECRET_ACCESS_KEY'),
        aws_session_token=os.getenv('AWS_SESSION_TOKEN'),
        region_name=os.getenv('AWS_REGION')
    )
    return session.client(service_name="bedrock-agent-runtime")

@app.route('/api/chat', methods=['POST'])
def chat():
    try:
        data = request.json
        input_text = data.get('message')
        session_id = data.get('sessionId', 'default-session')

        bedrock_agent_runtime = get_bedrock_client()

        single_filter = {
            "equals": {
                "key": "contentBaseUuid",
                "value": "8beca63a-1342-4702-bf85-7aea171488c3"
            }
        }

        retrieval_configuration = {
            "vectorSearchConfiguration": {
                "filter": single_filter
            }
        }

        response = bedrock_agent_runtime.invoke_agent(
            agentId='IW1ZYC0HAX',
            agentAliasId='QDIBJT6CZ3',
            sessionId=session_id,
            inputText=input_text,
            enableTrace=True,
            sessionState={
                'knowledgeBaseConfigurations': [
                    {
                        'knowledgeBaseId': '4ZWOZCDBGV',
                        'retrievalConfiguration': retrieval_configuration
                    }
                ]
            }
        )

        traces = []
        final_response = None

        event_stream = response["completion"]
        for event in event_stream:
            if 'chunk' in event:
                data = event['chunk']['bytes']
                final_response = data.decode('utf-8')
            elif 'trace' in event:
                traces.append(event['trace'])

        return jsonify({
            'message': final_response,
            'traces': traces
        })

    except Exception as e:
        logger.error(f"Error: {str(e)}")
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(port=5000, debug=True) 