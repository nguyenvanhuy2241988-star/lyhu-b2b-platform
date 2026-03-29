-- SEED: Tuyến bán hàng 63 tỉnh/thành (Phần 2: Miền Trung + Miền Nam)
-- Chạy SAU file 20260330_province_routes.sql

INSERT INTO province_routes (province, route_name, districts, estimated_outlets, frequency) VALUES
-- MIỀN TRUNG (19 tỉnh)

-- THANH HÓA (8 tuyến)
('Thanh Hoá', 'Tuyến TP Thanh Hóa', 'TP Thanh Hóa', 400, 'weekly'),
('Thanh Hoá', 'Tuyến Sầm Sơn - Quảng Xương', 'Sầm Sơn, Quảng Xương', 280, 'weekly'),
('Thanh Hoá', 'Tuyến Bỉm Sơn - Hà Trung', 'Bỉm Sơn, Hà Trung', 250, 'weekly'),
('Thanh Hoá', 'Tuyến Hoằng Hóa - Hậu Lộc', 'Hoằng Hóa, Hậu Lộc', 250, 'weekly'),
('Thanh Hoá', 'Tuyến Thiệu Hóa - Đông Sơn', 'Thiệu Hóa, Đông Sơn', 200, 'biweekly'),
('Thanh Hoá', 'Tuyến Tĩnh Gia - Nông Cống', 'Tĩnh Gia, Nông Cống', 220, 'biweekly'),
('Thanh Hoá', 'Tuyến Thọ Xuân - Yên Định', 'Thọ Xuân, Yên Định', 180, 'biweekly'),
('Thanh Hoá', 'Tuyến Ngọc Lặc - Lang Chánh - Bá Thước', 'Ngọc Lặc, Lang Chánh, Bá Thước', 100, 'monthly'),

-- NGHỆ AN (7 tuyến)
('Nghệ An', 'Tuyến TP Vinh - Cửa Lò', 'TP Vinh, Cửa Lò', 380, 'weekly'),
('Nghệ An', 'Tuyến Diễn Châu - Yên Thành', 'Diễn Châu, Yên Thành', 280, 'weekly'),
('Nghệ An', 'Tuyến Quỳnh Lưu - Hoàng Mai', 'Quỳnh Lưu, Hoàng Mai', 250, 'weekly'),
('Nghệ An', 'Tuyến Nghi Lộc - Hưng Nguyên', 'Nghi Lộc, Hưng Nguyên', 220, 'weekly'),
('Nghệ An', 'Tuyến Đô Lương - Thanh Chương', 'Đô Lương, Thanh Chương', 180, 'biweekly'),
('Nghệ An', 'Tuyến Nam Đàn - Anh Sơn', 'Nam Đàn, Anh Sơn', 150, 'biweekly'),
('Nghệ An', 'Tuyến Con Cuông - Tương Dương', 'Con Cuông, Tương Dương', 80, 'monthly'),

-- HÀ TĨNH (5 tuyến)
('Hà Tĩnh', 'Tuyến TP Hà Tĩnh - Thạch Hà', 'TP Hà Tĩnh, Thạch Hà', 280, 'weekly'),
('Hà Tĩnh', 'Tuyến TX Hồng Lĩnh - Can Lộc', 'TX Hồng Lĩnh, Can Lộc', 200, 'weekly'),
('Hà Tĩnh', 'Tuyến Cẩm Xuyên - TX Kỳ Anh', 'Cẩm Xuyên, TX Kỳ Anh', 180, 'biweekly'),
('Hà Tĩnh', 'Tuyến Đức Thọ - Hương Sơn', 'Đức Thọ, Hương Sơn', 150, 'biweekly'),
('Hà Tĩnh', 'Tuyến Nghi Xuân - Lộc Hà', 'Nghi Xuân, Lộc Hà', 120, 'biweekly'),

-- QUẢNG BÌNH (3 tuyến)
('Quảng Bình', 'Tuyến Đồng Hới - Bố Trạch', 'Đồng Hới, Bố Trạch', 220, 'weekly'),
('Quảng Bình', 'Tuyến Quảng Trạch - Ba Đồn', 'Quảng Trạch, Ba Đồn', 150, 'biweekly'),
('Quảng Bình', 'Tuyến Lệ Thủy - Quảng Ninh', 'Lệ Thủy, Quảng Ninh', 120, 'biweekly'),

-- QUẢNG TRỊ (3 tuyến)
('Quảng Trị', 'Tuyến Đông Hà - Cam Lộ', 'Đông Hà, Cam Lộ', 180, 'weekly'),
('Quảng Trị', 'Tuyến Triệu Phong - Hải Lăng', 'Triệu Phong, Hải Lăng', 130, 'biweekly'),
('Quảng Trị', 'Tuyến Vĩnh Linh - Gio Linh', 'Vĩnh Linh, Gio Linh', 100, 'biweekly'),

-- THỪA THIÊN HUẾ (4 tuyến)
('Thừa Thiên Huế', 'Tuyến TP Huế', 'TP Huế', 300, 'weekly'),
('Thừa Thiên Huế', 'Tuyến Phú Vang - Phú Lộc', 'Phú Vang, Phú Lộc', 200, 'weekly'),
('Thừa Thiên Huế', 'Tuyến Hương Thủy - Hương Trà', 'Hương Thủy, Hương Trà', 180, 'biweekly'),
('Thừa Thiên Huế', 'Tuyến Quảng Điền - Phong Điền', 'Quảng Điền, Phong Điền', 120, 'biweekly'),

-- ĐÀ NẴNG (5 tuyến)
('Đà Nẵng', 'Tuyến Hải Châu - Thanh Khê', 'Hải Châu, Thanh Khê', 350, 'weekly'),
('Đà Nẵng', 'Tuyến Sơn Trà - Ngũ Hành Sơn', 'Sơn Trà, Ngũ Hành Sơn', 280, 'weekly'),
('Đà Nẵng', 'Tuyến Liên Chiểu - Cẩm Lệ', 'Liên Chiểu, Cẩm Lệ', 250, 'weekly'),
('Đà Nẵng', 'Tuyến Hòa Vang', 'Hòa Vang', 150, 'biweekly'),
('Đà Nẵng', 'Tuyến Hoàng Sa', 'Hoàng Sa', 30, 'monthly'),

-- QUẢNG NAM (5 tuyến)
('Quảng Nam', 'Tuyến Tam Kỳ - Phú Ninh', 'Tam Kỳ, Phú Ninh', 280, 'weekly'),
('Quảng Nam', 'Tuyến Hội An - Điện Bàn', 'Hội An, Điện Bàn', 300, 'weekly'),
('Quảng Nam', 'Tuyến Đại Lộc - Duy Xuyên', 'Đại Lộc, Duy Xuyên', 200, 'biweekly'),
('Quảng Nam', 'Tuyến Thăng Bình - Quế Sơn', 'Thăng Bình, Quế Sơn', 180, 'biweekly'),
('Quảng Nam', 'Tuyến Núi Thành - Tiên Phước', 'Núi Thành, Tiên Phước', 150, 'biweekly'),

-- QUẢNG NGÃI (4 tuyến)
('Quảng Ngãi', 'Tuyến TP Quảng Ngãi - Tư Nghĩa', 'TP Quảng Ngãi, Tư Nghĩa', 280, 'weekly'),
('Quảng Ngãi', 'Tuyến Bình Sơn - Sơn Tịnh', 'Bình Sơn, Sơn Tịnh', 220, 'weekly'),
('Quảng Ngãi', 'Tuyến Mộ Đức - Đức Phổ', 'Mộ Đức, Đức Phổ', 180, 'biweekly'),
('Quảng Ngãi', 'Tuyến Nghĩa Hành - Minh Long', 'Nghĩa Hành, Minh Long', 100, 'biweekly'),

-- BÌNH ĐỊNH (5 tuyến)
('Bình Định', 'Tuyến Quy Nhơn', 'Quy Nhơn', 320, 'weekly'),
('Bình Định', 'Tuyến An Nhơn - Tuy Phước', 'An Nhơn, Tuy Phước', 250, 'weekly'),
('Bình Định', 'Tuyến Hoài Nhơn - Hoài Ân', 'Hoài Nhơn, Hoài Ân', 200, 'biweekly'),
('Bình Định', 'Tuyến Phù Mỹ - Phù Cát', 'Phù Mỹ, Phù Cát', 180, 'biweekly'),
('Bình Định', 'Tuyến Tây Sơn - Vĩnh Thạnh', 'Tây Sơn, Vĩnh Thạnh', 120, 'biweekly'),

-- PHÚ YÊN (3 tuyến)
('Phú Yên', 'Tuyến Tuy Hòa - Đông Hòa', 'Tuy Hòa, Đông Hòa', 250, 'weekly'),
('Phú Yên', 'Tuyến Sông Cầu - Tuy An', 'Sông Cầu, Tuy An', 180, 'biweekly'),
('Phú Yên', 'Tuyến Phú Hòa - Sơn Hòa', 'Phú Hòa, Sơn Hòa', 100, 'biweekly'),

-- KHÁNH HÒA (5 tuyến)
('Khánh Hoà', 'Tuyến Nha Trang Bắc', 'Nha Trang', 350, 'weekly'),
('Khánh Hoà', 'Tuyến Nha Trang Nam - Cam Ranh', 'Nha Trang, Cam Ranh', 280, 'weekly'),
('Khánh Hoà', 'Tuyến Ninh Hòa - Vạn Ninh', 'Ninh Hòa, Vạn Ninh', 200, 'weekly'),
('Khánh Hoà', 'Tuyến Diên Khánh - Khánh Vĩnh', 'Diên Khánh, Khánh Vĩnh', 150, 'biweekly'),
('Khánh Hoà', 'Tuyến Cam Lâm', 'Cam Lâm', 100, 'biweekly'),

-- NINH THUẬN (3 tuyến)
('Ninh Thuận', 'Tuyến Phan Rang - Tháp Chàm', 'Phan Rang', 180, 'weekly'),
('Ninh Thuận', 'Tuyến Ninh Hải - Ninh Phước', 'Ninh Hải, Ninh Phước', 120, 'biweekly'),
('Ninh Thuận', 'Tuyến Thuận Bắc - Bác Ái', 'Thuận Bắc, Bác Ái', 60, 'monthly'),

-- BÌNH THUẬN (4 tuyến)
('Bình Thuận', 'Tuyến Phan Thiết', 'Phan Thiết', 280, 'weekly'),
('Bình Thuận', 'Tuyến La Gi - Hàm Tân', 'La Gi, Hàm Tân', 200, 'weekly'),
('Bình Thuận', 'Tuyến Hàm Thuận Bắc - Hàm Thuận Nam', 'Hàm Thuận Bắc, Hàm Thuận Nam', 180, 'biweekly'),
('Bình Thuận', 'Tuyến Tuy Phong - Bắc Bình', 'Tuy Phong, Bắc Bình', 120, 'biweekly'),

-- GIA LAI (4 tuyến)
('Gia Lai', 'Tuyến Pleiku - Đak Đoa', 'Pleiku, Đak Đoa', 280, 'weekly'),
('Gia Lai', 'Tuyến An Khê - Đak Pơ', 'An Khê, Đak Pơ', 180, 'biweekly'),
('Gia Lai', 'Tuyến Ayun Pa - Krông Pa', 'Ayun Pa, Krông Pa', 150, 'biweekly'),
('Gia Lai', 'Tuyến Chư Sê - Chư Prông', 'Chư Sê, Chư Prông', 130, 'biweekly'),

-- KON TUM (2 tuyến)
('Kon Tum', 'Tuyến TP Kon Tum - Đak Hà', 'TP Kon Tum, Đak Hà', 170, 'weekly'),
('Kon Tum', 'Tuyến Ngọc Hồi - Đak Tô', 'Ngọc Hồi, Đak Tô', 80, 'biweekly'),

-- ĐẮK LẮK (5 tuyến)
('Đắk Lắk', 'Tuyến Buôn Ma Thuột', 'Buôn Ma Thuột', 350, 'weekly'),
('Đắk Lắk', 'Tuyến Ea H''leo - Ea Súp', 'Ea H''leo, Ea Súp', 200, 'biweekly'),
('Đắk Lắk', 'Tuyến Krông Năng - Krông Búk', 'Krông Năng, Krông Búk', 180, 'biweekly'),
('Đắk Lắk', 'Tuyến Krông Pắk - Ea Kar', 'Krông Pắk, Ea Kar', 180, 'biweekly'),
('Đắk Lắk', 'Tuyến Cư M''gar - Buôn Đôn', 'Cư M''gar, Buôn Đôn', 150, 'biweekly'),

-- ĐẮK NÔNG (3 tuyến)
('Đắk Nông', 'Tuyến Gia Nghĩa - Đắk R''lấp', 'Gia Nghĩa, Đắk R''lấp', 180, 'weekly'),
('Đắk Nông', 'Tuyến Đắk Mil - Cư Jút', 'Đắk Mil, Cư Jút', 150, 'biweekly'),
('Đắk Nông', 'Tuyến Đắk Song - Krông Nô', 'Đắk Song, Krông Nô', 100, 'biweekly'),

-- LÂM ĐỒNG (4 tuyến)
('Lâm Đồng', 'Tuyến Đà Lạt - Lạc Dương', 'Đà Lạt, Lạc Dương', 280, 'weekly'),
('Lâm Đồng', 'Tuyến Bảo Lộc - Bảo Lâm', 'Bảo Lộc, Bảo Lâm', 220, 'weekly'),
('Lâm Đồng', 'Tuyến Đức Trọng - Đơn Dương', 'Đức Trọng, Đơn Dương', 180, 'biweekly'),
('Lâm Đồng', 'Tuyến Di Linh - Lâm Hà', 'Di Linh, Lâm Hà', 150, 'biweekly'),

-- MIỀN NAM (19 tỉnh)

-- TP HCM (18 tuyến)
('TP. Hồ Chí Minh', 'Tuyến Q1 - Q3', 'Quận 1, Quận 3', 500, 'weekly'),
('TP. Hồ Chí Minh', 'Tuyến Q5 - Q10 - Q11', 'Quận 5, Quận 10, Quận 11', 480, 'weekly'),
('TP. Hồ Chí Minh', 'Tuyến Bình Thạnh - Phú Nhuận', 'Bình Thạnh, Phú Nhuận', 450, 'weekly'),
('TP. Hồ Chí Minh', 'Tuyến Tân Bình - Tân Phú', 'Tân Bình, Tân Phú', 480, 'weekly'),
('TP. Hồ Chí Minh', 'Tuyến Gò Vấp - Q12', 'Gò Vấp, Quận 12', 420, 'weekly'),
('TP. Hồ Chí Minh', 'Tuyến Q7 - Q4 - Q8', 'Quận 7, Quận 4, Quận 8', 400, 'weekly'),
('TP. Hồ Chí Minh', 'Tuyến Bình Tân - Bình Chánh', 'Bình Tân, Bình Chánh', 450, 'weekly'),
('TP. Hồ Chí Minh', 'Tuyến Thủ Đức Bắc', 'TP Thủ Đức (Thủ Đức cũ)', 380, 'weekly'),
('TP. Hồ Chí Minh', 'Tuyến Thủ Đức Đông', 'TP Thủ Đức (Q9 cũ)', 350, 'weekly'),
('TP. Hồ Chí Minh', 'Tuyến Thủ Đức Nam', 'TP Thủ Đức (Q2 cũ)', 300, 'weekly'),
('TP. Hồ Chí Minh', 'Tuyến Hóc Môn', 'Hóc Môn', 280, 'weekly'),
('TP. Hồ Chí Minh', 'Tuyến Củ Chi', 'Củ Chi', 250, 'biweekly'),
('TP. Hồ Chí Minh', 'Tuyến Nhà Bè - Cần Giờ', 'Nhà Bè, Cần Giờ', 150, 'biweekly'),
('TP. Hồ Chí Minh', 'Tuyến Q6 - Q Bình Tân TT', 'Quận 6, Bình Tân TT', 350, 'weekly'),
('TP. Hồ Chí Minh', 'Tuyến Tân Phú Đông', 'Tân Phú Đông', 200, 'biweekly'),
('TP. Hồ Chí Minh', 'Tuyến Chợ Lớn - Q5 - Q6', 'Chợ Lớn', 380, 'weekly'),
('TP. Hồ Chí Minh', 'Tuyến Q. Phú Nhuận - Q3 Nam', 'Phú Nhuận', 200, 'weekly'),
('TP. Hồ Chí Minh', 'Tuyến Gò Vấp Tây', 'Gò Vấp Tây', 200, 'weekly'),

-- BÌNH DƯƠNG (6 tuyến)
('Bình Dương', 'Tuyến Thủ Dầu Một - Thuận An', 'Thủ Dầu Một, Thuận An', 400, 'weekly'),
('Bình Dương', 'Tuyến Dĩ An - Tân Uyên', 'Dĩ An, Tân Uyên', 350, 'weekly'),
('Bình Dương', 'Tuyến Bến Cát - Bàu Bàng', 'Bến Cát, Bàu Bàng', 250, 'weekly'),
('Bình Dương', 'Tuyến Phú Giáo - Dầu Tiếng', 'Phú Giáo, Dầu Tiếng', 150, 'biweekly'),
('Bình Dương', 'Tuyến Bắc Tân Uyên', 'Bắc Tân Uyên', 120, 'biweekly'),
('Bình Dương', 'Tuyến KCN VSIP - Mỹ Phước', 'VSIP, Mỹ Phước', 200, 'weekly'),

-- ĐỒNG NAI (7 tuyến)
('Đồng Nai', 'Tuyến Biên Hòa Bắc', 'Biên Hòa', 380, 'weekly'),
('Đồng Nai', 'Tuyến Biên Hòa Nam', 'Biên Hòa', 350, 'weekly'),
('Đồng Nai', 'Tuyến Long Khánh - Xuân Lộc', 'Long Khánh, Xuân Lộc', 280, 'weekly'),
('Đồng Nai', 'Tuyến Trảng Bom - Thống Nhất', 'Trảng Bom, Thống Nhất', 250, 'weekly'),
('Đồng Nai', 'Tuyến Nhơn Trạch - Long Thành', 'Nhơn Trạch, Long Thành', 220, 'weekly'),
('Đồng Nai', 'Tuyến Vĩnh Cửu - Định Quán', 'Vĩnh Cửu, Định Quán', 150, 'biweekly'),
('Đồng Nai', 'Tuyến Tân Phú - Cẩm Mỹ', 'Tân Phú, Cẩm Mỹ', 120, 'biweekly'),

-- BÀ RỊA - VŨNG TÀU (4 tuyến)
('Bà Rịa - Vũng Tàu', 'Tuyến Vũng Tàu', 'Vũng Tàu', 280, 'weekly'),
('Bà Rịa - Vũng Tàu', 'Tuyến Bà Rịa - Long Điền', 'Bà Rịa, Long Điền', 220, 'weekly'),
('Bà Rịa - Vũng Tàu', 'Tuyến Phú Mỹ - Tân Thành', 'Phú Mỹ', 180, 'biweekly'),
('Bà Rịa - Vũng Tàu', 'Tuyến Xuyên Mộc - Châu Đức', 'Xuyên Mộc, Châu Đức', 120, 'biweekly'),

-- LONG AN (5 tuyến)
('Long An', 'Tuyến Tân An - Thủ Thừa', 'Tân An, Thủ Thừa', 280, 'weekly'),
('Long An', 'Tuyến Bến Lức - Đức Hòa', 'Bến Lức, Đức Hòa', 300, 'weekly'),
('Long An', 'Tuyến Cần Đước - Cần Giuộc', 'Cần Đước, Cần Giuộc', 220, 'weekly'),
('Long An', 'Tuyến Tân Trụ - Châu Thành', 'Tân Trụ, Châu Thành', 150, 'biweekly'),
('Long An', 'Tuyến Mộc Hóa - Vĩnh Hưng', 'Mộc Hóa, Vĩnh Hưng', 100, 'monthly'),

-- TÂY NINH (4 tuyến)
('Tây Ninh', 'Tuyến TP Tây Ninh - Hòa Thành', 'TP Tây Ninh, Hòa Thành', 250, 'weekly'),
('Tây Ninh', 'Tuyến Trảng Bàng - Gò Dầu', 'Trảng Bàng, Gò Dầu', 220, 'weekly'),
('Tây Ninh', 'Tuyến Dương Minh Châu - Châu Thành', 'Dương Minh Châu, Châu Thành', 150, 'biweekly'),
('Tây Ninh', 'Tuyến Tân Biên - Tân Châu', 'Tân Biên, Tân Châu', 100, 'biweekly'),

-- BÌNH PHƯỚC (3 tuyến)
('Bình Phước', 'Tuyến Đồng Xoài - Đồng Phú', 'Đồng Xoài, Đồng Phú', 220, 'weekly'),
('Bình Phước', 'Tuyến Chơn Thành - Hớn Quản', 'Chơn Thành, Hớn Quản', 150, 'biweekly'),
('Bình Phước', 'Tuyến Phước Long - Bù Đăng', 'Phước Long, Bù Đăng', 100, 'biweekly'),

-- TIỀN GIANG (5 tuyến)
('Tiền Giang', 'Tuyến Mỹ Tho', 'Mỹ Tho', 300, 'weekly'),
('Tiền Giang', 'Tuyến Cai Lậy - Cái Bè', 'Cai Lậy, Cái Bè', 280, 'weekly'),
('Tiền Giang', 'Tuyến Gò Công - Gò Công Đông', 'Gò Công, Gò Công Đông', 200, 'biweekly'),
('Tiền Giang', 'Tuyến Châu Thành - Tân Phước', 'Châu Thành, Tân Phước', 180, 'biweekly'),
('Tiền Giang', 'Tuyến Chợ Gạo - Tân Phú Đông', 'Chợ Gạo, Tân Phú Đông', 150, 'biweekly'),

-- BẾN TRE (4 tuyến)
('Bến Tre', 'Tuyến TP Bến Tre - Châu Thành', 'TP Bến Tre, Châu Thành', 280, 'weekly'),
('Bến Tre', 'Tuyến Giồng Trôm - Ba Tri', 'Giồng Trôm, Ba Tri', 200, 'biweekly'),
('Bến Tre', 'Tuyến Mỏ Cày Bắc - Mỏ Cày Nam', 'Mỏ Cày Bắc, Mỏ Cày Nam', 180, 'biweekly'),
('Bến Tre', 'Tuyến Bình Đại - Thạnh Phú', 'Bình Đại, Thạnh Phú', 120, 'biweekly'),

-- VĨNH LONG (4 tuyến)
('Vĩnh Long', 'Tuyến TP Vĩnh Long - Long Hồ', 'TP Vĩnh Long, Long Hồ', 250, 'weekly'),
('Vĩnh Long', 'Tuyến Bình Minh - Tam Bình', 'Bình Minh, Tam Bình', 180, 'biweekly'),
('Vĩnh Long', 'Tuyến Vũng Liêm - Trà Ôn', 'Vũng Liêm, Trà Ôn', 150, 'biweekly'),
('Vĩnh Long', 'Tuyến Mang Thít - Bình Tân', 'Mang Thít, Bình Tân', 100, 'biweekly'),

-- TRÀ VINH (4 tuyến)
('Trà Vinh', 'Tuyến TP Trà Vinh - Châu Thành', 'TP Trà Vinh, Châu Thành', 220, 'weekly'),
('Trà Vinh', 'Tuyến Càng Long - Tiểu Cần', 'Càng Long, Tiểu Cần', 180, 'biweekly'),
('Trà Vinh', 'Tuyến Cầu Kè - Trà Cú', 'Cầu Kè, Trà Cú', 150, 'biweekly'),
('Trà Vinh', 'Tuyến Duyên Hải - Cầu Ngang', 'Duyên Hải, Cầu Ngang', 120, 'biweekly'),

-- ĐỒNG THÁP (5 tuyến)
('Đồng Tháp', 'Tuyến Cao Lãnh - Thanh Bình', 'Cao Lãnh, Thanh Bình', 280, 'weekly'),
('Đồng Tháp', 'Tuyến Sa Đéc - Lai Vung', 'Sa Đéc, Lai Vung', 250, 'weekly'),
('Đồng Tháp', 'Tuyến Hồng Ngự - Tân Hồng', 'Hồng Ngự, Tân Hồng', 180, 'biweekly'),
('Đồng Tháp', 'Tuyến Lấp Vò - Châu Thành', 'Lấp Vò, Châu Thành', 170, 'biweekly'),
('Đồng Tháp', 'Tuyến Tam Nông - Tháp Mười', 'Tam Nông, Tháp Mười', 120, 'biweekly'),

-- AN GIANG (5 tuyến)
('An Giang', 'Tuyến Long Xuyên - Châu Thành', 'Long Xuyên, Châu Thành', 300, 'weekly'),
('An Giang', 'Tuyến Châu Đốc - An Phú', 'Châu Đốc, An Phú', 250, 'weekly'),
('An Giang', 'Tuyến Tân Châu - Phú Tân', 'Tân Châu, Phú Tân', 200, 'biweekly'),
('An Giang', 'Tuyến Chợ Mới - Thoại Sơn', 'Chợ Mới, Thoại Sơn', 200, 'biweekly'),
('An Giang', 'Tuyến Tri Tôn - Tịnh Biên', 'Tri Tôn, Tịnh Biên', 100, 'biweekly'),

-- KIÊN GIANG (5 tuyến)
('Kiên Giang', 'Tuyến Rạch Giá - Châu Thành', 'Rạch Giá, Châu Thành', 300, 'weekly'),
('Kiên Giang', 'Tuyến Hà Tiên - Kiên Lương', 'Hà Tiên, Kiên Lương', 200, 'weekly'),
('Kiên Giang', 'Tuyến Tân Hiệp - Giồng Riềng', 'Tân Hiệp, Giồng Riềng', 200, 'biweekly'),
('Kiên Giang', 'Tuyến An Biên - An Minh', 'An Biên, An Minh', 130, 'biweekly'),
('Kiên Giang', 'Tuyến Phú Quốc', 'Phú Quốc', 180, 'weekly'),

-- CẦN THƠ (5 tuyến)
('Cần Thơ', 'Tuyến Ninh Kiều - Bình Thủy', 'Ninh Kiều, Bình Thủy', 300, 'weekly'),
('Cần Thơ', 'Tuyến Cái Răng - Phong Điền', 'Cái Răng, Phong Điền', 250, 'weekly'),
('Cần Thơ', 'Tuyến Ô Môn - Thốt Nốt', 'Ô Môn, Thốt Nốt', 220, 'weekly'),
('Cần Thơ', 'Tuyến Thới Lai - Cờ Đỏ', 'Thới Lai, Cờ Đỏ', 150, 'biweekly'),
('Cần Thơ', 'Tuyến Vĩnh Thạnh', 'Vĩnh Thạnh', 80, 'biweekly'),

-- HẬU GIANG (3 tuyến)
('Hậu Giang', 'Tuyến Vị Thanh - Ngã Bảy', 'Vị Thanh, Ngã Bảy', 200, 'weekly'),
('Hậu Giang', 'Tuyến Châu Thành - Châu Thành A', 'Châu Thành, Châu Thành A', 150, 'biweekly'),
('Hậu Giang', 'Tuyến Long Mỹ - Phụng Hiệp', 'Long Mỹ, Phụng Hiệp', 130, 'biweekly'),

-- SÓC TRĂNG (4 tuyến)
('Sóc Trăng', 'Tuyến TP Sóc Trăng - Châu Thành', 'TP Sóc Trăng, Châu Thành', 250, 'weekly'),
('Sóc Trăng', 'Tuyến Mỹ Tú - Mỹ Xuyên', 'Mỹ Tú, Mỹ Xuyên', 180, 'biweekly'),
('Sóc Trăng', 'Tuyến Vĩnh Châu - Trần Đề', 'Vĩnh Châu, Trần Đề', 150, 'biweekly'),
('Sóc Trăng', 'Tuyến Long Phú - Kế Sách', 'Long Phú, Kế Sách', 130, 'biweekly'),

-- BẠC LIÊU (3 tuyến)
('Bạc Liêu', 'Tuyến TP Bạc Liêu - Vĩnh Lợi', 'TP Bạc Liêu, Vĩnh Lợi', 220, 'weekly'),
('Bạc Liêu', 'Tuyến Giá Rai - Đông Hải', 'Giá Rai, Đông Hải', 150, 'biweekly'),
('Bạc Liêu', 'Tuyến Hồng Dân - Phước Long', 'Hồng Dân, Phước Long', 100, 'biweekly'),

-- CÀ MAU (4 tuyến)
('Cà Mau', 'Tuyến TP Cà Mau', 'TP Cà Mau', 280, 'weekly'),
('Cà Mau', 'Tuyến Năm Căn - Ngọc Hiển', 'Năm Căn, Ngọc Hiển', 150, 'biweekly'),
('Cà Mau', 'Tuyến Cái Nước - Đầm Dơi', 'Cái Nước, Đầm Dơi', 180, 'biweekly'),
('Cà Mau', 'Tuyến Thới Bình - U Minh', 'Thới Bình, U Minh', 100, 'biweekly')

ON CONFLICT DO NOTHING;

-- Verify tổng
SELECT
  pm.region,
  COUNT(DISTINCT pm.province) as provinces,
  SUM(pm.total_routes) as routes,
  SUM(pm.estimated_outlets) as outlets
FROM province_market_data pm
GROUP BY pm.region
ORDER BY pm.region;
