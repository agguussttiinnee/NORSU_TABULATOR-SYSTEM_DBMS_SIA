/* NORSU Tabulator System - shared header, menu and login guard.

   How a page uses it (3 lines):
     <link rel="stylesheet" href="/css/app.css">
     <div id="app-header" data-title="Events" data-subtitle="Events management"></div>
     <script src="/js/layout.js"></script>

   Optional attribute on the div:
     data-role="admin"   only admins may open this page (judges are sent to their home page)
*/
(function () {
  var TOKEN_KEY = 'norsuToken';
  var USER_KEY = 'norsuUser';
  var LOGIN_PAGE = '/login.html';

  // Edit these lists when a new screen is added.
  var MENUS = {
    admin: [
      { label: 'Events', href: '/events.html' },
      { label: 'Participant registration', href: '/participant-registration.html' },
      { label: 'Awards', href: '/awards.html' },
      { label: 'Users', href: '/users.html' },
      { label: 'Judge assignment', href: '/judge-assignment.html' }
    ],
    judge: [
      { label: 'My events', href: '/judge-home.html' }
    ]
  };
  var HOME = { admin: '/events.html', judge: '/judge-home.html' };

  function readUser() {
    try {
      return JSON.parse(localStorage.getItem(USER_KEY)) || null;
    } catch (e) {
      return null;
    }
  }

  function roleOf(user) {
    var name = user ? String(user.role || user.role_name || '').toLowerCase() : '';
    return MENUS[name] ? name : '';
  }

  function clearSession() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem('token'); // copy that the Events page keeps
  }

  function logout() {
    clearSession();
    window.location.href = LOGIN_PAGE;
  }

  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text) node.textContent = text; // textContent keeps names from running as HTML
    return node;
  }

  function build() {
    var host = document.getElementById('app-header');
    if (!host) return;

    var token = localStorage.getItem(TOKEN_KEY);
    var user = readUser();
    var role = roleOf(user);

    // Not logged in, or the saved session is unreadable: go to the login page.
    if (!token || !role) {
      clearSession();
      window.location.href = LOGIN_PAGE;
      return;
    }

    // Page is limited to one role, and this user has a different one.
    var allowed = host.getAttribute('data-role');
    if (allowed && allowed !== role) {
      window.location.href = HOME[role];
      return;
    }

    var header = el('header', 'nt-header');
    var inner = el('div', 'nt-header-inner');

    var topline = el('div', 'nt-topline');
    var titleBox = el('div');
    titleBox.appendChild(el('h1', 'nt-title', host.getAttribute('data-title') || 'NORSU Tabulator System'));
    var subtitle = host.getAttribute('data-subtitle');
    if (subtitle) titleBox.appendChild(el('p', 'nt-subtitle', subtitle));

    var userBox = el('div', 'nt-user');
    userBox.appendChild(el('span', 'nt-user-name', user.full_name || user.email || 'User'));
    userBox.appendChild(el('span', 'nt-user-role', role));
    var logoutBtn = el('button', 'nt-logout', 'Log out');
    logoutBtn.type = 'button';
    logoutBtn.addEventListener('click', logout);
    userBox.appendChild(logoutBtn);

    topline.appendChild(titleBox);
    topline.appendChild(userBox);

    var nav = el('nav', 'nt-nav');
    nav.setAttribute('aria-label', 'Main menu');
    MENUS[role].forEach(function (item) {
      var link = el('a', '', item.label);
      link.href = item.href;
      if (window.location.pathname === item.href) link.setAttribute('aria-current', 'page');
      nav.appendChild(link);
    });

    inner.appendChild(topline);
    inner.appendChild(nav);
    header.appendChild(inner);
    host.replaceWith(header);
  }

  // Other scripts can use these, for example to send the token with fetch.
  window.NorsuAuth = {
    getToken: function () { return localStorage.getItem(TOKEN_KEY); },
    getUser: readUser,
    logout: logout
  };

  build();
})();