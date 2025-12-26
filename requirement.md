Rõ. Dưới đây là **bản mô tả ĐẦY ĐỦ – TUYẾN TÍNH – DB-LESS** cho **MVP hệ thống phân tích crypto + live chart + alert + AI**, **tất cả gói gọn trong Next.js**.
Mỗi đoạn = **1 nhóm công việc hoàn chỉnh**, làm tuần tự là chạy được MVP.

---

## 1. Định nghĩa phạm vi & mục tiêu MVP

* Xác định mục tiêu: demo live chart Binance với alert kỹ thuật + AI giải thích.
* Phạm vi: Binance Spot, 1 symbol tại 1 thời điểm, timeframe 5m–15m–1h.
* Chốt danh sách indicator & alert (EMA, RSI, Breakout, Volume).
* Quy ước: không DB, không lưu trạng thái dài hạn, reload = reset.

---

## 2. Khởi tạo dự án Next.js

* Tạo project Next.js (TypeScript, App Router).
* Cấu hình Tailwind CSS và layout cơ bản.
* Thiết lập biến môi trường cho Binance và AI.
* Tổ chức thư mục cho logic Binance, indicator, alert, AI.

---

## 3. Kết nối Binance REST (snapshot ban đầu)

* Gọi Binance REST API để lấy dữ liệu nến lịch sử (200–300 candles).
* Chuẩn hóa dữ liệu candle về format thống nhất.
* Lưu snapshot candle trong bộ nhớ (in-memory).
* Dùng snapshot để render chart ban đầu và warm-up indicator.

---

## 4. Kết nối Binance WebSocket (live data)

* Mở WebSocket tới Binance kline stream theo symbol & timeframe.
* Nhận dữ liệu nến realtime (update & close).
* Phân biệt nến đang chạy và nến đã đóng.
* Cập nhật dữ liệu candle trong memory theo từng event.

---

## 5. Quản lý state in-memory (server)

* Duy trì cấu trúc lưu candles và alerts trong RAM.
* Giới hạn số candle và alert để tránh tràn bộ nhớ.
* Reset state khi đổi symbol hoặc timeframe.
* Đồng bộ state giữa REST snapshot và WebSocket live.

---

## 6. Xây dựng Indicator Engine

* Cài đặt các hàm indicator thuần (EMA, SMA, RSI, Volume MA).
* Tính indicator cho snapshot ban đầu.
* Recalculate indicator khi có candle update.
* Đảm bảo indicator sync chính xác với dữ liệu chart.

---

## 7. Xây dựng Alert Detection Engine

* Kiểm tra điều kiện alert khi **candle đóng**.
* Các loại alert: EMA crossover, Breakout, Volume spike, RSI threshold.
* Tạo object alert với đầy đủ metadata và confidence.
* Tránh tạo alert trùng lặp trong cùng phiên chạy.

---

## 8. API nội bộ (Next.js API Routes)

* API trả candle + indicator cho frontend.
* API trả alert hiện có (in-memory).
* API bridge WebSocket (SSE/WS) để push live data & alert.
* API gọi AI để giải thích alert và tóm tắt thị trường.

---

## 9. Tích hợp Live Chart (Frontend)

* Cài đặt TradingView Lightweight Charts.
* Render candlestick chart và volume.
* Overlay indicator (EMA, SMA).
* Update chart realtime theo dữ liệu live.
* Giữ chart mượt, không reset khi cập nhật.

---

## 10. Hiển thị Alert trên Chart

* Vẽ marker trên candle khi alert xảy ra.
* Màu sắc và icon theo từng loại alert.
* Tooltip ngắn hiển thị lý do kỹ thuật.
* Highlight candle có alert và hỗ trợ jump-to.

---

## 11. Bảng điều khiển & UX cơ bản

* Chọn symbol và timeframe.
* Toggle bật/tắt indicator.
* Toggle bật/tắt layer alert.
* Timeline alert ngắn bên dưới chart.
* Trạng thái loading & error rõ ràng.

---

## 12. Tích hợp AI – Giải thích Alert

* Khi click alert, build prompt từ dữ liệu kỹ thuật hiện tại.
* Gọi AI để tạo giải thích ngắn (1–3 câu).
* Hiển thị giải thích trong panel bên cạnh chart.
* Không lưu kết quả AI, chỉ dùng theo yêu cầu.

---

## 13. Tích hợp AI – Market Summary

* Button “AI Market Summary”.
* Gửi context: symbol, số alert bullish/bearish, volume.
* AI trả về 2–4 câu tổng quan thị trường.
* Hiển thị rõ nhãn “AI generated – not financial advice”.

---

## 14. Natural Language Query (AI Q&A)

* Text input cho user đặt câu hỏi.
* Context gồm alert gần nhất + indicator snapshot.
* AI trả lời dạng giải thích kỹ thuật, không đưa khuyến nghị.
* Giới hạn tần suất gọi AI.

---

## 15. Kiểm soát chi phí & an toàn AI

* Throttle số lần gọi AI.
* Hiển thị disclaimer rõ ràng.
* Không cho AI suy đoán giá hoặc lời khuyên mua/bán.
* Fallback UI khi AI lỗi hoặc timeout.

---

## 16. Kiểm thử & demo

* Test indicator với dữ liệu lịch sử.
* Replay nến để kiểm tra alert xuất hiện đúng lúc.
* Kiểm tra live update ổn định.
* Chuẩn bị kịch bản demo mạch lạc.

---

## 17. Hoàn thiện & freeze MVP

* Dọn code, loại bỏ tính năng thừa.
* Freeze phạm vi MVP, không thêm mới.
* Deploy bản demo ổn định.
* Thu feedback người dùng.