var die, fade, format_time, fullscreen, get, hardcore, hardcore_mode, hide, input, is_ios, is_mac, keyFromCharCode, key_replace, kill, last_word, last_wpm, retry, run, session_length, shift_replace, show, start, start_time, stroke, tick, time_div, time_left, time_since_stroke, tock, track_outbound, update_clock, update_stats, valid_key_codes, valid_keys, win, won,
  indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

session_length = 5 * 60;

time_left = session_length;

time_since_stroke = 0;

time_div = document.getElementById('time');

input = document.getElementById('input');

hardcore = document.getElementById('hardcore');

run = false;

won = false;

tock = null;

start_time = 0;

last_wpm = 0;

last_word = 0;

is_ios = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;

is_mac = /Max|OS X/.test(navigator.userAgent) && !window.MSStream;

valid_keys = /Digit.|Key.|Space|Bracket.+|Enter|Semicolon|Quote|Backquote|Backslash|Comma|Period|Slash|Numpad.+/;

valid_key_codes = [13, 32, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 62, 63, 64, 65, 66, 67, 68, 69, 70, 71, 72, 73, 74, 75, 76, 77, 78, 79, 80, 81, 82, 83, 84, 85, 86, 87, 88, 89, 90, 186, 187, 188, 189, 190, 191, 222];

key_replace = {
  96: "0",
  97: "1",
  98: "2",
  99: "3",
  100: "4",
  101: "5",
  102: "6",
  103: "7",
  104: "8",
  105: "9",
  106: "*",
  107: "+",
  109: "-",
  110: ".",
  111: "/",
  186: ";",
  187: "=",
  188: ",",
  189: "-",
  190: ".",
  191: "/",
  222: "'"
};

shift_replace = {
  ",": "<",
  ".": ">",
  "/": "?",
  ";": ":",
  "'": "\"",
  "1": "!",
  "2": "@",
  "3": "#",
  "4": "$",
  "5": "%",
  "6": "^",
  "7": "&",
  "8": "*",
  "9": "(",
  "0": ")",
  "-": "_",
  "=": "+"
};

hardcore_mode = false;

kill = 60;

fade = 3;

format_time = function(time) {
  var dd;
  dd = function(time) {
    var result;
    result = '' + Math.floor(time);
    if (result.length === 1) {
      return '0' + result;
    } else {
      return result;
    }
  };
  return (dd(Math.floor(time / 60))) + ":" + (dd(time % 60));
};

update_clock = function() {
  return time_div.innerHTML = format_time(time_left);
};

update_stats = function() {
  var chars, words, wpm;
  chars = input.value.length;
  words = input.value.split(/\s+/).length - 1;
  if (words > last_word) {
    wpm = Math.floor(60 * words / (new Date().getTime() / 1000 - start_time));
    if (isNaN(wpm)) {
      wpm = 0;
    }
    last_wpm = wpm;
  } else {
    wpm = last_wpm;
  }
  last_word = words;
  return get('stats').innerHTML = chars + "c " + words + "w " + wpm + "wpm";
};

die = function() {
  var time, words;
  words = input.value.split(/\s+/).length - 1;
  time = format_time(session_length - time_left);
  input.value = '';
  input.disabled = true;
  input.placeholder = "";
  clearInterval(tock);
  run = false;
  get('tweet').href = "https://twitter.com/intent/tweet?text=I+wrote+" + words + "+words+in+" + time + "+minutes+-+and+then+I+died+using+The+Most+Dangerous+Writing+App+%23MDWA&url=http%3A%2F%2Fwww.themostdangerouswritingapp.com";
  get('tweet').innerHTML = "I wrote " + words + " words in " + time + " minutes - and then I died using The Most Dangerous Writing App #MDWA";
  show('die');
  show('logo');
  if (ga) {
    ga('send', 'event', 'Write', 'die', '', session_length - time_left);
    return ga('send', 'event', 'stats', 'words', 'die', words);
  }
};

win = function() {
  clearInterval(tock);
  run = false;
  won = true;
  if (hardcore_mode) {
    hide('hardcore');
    input.className = "";
  }
  show('win_button');
  show('save_button');
  hide('time');
  if (ga) {
    ga('send', 'event', 'Write', 'win', '', session_length);
    return ga('send', 'event', 'stats', 'words', 'win', input.value.split(/\s+/).length - 1);
  }
};

tick = function() {
  var perc;
  time_left -= 0.1;
  time_since_stroke += 0.1;
  update_clock();
  if (hardcore_mode) {
    hardcore.style.opacity = time_since_stroke > .1 ? 0 : 1;
  }
  if (!won && time_left <= 0) {
    return win();
  } else if (time_since_stroke > kill) {
    return die();
  } else if (time_since_stroke > fade) {
    perc = (time_since_stroke - fade) / (kill - fade);
    input.style.opacity = 1 - perc;
    return document.body.style.boxShadow = "inset 0px 0px " + (Math.floor(100 * perc)) + "px 0px rgba(242, 77, 77, " + (perc * .7) + ")";
  }
};

keyFromCharCode = function(charCode, shift) {
  var char;
  if (key_replace.hasOwnProperty(charCode)) {
    char = key_replace[charCode];
  } else if ((48 <= charCode && charCode <= 90)) {
    char = String.fromCharCode(charCode);
    if (!shift) {
      char = char.toLowerCase();
    }
  } else {
    char = "";
  }
  if (shift && shift_replace.hasOwnProperty(char)) {
    char = shift_replace[char];
  }
  return char;
};

stroke = function(e) {
  var charCode, evt;
  update_stats();
  if (won) {
    return;
  }
  evt = e || window.event;
  charCode = evt.keyCode || evt.which;
  if (charCode && indexOf.call(valid_key_codes, charCode) < 0) {
    return;
  }
  if (e.code && !e.code.match(valid_keys)) {
    return;
  }
  if (hardcore) {
    hardcore.innerHTML = keyFromCharCode(charCode, evt.shiftKey);
  }
  time_since_stroke = 0;
  if (!run) {
    run = true;
    return tock = setInterval(tick, 100);
  } else {
    input.style.opacity = 1;
    return document.body.style.boxShadow = "none";
  }
};

input.onkeydown = stroke;

fullscreen = function(el) {
  if (el.requestFullscreen) {
    return el.requestFullscreen();
  } else if (el.mozRequestFullScreen) {
    return el.mozRequestFullScreen();
  } else if (el.webkitRequestFullscreen) {
    return el.webkitRequestFullscreen();
  } else if (el.msRequestFullscreen) {
    return el.msRequestFullscreen();
  }
};

get = function(id) {
  return document.getElementById(id);
};

hide = function(id) {
  var el;
  el = document.getElementById(id).style.display = 'none';
  return document.getElementById('status').style.opacity = 1;
};

show = function(id) {
  return document.getElementById(id).style.display = 'block';
};

start = function() {
  input.value = '';
  hardcore_mode = get('hardcore_mode') && get('hardcore_mode').checked;
  time_div.style.display = 'inline';
  input.disabled = false;
  input.style.opacity = 1;
  document.body.style.boxShadow = 'none';
  time_left = session_length;
  update_clock();
  input.placeholder = "Start typing...";
  won = false;
  run = false;
  start_time = new Date().getTime() / 1000;
  get('status').style.opacity = 1;
  get('status_lower').style.opacity = 1;
  hide('logo');
  hide('start');
  hide('win_button');
  hide('save_button');
  if (hardcore_mode) {
    show('hardcore');
    input.className = "hardcore";
  } else {
    hide('hardcore');
    input.className = "";
  }
  if (ga) {
    ga('send', 'event', 'Write', 'start', '', session_length);
  }
  return input.focus();
};

retry = function() {
  get('stats').innerHTML = '';
  document.body.style.boxShadow = 'none';
  hide('time');
  show('start');
  hide('die');
  return input.disabled = true;
};

document.getElementById("start_button").onclick = function() {
  var el;
  session_length = parseInt(((function() {
    var i, len, ref, results;
    ref = document.getElementsByClassName('select_time');
    results = [];
    for (i = 0, len = ref.length; i < len; i++) {
      el = ref[i];
      if (el.checked) {
        results.push(el);
      }
    }
    return results;
  })())[0].value);
  return start();
};

document.getElementById("show_help").onclick = function() {
  return show('help');
};

document.getElementById("hide_help").onclick = function() {
  return hide('help');
};

document.getElementById("retry_button").onclick = retry;

document.getElementById("win_button").onclick = retry;

document.getElementById("save_button").onclick = function(event) {
  return get("save_button").href = "data:application/octet-stream;charset=utf-8;base64," + btoa(input.value);
};

track_outbound = function(event) {
  var href, proceed;
  event.preventDefault();
  href = event.target.href;
  proceed = function() {
    return document.location = href;
  };
  ga('send', 'event', {
    eventCategory: 'Affiliate Link',
    eventAction: 'click',
    eventLabel: event.target.className,
    transport: 'beacon',
    hitCallback: proceed
  });
  return setTimeout(proceed, 1000);
};

if (get("affiliate_mac")) {
  get("affiliate_mac").onclick = track_outbound;
  get("affiliate_ios").onclick = track_outbound;
  if (is_ios) {
    show('affiliate_ios');
  } else if (is_mac) {
    show('affiliate_mac');
  }
}
