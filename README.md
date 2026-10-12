# Sleepify

Trang giới thiệu bằng tiếng Việt cho Sleepify, được xây dựng bằng HTML, CSS và JavaScript thuần.

## Xem tại máy

Chạy trong thư mục dự án:

```sh
python -m http.server 8765 --bind 127.0.0.1
```

Mở `http://127.0.0.1:8765/`. Trang cũng có thể được mở trực tiếp từ `index.html`.

## Các tệp cần khi đưa lên hosting

- `index.html`
- `sleepify.css`
- `video-loop.js`
- `icon.png`
- Toàn bộ thư mục `assets/`

Không có bước build hoặc phụ thuộc JavaScript bên ngoài. Phông chữ được tải từ Google Fonts và có phông hệ thống dự phòng.

Video sản phẩm dùng MP4 phân mảnh để `video-loop.js` đệm các vòng liên tiếp trên cùng một timeline, tránh seek tại điểm nối. Trình duyệt không hỗ trợ MediaSource hoặc khi tải bộ đệm thất bại sẽ dùng loop HTML thông thường.

Khi thay video, xuất bản dành cho web bằng FFmpeg (giữ nguyên thứ tự frame, không reverse):

```sh
ffmpeg -i input.mp4 -map 0:v:0 -an -c:v libx264 -preset medium -crf 19 -bf 0 -g 30 -keyint_min 30 -sc_threshold 0 -pix_fmt yuv420p -profile:v high -level:v 4.0 -movflags +frag_keyframe+empty_moov+default_base_moof assets/sleepify-webloop.mp4
```

Trang phục vụ giới thiệu và demo sản phẩm tại triển lãm. Báo cáo sử dụng dữ liệu giả lập, được ghi nhãn rõ ràng; phần liên hệ gồm email và số điện thoại của nhóm.
