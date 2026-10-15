(function () {
  "use strict";
  var D = window.DATA;
  var app = document.getElementById("app");

  /* ---------- storage (safe) ---------- */
  var store = {
    get: function (k, def) { try { var v = localStorage.getItem("srk:" + k); return v == null ? def : JSON.parse(v); } catch (e) { return def; } },
    set: function (k, v) { try { localStorage.setItem("srk:" + k, JSON.stringify(v)); } catch (e) {} }
  };

  /* ---------- helpers ---------- */
  function h(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function shuffle(a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function pct(n, d) { return d ? Math.round(100 * n / d) : 0; }

  /* ---------- theme ---------- */
  var root = document.documentElement;
  var savedTheme = store.get("theme", null);
  if (savedTheme) root.setAttribute("data-theme", savedTheme);
  document.getElementById("themeBtn").addEventListener("click", function () {
    var dark = root.getAttribute("data-theme") === "dark" ||
      (!root.getAttribute("data-theme") && window.matchMedia("(prefers-color-scheme: dark)").matches);
    var next = dark ? "light" : "dark";
    root.setAttribute("data-theme", next); store.set("theme", next);
  });

  /* ---------- block renderer ---------- */
  function renderBlocks(blocks) {
    return blocks.map(function (b) {
      switch (b.t) {
        case "p": return "<p>" + b.v + "</p>";
        case "h": return "<h3>" + b.v + "</h3>";
        case "ul": return "<ul>" + b.v.map(function (x) { return "<li>" + x + "</li>"; }).join("") + "</ul>";
        case "ol": return "<ol>" + b.v.map(function (x) { return "<li>" + x + "</li>"; }).join("") + "</ol>";
        case "note": return '<div class="note">' + b.v + "</div>";
        case "warn": return '<div class="warn">⚠️ ' + b.v + "</div>";
        case "img": return '<figure><img src="' + b.src + '" alt="' + h(b.cap || "") + '" loading="lazy"><figcaption>' + h(b.cap || "") + "</figcaption></figure>";
        case "imgs": return '<div class="imgs">' + b.items.map(function (i) {
          return '<figure><img src="' + i.src + '" alt="' + h(i.cap) + '" loading="lazy"><figcaption>' + h(i.cap) + "</figcaption></figure>";
        }).join("") + "</div>";
        case "table":
          return '<div class="tablewrap"><table><thead><tr>' + b.head.map(function (x) { return "<th>" + x + "</th>"; }).join("") +
            "</tr></thead><tbody>" + b.rows.map(function (r) {
              return "<tr>" + r.map(function (c) { return "<td>" + c + "</td>"; }).join("") + "</tr>";
            }).join("") + "</tbody></table></div>";
      }
      return "";
    }).join("");
  }

  /* ---------- views ---------- */
  function viewHome() {
    var best = store.get("best", null);
    var clDone = D.checklists.filter(function (c) { var s = store.get("cl:" + c.id, []); return s.length === c.items.length; }).length;
    var ecgImgs = D.imageQuiz.length;
    return '<div class="fade">' +
      '<section class="hero"><h1>СРК и СЛР: конспект и тесты</h1>' +
      "<p>Специализированный реанимационный комплекс, СЛР у детей, техники манипуляций, видео и проверка знаний — всё в одном месте.</p>" +
      '<div class="btns"><a class="btn light" href="#/quiz">Пройти тест</a><a class="btn ghost" style="color:#fff;border-color:rgba(255,255,255,.5)" href="#/theory">Читать теорию</a></div>' +
      '<svg viewBox="0 0 800 100" preserveAspectRatio="none" aria-hidden="true"><path d="M0 60h120l16-40 22 80 20-60 14 20h140l16-40 22 80 20-60 14 20h140l16-40 22 80 20-60 14 20h96" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg></section>' +
      '<div class="stats">' +
      '<div class="card stat"><b>' + D.theory.length + '</b><span>тем в теории</span></div>' +
      '<div class="card stat"><b>' + (D.quiz.length + ecgImgs * 2) + '</b><span>вопросов в тесте</span></div>' +
      '<div class="card stat"><b>' + (best ? best + "%" : "—") + '</b><span>лучший результат</span></div>' +
      '<div class="card stat"><b>' + clDone + "/" + D.checklists.length + '</b><span>чек-листов выполнено</span></div></div>' +
      '<div class="section-title"><h2>Разделы</h2></div><div class="grid">' +
      tile("#/theory", "📖", "Теория", D.theory.length + " тем: СРК, ритмы, СЛР, дефибрилляция") +
      tile("#/videos", "▶️", "Видео", "Подборка роликов на YouTube по манипуляциям") +
      tile("#/checklists", "☑️", "Чек-листы", "Интерактивные списки для отработки навыков") +
      tile("#/quiz", "🎯", "Тест", "Вопросы по темам и распознавание ЭКГ по фото") +
      "</div>" +
      '<p class="foot">Учебный материал по методичке практических занятий №3 и №4. Не заменяет действующие клинические рекомендации и указания преподавателя.</p></div>';
  }
  function tile(href, ic, t, s) { return '<a class="card tile" href="' + href + '"><span class="ic">' + ic + "</span><b>" + t + "</b><small>" + s + "</small></a>"; }

  function viewTheoryList() {
    var seen = store.get("seen", []);
    return '<div class="fade"><h1>Теория</h1><p class="lead">Выберите тему. Прочитанные отмечаются галочкой.</p><div class="grid">' +
      D.theory.map(function (t) {
        var ok = seen.indexOf(t.id) >= 0;
        return '<a class="card tile" href="#/theory/' + t.id + '"><span class="ic">' + t.icon + "</span><b>" + t.title + (ok ? " ✓" : "") + "</b><small>" + t.lead + "</small></a>";
      }).join("") + "</div></div>";
  }

  function viewTheory(id) {
    var i = D.theory.findIndex(function (t) { return t.id === id; });
    if (i < 0) return viewTheoryList();
    var t = D.theory[i], seen = store.get("seen", []);
    if (seen.indexOf(id) < 0) { seen.push(id); store.set("seen", seen); }
    var prev = D.theory[i - 1], next = D.theory[i + 1];
    return '<div class="fade"><div class="crumbs"><a href="#/theory">Теория</a> / ' + t.title + "</div>" +
      "<h1>" + t.icon + " " + t.title + '</h1><p class="lead">' + t.lead + "</p>" +
      '<div class="prose">' + renderBlocks(t.blocks) + "</div>" +
      '<div class="pager">' + (prev ? '<a class="btn ghost" href="#/theory/' + prev.id + '">← ' + prev.title + "</a>" : "<span></span>") +
      (next ? '<a class="btn" href="#/theory/' + next.id + '">' + next.title + " →</a>" : '<a class="btn" href="#/quiz">К тесту →</a>') + "</div></div>";
  }

  function viewVideos() {
    return '<div class="fade"><h1>Видео</h1>' +
      '<p class="lead">Подборка роликов YouTube по темам. Ссылки открываются на YouTube. Перед использованием сверяйте алгоритм с вашей методичкой: рекомендации обновляются.</p>' +
      D.videos.map(function (g) {
        return '<section class="vgroup"><div class="section-title"><h2>' + g.group + '</h2></div><div class="vgrid">' +
          g.items.map(function (v) {
            return '<a class="card vcard" href="https://www.youtube.com/watch?v=' + v.id + '" target="_blank" rel="noopener noreferrer">' +
              '<div class="thumb"><img loading="lazy" alt="" src="https://i.ytimg.com/vi/' + v.id + '/mqdefault.jpg"><em>' + v.d + "</em></div>" +
              '<div class="meta"><b>' + h(v.t) + "</b><small>" + h(v.s) + "</small></div></a>";
          }).join("") + "</div></section>";
      }).join("") + "</div>";
  }

  function viewChecklists() {
    return '<div class="fade"><h1>Чек-листы</h1><p class="lead">Отмечайте шаги по мере отработки. Прогресс сохраняется на этом устройстве.</p>' +
      D.checklists.map(function (c) {
        var st = store.get("cl:" + c.id, []);
        return '<details class="card cl" data-id="' + c.id + '"><summary><b>' + h(c.title) + '</b><span class="pill' + (st.length === c.items.length ? " done" : "") + '">' +
          st.length + "/" + c.items.length + "</span></summary>" +
          '<div class="bar" style="margin:0 18px"><i style="width:' + pct(st.length, c.items.length) + '%"></i></div><ul>' +
          c.items.map(function (it, k) {
            return '<li><label><input type="checkbox" data-k="' + k + '"' + (st.indexOf(k) >= 0 ? " checked" : "") + "><span>" + (k + 1) + ". " + h(it) + "</span></label></li>";
          }).join("") + '</ul><div style="padding:0 18px 16px"><button class="btn ghost" data-reset="' + c.id + '">Сбросить</button></div></details>';
      }).join("") + "</div>";
  }
  function bindChecklists() {
    app.querySelectorAll(".cl").forEach(function (el) {
      var c = D.checklists.find(function (x) { return x.id === el.getAttribute("data-id"); });
      function refresh() {
        var st = [];
        el.querySelectorAll("input").forEach(function (i) { if (i.checked) st.push(+i.getAttribute("data-k")); });
        store.set("cl:" + c.id, st);
        var p = el.querySelector(".pill");
        p.textContent = st.length + "/" + c.items.length;
        p.classList.toggle("done", st.length === c.items.length);
        el.querySelector(".bar i").style.width = pct(st.length, c.items.length) + "%";
      }
      el.addEventListener("change", refresh);
      el.querySelector("[data-reset]").addEventListener("click", function () {
        el.querySelectorAll("input").forEach(function (i) { i.checked = false; }); refresh();
      });
    });
  }

  /* ---------- quiz ---------- */
  var Q = null; // active quiz state

  function imageQuestions() {
    var out = [];
    D.imageQuiz.forEach(function (it) {
      var others = shuffle(D.imageQuiz.filter(function (x) { return x.id !== it.id; })).map(function (x) { return x.name; }).slice(0, 3);
      out.push({ t: "ЭКГ", img: it.img, q: "Что показано на ЭКГ?", o: [it.name].concat(others), a: 0,
        e: it.name + ". " + it.hint + " " + (it.shock ? "Ритм подлежит дефибрилляции." : "Ритм не подлежит дефибрилляции.") });
      out.push({ t: "ЭКГ", img: it.img, q: "Подлежит ли этот ритм дефибрилляции?", o: ["Да, нужен разряд", "Нет, разряд не показан"], a: it.shock ? 0 : 1, fixed: true,
        e: it.name + ". " + (it.shock ? "Shockable: ФЖ и ЖТ без пульса." : "Non-shockable: асистолия и БЭА — СЛР и адреналин.") });
    });
    return out;
  }
  function allQuestions() { return D.quiz.concat(imageQuestions()); }
  function topics() {
    var m = {}; allQuestions().forEach(function (q) { m[q.t] = (m[q.t] || 0) + 1; }); return m;
  }

  function startQuiz(list) {
    var qs = shuffle(list).map(function (q) {
      var idx = q.o.map(function (_, i) { return i; });
      if (!q.fixed) idx = shuffle(idx);
      return { src: q, order: idx, a: idx.indexOf(q.a), picked: null };
    });
    Q = { qs: qs, i: 0 };
    renderQuiz();
  }

  function viewQuizMenu() {
    var mist = store.get("mistakes", []);
    var tp = topics();
    return '<div class="fade"><h1>Тест</h1><p class="lead">Ответ проверяется сразу, после — пояснение. Вопросы и варианты перемешиваются.</p>' +
      '<div class="grid">' +
      '<button class="card tile" data-quiz="mix">🎲<b>Случайные 20</b><small>Из всех тем, включая ЭКГ</small></button>' +
      '<button class="card tile" data-quiz="ecg">📈<b>ЭКГ по фото</b><small>Асистолия, ФЖ, ЖТ, БЭА + «шокируемый ли»</small></button>' +
      '<button class="card tile" data-quiz="all">📚<b>Все вопросы</b><small>' + allQuestions().length + " вопросов</small></button>" +
      '<button class="card tile" data-quiz="mist"' + (mist.length ? "" : " disabled") + '>🔁<b>Работа над ошибками</b><small>' + (mist.length ? mist.length + " вопросов" : "пока пусто") + "</small></button></div>" +
      '<div class="section-title"><h2>По темам</h2></div><div class="chips">' +
      Object.keys(tp).map(function (k) { return '<button class="chip" data-topic="' + h(k) + '">' + h(k) + " · " + tp[k] + "</button>"; }).join("") + "</div></div>";
  }
  function bindQuizMenu() {
    app.querySelectorAll("[data-quiz]").forEach(function (b) {
      b.addEventListener("click", function () {
        var m = b.getAttribute("data-quiz"), all = allQuestions();
        if (m === "mix") startQuiz(shuffle(all).slice(0, 20));
        else if (m === "ecg") startQuiz(imageQuestions());
        else if (m === "all") startQuiz(all);
        else if (m === "mist") {
          var ids = store.get("mistakes", []);
          var l = all.filter(function (q) { return ids.indexOf(q.q + "|" + (q.img || "")) >= 0; });
          startQuiz(l.length ? l : shuffle(all).slice(0, 10));
        }
      });
    });
    app.querySelectorAll("[data-topic]").forEach(function (b) {
      b.addEventListener("click", function () {
        var t = b.getAttribute("data-topic");
        startQuiz(allQuestions().filter(function (q) { return q.t === t; }));
      });
    });
  }

  function renderQuiz() {
    if (!Q) { app.innerHTML = viewQuizMenu(); bindQuizMenu(); return; }
    if (Q.i >= Q.qs.length) return renderResult();
    var cur = Q.qs[Q.i], s = cur.src, answered = cur.picked !== null;
    var letters = ["A", "Б", "В", "Г"];
    app.innerHTML = '<div class="fade"><div class="qhead"><span>Вопрос ' + (Q.i + 1) + " из " + Q.qs.length + "</span><span>" + h(s.t) + "</span></div>" +
      '<div class="bar"><i style="width:' + pct(Q.i, Q.qs.length) + '%"></i></div>' +
      '<div class="card" style="margin-top:14px"><h2>' + h(s.q) + "</h2>" +
      (s.img ? '<div class="qimg"><img src="' + s.img + '" alt="ЭКГ"></div>' : "") +
      cur.order.map(function (oi, pos) {
        var cls = "";
        if (answered) { if (pos === cur.a) cls = " ok"; else if (pos === cur.picked) cls = " bad"; }
        return '<button class="opt' + cls + '" data-pos="' + pos + '"' + (answered ? " disabled" : "") + '><span class="k">' + letters[pos] + "</span><span>" + h(s.o[oi]) + "</span></button>";
      }).join("") +
      (answered ? '<div class="explain"><b>' + (cur.picked === cur.a ? "✅ Верно" : "❌ Неверно") + "</b><br>" + h(s.e) + "</div>" +
        '<div class="pager"><span></span><button class="btn" id="nextQ">' + (Q.i + 1 >= Q.qs.length ? "Результат" : "Далее →") + "</button></div>" : "") +
      '</div><p style="text-align:center;margin-top:14px"><button class="btn ghost" id="quitQ">Выйти</button></p></div>';
    app.querySelectorAll(".opt").forEach(function (b) {
      b.addEventListener("click", function () {
        cur.picked = +b.getAttribute("data-pos");
        var ids = store.get("mistakes", []), key = s.q + "|" + (s.img || "");
        var at = ids.indexOf(key);
        if (cur.picked === cur.a) { if (at >= 0) ids.splice(at, 1); }
        else if (at < 0) ids.push(key);
        store.set("mistakes", ids);
        renderQuiz();
        var nx = document.getElementById("nextQ"); if (nx) nx.focus();
      });
    });
    var n = document.getElementById("nextQ");
    if (n) n.addEventListener("click", function () { Q.i++; renderQuiz(); window.scrollTo(0, 0); });
    document.getElementById("quitQ").addEventListener("click", function () { Q = null; renderQuiz(); });
  }

  function renderResult() {
    var ok = Q.qs.filter(function (q) { return q.picked === q.a; }).length, total = Q.qs.length, p = pct(ok, total);
    var best = store.get("best", 0); if (p > best) store.set("best", p);
    var wrong = Q.qs.filter(function (q) { return q.picked !== q.a; });
    var msg = p >= 90 ? "Отлично!" : p >= 70 ? "Хорошо, ещё чуть-чуть." : p >= 50 ? "Неплохо, повторите темы." : "Стоит перечитать теорию.";
    app.innerHTML = '<div class="fade"><div class="card" style="text-align:center"><div class="big">' + p + "%</div><h2>" + msg + "</h2><p class=\"lead\">Правильных ответов: " + ok + " из " + total + "</p>" +
      '<div class="btns" style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap"><button class="btn" id="again">Ещё раз</button><a class="btn ghost" href="#/theory">Теория</a></div></div>' +
      (wrong.length ? '<div class="section-title"><h2>Ошибки (' + wrong.length + ")</h2></div>" + wrong.map(function (q) {
        return '<div class="mist"><b>' + h(q.src.q) + "</b>" + (q.src.img ? '<div class="qimg" style="max-width:320px"><img src="' + q.src.img + '" alt="ЭКГ"></div>' : "") +
          "<br>Правильно: " + h(q.src.o[q.src.a]) + "<br><small>" + h(q.src.e) + "</small></div>";
      }).join("") : "") + "</div>";
    document.getElementById("again").addEventListener("click", function () { Q = null; renderQuiz(); });
  }

  /* ---------- router ---------- */
  function route() {
    var parts = (location.hash.replace(/^#\/?/, "") || "").split("/");
    var page = parts[0] || "home", html = "";
    if (page === "theory") html = parts[1] ? viewTheory(parts[1]) : viewTheoryList();
    else if (page === "videos") html = viewVideos();
    else if (page === "checklists") html = viewChecklists();
    else if (page === "quiz") { app.innerHTML = ""; Q = null; renderQuiz(); mark(page); window.scrollTo(0, 0); return; }
    else { page = "home"; html = viewHome(); }
    app.innerHTML = html;
    if (page === "checklists") bindChecklists();
    mark(page);
    window.scrollTo(0, 0);
  }
  function mark(page) {
    document.querySelectorAll("[data-nav]").forEach(function (a) { a.classList.toggle("on", a.getAttribute("data-nav") === page); });
  }
  window.addEventListener("hashchange", route);
  route();

  if ("serviceWorker" in navigator && location.protocol === "https:") { /* офлайн-режим не требуется */ }
})();
