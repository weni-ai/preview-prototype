from flask import Flask, request, jsonify
from flask_cors import CORS
import boto3
import logging
import json
import os
from dotenv import load_dotenv
import anthropic

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

client = anthropic.Anthropic(api_key=os.getenv('ANTHROPIC_API_KEY'))

def get_bedrock_client():
    session = boto3.Session(
        aws_access_key_id=os.getenv('AWS_ACCESS_KEY_ID'),
        aws_secret_access_key=os.getenv('AWS_SECRET_ACCESS_KEY'),
        aws_session_token=os.getenv('AWS_SESSION_TOKEN'),
        region_name=os.getenv('AWS_REGION')
    )
    return session.client(service_name="bedrock-agent-runtime")

def get_trace_summary(trace):
    try:
        prompt = f"""
        Summarize this Bedrock Agent trace in a clear and concise way, focusing on what the agent is doing in this step:
        
        {json.dumps(trace, indent=2)}
        
        Provide a one-line summary that captures the key action or decision being made.
        """

        message = client.messages.create(
            model="claude-3-5-haiku-20241022",
            max_tokens=100,
            messages=[{
                "role": "user",
                "content": prompt
            }]
        )
        
        return message.content[0].text
    except Exception as e:
        logger.error(f"Error getting trace summary: {str(e)}")
        return "Processing step"

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

        event_stream = response["completion"]
        traces = []
        final_response = None

        for event in event_stream:
            if 'chunk' in event:
                data = event['chunk']['bytes']
                final_response = data.decode('utf-8')
            elif 'trace' in event:
                trace_data = event['trace']
                if 'type' in trace_data:
                    formatted_trace = {
                        'type': trace_data['type'],
                        'modelInvocationInput': trace_data.get('modelInvocationInput', {}),
                        'modelInvocationOutput': {}
                    }
                    
                    # Handle different trace types
                    if trace_data['type'] == 'PRE_PROCESSING':
                        formatted_trace['modelInvocationOutput'] = trace_data.get('modelInvocationOutput', {})
                    elif trace_data['type'] == 'ORCHESTRATION':
                        formatted_trace['modelInvocationOutput'] = {
                            'rationale': trace_data.get('rationale', {}),
                            'observation': trace_data.get('observation', {})
                        }
                    elif trace_data['type'] == 'POST_PROCESSING':
                        formatted_trace['modelInvocationOutput'] = trace_data.get('modelInvocationOutput', {})
                    
                    # Get summary from Claude
                    formatted_trace['summary'] = get_trace_summary(trace_data)
                    traces.append(formatted_trace)
                else:
                    trace_data['summary'] = get_trace_summary(trace_data)
                    traces.append(trace_data)

        return jsonify({
            'message': final_response,
            'traces': traces
        })

    except Exception as e:
        logger.error(f"Error: {str(e)}")
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(port=5000, debug=True) 