import React from 'react'
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
function GoogleLoginComponent() {
    const handleLoginSuccess = (response) => {
        console.log('Đăng nhập thành công:', response);
        // Xử lý token hoặc thông tin người dùng tại đây
        };

        const handleLoginFailure = (error) => {
        console.log('Đăng nhập thất bại:', error);
    };
  return (
    <GoogleOAuthProvider clientId="582300930965-hs8ibl57hq977ih4c0q627n2pg24dc4b.apps.googleusercontent.com">
      <div>
        <GoogleLogin
          text='Đăng nhập với Google2'
          onSuccess={handleLoginSuccess}
          onError={handleLoginFailure}
        />
      </div>
    </GoogleOAuthProvider>
  )
}

export default GoogleLoginComponent