import "./DashboardSidebar.css";

const sidebarItems = [
  {
    page: "overview",
    translationKey: "overview",
  },
  {
    page: "request",
    translationKey: "request",
  },
  {
    page: "services",
    translationKey: "services",
  },
  {
    page: "documents",
    translationKey: "documents",
  },
  {
    page: "updates",
    translationKey: "updates",
  },
];

function DashboardSidebar({
  t,
  user,
  activePage,
  onChangePage,
  onLogout,
}) {
  return (
    <aside className="dashboard-sidebar">
      <div className="dashboard-logo-wrap">
        <img src="/rita-logo.png" alt="Rita Digital Services" />
      </div>

      <div className="dashboard-user-mobile">
        <strong dir="auto">{user?.fullName}</strong>
        <span dir="auto">{user?.email}</span>
        <small>{user?.role}</small>
      </div>

      <nav>
        {sidebarItems.map((item) => (
          <button
            key={item.page}
            type="button"
            className={activePage === item.page ? "active" : ""}
            onClick={() => onChangePage(item.page)}
          >
            {t.sidebar[item.translationKey]}
          </button>
        ))}
      </nav>

      <button
        className="dashboard-logout"
        type="button"
        onClick={onLogout}
      >
        {t.sidebar.logout}
      </button>
    </aside>
  );
}

export default DashboardSidebar;