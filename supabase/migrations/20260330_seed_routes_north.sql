-- SEED: Tuyến bán hàng 63 tỉnh/thành (Phần 1: Miền Bắc)
-- Chạy SAU file 20260330_province_routes.sql

INSERT INTO province_routes (province, route_name, districts, estimated_outlets, frequency) VALUES
-- HÀ NỘI (15 tuyến)
('Hà Nội', 'Tuyến Hoàn Kiếm - Ba Đình', 'Hoàn Kiếm, Ba Đình', 450, 'weekly'),
('Hà Nội', 'Tuyến Đống Đa - Thanh Xuân', 'Đống Đa, Thanh Xuân', 520, 'weekly'),
('Hà Nội', 'Tuyến Cầu Giấy - Nam Từ Liêm', 'Cầu Giấy, Nam Từ Liêm', 480, 'weekly'),
('Hà Nội', 'Tuyến Bắc Từ Liêm - Tây Hồ', 'Bắc Từ Liêm, Tây Hồ', 380, 'weekly'),
('Hà Nội', 'Tuyến Hai Bà Trưng - Hoàng Mai', 'Hai Bà Trưng, Hoàng Mai', 550, 'weekly'),
('Hà Nội', 'Tuyến Long Biên - Gia Lâm', 'Long Biên, Gia Lâm', 420, 'weekly'),
('Hà Nội', 'Tuyến Hà Đông - Thanh Oai', 'Hà Đông, Thanh Oai', 380, 'weekly'),
('Hà Nội', 'Tuyến Đông Anh - Mê Linh', 'Đông Anh, Mê Linh', 350, 'weekly'),
('Hà Nội', 'Tuyến Sóc Sơn - Đông Anh Bắc', 'Sóc Sơn', 280, 'biweekly'),
('Hà Nội', 'Tuyến Thanh Trì - Thường Tín', 'Thanh Trì, Thường Tín', 320, 'weekly'),
('Hà Nội', 'Tuyến Hoài Đức - Đan Phượng', 'Hoài Đức, Đan Phượng', 300, 'weekly'),
('Hà Nội', 'Tuyến Chương Mỹ - Quốc Oai', 'Chương Mỹ, Quốc Oai', 280, 'biweekly'),
('Hà Nội', 'Tuyến Phú Xuyên - Ứng Hòa', 'Phú Xuyên, Ứng Hòa', 250, 'biweekly'),
('Hà Nội', 'Tuyến Sơn Tây - Ba Vì', 'Sơn Tây, Ba Vì', 220, 'biweekly'),
('Hà Nội', 'Tuyến Thạch Thất - Phúc Thọ', 'Thạch Thất, Phúc Thọ', 200, 'biweekly'),

-- HẢI PHÒNG (8 tuyến)
('Hải Phòng', 'Tuyến Hồng Bàng - Lê Chân', 'Hồng Bàng, Lê Chân', 350, 'weekly'),
('Hải Phòng', 'Tuyến Ngô Quyền - Hải An', 'Ngô Quyền, Hải An', 300, 'weekly'),
('Hải Phòng', 'Tuyến Kiến An - An Dương', 'Kiến An, An Dương', 280, 'weekly'),
('Hải Phòng', 'Tuyến Thủy Nguyên', 'Thủy Nguyên', 250, 'weekly'),
('Hải Phòng', 'Tuyến An Lão - Kiến Thụy', 'An Lão, Kiến Thụy', 200, 'biweekly'),
('Hải Phòng', 'Tuyến Tiên Lãng - Vĩnh Bảo', 'Tiên Lãng, Vĩnh Bảo', 180, 'biweekly'),
('Hải Phòng', 'Tuyến Đồ Sơn - Dương Kinh', 'Đồ Sơn, Dương Kinh', 150, 'biweekly'),
('Hải Phòng', 'Tuyến Cát Hải - Bạch Long Vĩ', 'Cát Hải', 80, 'monthly'),

-- QUẢNG NINH (7 tuyến)
('Quảng Ninh', 'Tuyến Hạ Long - Cẩm Phả', 'Hạ Long, Cẩm Phả', 350, 'weekly'),
('Quảng Ninh', 'Tuyến Uông Bí - Quảng Yên', 'Uông Bí, Quảng Yên', 250, 'weekly'),
('Quảng Ninh', 'Tuyến Móng Cái - Hải Hà', 'Móng Cái, Hải Hà', 200, 'weekly'),
('Quảng Ninh', 'Tuyến Đông Triều - Hoành Bồ', 'Đông Triều', 180, 'biweekly'),
('Quảng Ninh', 'Tuyến Tiên Yên - Ba Chẽ', 'Tiên Yên, Ba Chẽ', 100, 'biweekly'),
('Quảng Ninh', 'Tuyến Bình Liêu - Đầm Hà', 'Bình Liêu, Đầm Hà', 80, 'monthly'),
('Quảng Ninh', 'Tuyến Vân Đồn - Cô Tô', 'Vân Đồn, Cô Tô', 60, 'monthly'),

-- BẮC NINH (5 tuyến)
('Bắc Ninh', 'Tuyến TP Bắc Ninh - Từ Sơn', 'TP Bắc Ninh, Từ Sơn', 380, 'weekly'),
('Bắc Ninh', 'Tuyến Yên Phong - Tiên Du', 'Yên Phong, Tiên Du', 280, 'weekly'),
('Bắc Ninh', 'Tuyến Quế Võ - Thuận Thành', 'Quế Võ, Thuận Thành', 250, 'weekly'),
('Bắc Ninh', 'Tuyến Gia Bình - Lương Tài', 'Gia Bình, Lương Tài', 200, 'biweekly'),
('Bắc Ninh', 'Tuyến Tiên Du Nam', 'Tiên Du', 150, 'biweekly'),

-- HẢI DƯƠNG (6 tuyến)
('Hải Dương', 'Tuyến TP Hải Dương', 'TP Hải Dương', 350, 'weekly'),
('Hải Dương', 'Tuyến Chí Linh - Kinh Môn', 'Chí Linh, Kinh Môn', 280, 'weekly'),
('Hải Dương', 'Tuyến Kim Thành - Thanh Hà', 'Kim Thành, Thanh Hà', 220, 'weekly'),
('Hải Dương', 'Tuyến Nam Sách - Gia Lộc', 'Nam Sách, Gia Lộc', 250, 'weekly'),
('Hải Dương', 'Tuyến Bình Giang - Cẩm Giàng', 'Bình Giang, Cẩm Giàng', 200, 'biweekly'),
('Hải Dương', 'Tuyến Tứ Kỳ - Ninh Giang', 'Tứ Kỳ, Ninh Giang', 200, 'biweekly'),

-- HƯNG YÊN (5 tuyến)
('Hưng Yên', 'Tuyến TP Hưng Yên - Tiên Lữ', 'TP Hưng Yên, Tiên Lữ', 280, 'weekly'),
('Hưng Yên', 'Tuyến Mỹ Hào - Văn Lâm', 'Mỹ Hào, Văn Lâm', 250, 'weekly'),
('Hưng Yên', 'Tuyến Yên Mỹ - Khoái Châu', 'Yên Mỹ, Khoái Châu', 220, 'weekly'),
('Hưng Yên', 'Tuyến Ân Thi - Kim Động', 'Ân Thi, Kim Động', 200, 'biweekly'),
('Hưng Yên', 'Tuyến Phù Cừ', 'Phù Cừ', 120, 'biweekly'),

-- VĨNH PHÚC (5 tuyến)
('Vĩnh Phúc', 'Tuyến Vĩnh Yên - Phúc Yên', 'Vĩnh Yên, Phúc Yên', 300, 'weekly'),
('Vĩnh Phúc', 'Tuyến Bình Xuyên - Yên Lạc', 'Bình Xuyên, Yên Lạc', 220, 'weekly'),
('Vĩnh Phúc', 'Tuyến Vĩnh Tường - Tam Đảo', 'Vĩnh Tường, Tam Đảo', 200, 'biweekly'),
('Vĩnh Phúc', 'Tuyến Tam Dương - Lập Thạch', 'Tam Dương, Lập Thạch', 150, 'biweekly'),
('Vĩnh Phúc', 'Tuyến Sông Lô', 'Sông Lô', 100, 'monthly'),

-- BẮC GIANG (6 tuyến)
('Bắc Giang', 'Tuyến TP Bắc Giang', 'TP Bắc Giang', 320, 'weekly'),
('Bắc Giang', 'Tuyến Việt Yên - Hiệp Hòa', 'Việt Yên, Hiệp Hòa', 300, 'weekly'),
('Bắc Giang', 'Tuyến Lạng Giang - Tân Yên', 'Lạng Giang, Tân Yên', 250, 'weekly'),
('Bắc Giang', 'Tuyến Yên Dũng - Lục Nam', 'Yên Dũng, Lục Nam', 220, 'biweekly'),
('Bắc Giang', 'Tuyến Lục Ngạn - Sơn Động', 'Lục Ngạn, Sơn Động', 150, 'biweekly'),
('Bắc Giang', 'Tuyến Yên Thế', 'Yên Thế', 120, 'biweekly'),

-- THÁI NGUYÊN (5 tuyến)
('Thái Nguyên', 'Tuyến TP Thái Nguyên - Sông Công', 'TP Thái Nguyên, Sông Công', 350, 'weekly'),
('Thái Nguyên', 'Tuyến Phổ Yên - Phú Bình', 'Phổ Yên, Phú Bình', 250, 'weekly'),
('Thái Nguyên', 'Tuyến Đại Từ - Định Hóa', 'Đại Từ, Định Hóa', 180, 'biweekly'),
('Thái Nguyên', 'Tuyến Đồng Hỷ - Võ Nhai', 'Đồng Hỷ, Võ Nhai', 120, 'biweekly'),
('Thái Nguyên', 'Tuyến Phú Lương', 'Phú Lương', 100, 'biweekly'),

-- PHÚ THỌ (5 tuyến)
('Phú Thọ', 'Tuyến Việt Trì - Lâm Thao', 'Việt Trì, Lâm Thao', 320, 'weekly'),
('Phú Thọ', 'Tuyến Phù Ninh - TX Phú Thọ', 'Phù Ninh, TX Phú Thọ', 250, 'weekly'),
('Phú Thọ', 'Tuyến Thanh Ba - Hạ Hòa', 'Thanh Ba, Hạ Hòa', 180, 'biweekly'),
('Phú Thọ', 'Tuyến Cẩm Khê - Yên Lập', 'Cẩm Khê, Yên Lập', 150, 'biweekly'),
('Phú Thọ', 'Tuyến Thanh Sơn - Tân Sơn', 'Thanh Sơn, Tân Sơn', 100, 'monthly'),

-- LẠNG SƠN (4 tuyến)
('Lạng Sơn', 'Tuyến TP Lạng Sơn - Cao Lộc', 'TP Lạng Sơn, Cao Lộc', 200, 'weekly'),
('Lạng Sơn', 'Tuyến Hữu Lũng - Chi Lăng', 'Hữu Lũng, Chi Lăng', 150, 'biweekly'),
('Lạng Sơn', 'Tuyến Bắc Sơn - Văn Quan', 'Bắc Sơn, Văn Quan', 100, 'biweekly'),
('Lạng Sơn', 'Tuyến Tràng Định - Đình Lập', 'Tràng Định, Đình Lập', 80, 'monthly'),

-- CAO BẰNG (3 tuyến)
('Cao Bằng', 'Tuyến TP Cao Bằng - Hòa An', 'TP Cao Bằng, Hòa An', 150, 'weekly'),
('Cao Bằng', 'Tuyến Trùng Khánh - Quảng Hòa', 'Trùng Khánh, Quảng Hòa', 100, 'biweekly'),
('Cao Bằng', 'Tuyến Nguyên Bình - Bảo Lạc', 'Nguyên Bình, Bảo Lạc', 60, 'monthly'),

-- BẮC KẠN (2 tuyến)
('Bắc Kạn', 'Tuyến TP Bắc Kạn - Bạch Thông', 'TP Bắc Kạn, Bạch Thông', 100, 'weekly'),
('Bắc Kạn', 'Tuyến Chợ Đồn - Na Rì - Ba Bể', 'Chợ Đồn, Na Rì, Ba Bể', 80, 'biweekly'),

-- TUYÊN QUANG (3 tuyến)
('Tuyên Quang', 'Tuyến TP Tuyên Quang - Yên Sơn', 'TP Tuyên Quang, Yên Sơn', 200, 'weekly'),
('Tuyên Quang', 'Tuyến Sơn Dương - Hàm Yên', 'Sơn Dương, Hàm Yên', 150, 'biweekly'),
('Tuyên Quang', 'Tuyến Chiêm Hóa - Na Hang', 'Chiêm Hóa, Na Hang', 80, 'monthly'),

-- YÊN BÁI (3 tuyến)
('Yên Bái', 'Tuyến TP Yên Bái - Trấn Yên', 'TP Yên Bái, Trấn Yên', 200, 'weekly'),
('Yên Bái', 'Tuyến Nghĩa Lộ - Văn Chấn', 'Nghĩa Lộ, Văn Chấn', 150, 'biweekly'),
('Yên Bái', 'Tuyến Yên Bình - Lục Yên', 'Yên Bình, Lục Yên', 120, 'biweekly'),

-- LÀO CAI (3 tuyến)
('Lào Cai', 'Tuyến TP Lào Cai - Bát Xát', 'TP Lào Cai, Bát Xát', 180, 'weekly'),
('Lào Cai', 'Tuyến Sa Pa - Văn Bàn', 'Sa Pa, Văn Bàn', 120, 'biweekly'),
('Lào Cai', 'Tuyến Bảo Yên - Bảo Thắng', 'Bảo Yên, Bảo Thắng', 100, 'biweekly'),

-- HÀ GIANG (3 tuyến)
('Hà Giang', 'Tuyến TP Hà Giang - Vị Xuyên', 'TP Hà Giang, Vị Xuyên', 180, 'weekly'),
('Hà Giang', 'Tuyến Bắc Quang - Quang Bình', 'Bắc Quang, Quang Bình', 130, 'biweekly'),
('Hà Giang', 'Tuyến Đồng Văn - Mèo Vạc - Yên Minh', 'Đồng Văn, Mèo Vạc, Yên Minh', 80, 'monthly'),

-- THÁI BÌNH (6 tuyến)
('Thái Bình', 'Tuyến TP Thái Bình', 'TP Thái Bình', 350, 'weekly'),
('Thái Bình', 'Tuyến Đông Hưng - Quỳnh Phụ', 'Đông Hưng, Quỳnh Phụ', 300, 'weekly'),
('Thái Bình', 'Tuyến Vũ Thư - Kiến Xương', 'Vũ Thư, Kiến Xương', 280, 'weekly'),
('Thái Bình', 'Tuyến Hưng Hà - Tiền Hải', 'Hưng Hà, Tiền Hải', 250, 'biweekly'),
('Thái Bình', 'Tuyến Thái Thụy', 'Thái Thụy', 200, 'biweekly'),
('Thái Bình', 'Tuyến Thanh Miện Đông', 'TP Thái Bình ngoại thành', 150, 'biweekly'),

-- NAM ĐỊNH (6 tuyến)
('Nam Định', 'Tuyến TP Nam Định', 'TP Nam Định', 380, 'weekly'),
('Nam Định', 'Tuyến Vụ Bản - Ý Yên', 'Vụ Bản, Ý Yên', 280, 'weekly'),
('Nam Định', 'Tuyến Mỹ Lộc - Nam Trực', 'Mỹ Lộc, Nam Trực', 250, 'weekly'),
('Nam Định', 'Tuyến Trực Ninh - Xuân Trường', 'Trực Ninh, Xuân Trường', 230, 'biweekly'),
('Nam Định', 'Tuyến Giao Thủy - Hải Hậu', 'Giao Thủy, Hải Hậu', 220, 'biweekly'),
('Nam Định', 'Tuyến Nghĩa Hưng', 'Nghĩa Hưng', 150, 'biweekly'),

-- NINH BÌNH (4 tuyến)
('Ninh Bình', 'Tuyến TP Ninh Bình - Tam Điệp', 'TP Ninh Bình, Tam Điệp', 250, 'weekly'),
('Ninh Bình', 'Tuyến Hoa Lư - Gia Viễn', 'Hoa Lư, Gia Viễn', 180, 'weekly'),
('Ninh Bình', 'Tuyến Yên Khánh - Yên Mô', 'Yên Khánh, Yên Mô', 180, 'biweekly'),
('Ninh Bình', 'Tuyến Kim Sơn - Nho Quan', 'Kim Sơn, Nho Quan', 150, 'biweekly'),

-- HÀ NAM (4 tuyến)
('Hà Nam', 'Tuyến Phủ Lý - Duy Tiên', 'Phủ Lý, Duy Tiên', 250, 'weekly'),
('Hà Nam', 'Tuyến Kim Bảng - Thanh Liêm', 'Kim Bảng, Thanh Liêm', 180, 'weekly'),
('Hà Nam', 'Tuyến Bình Lục - Lý Nhân', 'Bình Lục, Lý Nhân', 180, 'biweekly'),
('Hà Nam', 'Tuyến Duy Tiên Nam', 'Duy Tiên', 100, 'biweekly'),

-- HÒA BÌNH (3 tuyến)
('Hoà Bình', 'Tuyến TP Hòa Bình - Lương Sơn', 'TP Hòa Bình, Lương Sơn', 200, 'weekly'),
('Hoà Bình', 'Tuyến Kim Bôi - Lạc Thủy', 'Kim Bôi, Lạc Thủy', 150, 'biweekly'),
('Hoà Bình', 'Tuyến Mai Châu - Đà Bắc - Cao Phong', 'Mai Châu, Đà Bắc, Cao Phong', 100, 'monthly'),

-- SƠN LA (3 tuyến)
('Sơn La', 'Tuyến TP Sơn La - Mai Sơn', 'TP Sơn La, Mai Sơn', 200, 'weekly'),
('Sơn La', 'Tuyến Mộc Châu - Vân Hồ', 'Mộc Châu, Vân Hồ', 150, 'biweekly'),
('Sơn La', 'Tuyến Yên Châu - Phù Yên - Bắc Yên', 'Yên Châu, Phù Yên, Bắc Yên', 100, 'monthly'),

-- ĐIỆN BIÊN (2 tuyến)
('Điện Biên', 'Tuyến TP Điện Biên - Điện Biên Đông', 'TP Điện Biên, Điện Biên Đông', 150, 'weekly'),
('Điện Biên', 'Tuyến Mường Lay - Tuần Giáo', 'Mường Lay, Tuần Giáo', 80, 'biweekly'),

-- LAI CHÂU (2 tuyến)
('Lai Châu', 'Tuyến TP Lai Châu - Tam Đường', 'TP Lai Châu, Tam Đường', 120, 'weekly'),
('Lai Châu', 'Tuyến Than Uyên - Phong Thổ', 'Than Uyên, Phong Thổ', 80, 'biweekly')

ON CONFLICT DO NOTHING;
