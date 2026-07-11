import React, { useEffect, useState } from "react";
import { Satellite } from "lucide-react";

/* ---- dữ liệu hiển thị của panel — sửa trực tiếp ở đây khi có dữ liệu thật ---- */

const TICKER_LINES = [
  "GPS lock 37.7749° N, 122.4194° W",
  "Battery 86% · range 212 mi",
  "Nearest unit 240 m · clear",
  "LIDAR frame rate 20 Hz · nominal",
  "Route deviation 0.0 m",
  "V2X handshake · unit 0417",
  "Sensor fusion · 12 objects tracked",
  "Fleet uplink · 42 units active",
];

const RADAR_BLIPS = [
  { top: "22%", left: "64%", delay: "0s" },
  { top: "68%", left: "28%", delay: "0.6s" },
  { top: "35%", left: "20%", delay: "1.2s" },
  { top: "78%", left: "70%", delay: "1.8s" },
  { top: "50%", left: "82%", delay: "0.9s" },
];

// tone: "ok" | "warn"
const STATUS_ITEMS = [
  { label: "LIDAR", value: "TRỰC TUYẾN", tone: "ok" },
  { label: "GPS", value: "ĐÃ KHÓA", tone: "ok" },
  { label: "V2X", value: "ĐANG ĐỒNG BỘ", tone: "warn" },
  { label: "FLEET", value: "42 HOẠT ĐỘNG", tone: "ok" },
];

function formatTime(date) {
  return date.toTimeString().slice(0, 8);
}

/** Đồng hồ sống + ticker telemetry cuộn dòng. Thay TICKER_LINES bằng feed thật khi có. */
function useTelemetry(intervalMs = 2600) {
  const [time, setTime] = useState(() => new Date());
  const [index, setIndex] = useState(3);
  const [lines, setLines] = useState(TICKER_LINES.slice(0, 4));

  useEffect(() => {
    const clockId = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(clockId);
  }, []);

  useEffect(() => {
    const tickerId = setInterval(() => {
      setIndex((prev) => {
        const next = (prev + 1) % TICKER_LINES.length;
        setLines((cur) => [...cur.slice(1), TICKER_LINES[next]]);
        return next;
      });
    }, intervalMs);
    return () => clearInterval(tickerId);
  }, [intervalMs]);

  return { time: formatTime(time), lines };
}

/** Vòng radar quét kiểu LIDAR, với marker xe của console ở tâm. */
function Radar() {
  return (
    <div className="avc-radar-wrap">
      <div className="avc-radar">
        <div className="avc-radar-crosshair" />
        <div className="avc-radar-sweep" />
        <div className="avc-radar-self" />
        {RADAR_BLIPS.map((blip, i) => (
          <div
            key={i}
            className="avc-blip"
            style={{ top: blip.top, left: blip.left, animationDelay: blip.delay }}
          />
        ))}
      </div>
    </div>
  );
}

/** Panel trái: brand, radar, lưới trạng thái hệ thống, và ticker telemetry. */
export default function SystemPanel() {
  const { time, lines } = useTelemetry();

  return (
    <div className="avc-left">
      <div className="avc-brand">
        <div className="avc-brand-mark">
          <Satellite size={17} />
        </div>
        <div>
          <div className="avc-brand-name">AUTOX</div>
          <div className="avc-eyebrow">Trung tâm điều hành</div>
        </div>
      </div>

      <h1 className="avc-headline">Bảng điều khiển cho đội xe tự hành</h1>
      <p className="avc-sub">
        Giám sát telemetry, điều phối tuyến đường và can thiệp từ xa theo thời
        gian thực — trong một phiên đăng nhập duy nhất.
      </p>

      <Radar />

      <div className="avc-status-title">Trạng thái hệ thống</div>
      <div className="avc-status-list">
        {STATUS_ITEMS.map((item) => (
          <div className="avc-status-row" key={item.label}>
            <span className={`avc-dot ${item.tone === "warn" ? "amber" : ""}`} />
            {item.label}
            <span className="avc-status-val">{item.value}</span>
          </div>
        ))}
      </div>

      <div className="avc-ticker">
        {lines.map((line, i) => (
          <div className="avc-ticker-line" key={line + i}>
            <span className="avc-ticker-time">{time}</span>
            <span>{line}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
