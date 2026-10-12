(function () {
  var preview = document.querySelector('.intro-video-preview');
  if (!preview) return;
  var container = preview.parentElement;
  var loading = false;

  preview.addEventListener('click', function (event) {
    // Preserve opening the hosted player in a new tab, and the normal link without JavaScript.
    if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey || event.button) return;
    event.preventDefault();
    if (loading) return;
    loading = true;
    preview.setAttribute('aria-busy', 'true');
    preview.querySelector('.intro-video-label').textContent = 'Đang tải video…';

    var frame = document.createElement('iframe');
    frame.title = 'Video giới thiệu Sleepify';
    frame.allow = 'accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture; fullscreen';
    frame.allowFullscreen = true;
    frame.addEventListener('load', function () {
      container.classList.add('is-loaded');
      preview.remove();
      frame.focus();
    }, { once: true });
    frame.src = preview.href;
    container.appendChild(frame);
  });
})();
