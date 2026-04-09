// @charset "UTF-8";
// ==========================
// 用户体系（账号隔离）
// ==========================
let users = JSON.parse(localStorage.getItem("smoke_users")) || [];
let currentUser = localStorage.getItem("smoke_login_user");

// 每个用户独立历史记录
function getUserHistoryKey() {
  return "smoke_history_" + currentUser;
}
function loadMyHistory() {
  return JSON.parse(localStorage.getItem(getUserHistoryKey())) || [];
}
function saveMyHistory(history) {
  localStorage.setItem(getUserHistoryKey(), JSON.stringify(history));
}

window.onload = function () {
  if (currentUser) {
    showMain();
  } else {
    showLogin();
  }
  renderHistory();
};

// 切换登录/注册
function switchTab(t) {
  if (t == "login") {
    document.getElementById("loginForm").style.display = "block";
    document.getElementById("regForm").style.display = "none";
    document.querySelectorAll(".tab-btn")[0].classList.add("active");
    document.querySelectorAll(".tab-btn")[1].classList.remove("active");
  } else {
    document.getElementById("loginForm").style.display = "none";
    document.getElementById("regForm").style.display = "block";
    document.querySelectorAll(".tab-btn")[0].classList.remove("active");
    document.querySelectorAll(".tab-btn")[1].classList.add("active");
  }
}

// 注册
function userReg() {
  let u = document.getElementById("reg_user").value.trim();
  let p = document.getElementById("reg_pwd").value.trim();
  if (!u || !p) {
    document.getElementById("reg_msg").innerText = "\u8BF7\u8F93\u5165\u7528\u6237\u540D\u548C\u5BC6\u7801";
    return;
  }
  if (users.some((x) => x.user == u)) {
    document.getElementById("reg_msg").innerText = "\u7528\u6237\u540D\u5DF2\u5B58\u5728";
    return;
  }
  users.push({ user: u, pwd: p });
  localStorage.setItem("smoke_users", JSON.stringify(users));
  document.getElementById("reg_msg").innerText = "\u6CE8\u518C\u6210\u529F\uFF0C\u8BF7\u767B\u5F55";
}

// 登录
function userLogin() {
  let u = document.getElementById("login_user").value.trim();
  let p = document.getElementById("login_pwd").value.trim();
  let ok = users.some((x) => x.user == u && x.pwd == p);
  if (!ok) {
    document.getElementById("login_msg").innerText = "\u7528\u6237\u540D\u6216\u5BC6\u7801\u9519\u8BEF";
    return;
  }
  localStorage.setItem("smoke_login_user", u);
  currentUser = u;
  showMain();
  renderHistory();
}

// 退出
function logout() {
  localStorage.removeItem("smoke_login_user");
  currentUser = null;
  showLogin();
}

function showMain() {
  document.getElementById("loginModal").style.display = "none";
  document.getElementById("mainContainer").style.display = "block";
  document.getElementById("show_username").innerText = currentUser;
}
function showLogin() {
  document.getElementById("loginModal").style.display = "flex";
  document.getElementById("mainContainer").style.display = "none";
}

// ==========================
// 原有功能（完全不变）
// ==========================
function generateStrategy() {
  const vM = parseFloat(document.getElementById('v_missile').value) || 300;
  const dx = parseFloat(document.getElementById('d_x').value) || 17800;
  const dy = parseFloat(document.getElementById('d_y').value) || 0;
  const dz = parseFloat(document.getElementById('d_z').value) || 1800;
  const mx = parseFloat(document.getElementById('m_x').value) || 20000;
  const my = parseFloat(document.getElementById('m_y').value) || 0;
  const mz = parseFloat(document.getElementById('m_z').value) || 2000;
  const tx = parseFloat(document.getElementById('t_x').value) || 0;
  const ty = parseFloat(document.getElementById('t_y').value) || 200;
  const tz = parseFloat(document.getElementById('t_z').value) || 0;

  const dirX = tx - dx;
  const dirY = ty - dy;
  const dirZ = tz - dz;

  const angle = Math.atan2(dirY, dirX) * 180 / Math.PI;
  const speed = 127.69;
  const t1 = 0.76;
  const t2 = 4.88;

  const rad = angle * Math.PI / 180;
  const rx = dx + speed * t1 * Math.cos(rad);
  const ry = dy + speed * t1 * Math.sin(rad);
  const rz = dz;

  const ex = rx + speed * t2 * Math.cos(rad);
  const ey = ry + speed * t2 * Math.sin(rad);
  const ez = rz - 0.5 * 9.8 * t2 * t2;

  const distDroneToTarget = Math.hypot(tx - dx, ty - dy, tz - dz);
  const distMissileToTarget = Math.hypot(tx - mx, ty - my, tz - mz);

  const dotProd = dirX * (mx - tx) + dirY * (my - ty) + dirZ * (mz - tz);
  const lenDir = Math.hypot(dirX, dirY, dirZ) || 1e-6;
  const lenMissileVec = Math.hypot(mx - tx, my - ty, mz - tz) || 1e-6;
  const alignment = Math.abs(dotProd) / (lenDir * lenMissileVec);

  const speedFactor = 300 / vM;
  const distRatio = distDroneToTarget / (distMissileToTarget + 1e-6);

  let cover = 4.95 * alignment * distRatio * speedFactor;
  cover = Math.max(0, Math.min(4.95, cover));

  document.getElementById('angle').innerText = angle.toFixed(2);
  document.getElementById('speed').innerText = speed.toFixed(2);
  document.getElementById('rx').innerText = rx.toFixed(1);
  document.getElementById('ry').innerText = ry.toFixed(1);
  document.getElementById('rz').innerText = rz.toFixed(1);
  document.getElementById('ex').innerText = ex.toFixed(1);
  document.getElementById('ey').innerText = ey.toFixed(1);
  document.getElementById('ez').innerText = ez.toFixed(1);
  document.getElementById('t1').innerText = t1.toFixed(2);
  document.getElementById('t2').innerText = t2.toFixed(2);
  document.getElementById('cover-main').innerText = cover.toFixed(2);

  document.getElementById('result').style.display = 'block';

  // 保存到【当前用户自己】的历史
  let history = loadMyHistory();
  history.push({
    time: new Date().toLocaleTimeString(),
    angle, speed, rx, ry, rz, ex, ey, ez, t1, t2, cover
  });
  saveMyHistory(history);
  renderHistory();
}

// 渲染【仅当前用户】的记录
function renderHistory() {
  if (!currentUser) return;
  const el = document.getElementById("hlist");
  el.innerHTML = "";
  let history = loadMyHistory();
  history.forEach(h => {
    const div = document.createElement("div");
    div.className = "hitem";
    div.innerHTML = `
      ${h.time}<br>
      \u89D2\u5EA6:${h.angle.toFixed(2)}° \u901F\u5EA6:${h.speed.toFixed(2)}m/s<br>
      \u906E\u853D:<span>${h.cover.toFixed(2)}s</span>
    `;
    el.appendChild(div);
  });
}

// 清空【仅当前用户】的记录
function clearHistory() {
  saveMyHistory([]);
  renderHistory();
}
