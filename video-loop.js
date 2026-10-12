(function () {
  var video = document.querySelector('.product-video video');
  var mime = 'video/mp4; codecs="avc1.640028"';
  if (!video || !window.MediaSource || !MediaSource.isTypeSupported(mime)) return;

  // Append the next cycle on one continuous timeline, avoiding a decoder seek at the seam.
  var originalSource = video.querySelector('source').src;
  var mediaSource = new MediaSource();
  var objectURL = URL.createObjectURL(mediaSource);
  var sourceBuffer;
  var clip;
  var cycleDuration;
  var failed = false;

  function play() {
    video.play().catch(function () {});
  }

  function fallback() {
    if (failed) return;
    failed = true;
    video.removeEventListener('timeupdate', fillBuffer);
    video.removeEventListener('error', fallback);
    video.loop = true;
    video.src = originalSource;
    URL.revokeObjectURL(objectURL);
    video.load();
    play();
  }

  function fillBuffer() {
    if (failed || !clip || !sourceBuffer || sourceBuffer.updating || mediaSource.readyState !== 'open') return;
    try {
      var ranges = sourceBuffer.buffered;
      var end = ranges.length ? ranges.end(ranges.length - 1) : 0;
      if (!cycleDuration && end > 0) cycleDuration = end;

      // Keep one previous cycle for decoding and two cycles ahead, with bounded memory.
      var trimTo = cycleDuration ? Math.floor(video.currentTime / cycleDuration - 1) * cycleDuration : 0;
      if (ranges.length && trimTo > ranges.start(0) + 0.001) {
        sourceBuffer.remove(0, trimTo);
      } else if (!end || end - video.currentTime < cycleDuration * 2) {
        sourceBuffer.appendBuffer(clip);
      }
    } catch (error) {
      fallback();
    }
  }

  mediaSource.addEventListener('sourceopen', function () {
    if (sourceBuffer || failed) return;
    try {
      sourceBuffer = mediaSource.addSourceBuffer(mime);
      sourceBuffer.mode = 'sequence';
      sourceBuffer.addEventListener('error', fallback);
      sourceBuffer.addEventListener('updateend', function () {
        fillBuffer();
        if (!failed && video.paused && sourceBuffer.buffered.length) play();
      });
      fetch(originalSource).then(function (response) {
        if (!response.ok) throw new Error('Video load failed');
        return response.arrayBuffer();
      }).then(function (data) {
        clip = data;
        fillBuffer();
      }).catch(fallback);
    } catch (error) {
      fallback();
    }
  });

  video.addEventListener('timeupdate', fillBuffer);
  video.addEventListener('error', fallback);
  video.loop = false;
  video.src = objectURL;
})();
