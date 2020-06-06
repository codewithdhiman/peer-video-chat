let Peer = require('simple-peer');
let socket = io();
const video = document.querySelector('video');
let client = {}

navigator.mediaDevices.getUserMedia({ video: true, audio: true })
	.then( stream => {
		socket.emit('NewClient');
		if ('srcObject' in video) {
			video.srcObject = stream;
		} else {
			video.src = window.URL.createObjectURL(stream);
		}
		video.play();
		
		const initPeer = type => {
			let peer = new Peer({
				initiator: (type === 'init') ? true : false,
				stream,
				trickle: false
			});
			
			peer.on('stream', stream => {
				createVideo(stream);
			});
			
			peer.on('close', () => {
				document.getElementById('peerVideos').remove();
				peer.destroy();
			});
			return peer;
		};
		
		const makePeer = () => {
			client.gotAnswer = false;
			let peer = initPeer('init');
			peer.on('signal', data => {
				if (!client.gotAnswer) {
					socket.emit('Offer', data);
				}
			});
			client.peer = peer;
		};
		
		const frontAnswer = offer => {
			let peer = initPeer('notInit');
			peer.on('signal', data => {
				socket.emit('Answer', data);
			});
			peer.signal(offer);
		};
		
		const signalAnswer = answer => {
			client.gotAnswer = true;
			let peer = client.peer;
			peer.signal(answer);
		};
		
		const createVideo = stream => {
			let video = document.createElement('video');
			video.id = 'peerVideo';
			if ('srcObject' in video) {
				video.srcObject = stream;
			} else {
				video.src = window.URL.createObjectURL(stream);
			}
			document.querySelector('#peerVideos').appendChild(video);
			video.play();
		};
		
		const sessionActive = () => {
			document.write('Session Active. Please come back later!');
		};
		
		socket.on('BackOffer', frontAnswer);
		socket.on('BackAnswer', signalAnswer);
		socket.on('SessionActive', sessionActive);
		socket.on('CreatePeer', makePeer);
	})
	.catch( err => document.write(err));