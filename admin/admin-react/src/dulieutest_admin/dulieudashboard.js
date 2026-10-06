 

// 4 thẻ thống kê trên cùng
export const thongKeTongQuan = [
    { label: "Doanh thu hôm nay", value: "đ45,230,000", change: "+12.5%", so: "so với hôm qua", icon: "bx-dollar-circle" },
    { label: "Đơn hàng mới", value: "128", change: "+8.4%", so: "so với hôm qua", icon: "bx-cart"  },
    { label: "Sản phẩm sắp hết hàng", value: "23", canhBao: "Cần nhập kho gấp", icon: "bx bx-alert-triangle",   },
    { label: "Đánh giá chưa phản hồi", value: "15", moTa: "Ưu tiên phản hồi KH", icon: "bx-star",   },
];
 
// Dữ liệu biểu đồ doanh thu 30 ngày
export const doanhThu30Ngay = [
    { ngay: "01/02", doanhThu: 15000000 },  
   
    { ngay: "06/02", doanhThu: 25000000 },
    { ngay: "11/02", doanhThu: 10000000 },
    { ngay: "15/02", doanhThu: 48500000 }, 
    { ngay: "21/02", doanhThu: 35000000 },
    { ngay: "26/02", doanhThu: 12000000 },
];
// Top 5 sản phẩm bán chạy
export const topSanPhamBanChay = [
    { name: "iPhone 15 Pro Max", soLuong: 142, phanTram: 100 },
    { name: "Samsung S24 Ultra", soLuong: 119, phanTram: 84 },
    { name: "MacBook Air M3", soLuong: 90, phanTram: 63 },
    { name: "Xiaomi 14 Ultra", soLuong: 72, phanTram: 51 },
    { name: "iPad Pro M4", soLuong: 51, phanTram: 36 },
];

// Đơn hàng mới nhất
export const donHangMoiNhat = [
    { maDon: "#DH-9402", khachHang: "Trần Thị Lan", tongTien: "đ24,990,000", trangThai: "Chờ xác nhận" },
    { maDon: "#DH-9401", khachHang: "Lê Văn Hùng", tongTien: "đ18,450,000", trangThai: "Đang giao" },
    { maDon: "#DH-9400", khachHang: "Nguyễn Minh Anh", tongTien: "đ5,200,000", trangThai: "Hoàn tất" },
    { maDon: "#DH-9399", khachHang: "Phạm Hồng Sơn", tongTien: "đ32,120,000", trangThai: "Chờ xác nhận" },
    { maDon: "#DH-9398", khachHang: "Hoàng Ngọc Ánh", tongTien: "đ1,250,000", trangThai: "Hoàn tất" },
];

// Sản phẩm tồn kho thấp
export const sanPhamTonKhoThap = [
    { name: "Apple iPhone 15 Pro 256G...", conLai: 3 },
    { name: "iPad Air 6 M2 11-inch Wifi 128GB", conLai: 5 },
    { name: "Xiaomi Redmi Note 13 Pro 4G", conLai: 8 },
    { name: "Sony WH-1000XM5 Noise Can...", conLai: 2 },
    { name: "Samsung Watch6 LTE 4...", conLai: 4 },
];

export const danhMucSanPham = [
    { id: "#CAT-0272", name: "Iphone", soLuong: 42, 
        img: "https://cdn2.cellphones.com.vn/insecure/rs:fill:300:300/q:100/plain/https://cellphones.com.vn/media/catalog/product/i/p/iphone-18-pro-01.jpg", 
        isActive: true },
    { id: "#CAT-0761", name: "SamSung", soLuong: 28, 
        img: "https://cdn2.cellphones.com.vn/insecure/rs:fill:300:300/q:100/plain/https://cellphones.com.vn/media/catalog/product/d/i/dien-thoai-samsung-galaxy-s25-ultra_3__3.png", 
        isActive: true },
    { id: "#CAT-0772", name: "Xiaomi", soLuong: 15, 
        img: "https://cdn2.cellphones.com.vn/insecure/rs:fill:358:358/q:90/plain/https://cellphones.com.vn/media/catalog/product/x/i/xiaomi-poco-f9-ultra-red.jpg",
         isActive: true },
    { id: "#CAT-0803", name: "Oppo", soLuong: 12,
         img: "https://cdn2.cellphones.com.vn/insecure/rs:fill:358:358/q:90/plain/https://cellphones.com.vn/media/catalog/product/o/p/oppo-reno16f-pop-white-9.jpg", 
         isActive: true }, /* Tắt trạng thái để test nút xám */
    { id: "#CAT-0844", name: "Tablet", soLuong: 34,
         img: "https://cdn2.cellphones.com.vn/insecure/rs:fill:358:358/q:90/plain/https://cellphones.com.vn/media/catalog/product/x/i/xiaomi-pad-mini.jpg",
          isActive: true },
    { id: "#CAT-0275", name: "Phụ Kiện", soLuong: 110,
         img: "https://cdn2.cellphones.com.vn/insecure/rs:fill:358:358/q:90/plain/https://cellphones.com.vn/media/catalog/product/a/p/apple-airpods-4-thumb.png",
          isActive: true }
];


export const danhSachDonHang = [
    { 
        maDonHang: "#DH-9402", 
        tenKhachHang: "Trần Thị Lan", 
        sdt: "0912 345 678", 
        soSanPham: 2, 
        tenSanPham: "Apple iPhone 18 Pro Max 1T",
        img: "https://cdn2.cellphones.com.vn/insecure/rs:fill:300:300/q:100/plain/https://cellphones.com.vn/media/catalog/product/i/p/iphone-18-pro-01.jpg", 
        tongTien: "đ24,990,000", 
        trangThai: "Chờ xác nhận", 
        ngayLap: "24/02/2026" 
    },
    { 
        maDonHang: "#DH-9401", 
        tenKhachHang: "Lê Văn Hùng", 
        sdt: "0988 765 432", 
        soSanPham: 1, 
        tenSanPham: "Apple iPhone 18 Pro Max 1T",
        img: "https://cdn2.cellphones.com.vn/insecure/rs:fill:300:300/q:100/plain/https://cellphones.com.vn/media/catalog/product/i/p/iphone-18-pro-01.jpg", 
        tongTien: "đ18,450,000", 
        trangThai: "Đang giao", 
        ngayLap: "23/02/2026" 
    },
    { 
        maDonHang: "#DH-9400", 
        tenKhachHang: "Nguyễn Minh Anh", 
        sdt: "0909 111 222", 
        soSanPham: 3, 
        tenSanPham: "Apple iPhone 18 Pro Max 1T",
        img: "https://cdn2.cellphones.com.vn/insecure/rs:fill:300:300/q:100/plain/https://cellphones.com.vn/media/catalog/product/i/p/iphone-18-pro-01.jpg", 
        tongTien: "đ5,200,000", 
        trangThai: "Hoàn tất", 
        ngayLap: "23/02/2026" 
    },
    { 
        maDonHang: "#DH-9399", 
        tenKhachHang: "Phạm Hồng Sơn", 
        sdt: "0977 444 555", 
        soSanPham: 1, 
        tenSanPham: "Apple iPhone 18 Pro Max 1T",
        img: "https://cdn2.cellphones.com.vn/insecure/rs:fill:300:300/q:100/plain/https://cellphones.com.vn/media/catalog/product/i/p/iphone-18-pro-01.jpg", 
        tongTien: "đ32,120,000", 
        trangThai: "Chờ xác nhận", 
        ngayLap: "22/02/2026" 
    },
    { 
        maDonHang: "#DH-9398", 
        tenKhachHang: "Hoàng Ngọc Ánh", 
        sdt: "0933 666 777", 
        soSanPham: 4, 
        tenSanPham: "Apple iPhone 18 Pro Max 1T",
        img: "https://cdn2.cellphones.com.vn/insecure/rs:fill:300:300/q:100/plain/https://cellphones.com.vn/media/catalog/product/i/p/iphone-18-pro-01.jpg", 
        tongTien: "đ1,250,000", 
        trangThai: "Hoàn tất", 
        ngayLap: "21/02/2026" 
    },
    { 
        maDonHang: "#DH-9397", 
        tenKhachHang: "Đặng Quốc Khánh", 
        sdt: "0966 888 999", 
        soSanPham: 2, 
        tenSanPham: "Apple iPhone 18 Pro Max 1T",
        img: "https://cdn2.cellphones.com.vn/insecure/rs:fill:300:300/q:100/plain/https://cellphones.com.vn/media/catalog/product/i/p/iphone-18-pro-01.jpg", 
        tongTien: "đ16,490,000", 
        trangThai: "Hoàn tất", 
        ngayLap: "20/02/2026" 
    },
    { 
        maDonHang: "#DH-9396", 
        tenKhachHang: "Bùi Thị Tuyết", 
        sdt: "0944 222 333", 
        soSanPham: 1, 
        tenSanPham: "Apple iPhone 18 Pro Max 1T",
        img: "https://cdn2.cellphones.com.vn/insecure/rs:fill:300:300/q:100/plain/https://cellphones.com.vn/media/catalog/product/i/p/iphone-18-pro-01.jpg", 
        tongTien: "đ29,990,000", 
        trangThai: "Đã hủy", 
        ngayLap: "19/02/2026" 
    },
    { 
        maDonHang: "#DH-9395", 
        tenKhachHang: "Vũ Hoàng Nam", 
        sdt: "0955 999 111", 
        soSanPham: 5, 
        tenSanPham: "Apple iPhone 18 Pro Max 1T",
        img: "https://cdn2.cellphones.com.vn/insecure/rs:fill:300:300/q:100/plain/https://cellphones.com.vn/media/catalog/product/i/p/iphone-18-pro-01.jpg", 
        tongTien: "đ6,990,000", 
        trangThai: "Hoàn tất", 
        ngayLap: "18/02/2026" 
    },
     { 
        maDonHang: "#DH-9402", 
        tenKhachHang: "Trần Thị Lan", 
        sdt: "0912 345 678", 
        soSanPham: 2, 
        tenSanPham: "Apple iPhone 18 Pro Max 1T",
        img: "https://cdn2.cellphones.com.vn/insecure/rs:fill:300:300/q:100/plain/https://cellphones.com.vn/media/catalog/product/i/p/iphone-18-pro-01.jpg", 
        tongTien: "đ24,990,000", 
        trangThai: "Chờ xác nhận", 
        ngayLap: "24/02/2026" 
    },
    { 
        maDonHang: "#DH-9401", 
        tenKhachHang: "Lê Văn Hùng", 
        sdt: "0988 765 432", 
        soSanPham: 1, 
        tenSanPham: "Apple iPhone 18 Pro Max 1T",
        img: "https://cdn2.cellphones.com.vn/insecure/rs:fill:300:300/q:100/plain/https://cellphones.com.vn/media/catalog/product/i/p/iphone-18-pro-01.jpg", 
        tongTien: "đ18,450,000", 
        trangThai: "Đang giao", 
        ngayLap: "23/02/2026" 
    },
    { 
        maDonHang: "#DH-9400", 
        tenKhachHang: "Nguyễn Minh Anh", 
        sdt: "0909 111 222", 
        soSanPham: 3, 
        tenSanPham: "Apple iPhone 18 Pro Max 1T",
        img: "https://cdn2.cellphones.com.vn/insecure/rs:fill:300:300/q:100/plain/https://cellphones.com.vn/media/catalog/product/i/p/iphone-18-pro-01.jpg", 
        tongTien: "đ5,200,000", 
        trangThai: "Hoàn tất", 
        ngayLap: "23/02/2026" 
    },
    { 
        maDonHang: "#DH-9399", 
        tenKhachHang: "Phạm Hồng Sơn", 
        sdt: "0977 444 555", 
        soSanPham: 1, 
        tenSanPham: "Apple iPhone 18 Pro Max 1T",
        img: "https://cdn2.cellphones.com.vn/insecure/rs:fill:300:300/q:100/plain/https://cellphones.com.vn/media/catalog/product/i/p/iphone-18-pro-01.jpg", 
        tongTien: "đ32,120,000", 
        trangThai: "Chờ xác nhận", 
        ngayLap: "22/02/2026" 
    },
    { 
        maDonHang: "#DH-9398", 
        tenKhachHang: "Hoàng Ngọc Ánh", 
        sdt: "0933 666 777", 
        soSanPham: 4,
        tenSanPham: "Apple iPhone 18 Pro Max 1T",
        img: "https://cdn2.cellphones.com.vn/insecure/rs:fill:300:300/q:100/plain/https://cellphones.com.vn/media/catalog/product/i/p/iphone-18-pro-01.jpg", 
        tongTien: "đ1,250,000", 
        trangThai: "Hoàn tất", 
        ngayLap: "21/02/2026" 
    },
    { 
        maDonHang: "#DH-9397", 
        tenKhachHang: "Đặng Quốc Khánh", 
        sdt: "0966 888 999", 
        soSanPham: 2, 
        tenSanPham: "Apple iPhone 18 Pro Max 1T",
        img: "https://cdn2.cellphones.com.vn/insecure/rs:fill:300:300/q:100/plain/https://cellphones.com.vn/media/catalog/product/i/p/iphone-18-pro-01.jpg", 
        tongTien: "đ16,490,000", 
        trangThai: "Hoàn tất", 
        ngayLap: "20/02/2026" 
    },
    { 
        maDonHang: "#DH-9396", 
        tenKhachHang: "Bùi Thị Tuyết", 
        sdt: "0944 222 333", 
        soSanPham: 1, 
        tenSanPham: "Apple iPhone 18 Pro Max 1T",
        img: "https://cdn2.cellphones.com.vn/insecure/rs:fill:300:300/q:100/plain/https://cellphones.com.vn/media/catalog/product/i/p/iphone-18-pro-01.jpg", 
        tongTien: "đ29,990,000", 
        trangThai: "Đã hủy", 
        ngayLap: "19/02/2026" 
    },
    { 
        maDonHang: "#DH-9395", 
        tenKhachHang: "Vũ Hoàng Nam", 
        sdt: "0955 999 111", 
        soSanPham: 5, 
        tenSanPham: "Apple iPhone 18 Pro Max 1T",
        img: "https://cdn2.cellphones.com.vn/insecure/rs:fill:300:300/q:100/plain/https://cellphones.com.vn/media/catalog/product/i/p/iphone-18-pro-01.jpg", 
        tongTien: "đ6,990,000", 
        trangThai: "Hoàn tất", 
        ngayLap: "18/02/2026" 
    }
];



export const danhSachKhachHang = [
    {
        maKH: "KH-0024",
        avatar: "MA",
        tenKhachHang: "Nguyễn Thị Mai Anh",
        email: "anh.nguyen@gmail.com",
        sdt: "0912.345.678",
        diemTichLuy: 850,
        tongDonHang: "24 đơn",
        trangThai: "Hoạt động"
    },
    {
        maKH: "KH-0023",
        avatar: "MH",
        tenKhachHang: "Trần Minh Hoàng",
        email: "hoang.tran92@yahoo.com",
        sdt: "0983.112.233",
        diemTichLuy: 1200,
        tongDonHang: "41 đơn",
        trangThai: "Hoạt động"
    },
    {
        maKH: "KH-0022",
        avatar: "TT",
        tenKhachHang: "Phạm Thanh Thảo",
        email: "thanhthao_p@gmail.com",
        sdt: "0905.778.899",
        diemTichLuy: 340,
        tongDonHang: "8 đơn",
        trangThai: "Đã khóa"
    },
    {
        maKH: "KH-0021",
        avatar: "VH",
        tenKhachHang: "Lê Văn Hùng",
        email: "hung.le.dev@outlook.com",
        sdt: "0974.456.123",
        diemTichLuy: 950,
        tongDonHang: "19 đơn",
        trangThai: "Hoạt động"
    },
    {
        maKH: "KH-0020",
        avatar: "NG",
        tenKhachHang: "Hoàng Ngân Giang",
        email: "ngangiang.h@gmail.com",
        sdt: "0936.889.911",
        diemTichLuy: 2100,
        tongDonHang: "53 đơn",
        trangThai: "Hoạt động"
    },
    {
        maKH: "KH-0019",
        avatar: "VĐ",
        tenKhachHang: "Phan Văn Đức",
        email: "ducphan@gmail.com",
        sdt: "0911.223.344",
        diemTichLuy: 150,
        tongDonHang: "3 đơn",
        trangThai: "Hoạt động"
    },
    {
        maKH: "KH-0018",
        avatar: "HY",
        tenKhachHang: "Đỗ Hải Yến",
        email: "haiyen.do@gmail.com",
        sdt: "0982.556.677",
        diemTichLuy: 0,
        tongDonHang: "1 đơn",
        trangThai: "Đã khóa"
    },
    {
        maKH: "KH-0017",
        avatar: "QT",
        tenKhachHang: "Bùi Quốc Tuấn",
        email: "tuanbq@gmail.com",
        sdt: "0909.998.877",
        diemTichLuy: 620,
        tongDonHang: "12 đơn",
        trangThai: "Hoạt động"
    }
];