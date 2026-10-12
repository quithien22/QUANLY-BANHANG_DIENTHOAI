import React from 'react';
import axios from 'axios';
import { GoogleOAuthProvider, useGoogleLogin } from '@react-oauth/google';

// Client ID lấy từ file .env của frontend: REACT_APP_GOOGLE_CLIENT_ID=xxxx.apps.googleusercontent.com
// (Chú ý: đây là Client ID, KHÔNG phải Client Secret "GOCSPX-...". Không bao giờ để Client Secret trong code frontend.)
const clientId = process.env.REACT_APP_GOOGLE_CLIENT_ID || '';

const GoogleIcon = () => (
    <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true">
        <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
        <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
        <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
        <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
    </svg>
);

// Nút Google thật (chỉ render khi đã có clientId)
function NutGoogle({ onSuccess, onError }) {
    const [dangXuLy, setDangXuLy] = React.useState(false);

    const dangNhapGoogle = useGoogleLogin({
        onSuccess: async (tokenResponse) => {
            setDangXuLy(true);
            try {
                // Gửi token xuống Backend để xác thực với Google và lấy/tạo tài khoản
                const res = await axios.post('http://localhost:8080/api/user/dang-nhap-google', {
                    accessToken: tokenResponse.access_token,
                });
                onSuccess(res.data.userInfo);
            } catch (err) {
                onError(err.response?.data?.message || 'Lỗi kết nối đến máy chủ!');
            } finally {
                setDangXuLy(false);
            }
        },
        onError: () => onError('Đăng nhập Google thất bại, vui lòng thử lại!'),
        // Người dùng tự đóng cửa sổ popup -> không báo lỗi
        onNonOAuthError: () => { },
    });

    return (
        <button
            type="button"
            className="btn-social google"
            onClick={() => dangNhapGoogle()}
            disabled={dangXuLy}
        >
            <GoogleIcon />
            {dangXuLy ? 'Đang xử lý...' : 'Google'}
        </button>
    );
}

// Component dùng ở trang đăng nhập: <LoginGoogle onSuccess={(userInfo) => ...} onError={(msg) => ...} />
function LoginGoogle({ onSuccess, onError }) {
    // Chưa cấu hình Client ID -> vẫn hiện nút nhưng báo lỗi rõ ràng khi bấm
    if (!clientId) {
        return (
            <button
                type="button"
                className="btn-social google"
                onClick={() => onError('Chưa cấu hình REACT_APP_GOOGLE_CLIENT_ID trong file .env của frontend!')}
            >
                <GoogleIcon />
                Google
            </button>
        );
    }

    return (
        <GoogleOAuthProvider clientId={clientId}>
            <NutGoogle onSuccess={onSuccess} onError={onError} />
        </GoogleOAuthProvider>
    );
}

export default LoginGoogle;
