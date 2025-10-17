<!DOCTYPE html>
<html lang="zh-TW">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>LINE 登入處理中...</title>
    <style>
        body {
            font-family: 'Microsoft JhengHei', Arial, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            justify-content: center;
            align-items: center;
            margin: 0;
        }

        .container {
            background: white;
            border-radius: 20px;
            padding: 40px;
            text-align: center;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            max-width: 400px;
        }

        .logo {
            font-size: 4rem;
            margin-bottom: 20px;
        }

        h1 {
            color: #667eea;
            margin-bottom: 20px;
        }

        .spinner {
            border: 4px solid #f3f3f3;
            border-top: 4px solid #667eea;
            border-radius: 50%;
            width: 50px;
            height: 50px;
            animation: spin 1s linear infinite;
            margin: 20px auto;
        }

        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }

        .status {
            color: #666;
            font-size: 0.9rem;
            margin-top: 15px;
        }

        .error {
            background: #ffebee;
            padding: 20px;
            border-radius: 10px;
            border-left: 4px solid #f44336;
            margin-top: 20px;
        }

        .error h2 {
            color: #c62828;
            margin-bottom: 10px;
        }

        .error p {
            color: #666;
            line-height: 1.6;
        }

        .debug {
            background: #f5f5f5;
            padding: 10px;
            border-radius: 5px;
            margin-top: 10px;
            font-size: 0.8rem;
            text-align: left;
            max-height: 200px;
            overflow-y: auto;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="logo">🔐</div>
        <h1>LINE 登入處理中</h1>
        <div class="spinner"></div>
        <div class="status" id="status">正在驗證您的身份...</div>
        <div id="error" style="display: none;"></div>
    </div>

    <script type="module">
        const LINE_LOGIN_CHANNEL_ID = '2008269293';
        const LINE_LOGIN_CHANNEL_SECRET = '025a71a9799934c6ded8b0d6e930a125';
        const REDIRECT_URI = 'https://guimashen.vercel.app/auth/callback';

        function updateStatus(message) {
            document.getElementById('status').textContent = message;
            console.log('[STATUS]', message);
        }

        function showError(title, message, debug = '') {
            document.querySelector('.spinner').style.display = 'none';
            document.getElementById('error').style.display = 'block';
            document.getElementById('error').innerHTML = `
                <div class="error">
                    <h2>❌ ${title}</h2>
                    <p>${message}</p>
                    ${debug ? `<div class="debug"><strong>詳細資訊：</strong><br>${debug}</div>` : ''}
                </div>
            `;
        }

        async function handleCallback() {
            try {
                console.log('=== LINE 登入 Callback 開始 ===');
                console.log('Channel ID:', LINE_LOGIN_CHANNEL_ID);
                console.log('Channel Secret:', LINE_LOGIN_CHANNEL_SECRET);
                console.log('Redirect URI:', REDIRECT_URI);

                // 1. 取得 URL 參數
                const urlParams = new URLSearchParams(window.location.search);
                const code = urlParams.get('code');
                const state = urlParams.get('state');
                const error = urlParams.get('error');

                console.log('URL 參數:');
                console.log('  - code:', code ? '✓ 有' : '✗ 無');
                console.log('  - state:', state ? '✓ 有' : '✗ 無');
                console.log('  - error:', error || '無');

                if (error) {
                    throw new Error(`LINE 授權失敗: ${error}`);
                }

                if (!code) {
                    throw new Error('缺少授權碼 (code)');
                }

                // 2. 解析 state
                let redirectUrl = '/checkin/';

                if (state) {
                    try {
                        console.log('原始 state:', state);
                        const stateData = JSON.parse(decodeURIComponent(state));
                        console.log('解析後 state:', stateData);
                        
                        if (stateData.redirect) {
                            redirectUrl = stateData.redirect;
                            console.log('✓ 將導回:', redirectUrl);
                        }
                    } catch (e) {
                        console.error('✗ 無法解析 state:', e);
                    }
                }

                // 3. 取得 Access Token
                updateStatus('正在取得 Access Token...');
                
                const tokenRequestBody = new URLSearchParams({
                    grant_type: 'authorization_code',
                    code: code,
                    redirect_uri: REDIRECT_URI,
                    client_id: LINE_LOGIN_CHANNEL_ID,
                    client_secret: LINE_LOGIN_CHANNEL_SECRET
                });

                console.log('Token 請求參數:', {
                    grant_type: 'authorization_code',
                    code: code.substring(0, 10) + '...',
                    redirect_uri: REDIRECT_URI,
                    client_id: LINE_LOGIN_CHANNEL_ID,
                    client_secret: LINE_LOGIN_CHANNEL_SECRET.substring(0, 10) + '...'
                });

                const tokenResponse = await fetch('https://api.line.me/oauth2/v2.1/token', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded'
                    },
                    body: tokenRequestBody
                });

                console.log('Token Response Status:', tokenResponse.status);

                if (!tokenResponse.ok) {
                    const errorText = await tokenResponse.text();
                    console.error('Token 錯誤 Response:', errorText);
                    
                    let errorDetail = '';
                    try {
                        const errorJson = JSON.parse(errorText);
                        errorDetail = `錯誤代碼: ${errorJson.error}\n描述: ${errorJson.error_description || '無'}`;
                    } catch (e) {
                        errorDetail = errorText;
                    }
                    
                    throw new Error(`取得 Token 失敗: ${tokenResponse.status}\n\n${errorDetail}`);
                }

                const tokenData = await tokenResponse.json();
                console.log('✓ Access Token 取得成功');

                // 4. 取得使用者資料
                updateStatus('正在取得使用者資料...');

                const profileResponse = await fetch('https://api.line.me/v2/profile', {
                    headers: {
                        'Authorization': `Bearer ${tokenData.access_token}`
                    }
                });

                if (!profileResponse.ok) {
                    throw new Error(`取得使用者資料失敗: ${profileResponse.status}`);
                }

                const profile = await profileResponse.json();
                console.log('✓ 使用者資料取得成功');
                console.log('  - userId:', profile.userId);
                console.log('  - displayName:', profile.displayName);

                // 5. 儲存到 localStorage
                updateStatus('正在儲存登入資訊...');

                localStorage.setItem('line_user_id', profile.userId);
                localStorage.setItem('line_display_name', profile.displayName);
                localStorage.setItem('line_picture_url', profile.pictureUrl || '');
                localStorage.setItem('line_login_timestamp', Date.now().toString());

                console.log('✓ localStorage 儲存成功');

                // 驗證儲存
                const savedUserId = localStorage.getItem('line_user_id');
                console.log('驗證儲存:', savedUserId === profile.userId ? '✓ 成功' : '✗ 失敗');

                // 6. 導回原頁面
                updateStatus('登入成功！正在導回...');
                console.log('=== 準備導向:', redirectUrl, '===');

                setTimeout(() => {
                    window.location.href = redirectUrl;
                }, 1000);

            } catch (error) {
                console.error('✗ 處理失敗:', error);
                showError('登入失敗', error.message, error.stack);
            }
        }

        handleCallback();
    </script>
</body>
</html>
