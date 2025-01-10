from flask import Flask, request, jsonify, send_from_directory
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
import uuid
from werkzeug.utils import secure_filename
import base64

# Only load .env file if it exists and don't override existing env vars
load_dotenv(override=False)

app = Flask(__name__)

# Update CORS configuration to handle preflight requests properly
CORS(app,
    resources={
        r"/api/*": {
            "origins": ["http://localhost:3000", "http://localhost:5173", "https://multiagent-preview.netlify.app", "https://multiagent-preview.stg.cloud.weni.ai"],
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
    cors_allowed_origins=["http://localhost:3000", "http://localhost:5173", "https://multiagent-preview.netlify.app", "https://multiagent-preview.stg.cloud.weni.ai"],
    async_mode='threading'
)

logging.basicConfig(
    format='[%(asctime)s] p%(process)s {%(filename)s:%(lineno)d} %(levelname)s - %(message)s',
    level=logging.INFO
)
logger = logging.getLogger(__name__)

client = OpenAI()

# Create uploads directory if it doesn't exist
UPLOAD_FOLDER = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'uploads')
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

CLOTHING_ANALYSIS_PROMPT_TEMPLATE = '''Based on the following image description: {image_analysis}

User is looking for: {input_text}

Please consider:
1. Visual details like colors, patterns, and style
2. Clothing categories and types
3. Material and fabric descriptions
4. Fit and sizing elements
5. Similar or alternative clothing suggestions

Provide relevant product recommendations and insights.'''

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
        You are an AI agent naturally describing your current action. Write a first-person summary that feels conversational and engaging.

        Here's the trace of your action:
        {json.dumps(trace, indent=2)}
        
        Guidelines for your response:
        - Write a concise, one-line summary (maximum 10 words)
        - Use natural, varied first-person expressions (e.g., "Looking through", "Currently exploring", "Just checking", "Let me", "Working on", "Searching for")
        - Keep it active and present-focused
        - Make it sound like you're talking to the user
        - Avoid technical details about models or architecture
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
        return "Processing your request now"

@retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=4, max=10))
def get_collaborator_description(collaborator_name: str, instruction: str) -> str:
    try:
        prompt = f"""
        You are an AI agent describing your role in a team. Write a concise description that feels natural and clear.

        Original name: {collaborator_name}
        Original instruction: {instruction}
        
        Guidelines for your response:
        - Write a concise, one-line description (maximum 5 words)
        - Use active, present-tense verbs
        - Focus on the core role of this agent for the team
        - Keep it simple and clear
        - Avoid technical jargon
        """

        response = client.chat.completions.create(
            model="gpt-4o-mini",
            max_tokens=50,
            messages=[{
                "role": "user",
                "content": prompt
            }]
        )
        
        return response.choices[0].message.content
    except Exception as e:
        logger.error(f"Error getting collaborator description: {str(e)}")
        return "Team member"

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

def parse_message_content(message):
    """
    Parse message content intelligently:
    - If message is a string that contains valid JSON with 'text' field, extract the text
    - If message is a string but not JSON, return as is
    - If message is any other type, convert to string
    """
    if not isinstance(message, str):
        return str(message)
    
    # Check if the string starts with { and ends with } (potential JSON)
    message = message.strip()
    if message.startswith('{') and message.endswith('}'):
        try:
            message_data = json.loads(message)
            if isinstance(message_data, dict) and 'text' in message_data:
                return message_data['text']
        except json.JSONDecodeError:
            pass
    
    return message

@app.route('/api/chat', methods=['POST'])
def chat():
    try:
        data = request.get_json()
        raw_message = data.get('message', '')
        skip_trace_summary = data.get('skip_trace_summary', False)
        
        # Convert the message to string first
        message = str(raw_message)
        input_text = message

        # Only try to parse as JSON if it looks like a JSON object or array
        if message.startswith('{') or message.startswith('['):
            try:
                message_data = json.loads(message)
                if isinstance(message_data, dict):
                    input_text = message_data.get('text', message)
                    
                    if message_data.get("type") == "image" and message_data.get('imageAnalysis'):
                        image_analysis = message_data.get('imageAnalysis')
                        input_text = CLOTHING_ANALYSIS_PROMPT_TEMPLATE.format(
                            image_analysis=image_analysis,
                            input_text=input_text
                        )
            except json.JSONDecodeError:
                pass  # Keep the original message if JSON parsing fails

        session_id = data.get('sessionId', 'default-session')
        logger.info(f"Processing chat for session: {session_id} with text: {input_text}")
        
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
            enableTrace=not skip_trace_summary,
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
        final_response = None

        for event in event_stream:
            if 'chunk' in event:
                data = event['chunk']['bytes']
                content = data.decode('utf-8')
                final_response = content
                # Emit the chunk in real-time to specific session room
                logger.info(f"Emitting response chunk to session {session_id}")
                socketio.emit('response_chunk', {'content': content}, room=session_id)
            elif 'trace' in event and not skip_trace_summary:
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
            # Get a summarized description for each collaborator
            original_name = collaborator.get('collaboratorName')
            original_instruction = collaborator.get('collaborationInstruction')
            summarized_description = get_collaborator_description(original_name, original_instruction)
            
            collaborators.append({
                'id': collaborator.get('agentDescriptor').get("aliasArn"),
                'name': original_name,
                'description': summarized_description,
                'type': 'COLLABORATOR'
            })

        print(f"List Collaborators Response: {collaborators}")
        
        return jsonify({
            'collaborators': collaborators,
            'manager': {
                'id': f"arn:aws:bedrock:us-east-1:005047304657:agent-alias/{agent_id}/{agent_alias}",
                'name': 'Manager',
                'description': 'Coordinating team tasks',
                'type': 'MANAGER'
            }
        })
    except Exception as e:
        logger.error(f"Error listing collaborators: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/healthcheck', methods=['GET'])
def health_check():
    return jsonify({
        'status': 'healthy',
        'timestamp': time.time()
    })

@app.route('/api/transcribe', methods=['POST'])
def transcribe_audio():
    try:
        if 'audio' not in request.files:
            return jsonify({'error': 'No audio file provided'}), 400

        audio_file = request.files['audio']
        
        # Generate a unique filename
        filename = f"{uuid.uuid4()}.webm"
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], secure_filename(filename))
        
        # Save the file
        audio_file.save(filepath)
        
        # Read the file for transcription
        with open(filepath, 'rb') as f:
            # Transcribe the audio using OpenAI's Whisper model
            response = client.audio.transcriptions.create(
                model="whisper-1",
                file=(filename, f, "audio/webm"),
                response_format="text"
            )
        
        # Generate the URL for the audio file
        audio_url = f"/api/audio/{filename}"
        
        return jsonify({
            'status': 'success',
            'text': response,
            'audioUrl': audio_url
        })

    except Exception as e:
        logger.error(f"Error transcribing audio: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/audio/<filename>')
def serve_audio(filename):
    try:
        return send_from_directory(app.config['UPLOAD_FOLDER'], filename)
    except Exception as e:
        logger.error(f"Error serving audio file: {str(e)}")
        return jsonify({'error': str(e)}), 404

@app.route('/api/analyze-image', methods=['POST'])
def analyze_image():
    try:
        if 'image' not in request.files:
            return jsonify({'error': 'No image file provided'}), 400

        image_file = request.files['image']
        
        # Generate a unique filename
        filename = f"{uuid.uuid4()}{os.path.splitext(image_file.filename)[1]}"
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], secure_filename(filename))
        
        # Save the file
        image_file.save(filepath)
        
        # Read the image file and encode it as base64
        with open(filepath, 'rb') as f:
            base64_image = base64.b64encode(f.read()).decode('utf-8')
        
        # Call OpenAI's Vision API
        response = client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": "What's in this image? Please provide a detailed but concise description."},
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": f"data:image/jpeg;base64,{base64_image}"
                            }
                        }
                    ]
                }
            ],
            max_tokens=300
        )
        
        # Generate the URL for the image file
        image_url = f"/api/images/{filename}"
        
        return jsonify({
            'status': 'success',
            'text': response.choices[0].message.content,
            'imageUrl': image_url
        })

    except Exception as e:
        logger.error(f"Error analyzing image: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/images/<filename>')
def serve_image(filename):
    try:
        return send_from_directory(app.config['UPLOAD_FOLDER'], filename)
    except Exception as e:
        logger.error(f"Error serving image file: {str(e)}")
        return jsonify({'error': str(e)}), 404

if __name__ == '__main__':
    # app.run(port=5000, debug=True)
    socketio.run(app, port=5000, debug=True) 
