from flask import Flask, request, jsonify
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
from flask_cors import CORS
from google.auth.transport import requests as google_requests
from google.oauth2 import id_token
import requests
import os
from datetime import timedelta

app = Flask(__name__)

load_dotenv()

# 환경 변수 설정
app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY')  # 실제 환경에서는 환경변수 사용
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(hours=1)
app.config['JWT_TOKEN_LOCATION'] = ['cookies']
app.config['JWT_COOKIE_SECURE'] = False  # 개발환경용, 프로덕션에서는 True
app.config['JWT_COOKIE_CSRF_PROTECT'] = False  # 개발환경용

# Google OAuth2 설정
GOOGLE_CLIENT_ID = os.getenv('GOOGLE_CLIENT_ID')
GOOGLE_CLIENT_SECRET = os.getenv('GOOGLE_CLIENT_SECRET')

# Flask-JWT-Extended 초기화
jwt = JWTManager(app)

# CORS 설정
CORS(app, origins=["http://localhost:3000"], supports_credentials=True)

# 사용자 데이터베이스 (실제 환경에서는 실제 DB 사용)
users_db = {}

@app.route('/api/auth/google', methods=['POST'])
def google_login():
    """구글 OAuth2 로그인 처리"""
    try:
        data = request.get_json()
        
        # 방법 1: Google ID Token 검증 (권장)
        if 'id_token' in data:
            # Google ID Token 직접 검증
            id_token_str = data['id_token']
            
            # Google의 공개 키로 ID Token 검증
            id_info = id_token.verify_oauth2_token(
                id_token_str, 
                google_requests.Request(), 
                GOOGLE_CLIENT_ID
            )
            
            # 사용자 정보 추출
            user_info = {
                'google_id': id_info['sub'],
                'email': id_info['email'],
                'name': id_info['name'],
                'picture': id_info.get('picture', '')
            }
        
        # 방법 2: Authorization Code로 토큰 교환
        elif 'code' in data:
            auth_code = data['code']
            
            # Google OAuth2 토큰 엔드포인트로 토큰 교환
            token_data = {
                'code': auth_code,
                'client_id': GOOGLE_CLIENT_ID,
                'client_secret': GOOGLE_CLIENT_SECRET,
                'redirect_uri': 'postmessage',  # JavaScript origins용
                'grant_type': 'authorization_code'
            }
            
            # 구글에서 액세스 토큰 받기
            token_response = requests.post(
                'https://oauth2.googleapis.com/token', 
                data=token_data
            )
            token_json = token_response.json()
            
            if 'access_token' not in token_json:
                return jsonify({'error': 'Failed to get access token'}), 400
            
            # 액세스 토큰으로 사용자 정보 조회
            headers = {'Authorization': f'Bearer {token_json["access_token"]}'}
            user_response = requests.get(
                'https://www.googleapis.com/oauth2/v3/userinfo', 
                headers=headers
            )
            user_info = user_response.json()
        
        else:
            return jsonify({'error': 'Missing id_token or code'}), 400
        
        # 사용자 DB에 저장 또는 업데이트
        user_id = user_info.get('sub', user_info.get('google_id'))
        users_db[user_id] = user_info
        
        # JWT 토큰 생성
        access_token = create_access_token(
            identity=user_info['email'],
            additional_claims={
                'user_id': user_id,
                'name': user_info.get('name', ''),
                'picture': user_info.get('picture', '')
            }
        )
        
        # 쿠키로 JWT 토큰 설정하여 응답
        response = jsonify({
            'message': 'Login successful',
            'user': {
                'email': user_info['email'],
                'name': user_info.get('name', ''),
                'picture': user_info.get('picture', '')
            }
        })
        response.set_cookie(
            'access_token_cookie', 
            access_token,
            httponly=True,
            secure=False,  # 개발환경용
            samesite='Lax'
        )
        
        return response, 200
        
    except ValueError as e:
        # ID Token 검증 실패
        return jsonify({'error': 'Invalid token'}), 401
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/auth/logout', methods=['POST'])
@jwt_required()
def logout():
    """로그아웃 처리"""
    response = jsonify({'message': 'Logout successful'})
    response.set_cookie('access_token_cookie', '', expires=0)
    return response

@app.route('/api/user/profile', methods=['GET'])
@jwt_required()
def get_profile():
    """보호된 라우트 - 사용자 프로필 조회"""
    current_user_email = get_jwt_identity()
    # JWT에서 추가 정보 가져오기
    from flask_jwt_extended import get_jwt
    claims = get_jwt()
    
    return jsonify({
        'email': current_user_email,
        'user_id': claims.get('user_id'),
        'name': claims.get('name'),
        'picture': claims.get('picture')
    })

@app.route('/api/protected', methods=['GET'])
@jwt_required()
def protected():
    """보호된 라우트 예시"""
    current_user = get_jwt_identity()
    return jsonify({'message': f'Hello {current_user}!'})

@app.route('/api/health', methods=['GET'])
def health_check():
    """헬스 체크"""
    return jsonify({'status': 'OK'})

# JWT 에러 핸들러
@jwt.expired_token_loader
def expired_token_callback(jwt_header, jwt_payload):
    return jsonify({'error': 'Token has expired'}), 401

@jwt.invalid_token_loader
def invalid_token_callback(error):
    return jsonify({'error': 'Invalid token'}), 401

@jwt.unauthorized_loader
def missing_token_callback(error):
    return jsonify({'error': 'Authorization token is required'}), 401

if __name__ == '__main__':
    app.run(debug=True, port=5000)