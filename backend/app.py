from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_socketio import SocketIO, emit, join_room, disconnect
import boto3
import logging
import json
import os
from dotenv import load_dotenv
import traceback
import time
from tenacity import retry, stop_after_attempt, wait_exponential
from openai import OpenAI

load_dotenv()

app = Flask(__name__)

# Update CORS configuration to handle preflight requests properly
CORS(app,
    resources={
        r"/api/*": {
            "origins": ["http://localhost:3000", "http://localhost:5173", "https://multiagent-preview.netlify.app"],
            "methods": ["GET", "POST", "OPTIONS"],  # Explicitly include OPTIONS
            "allow_headers": ["Content-Type", "Authorization", "Accept"],  # Add commonly needed headers
            "expose_headers": ["Content-Type"],
            "supports_credentials": True,
            "send_wildcard": False,
            "max_age": 3600  # Cache preflight request results for 1 hour
        }
    },
    supports_credentials=True
)

# Configure SocketIO with proper CORS settings
socketio = SocketIO(app,
    cors_allowed_origins=["http://localhost:3000", "http://localhost:5173", "https://multiagent-preview.netlify.app"],
    async_mode='threading'
)

logging.basicConfig(
    format='[%(asctime)s] p%(process)s {%(filename)s:%(lineno)d} %(levelname)s - %(message)s',
    level=logging.INFO
)
logger = logging.getLogger(__name__)

client = OpenAI()

def get_bedrock_client():
    session = boto3.Session(
        aws_access_key_id=os.getenv('AWS_ACCESS_KEY_ID'),
        aws_secret_access_key=os.getenv('AWS_SECRET_ACCESS_KEY'),
        aws_session_token=os.getenv('AWS_SESSION_TOKEN'),
        region_name=os.getenv('AWS_REGION')
    )
    return session.client(service_name="bedrock-agent")

def get_bedrock_runtime_client():
    session = boto3.Session(
        aws_access_key_id=os.getenv('AWS_ACCESS_KEY_ID'),
        aws_secret_access_key=os.getenv('AWS_SECRET_ACCESS_KEY'),
        aws_session_token=os.getenv('AWS_SESSION_TOKEN'),
        region_name=os.getenv('AWS_REGION')
    )
    return session.client(service_name="bedrock-agent-runtime")

@retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=4, max=10))
def get_trace_summary(trace):
    try:
        # Add a small delay between API calls to respect rate limits
        time.sleep(3)
        
        prompt = f"""
        Summarize this Bedrock Agent trace in a clear and concise way, focusing on what the agent is doing in this step:
        
        {json.dumps(trace, indent=2)}
        
        Provide a one-line summary with maximum of 5 words that captures the key action or decision being made.
        Do not mention what the architectured or models behind each step, consider it as confidential, consider the text will be demonstrated to possible competitors.
        """

        response = client.chat.completions.create(
            model="gpt-4o-mini",
            max_tokens=100,
            messages=[{
                "role": "user",
                "content": prompt
            }]
        )
        
        return response.choices[0].message.content
    except Exception as e:
        logger.error(f"Error getting trace summary: {str(e)}")
        return "Processing step"

# Socket.IO event handlers
@socketio.on('connect')
def handle_connect():
    logger.info(f"Client connected with SID: {request.sid}")

@socketio.on('join')
def on_join(data):
    session_id = data.get('sessionId', 'default-session')
    join_room(session_id)
    logger.info(f"Client {request.sid} joined room: {session_id}")

@socketio.on('disconnect')
def handle_disconnect():
    logger.info(f"Client disconnected with SID: {request.sid}")

@app.route('/api/chat', methods=['POST'])
def chat():
    try:
        data = request.json
        input_text = data.get('message')
        session_id = data.get('sessionId', 'default-session')
        logger.info(f"Processing chat for session: {session_id}")
        
        agent_id = os.getenv('BEDROCK_AGENT_ID')
        agent_alias = os.getenv('BEDROCK_AGENT_ALIAS')
        knowledge_base_id = os.getenv('BEDROCK_KNOWLEDGE_BASE_ID')
        nexus_content_base_uuid = os.getenv('NEXUS_CONTENT_BASE_UUID')

        bedrock_agent_runtime = get_bedrock_runtime_client()

        single_filter = {
            "equals": {
                "key": "contentBaseUuid",
                "value": nexus_content_base_uuid
            }
        }

        retrieval_configuration = {
            "vectorSearchConfiguration": {
                "filter": single_filter
            }
        }

        response = bedrock_agent_runtime.invoke_agent(
            agentId=agent_id,
            agentAliasId=agent_alias,
            sessionId=session_id,
            inputText=input_text,
            enableTrace=True,
            sessionState={
                'knowledgeBaseConfigurations': [
                    {
                        'knowledgeBaseId': knowledge_base_id,
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
                content = data.decode('utf-8')
                final_response = content
                # Emit the chunk in real-time to specific session room
                logger.info(f"Emitting response chunk to session {session_id}")
                socketio.emit('response_chunk', {'content': content}, room=session_id)
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
                    # Emit the trace in real-time to specific session room
                    logger.info(f"Emitting trace update to session {session_id}")
                    socketio.emit('trace_update', {'trace': formatted_trace}, room=session_id)
                else:
                    trace_data['summary'] = get_trace_summary(trace_data)
                    # Emit the trace in real-time to specific session room
                    logger.info(f"Emitting trace update to session {session_id}")
                    socketio.emit('trace_update', {'trace': trace_data}, room=session_id)

        return jsonify({
            'status': 'success'
        })

    except Exception as e:
        traceback.print_exc()
        logger.error(f"Error: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/collaborators', methods=['GET'])
def list_collaborators():
    try:
        bedrock_agent = get_bedrock_client()
        
        agent_id = os.getenv('BEDROCK_AGENT_ID')
        agent_version = os.getenv('BEDROCK_AGENT_VERSION')
        agent_alias = os.getenv('BEDROCK_AGENT_ALIAS')

        response = bedrock_agent.list_agent_collaborators(
            agentId=agent_id,
            agentVersion=agent_version
        )
        
        collaborators = []
        for collaborator in response.get('agentCollaboratorSummaries', []):
            collaborators.append({
                'id': collaborator.get('agentDescriptor').get("aliasArn"),
                'name': collaborator.get('collaboratorName'),
                'description': collaborator.get('collaborationInstruction'),
                'type': 'COLLABORATOR'
            })

        print(f"List Collaborators Response: {collaborators}")
        
        return jsonify({
            'collaborators': collaborators,
            'manager': {
                'id': f"arn:aws:bedrock:us-east-1:005047304657:agent-alias/{agent_id}/{agent_alias}",
                'name': 'Manager',
                'description': 'Coordinate the team',
                'type': 'MANAGER'
            }
        })
    except Exception as e:
        logger.error(f"Error listing collaborators: {str(e)}")
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    # app.run(port=5000, debug=True)
    socketio.run(app, port=5000, debug=True) 
