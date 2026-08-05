document.addEventListener('DOMContentLoaded', function () {
  // ---- Mobile navigation toggle ----
  const navToggle = document.querySelector('.nav-toggle');
  const navLinks = document.querySelector('.nav-links');
  if (navToggle && navLinks) {
    navToggle.addEventListener('click', function () {
      navLinks.classList.toggle('open');
    });
    navLinks.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () {
        navLinks.classList.remove('open');
      });
    });
  }

  // ---- Active navigation highlight ----
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-links a').forEach(function (a) {
    const href = a.getAttribute('href');
    if (href && href.split('/').pop() === currentPage) {
      a.classList.add('active');
    }
  });

  // ---- Auth tabs (Login / Register) ----
  function switchAuthTab(tab) {
    document.querySelectorAll('.auth-tabs button').forEach(function (b) {
      b.classList.toggle('active', b.getAttribute('data-tab') === tab);
    });
    document.querySelectorAll('.auth-panel').forEach(function (p) {
      p.classList.toggle('active', p.id === 'panel-' + tab);
    });
  }
  window.switchAuthTab = switchAuthTab;
  document.querySelectorAll('.auth-tabs button').forEach(function (btn) {
    btn.addEventListener('click', function () {
      switchAuthTab(btn.getAttribute('data-tab'));
    });
  });
  const params = new URLSearchParams(window.location.search);
  if (params.get('mode') === 'register') {
    switchAuthTab('register');
  }

  // ---- Toast helper ----
  window.showToast = function (message, type) {
    let toast = document.getElementById('toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'toast';
      document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.className = type || '';
    requestAnimationFrame(function () {
      toast.classList.add('show');
    });
    clearTimeout(toast._timer);
    toast._timer = setTimeout(function () {
      toast.classList.remove('show');
    }, 3200);
  };

  // ---- Generic form demo submit ----
  document.querySelectorAll('[data-demo-submit]').forEach(function (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      const msg = form.getAttribute('data-success-msg') || 'Done.';
      const type = form.getAttribute('data-success-type') || 'success';
      if (window.showToast) window.showToast(msg, type);
    });
  });

  // ---- Login / Register forms ----
  const loginForm = document.getElementById('login-form');
  if (loginForm) {
    loginForm.addEventListener('submit', function (e) {
      e.preventDefault();
      const role = (document.querySelector('input[name="role"]:checked') || {}).value || 'patient';
      const pages = {
        patient: 'dashboard.html',
        donor: 'donor-dashboard.html',
        hospital: 'hospital-dashboard.html',
        volunteer: 'volunteer-dashboard.html',
        admin: 'admin-dashboard.html'
      };
      window.location.href = pages[role] || 'dashboard.html';
    });
  }

  const registerForm = document.getElementById('register-form');
  if (registerForm) {
    registerForm.addEventListener('submit', function (e) {
      e.preventDefault();
      window.showToast('Account created. You can now log in.', 'success');
    });
  }

  // ---- Blood request form ----
  const requestForm = document.getElementById('blood-request-form');
  if (requestForm) {
    requestForm.addEventListener('submit', function (e) {
      e.preventDefault();
      const unitSelect = document.getElementById('units');
      if (unitSelect && unitSelect.value) {
        const m = unitSelect.value.match(/\d+/);
        unitSelect.options[0].textContent = 'Number of Units: ' + (m ? m[0] : unitSelect.value);
      }
      const group = (document.getElementById('blood-group') || {}).value;
      const type = (document.getElementById('donation-type') || {}).value;
      const level = (document.getElementById('emergency-level') || {}).value;
      const hospital = (document.getElementById('hospital-name') || {}).value;
      const units = unitSelect ? unitSelect.value : '';

      document.getElementById('request-success').style.display = 'block';
      document.getElementById('request-success').scrollIntoView({ behavior: 'smooth', block: 'center' });
      window.showToast('Request submitted successfully!', 'success');

      // Auto-update summary chips
      const chips = document.querySelectorAll('[data-summary]');
      const map = { group: group, type: type, level: level, hospital: hospital, units: units };
      chips.forEach(function (chip) {
        const key = chip.getAttribute('data-summary');
        if (map[key]) chip.textContent = map[key];
      });
    });
  }

  // ---- Emergency notification ----
  const emergencyCard = document.getElementById('emergency-card');
  if (emergencyCard) {
    document.getElementById('accept-btn').addEventListener('click', function () {
      emergencyCard.querySelector('.emergency-actions').style.display = 'none';
      document.getElementById('emergency-result').className = 'alert alert-success';
      document.getElementById('emergency-result').style.display = 'flex';
      document.getElementById('emergency-result').innerHTML =
        '<div class="alert-icon">\u2705</div><div><b>Donor Confirmed</b><p>Rahim Uddin has accepted the request. The hospital has been notified and a confirmation SMS has been sent.</p></div>';
      window.showToast('Donor Confirmed!', 'success');
    });
    document.getElementById('decline-btn').addEventListener('click', function () {
      emergencyCard.querySelector('.emergency-actions').style.display = 'none';
      document.getElementById('emergency-result').className = 'alert';
      document.getElementById('emergency-result').style.display = 'flex';
      document.getElementById('emergency-result').innerHTML =
        '<div class="alert-icon">\u23F3</div><div><b>Searching for Next Nearby Donor...</b><p>BloodDrop AI is scanning donors within 5 km. Estimated time: under 2 minutes.</p></div>';
      window.showToast('Searching for next nearby donor...', 'error');
    });
  }

  // ---- Funding form ----
  const donateForm = document.getElementById('donate-form');
  if (donateForm) {
    donateForm.addEventListener('submit', function (e) {
      e.preventDefault();
      document.getElementById('donate-success').style.display = 'block';
      document.getElementById('donate-success').scrollIntoView({ behavior: 'smooth', block: 'center' });
      window.showToast('Thank you for supporting BloodDrop AI!', 'success');
    });
  }

  // ---- Donor dashboard actions ----
  const acceptRequestBtn = document.getElementById('donor-accept');
  if (acceptRequestBtn) {
    acceptRequestBtn.addEventListener('click', function () {
      const badge = document.getElementById('availability-badge');
      if (badge) {
        badge.className = 'badge badge-blue';
        badge.innerHTML = '\u{1F464} Busy';
      }
      window.showToast('Request accepted! Hospital notified.', 'success');
    });
  }
  const rejectRequestBtn = document.getElementById('donor-reject');
  if (rejectRequestBtn) {
    rejectRequestBtn.addEventListener('click', function () {
      window.showToast('Request rejected. Searching for another donor.', 'error');
    });
  }

  // ---- AI coordination auto-play ----
  const aiNodes = document.querySelectorAll('#ai-flow .ai-node');
  if (aiNodes.length) {
    let idx = 0;
    aiNodes[0].classList.add('active');
    const timer = setInterval(function () {
      aiNodes.forEach(function (n) { n.classList.remove('active'); });
      idx = (idx + 1) % aiNodes.length;
      aiNodes[idx].classList.add('active');
      const status = aiNodes[idx].querySelector('.node-status');
      if (status) {
        status.textContent = '\u23F3';
        setTimeout(function () { status.textContent = '\u2705'; }, 1400);
      }
      const last = aiNodes[aiNodes.length - 1];
      if (idx === aiNodes.length - 1) {
        setTimeout(function () {
          const s = last.querySelector('.node-status');
          if (s) { s.textContent = '\u2705'; }
        }, 1500);
        clearInterval(timer);
      }
    }, 1200);
  }

  // ---- Volunteer / admin action buttons ----
  document.querySelectorAll('[data-action-btn]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      const msg = btn.getAttribute('data-msg') || 'Action completed.';
      window.showToast(msg, 'success');
      const disable = btn.getAttribute('data-disable');
      if (disable === 'true') btn.disabled = true;
    });
  });

  // ---- Form submit show success inline ----
  document.querySelectorAll('[data-inline-success]').forEach(function (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      const targetId = form.getAttribute('data-inline-success');
      const el = document.getElementById(targetId);
      if (el) el.style.display = 'block';
    });
  });
});
