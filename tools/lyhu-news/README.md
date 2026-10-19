# LYHU — bộ đăng bài độc lập với ChatGPT

Đã viết theo hướng 2: Python + GitHub Actions. Chạy trên máy chủ GitHub, không dùng Connector/SQL trong cửa sổ ChatGPT nên không có popup ChatGPT trong đường thực thi này. Vẫn phải cấu hình máy chủ và Secrets một lần. Không hứa “không bao giờ lỗi”: hết quota Actions, thiếu bản nháp, thiếu ảnh hoặc lỗi Supabase sẽ khiến job thất bại.

**Trạng thái bàn giao: mã nguồn và kiểm thử mô phỏng đã hoàn tất; CHƯA triển khai lên GitHub, CHƯA cấu hình khóa và CHƯA chạy xuất bản thật bằng bộ mới. Không thay database, RLS hoặc các lịch cũ.**

## Phạm vi

- Lấy đúng ba ID bản nháp trong bản kê ngày; không lấy ngẫu nhiên mọi draft.
- Đăng theo giờ Việt Nam 07h,13h,19h, chỉ trong 60 phút kể từ giờ hẹn. Không đăng bù quá giờ.
- Kiểm trạng thái, nội dung chưa bị sửa, cờ chất lượng, ảnh bìa/ảnh nội dung và đường dẫn ảnh.
- Chỉ PATCH ba trường status/published_at/updated_at, với bộ lọc chính xác ID + request_id + slug + nội dung/title/cover/updated_at cũ + draft + published_at NULL.
- Đã published thì chỉ kiểm lại trang, không đăng lại. Khi mất phản hồi ghi, đọc DB trước, không retry ghi mù.
- Không INSERT/DELETE, không sửa hàng khác, schema hoặc RLS; không tải khóa từ Connector.
- Mặc định chạy thử không ghi. Chỉ `--publish` mới ghi DB. Workflow chạy theo lịch bật ghi thật; workflow thủ công mặc định dry-run.
- Đọc lại DB và kiểm HTTP/title/URL ảnh trên HTML trang công khai. Không phải kiểm ảnh trực quan desktop/mobile.

Script này **chỉ thay phần xuất bản**. Phần tự viết, chống trùng và tạo ảnh phải hoàn tất bản nháp và bản kê trước giờ đăng. Ba bản giữ chỗ ngày19/10 hiện chưa đủ điều kiện; không được đánh dấu ready để ép đăng. Producer có thể tự tạo bản kê sau kiểm chứng, không cần con người duyệt từng bài; nhưng chưa nối producer Cloud hiện tại vào repository bằng gói này.

## 1. Cài một lần trên GitHub

1. Dùng repository PRIVATE do anh kiểm soát. Chép toàn bộ thư mục này vào root repository, gồm cả `.github/workflows/publish.yml` và `queue/`. Workflow phải có trên default branch.
2. Settings → Secrets and variables → Actions → New repository secret. Đặt `SUPABASE_URL=https://wepxcpifgxghfvdgnkeh.supabase.co`.
3. Tạo **một** trong hai secret:
   - `SUPABASE_SECRET_KEY`: khóa backend `sb_secret_...` (Supabase khuyến nghị cho ứng dụng mới).
   - Hoặc `SUPABASE_SERVICE_ROLE_KEY`: legacy service_role JWT đang có của dự án, đúng lựa chọn anh yêu cầu.
4. Nhập khóa trực tiếp vào GitHub Secrets. Không gửi khóa trong chat, không ghi vào Git/README/Drive/log hoặc frontend. Service key có quyền rộng và bỏ qua RLS; không phải khóa chỉ giới hạn blog_posts. Code tự giới hạn thao tác nhưng không thu hẹp quyền bản thân khóa.
5. Giữ repository/workflow ở nhánh đáng tin, không thêm trigger pull_request_target, không chạy mã PR lạ với Secrets. Chỉ người/producer được tin cậy được sửa queue và code. Nếu dùng GitHub Environment có “required reviewers” sẽ cần xác nhận lúc chạy; workflow mẫu dùng repository Secrets, không khai báo Environment.
6. Bật Actions nếu repository đang tắt. Không cần cài npm/pip: dùng Python3 có sẵn trên ubuntu-latest. Kiểm tra hạn mức/phí Actions của tài khoản trước khi bật; gói này không tự mua dịch vụ.

## 2. Bản kê sẵn sàng xuất bản

Lưu `queue/YYYY-MM-DD.json` vào repository trên default branch. File có đúng ba slot7/13/19; ID là ID thật của draft, `content_hash` là SHA-256 UTF-8 của nguyên văn trường `content` từ DB (không trim/chuyển newline). Các giá trị title/slug/cover phải khớp DB. Cờ true chỉ được đặt sau kiểm thực tế.

```json
{
  "schema_version": 1,
  "target_date_ict": "2026-10-20",
  "articles": [
    {
      "id": "UUID_THAT_CUA_BAI_7H",
      "slot": 7,
      "request_id": "lyhu-news:2026-10-20:7",
      "slug": "slug-thuc-te",
      "title": "Tiêu đề đúng trong DB",
      "due_at_utc": "2026-10-20T00:00:00Z",
      "thumbnail_url": "https://wepxcpifgxghfvdgnkeh.supabase.co/storage/v1/object/public/public-assets/news/.../cover.webp",
      "asset_urls": ["URL_ANH_BIA", "URL_ANH_NOI_DUNG"],
      "content_hash": "SHA256_64_KY_TU_HEX_TU_NOI_DUNG_THAT",
      "ready_for_publish": false,
      "checks": {"editorial": false, "sources": false, "dedup": false, "images": false}
    }
  ]
}
```

Ví dụ trên chỉ minh họa một phần tử, KHÔNG phải queue hợp lệ: phải thêm hai phần tử slot13/19 với ID khác nhau, request_id tương ứng và due00Z/06Z/12Z. Không dùng placeholder làm dữ liệu production. Hồ sơ nguồn/chống trùng vẫn lưu nội bộ theo Skill LYHU.

Manifest Drive cũ chưa tự đọc được ở đây. Producer phải xuất bản kê theo schema trên vào repository. Không nhúng token Google hoặc Service Role Key vào bản kê. Không tự nhận một draft Gemini là draft đã kiểm của luồng này.

## 3. Kiểm thử trước bật thật

Trong thư mục bộ đăng:
```sh
python3 -m unittest discover -s tests -v
python3 publish.py --check-all --date 2026-10-20
```

Lệnh thứ hai cần ENV thật và queue thật, chỉ đọc/kiểm ảnh, không ghi. Đặt ENV bằng secret manager của máy chủ; chương trình không tự đọc `.env.example`. Sau khi dry-run cả ba bài đạt, chọn Actions → LYHU scheduled publisher → Run workflow, publish=false để kiểm thêm trên runner. Muốn chạy thử ghi thật trong khung giờ đến hạn, chọn publish=true. Không có mốc override giờ để ép đăng sớm.

Workflow có lịch kiểm mỗi10phút tại phút07/17/27/37/47/57 trong các giờ UTC00/06/12, tương ứng07/13/19ICT. Đây là lịch kiểm trong cửa sổ đăng, **không cam kết đúng giây07:00**. GitHub có thể trễ hoặc bỏ lượt khi tải cao; nếu chạy ngoài giờ hoặc quá60phút chương trình không đăng. Muốn thời gian ổn định hơn, dùng cron trên máy chủ luôn bật:

```cron
# Đặt timezone của cron/host là UTC. Mỗi dòng chạy đồng bộ một tiến trình.
7,17,27,37,47,57 0,6,12 * * * cd /opt/lyhu-publisher && /usr/bin/flock -n /tmp/lyhu-publisher.lock /usr/bin/python3 publish.py --publish >> /var/log/lyhu-publisher.log 2>&1
```

ENV cho cron phải do máy chủ cấp sẵn, không chép key vào dòng cron. Chọn MỘT scheduler, không bật cả cron và Actions. Đường dẫn là ví dụ máy chủ Linux, cần điều chỉnh khi cài.

## 4. Vận hành và chuyển từ Cloud

- Chưa bật lại các lịch Cloud đang bị kẹt. Khi triển khai bộ mới: thử end-to-end trên một draft hoàn chỉnh; đối chiếu kết quả thật; chỉ sau đó tắt publisher cũ và chọn duy nhất scheduler mới. Không tự thao tác popup cũ.
- Luồng Gemini đang dùng request_id cùng slot: publisher mới chỉ nhận ID đã ghi trong queue. Nếu slot có bài khác hoặc dữ liệu thay đổi thì dừng. Cần quyết định publisher duy nhất ở hạ tầng để tránh tranh slot; gói này không tự sửa Gemini.
- Exit0=đạt/no-op; exit1=thiếu cấu hình/queue, bài chưa sẵn sàng, lỗi HTTP hoặc không xác minh trang. GitHub báo Failed theo cơ chế notifications của tài khoản; không gửi email/Slack riêng.
- Log không in khóa, response body hay fullURL chứa filter nội dung. Không tự rollback bài đã published nếu CDN chưa cập nhật; lượt sau kiểm lại trong giờ. Đọc DB trước mọi thao tác xử lý sự cố.
- Bản nháp HTML lớn khiến URL so sánh trạng thái dài hơn24.000 ký tự sẽ bị từ chối trước ghi. Khi đó dùng RPC có khóa hàng và kiểm hash ở DB đã được review; không nới điều kiện PATCH.
- Không sửa quyền backend để né một hành động Connector đang bị chặn. Đây là ứng dụng máy chủ riêng do anh yêu cầu, nhận khóa qua Secrets, không gọi lại hành động SQL chưa xác định.

## Tài liệu chính thức

- Supabase keys: https://supabase.com/docs/guides/getting-started/api-keys
- PostgREST cập nhật có filter: https://docs.postgrest.org/en/stable/references/api/tables_views.html#update
- GitHub lịch và giới hạn trễ: https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#schedule
- GitHub Secrets: https://docs.github.com/en/actions/how-tos/write-workflows/choose-what-workflows-do/use-secrets

Không đưa SQL RPC vào gói này vì đã chọn hướng2. RPC gọi qua Connector vẫn có thể chịu xác nhận của nền tảng; bọc SQL vào hàm không bảo đảm loại bỏ popup. Gói này dùng REST từ runner độc lập.
