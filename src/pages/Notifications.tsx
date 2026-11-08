import { useEffect, useState } from "react";
import UserLayout from "../components/UserLayout";
import "./Notifications.css";

type Notice = {
  id: number;
  title: string;
  description: string;
  status: string;
  statusClass: string;
  unread: boolean;
};

const INITIAL_NOTICES: Notice[] = [
  {
    id: 1,
    title: "보완요청이 도착했어요",
    description: "《불편한 편의점》 · 10월 11일 · 심사 코멘트를 확인해 주세요",
    status: "보완요청",
    statusClass: "notice-revision",
    unread: true,
  },
  {
    id: 2,
    title: "기록이 승인됐어요",
    description: "《소년이 온다》 · 10월 9일 · 누적 쪽수에 반영됐어요",
    status: "승인",
    statusClass: "notice-approved",
    unread: true,
  },
  {
    id: 3,
    title: "작별하지 않는다 기록이 심사 대기 중이에요",
    description: "10월 10일 · 제출 완료",
    status: "심사 대기",
    statusClass: "notice-waiting",
    unread: false,
  },
  {
    id: 4,
    title: "마지막 기록 후 10일이 지났어요",
    description: "9월 29일 · 오늘 한 쪽만 읽어 볼까요?",
    status: "독서 독려",
    statusClass: "notice-encourage",
    unread: false,
  },
];

const NOTICES_KEY = "reading-marathon-notifications";
const SETTINGS_KEY = "reading-marathon-notification-settings";

type Settings = {
  readingEncouragement: boolean;
  reviewResult: boolean;
};

const DEFAULT_SETTINGS: Settings = {
  readingEncouragement: true,
  reviewResult: true,
};

function loadNotices(): Notice[] {
  try {
    const saved = localStorage.getItem(NOTICES_KEY);
    return saved ? JSON.parse(saved) as Notice[] : INITIAL_NOTICES;
  } catch {
    return INITIAL_NOTICES;
  }
}

function loadSettings(): Settings {
  try {
    const saved = localStorage.getItem(SETTINGS_KEY);
    return saved
      ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) as Partial<Settings> }
      : DEFAULT_SETTINGS;
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export default function Notifications() {
  const [notices, setNotices] = useState<Notice[]>(loadNotices);
  const [settings, setSettings] = useState<Settings>(loadSettings);

  const unreadCount = notices.filter((notice) => notice.unread).length;

  useEffect(() => {
    localStorage.setItem(NOTICES_KEY, JSON.stringify(notices));
  }, [notices]);

  useEffect(() => {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  }, [settings]);

  function markAllRead() {
    setNotices((current) =>
      current.map((notice) => ({ ...notice, unread: false })),
    );
  }

  function toggleSetting(key: keyof Settings) {
    setSettings((current) => ({
      ...current,
      [key]: !current[key],
    }));
  }

  return (
    <UserLayout active="">
      <main className="notifications-page">
        <section className="notifications-hero">
          <div className="notifications-hero-copy">
            <h1>알림</h1>
            <p>심사 결과와 독서 독려 알림을 모아서 보여 드려요.</p>
            <button
              className="notifications-button notifications-button-light"
              type="button"
              onClick={markAllRead}
              disabled={unreadCount === 0}
            >
              모두 읽음
            </button>
          </div>

          <div className="notifications-hero-art" aria-hidden="true">
            <span className="notifications-art-building notifications-art-back" />
            <span className="notifications-art-building notifications-art-front" />
            <span className="notifications-art-building notifications-art-small" />
          </div>
        </section>

        <div className="notifications-content">
          <section className="notifications-panel notifications-list-panel">
            <div className="notifications-panel-heading">
              <h2>최근 알림</h2>
              <span className="notifications-new-count">새 알림 {unreadCount}</span>
            </div>

            {notices.length > 0 ? (
              <ul className="notification-list">
                {notices.map((notice) => (
                  <li
                    className={`notification-item${notice.unread ? " is-unread" : ""}`}
                    key={notice.id}
                  >
                    <span
                      className={`unread-dot${notice.unread ? "" : " is-hidden"}`}
                      aria-hidden="true"
                    />
                    <div className="notification-copy">
                      <h3>{notice.title}</h3>
                      <p>{notice.description}</p>
                    </div>
                    <span className={`status-badge ${notice.statusClass}`}>
                      {notice.status}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="notifications-empty">표시할 알림이 없어요.</p>
            )}
          </section>

          <aside className="notifications-panel notifications-settings-panel">
            <h2>알림 설정</h2>

            <label className="notification-setting">
              <input
                type="checkbox"
                checked={settings.readingEncouragement}
                onChange={() => toggleSetting("readingEncouragement")}
              />
              <span className="custom-checkbox" aria-hidden="true">✓</span>
              <span className="setting-copy">
                <strong>독서 독려 알림 받기</strong>
                <small>마지막 기록 후 10일이 지나면 참여를 권해요.</small>
              </span>
            </label>

            <label className="notification-setting">
              <input
                type="checkbox"
                checked={settings.reviewResult}
                onChange={() => toggleSetting("reviewResult")}
              />
              <span className="custom-checkbox" aria-hidden="true">✓</span>
              <span className="setting-copy">
                <strong>심사 결과 알림</strong>
                <small>승인 · 보완요청 · 완주 승인</small>
              </span>
            </label>

            <p className="notifications-settings-note">
              설정은 현재 브라우저에 저장돼요.
            </p>
          </aside>
        </div>
      </main>
    </UserLayout>
  );
}