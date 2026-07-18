import "./DashboardHeader.css";

function DashboardHeader({
  t,
  user,
  onLanguageToggle,
}) {
  return (
    <header className="dashboard-topbar">
      <div className="topbar-welcome">
        <strong>
          {t.topbar.welcome}،{" "}
          <span dir="auto">{user?.fullName}</span>
        </strong>

        <small dir="auto">
          {user?.companyName || "Rita"}
        </small>
      </div>

      <div className="topbar-actions">
        <div className="topbar-email" dir="auto">
          {user?.email}
        </div>

        <button
          className="topbar-icon"
          type="button"
          aria-label="Profile"
        >
          ◎
        </button>

        <button
          className="topbar-icon"
          type="button"
          aria-label="Notifications"
        >
          ♡
        </button>

        <button
          className="topbar-password"
          type="button"
        >
          🔑 {t.topbar.password}
        </button>

        <button
          className="dashboard-lang-btn"
          type="button"
          onClick={onLanguageToggle}
        >
          ↔ {t.langButton}
        </button>
      </div>
    </header>
  );
}

export default DashboardHeader;