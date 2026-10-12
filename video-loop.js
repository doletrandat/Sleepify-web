(function () {
  var video = document.querySelector('.product-video video');
  if (!video) return;

  var source = video.querySelector('source');
  var connection = navigator.connection;
  var useMobile = window.matchMedia('(max-width: 760px)').matches ||
    (connection && (connection.saveData || /^(slow-2g|2g|3g)$/.test(connection.effectiveType)));
  var mobileSource = video.getAttribute('data-mobile-src');
  var selectedSource = useMobile && mobileSource ? new URL(mobileSource, document.baseURI).href : source.src;
  var nativeSource = video.getAttribute('data-native-src');
  var mime = 'video/mp4; codecs="avc1.640028"';

  function play() {
    video.play().catch(function () {});
  }

  function nativePlayback() {
    video.autoplay = true;
    video.preload = 'auto';
    video.loop = true;
    // Ordinary fast-start MP4 exposes duration immediately on native-only players.
    video.src = nativeSource ? new URL(nativeSource, document.baseURI).href : selectedSource;
    video.load();
    play();
  }

  if (!window.MediaSource || !MediaSource.isTypeSupported(mime) || !window.fetch) {
    nativePlayback();
    return;
  }

  // Stream the first cycle, then replay the cached bytes on the same timeline without seeking.
  var mediaSource = new MediaSource();
  var objectURL = URL.createObjectURL(mediaSource);
  var controller = window.AbortController ? new AbortController() : null;
  var sourceBuffer;
  var queue = [];
  var parts = [];
  var byteLength = 0;
  var clip;
  var downloadComplete = false;
  var cycleDuration;
  var started = false;
  var failed = false;

  function fallback() {
    if (failed) return;
    failed = true;
    if (controller) controller.abort();
    queue = [];
    parts = [];
    clip = null;
    video.removeEventListener('timeupdate', fillBuffer);
    video.removeEventListener('error', fallback);
    nativePlayback();
    URL.revokeObjectURL(objectURL);
  }

  function startWhenReady() {
    if (failed || started || !sourceBuffer.buffered.length) return;
    var end = sourceBuffer.buffered.end(sourceBuffer.buffered.length - 1);
    // A small head start reduces stalls without waiting for the entire download.
    if (end - video.currentTime >= 1 || (downloadComplete && !queue.length)) {
      started = true;
      video.autoplay = true;
      play();
    }
  }

  function fillBuffer() {
    if (failed || !sourceBuffer || sourceBuffer.updating || mediaSource.readyState !== 'open') return;
    try {
      if (queue.length) {
        sourceBuffer.appendBuffer(queue.shift());
        return;
      }
      if (!downloadComplete) return;

      var ranges = sourceBuffer.buffered;
      var end = ranges.length ? ranges.end(ranges.length - 1) : 0;
      // Only measure the cycle after all first-pass fragments have been appended.
      if (!cycleDuration) {
        if (!end) throw new Error('Video contains no playable frames');
        cycleDuration = end;
      }

      // Retain one previous cycle and two cycles ahead, keeping memory bounded.
      var trimTo = Math.floor(video.currentTime / cycleDuration - 1) * cycleDuration;
      if (ranges.length && trimTo > ranges.start(0) + 0.001) {
        sourceBuffer.remove(0, trimTo);
      } else if (end - video.currentTime < cycleDuration * 2) {
        sourceBuffer.appendBuffer(clip);
      }
    } catch (error) {
      fallback();
    }
  }

  function finishDownload() {
    if (!byteLength) throw new Error('Video download is empty');
    var bytes = new Uint8Array(byteLength);
    var offset = 0;
    parts.forEach(function (part) {
      bytes.set(part, offset);
      offset += part.byteLength;
    });
    clip = bytes.buffer;
    parts = [];
    downloadComplete = true;
    fillBuffer();
  }

  function download(response) {
    if (!response.ok) throw new Error('Video load failed');
    if (!response.body || !response.body.getReader) {
      return response.arrayBuffer().then(function (data) {
        if (failed) return;
        var bytes = new Uint8Array(data);
        parts.push(bytes);
        byteLength = bytes.byteLength;
        queue.push(bytes);
        finishDownload();
      });
    }

    var reader = response.body.getReader();
    function read() {
      return reader.read().then(function (result) {
        if (failed) return;
        if (result.done) {
          finishDownload();
          return;
        }
        parts.push(result.value);
        byteLength += result.value.byteLength;
        queue.push(result.value);
        fillBuffer();
        return read();
      });
    }
    return read();
  }

  mediaSource.addEventListener('sourceopen', function () {
    if (sourceBuffer || failed) return;
    try {
      sourceBuffer = mediaSource.addSourceBuffer(mime);
      sourceBuffer.mode = 'sequence';
      sourceBuffer.addEventListener('error', fallback);
      sourceBuffer.addEventListener('updateend', function () {
        if (failed) return;
        startWhenReady();
        fillBuffer();
      });
      fetch(selectedSource, controller ? { signal: controller.signal } : undefined)
        .then(download).catch(fallback);
    } catch (error) {
      fallback();
    }
  });

  video.addEventListener('timeupdate', fillBuffer);
  video.addEventListener('error', fallback);
  video.loop = false;
  video.src = objectURL;
})();
