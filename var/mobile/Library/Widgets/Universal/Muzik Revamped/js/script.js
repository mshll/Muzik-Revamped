/* 
    MUZIK REVAMPED JS SCRIPT.
    - MESHAL (contact@mshl.me)
*/
var scrobbleColorLeft = "#fff";
var scrobbleColorRight = "#eee";

const stitle = document.querySelector(".song-title");
const sdetails = document.querySelector(".song-details");
const sapp = document.querySelector(".song-app");
const artwork = document.querySelector(".artwork");
const play = document.getElementById("play");

function onload() {
	// Setup user config
	setUpConfig();

	// Configure callback
	api.media.observeData(function (newData) {
		if (config.hideWidget) {
			document.getElementById("widget-content").style.display = newData.isStopped ? "none" : "block";
		}

		sapp.innerHTML = newData.nowPlayingApplication.name;
		stitle.innerHTML = newData.isStopped ? "" : newData.nowPlaying.title;

		// Custom song details based on user config
		const sep = " &mdash; ";
		var str = "";
		const subOptions = [newData.nowPlaying.album, newData.nowPlaying.artist, newData.nowPlaying.genre];
		config.subtitle.forEach((el, idx, arr) => {
			if (idx === arr.length - 1) {
				str += subOptions[Number(el)];
			} else {
				str += subOptions[Number(el)] + sep;
			}
		});
		sdetails.innerHTML = newData.isStopped ? "" : str;
		if (config.subtitle.length < 1) {
			sdetails.style.setProperty("display", "none");
		}

		artwork.src = newData.isStopped ? "images/noalbumart.png" : "file:///var/mobile/Documents/Artwork.jpg?" + new Date().getTime();
		// artwork.src = newData.nowPlaying.artwork.length > 0 ? newData.nowPlaying.artwork : "xui://resource/default/media/no-artwork.svg";

		// Update play icon and artwork size
		if (newData.isPlaying) {
			play.classList.remove("fa-play");
			play.classList.add("fa-pause");
			artwork.style = "-webkit-transform: scale(1, 1)";
		} else {
			play.classList.add("fa-play");
			play.classList.remove("fa-pause");
			artwork.style = "-webkit-transform: scale(0.9, 0.9)";
		}

		// Update volume slider position
		handleVolume(newData.volume);

		// Update elapsed/length state
		document.getElementById("seekbar").setAttribute("max", api.media.nowPlaying.length);
		handleTrackTimes(newData.nowPlaying.elapsed, newData.nowPlaying.length);

		// Vibrant
		// Vibrant.from(artwork.src).getPalette(function (err, palette) {
		// 	const clrs = [palette.Vibrant.getRgb(), palette.Muted.getRgb(), palette.DarkMuted.getRgb()];
		// 	const color1 = "rgba(" + clrs[0][0] + ", " + clrs[0][1] + ", " + clrs[0][2] + ", 0.75)";
		// 	const color2 = "rgba(" + clrs[1][0] + ", " + clrs[1][1] + ", " + clrs[1][2] + ", 1)";
		// 	const color3 = "rgba(" + clrs[2][0] + ", " + clrs[2][1] + ", " + clrs[2][2] + ", 1)";
		// 	// document.querySelector(".content").style.background = color1;
		// 	document.documentElement.style.setProperty("--color1", color1);
		// 	document.documentElement.style.setProperty("--color2", color2);
		// 	document.documentElement.style.setProperty("--color3", color3);
		// 	scrobbleColorLeft = color2;
		// 	scrobbleColorRight = color3;
		// });

		function changeColors() {
			// color-thief
			const colorThief = new ColorThief();
			const clrs = colorThief.getPalette(artwork, 3);
			const opac = config.noBlur ? "1" : "0.75";
			const color1 = "rgba(" + clrs[0][0] + ", " + clrs[0][1] + ", " + clrs[0][2] + ", " + opac + ")";
			const color2 = "rgba(" + clrs[1][0] + ", " + clrs[1][1] + ", " + clrs[1][2] + ", 1)";
			const color3 = "rgba(" + clrs[2][0] + ", " + clrs[2][1] + ", " + clrs[2][2] + ", 1)";

			// document.querySelector(".content").style.background = color1;
			document.documentElement.style.setProperty("--color1", color1);
			document.documentElement.style.setProperty("--color2", color2);
			document.documentElement.style.setProperty("--color3", color3);
			scrobbleColorLeft = color2;
			scrobbleColorRight = color3;
		}

		// APPLY CUSTOM COLORS IF USER CHOSE TO
		if (config.useCustom) {
			document.documentElement.style.setProperty("--color1", config.clr1);
			document.documentElement.style.setProperty("--color2", config.clr2);
			document.documentElement.style.setProperty("--color3", config.clr3);
		} else {
			artwork.addEventListener("load", function () {
				changeColors();
			});
		}
	});

	// Elapsed time observer
	api.media.observeElapsedTime(function (newElapsedTime) {
		handleTrackTimes(newElapsedTime, api.media.nowPlaying.length);
	});

	// Set initial volume slider position
	handleVolume(api.media.volume);
}

function setUpConfig() {
	if (config.hideControls) {
		document.querySelector(".controls").style.setProperty("display", "none");
	}
	document.documentElement.style.setProperty("--width", config.width);
	document.documentElement.style.setProperty("--height", config.height);
	document.documentElement.style.setProperty("--fsize", config.fsize);

	var blocks = [document.querySelector(".song-slider"), document.querySelector(".volume-slider")];
	config.wblocks.forEach((el, idx) => {
		blocks[Number(el)].style.setProperty("order", idx);
		blocks[Number(el)].style.setProperty("display", "flex");
	});

	if (config.noBlur) {
		document.getElementById("widget-content").classList.remove("blur");
	}

	if (config.hideAppName) {
		document.querySelector(".song-app").style.setProperty("display", "none");
	}
}

function togglePlay() {
	play.classList.toggle("fa-play");
	play.classList.toggle("fa-pause");
	if (play.classList.contains("fa-pause")) {
		artwork.style = "-webkit-transform: scale(1, 1)";
	} else {
		artwork.style = "-webkit-transform: scale(0.9, 0.9)";
	}
	window.location = api.media.togglePlayPause();
}

function handleTrackTimes(elapsed, length) {
	const elapsedContent = length === 0 ? "--:--" : secondsToFormatted(elapsed);
	document.getElementById("current-length").innerHTML = elapsedContent;

	const lengthContent = length === 0 ? "--:--" : secondsToFormatted(length);
	document.getElementById("song-length").innerHTML = lengthContent;

	const scrobble = document.getElementById("seekbar");
	scrobble.setAttribute("max", length);
	scrobble.value = elapsed;
	var value = ((scrobble.value - scrobble.min) / (scrobble.max - scrobble.min)) * 100;
	scrobble.style.background = "linear-gradient(to right, var(--color2) 0%, var(--color2) " + value + "%, var(--color3) " + value + "%, var(--color3) 100%)";
}

function handleVolume(level) {
	const volbar = document.getElementById("volbar");
	volbar.value = level;
	volbar.style.background = "linear-gradient(to right, var(--color2) 0%, var(--color2) " + volbar.value + "%, var(--color3) " + volbar.value + "%, var(--color3) 100%)";
}

// Open app on artwork click
function openApp() {
	const apps = ["music://", "spotify://", "youtube://", "pcast://", "soundcloud://"];
	window.location = apps[config.chosenApp];
}

// Generates a formatted time for the seconds specified
function secondsToFormatted(seconds) {
	if (seconds === 0) return "0:00";
	const isNegative = seconds < 0;
	if (isNegative) return "0:00";
	seconds = Math.abs(seconds);
	const hours = Math.floor(seconds / 60 / 60);
	const minutes = Math.floor(seconds / 60) - hours * 60;
	const secs = Math.floor(seconds - minutes * 60 - hours * 60 * 60);
	if (hours > 0) {
		return hours + ":" + (minutes < 10 ? "0" : "") + minutes + ":" + (secs < 10 ? "0" : "") + secs;
	} else {
		return minutes + ":" + (secs < 10 ? "0" : "") + secs;
	}
}

function onVolumeChanged(input) {
	api.media.setVolume(input);
}

/**
 * Called by the scrobble hidden slider whilst the user is interacting with it
 * @param {string} input New value
 */
function onScrobbleUIChanged(input) {
	// window.alert("onscrobbleui");
	// Update progress bar only, the scrobble slider is already in position
	handleTrackTimes(input, api.media.nowPlaying.length);
}

/**
 * Called by the scrobble hidden slider when the user finishes interacting with it
 * @param {string} input New value
 */
function onScrobbleChanged(input) {
	api.media.seekToPosition(input); // set at this position
	handleTrackTimes(input, api.media.nowPlaying.length);
}
