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
- `intro-video.js`
- `icon.png`
- Toàn bộ thư mục `assets/`

Không có bước build hoặc phụ thuộc JavaScript bên ngoài. Phông chữ được tải từ Google Fonts và có phông hệ thống dự phòng.

Video giới thiệu dưới “Khám phá Sleepify” được host trên Mux. Ban đầu trang chỉ tải ảnh poster WebP ở local; `intro-video.js` tạo iframe Mux khi bấm “Xem video”, không tải player hay video giới thiệu lúc mở trang. Liên kết vẫn mở được player Mux khi JavaScript bị tắt. File video gốc không nằm trong repo. Khi thay video giới thiệu, cập nhật URL Mux trong `.intro-video-preview` và ảnh `assets/sleepify-intro-poster.webp`.

Video sản phẩm dùng MP4 phân mảnh để `video-loop.js` phát ngay khi đệm được khoảng một giây, rồi lưu toàn bộ clip để lặp trên cùng một timeline, tránh seek tại điểm nối. Mobile, kết nối chậm hoặc chế độ tiết kiệm dữ liệu dùng bản 720p; desktop thông thường dùng bản 1080p. Trình duyệt không hỗ trợ MediaSource hoặc khi tải bộ đệm thất bại sẽ dùng bản 720p MP4 fast-start với loop HTML thông thường. Ảnh poster hiển thị trong lúc chờ video; không có hai lượt tải video song song lúc khởi động.

Khi thay video, xuất bản dành cho web bằng FFmpeg (giữ nguyên thứ tự frame, không reverse):

```sh
ffmpeg -i input.mp4 -map 0:v:0 -an -c:v libx264 -preset slow -crf 24 -bf 0 -g 15 -keyint_min 15 -sc_threshold 0 -pix_fmt yuv420p -profile:v high -level:v 4.0 -movflags +frag_keyframe+empty_moov+default_base_moof assets/sleepify-webloop.mp4
ffmpeg -i input.mp4 -map 0:v:0 -an -vf scale=1280:720 -c:v libx264 -preset slow -crf 25 -bf 0 -g 15 -keyint_min 15 -sc_threshold 0 -pix_fmt yuv420p -profile:v high -level:v 4.0 -movflags +frag_keyframe+empty_moov+default_base_moof assets/sleepify-webloop-mobile.mp4
ffmpeg -i assets/sleepify-webloop-mobile.mp4 -map 0:v:0 -c:v copy -an -movflags +faststart assets/sleepify-webloop-mobile-native.mp4
```

Trang phục vụ giới thiệu và demo sản phẩm tại triển lãm. Báo cáo sử dụng dữ liệu giả lập, được ghi nhãn rõ ràng; phần liên hệ gồm email và số điện thoại của nhóm.
