export const DEFAULT_CMS_DATA = {
    tabs: [
        { id: 't_intro', label: "Thông điệp mở đầu", icon: "BookOpen" },
        { id: 't_brand', label: "ADN Thương hiệu", icon: "Palette" },
        { id: 't_logo', label: "Thiết kế & Ý nghĩa Logo", icon: "Shapes" },
        { id: 't_core', label: "Giá trị cốt lõi 3K1C", icon: "Scale" },
        { id: 't_philo', label: "Triết lý hành động", icon: "HeartHandshake" },
        { id: 't_vision', label: "Định hướng tương lai", icon: "Map" },
    ],
    pages: {
        t_intro: [
            { id: "b_hero", type: "HERO_BANNER", config: { 
                title: "Văn hóa LYHU",
                subtitle: "KẾT NỐI CHÂN THÀNH - HỢP TÁC BỀN VỮNG",
                imageUrl: ""
            }},
            { id: "b_quote1", type: "QUOTE", config: { 
                text: "Mỗi hành trình vạn dặm đều bắt đầu từ một bước chân nhỏ. Tại LYHU, chúng tôi không chỉ xây dựng một doanh nghiệp, mà kiến tạo một 'ngôi nhà chung' - nơi mỗi cá nhân là một viên gạch vững chắc, nơi sự chân thành làm nên văn hóa, và nỗ lực cống hiến được ghi nhận xứng đáng."
            }}
        ],
        t_brand: [
            { id: "b_hero_brand", type: "HERO_BANNER", config: {
                title: "CHÚNG TA CÓ THỂ",
                subtitle: "Vươn lên và vượt qua mọi thách thức",
                imageUrl: ""
            }},
            { id: "b_adn", type: "GRID_NUMBERS", config: {
                title: "ADN LYHU – Sức mạnh của 4 chữ cái",
                items: [
                    { title: "LOVE", desc: "Định hình lại các tiêu chuẩn và tạo ra những chuẩn mực mới bằng tình yêu và niềm đam mê công việc." },
                    { title: "YEARN", desc: "Luôn khao khát và nỗ lực để kiến tạo nên những giá trị vật chất và tinh thần vượt xa mong đợi." },
                    { title: "HARMONIZE", desc: "Sức mạnh của tập thể luôn lớn hơn cá nhân. Sự gắn kết đồng thuận tạo nên động lực bức phá." },
                    { title: "UNIFY", desc: "Cùng chung một tầm nhìn, đồng lòng hướng tới một tương lai thịnh vượng, mang tên LYHU." }
                ]
            }},
            { id: "b_colors", type: "GRID_NUMBERS", config: {
                title: "Ý Nghĩa Gam Màu Thương Hiệu",
                items: [
                    { title: "Thanh Lịch & Uy Tín", desc: "Xanh ngọc - Biểu trưng cho sự hiện đại, chân thành, sâu sắc và độ tin cậy tuyệt đối." },
                    { title: "Tươi Mới & Vững Bền", desc: "Xanh lá - Mang năng lượng của sự sinh trưởng, bền vững, thân thiện và không ngừng phát triển." }
                ]
            }}
        ],
        t_logo: [
            { id: "b_split_logo", type: "SPLIT_TEXT", config: {
                title: "Ý TƯỞNG THIẾT KẾ & Ý NGHĨA LOGO",
                subtitle: "Biểu Tượng Cho Sự Hòa Hợp",
                desc1: "Logo LYHU là sự kết hợp tinh tế giữa đường nét hiện đại và kết cấu vững chãi. Thiết kế không chỉ thể hiện tên thương hiệu mà còn ẩn chứa khát vọng kiến tạo một hệ sinh thái tuần hoàn và phát triển bền vững.",
                desc2: "Sự liên kết tiếp nối giữa các khối màu đại diện cho sự cộng hưởng của các thành viên cùng chung một mục đích, tượng trưng cho thông điệp cốt lõi: Kết nối chân thành - Hợp tác bền vững.",
                imageUrl: ""
            }},
            { id: "b_num4", type: "GRID_NUMBERS", config: {
                title: "ADN LYHU – Sức mạnh của số 4",
                items: [
                    { title: "4 Cánh nối tiếp nhau", desc: "Logo của LYHU có 4 cánh, biểu tượng cho sức mạnh của tinh thần đoàn kết, gắn bó bền chặt." },
                    { title: "4 Ký tự tên công ty", desc: "Mỗi chữ cái là một giá trị cốt lõi: Love (Yêu thương), Yearn (Khao khát), Harmonize (Hòa hợp), Unify (Thống nhất)." },
                    { title: "4 Nguyên tắc cốt lõi", desc: "Văn hóa LYHU tôn vinh 4 nguyên tắc: Kỷ luật – Kiên trì – Kiên nhẫn – Chấp nhận quá trình." },
                    { title: "Slogan có vần điệu", desc: 'Slogan của LYHU có 2 vế, mỗi vế chứa trọn 4 từ đắt giá: "Kết nối chân thành – Hợp tác bền vững".' }
                ]
            }},
            { id: "b_quote_logo", type: "QUOTE", config: {
                text: "Trong thế giới quanh ta, số 4 xuất hiện ở khắp nơi. Bốn mùa luân chuyển – Xuân, Hạ, Thu, Đông. Bốn phương định hướng – Đông, Tây, Nam, Bắc. Bốn yếu tố tự nhiên – Đất, Nước, Lửa, Khí. Tất cả tạo nên một vòng tròn cân bằng, đầy đủ và vững chãi.\n\nSố 4 vì thế trở thành ADN của LYHU – một lời nhắc nhở rằng, chỉ khi có nền tảng vững chắc, sự cân bằng toàn diện, kỷ luật và sự đoàn kết, chúng ta mới có thể phát triển lâu dài."
            }}
        ],
        t_core: [
            { id: "b_core_text", type: "SPLIT_TEXT", config: {
                title: "Giá Trị Cốt Lõi 3K1C",
                subtitle: "",
                desc1: "3K1C không chỉ là nguyên tắc làm việc, mà còn là thái độ sống, giúp mỗi thành viên LYHU cùng nhau trưởng thành, gắn kết và kiến tạo giá trị lâu dài.",
                desc2: "",
                imageUrl: ""
            }},
            { id: "b_core_grid", type: "GRID_NUMBERS", config: {
                title: "",
                items: [
                    { title: "KỶ LUẬT LÀ SỨC MẠNH", desc: "Kỷ luật cao là nền tảng để đạt được mục tiêu chung." },
                    { title: "KIÊN TRÌ LÀ TỐ CHẤT", desc: "Luôn nỗ lực vươn lên dù đối mặt với bất kỳ khó khăn nào." },
                    { title: "KIÊN NHẪN LÀ THÁI ĐỘ", desc: "Chấp nhận nhịp độ và thời gian cần thiết để thấy kết quả." },
                    { title: "CHẤP NHẬN QUÁ TRÌNH LÀ TƯ DUY", desc: "Tư duy cao nhất: hiểu rằng kết quả đến từ cả chặng hành trình." }
                ]
            }},
            { id: "b_core_quote", type: "QUOTE", config: {
                text: "Chọn đúng thời gian, sự bền bỉ và mười năm nỗ lực rồi cuối cùng sẽ khiến bạn có vẻ như thành công chỉ trong một đêm.\n— BIZ STONE (Đồng sáng lập TWITTER)"
            }}
        ],
        t_philo: [
            { id: "b_philo_intro", type: "SPLIT_TEXT", config: {
                title: "TRIẾT LÝ LÀM VIỆC",
                subtitle: "",
                desc1: "Tại LYHU, chúng tôi tin rằng mọi mối quan hệ đều bắt đầu từ sự chân thành. Từ người lao động cho đến đối tác và khách hàng, chúng tôi tạo ra một môi trường đầy tôn trọng, sẻ chia, lấy sự tin cậy làm cốt lõi.",
                desc2: "Chúng tôi chú trọng sự bền vững. Trong quá trình làm việc, chúng tôi hướng đến sự công bằng, minh bạch và tin cậy. Hợp tác là sự gắn kết để cùng nhau chinh phục mọi giới hạn.",
                imageUrl: ""
            }}
        ],
        t_vision: [
            { id: "b_vision_logistics", type: "SPLIT_TEXT", config: {
                title: "NĂNG LỰC CUNG ỨNG TOÀN DIỆN",
                subtitle: "",
                desc1: "Với lợi thế nguồn hàng dồi dào, hệ thống vận tải mạnh mẽ và hệ thống kho bãi chuẩn quốc tế, LYHU Logistics tự hào là đối tác chiến lược hàng đầu tại Việt Nam.",
                desc2: "Chúng tôi mang đến các giải pháp lưu trữ, đóng gói và vận chuyển tối ưu, đảm bảo hàng hóa luôn được kiểm soát chất lượng từ đầu nguồn đến tay khách hàng.",
                imageUrl: ""
            }},
            { id: "b_vision_future", type: "GRID_NUMBERS", config: {
                title: "TẦM NHÌN",
                items: [
                    { title: "TOP 10 LOGISTICS", desc: "Đạt chuẩn thương hiệu Top 10 trong lĩnh vực cung ứng, phân phối." },
                    { title: "ĐỐI TÁC CHIẾN LƯỢC", desc: "Trở thành nhà cung cấp/đối tác chiến lược uy tín trong hệ thống đại siêu thị tiêu dùng toàn quốc." },
                    { title: "PHỦ KHẮP TOÀN QUỐC", desc: "Đưa sản phẩm phù hợp khắp chuỗi cửa hàng tiện lợi phục vụ trực tiếp giới trẻ và dân văn phòng." }
                ]
            }}
        ]
    }
};
