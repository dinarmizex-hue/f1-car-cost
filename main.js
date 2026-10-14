// Сколько стоит болид Формулы-1: движение страницы.
// Всё содержимое видно и без этого файла; скрипт только добавляет появление схем,
// счёт цифр, полосу прогресса (где нет CSS scroll-timeline) и подсветку раздела в боковой навигации.
(function () {
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // 1. Появление схем и фото при входе в экран - один раз.
  var reveals = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && !reduce) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.classList.add('in');
        var num = e.target.querySelector('[data-count]');
        if (num) countUp(num);
        io.unobserve(e.target);
      });
    }, { rootMargin: '0px 0px -12% 0px', threshold: 0.12 });
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add('in'); });
  }

  // 2. Счёт цифры от нуля до итога. Итоговая строка в разметке не меняется - её читает поиск и экранный диктор.
  function countUp(el) {
    if (reduce || el.dataset.done) return;
    el.dataset.done = '1';
    // числовая часть - от первой до последней цифры подряд; хвост («млн $», « $») сохраняется как есть
    var target = +el.dataset.count, final = el.textContent, m = final.match(/^(\d[\d\s  ]*\d|\d)([\s\S]*)$/);
    if (!m) return;
    var suffix = m[2];
    var t0 = performance.now(), dur = 1300;
    el.setAttribute('aria-label', final);
    function fmt(n) { return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' '); }
    function frame(t) {
      var p = Math.min(1, (t - t0) / dur), k = 1 - Math.pow(1 - p, 4);
      el.textContent = p < 1 ? fmt(Math.round(target * k)) + suffix : final;
      if (p < 1) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }
  document.querySelectorAll('.hero [data-count]').forEach(countUp);

  // 3. Полоса прогресса там, где браузер не умеет animation-timeline (Firefox, старый Safari).
  if (!(window.CSS && CSS.supports('animation-timeline: scroll()'))) {
    var bar = document.querySelector('.progress span'), ticking = false;
    var update = function () {
      var h = document.documentElement.scrollHeight - innerHeight;
      bar.style.transform = 'scaleX(' + (h > 0 ? Math.min(1, scrollY / h) : 0) + ')';
      ticking = false;
    };
    addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
    update();
  }

  // 4. Подсветка текущего раздела в боковой навигации.
  var links = {};
  document.querySelectorAll('.rail a').forEach(function (a) { links[a.getAttribute('href').slice(1)] = a; });
  // Текущий раздел - последний заголовок, ушедший выше трети экрана; выше первого - ни один.
  var heads = Array.prototype.slice.call(document.querySelectorAll('.prose h2[id], .sources[id]'));
  if ('IntersectionObserver' in window && heads.length) {
    var cur = null;
    var pick = function () {
      var line = innerHeight * 0.3, found = null;
      heads.forEach(function (h) { if (h.getBoundingClientRect().top < line) found = h; });
      var a = found ? links[found.id] : null;
      if (a === cur) return;
      if (cur) cur.classList.remove('on');
      cur = a; if (cur) cur.classList.add('on');
    };
    var spy = new IntersectionObserver(pick, { rootMargin: '0px 0px -70% 0px' });
    heads.forEach(function (h) { spy.observe(h); });
  }
})();
