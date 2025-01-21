document.getElementById('startBtn').addEventListener('click', function() {
    const streamkey = document.getElementById('streamkey').value;
    const video = document.getElementById('video').value;
    
    if (streamkey && video) {
      fetch('/start-stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ streamkey, video })
      })
      .then(response => response.json())
      .then(data => {
        console.log('Streaming started');
        document.getElementById('startBtn').style.display = 'none';
        document.getElementById('stopBtn').style.display = 'inline-block';
      })
      .catch(error => console.error('Error starting stream:', error));
    } else {
      alert('Please provide stream key and video filename.');
    }
  });
  
  document.getElementById('stopBtn').addEventListener('click', function() {
    fetch('/stop-stream', { method: 'POST' })
    .then(response => response.json())
    .then(data => {
      console.log('Streaming stopped');
      document.getElementById('startBtn').style.display = 'inline-block';
      document.getElementById('stopBtn').style.display = 'none';
    })
    .catch(error => console.error('Error stopping stream:', error));
  });
  