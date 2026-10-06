import { Navigate } from 'react-router-dom';

function ProtectedRoute({ children }) {
    // Kiểm tra xem trong Local Storage có thông tin Admin chưa
    const adminData = localStorage.getItem("adminData");

    if (!adminData) {
        // Nếu chưa đăng nhập -> Đá văng về trang Login ngay lập tức
        return <Navigate to="/login" replace />;
    }

    // Nếu có rồi -> Cho phép xem trang (children là trang Chấm công, Sản phẩm...)
    return children;
}
export default ProtectedRoute;