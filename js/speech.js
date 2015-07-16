/* global counter, loadPano, panosList, playAudio, SpeechRecognition, SpeechGrammarList */
(function () {

var commands = {
  'next': 1,
  'previous': -1,
  'forward': 1,
  'back': -1,
  'computer next': 1,
  'computer previous': -1,
  'computer next program': 1,
  'computer previous program': -1,
  'computer start next program': 1,
  'computer start previous program': -1,
  'computer forward': 1,
  'computer back': -1,
  'computer go forward': 1,
  'computer go back': -1,
};

var panosByKey = {};


panosList.then(function (panos) {

  panos.forEach(function (pano) {
    panosByKey[pano.id] = pano;
    (pano.commands || []).forEach(function (cmd) {
      commands[cmd] = pano;
    });
  });

  var grammar = Object.keys(commands).join(' | ');

  createGrammar();
  setGrammar('#JSGF V1.0; grammar holodeck; public <simple> = ' + grammar + ';');
  initSpeech();

});


var finalTranscript = '';
// var language = 'en-US';
var recognising = false;
var recognition;
var speechrecognitionlist;


function initSpeech() {
  // Create the recognition object and define four event handlers (onstart, onerror, onend, onresult).
  recognition = new SpeechRecognition();

  console.log('SpeechRecognition ready');

  //recognition.continuous = true;         // keep processing input until stopped // MOZ: NS_ERROR_NOT_IMPLEMENTED
  //recognition.interimResults = true;     // show interim results // MOZ: NS_ERROR_NOT_IMPLEMENTED
  //recognition.lang = language;           // specify the language // MOZ: NS_ERROR_NOT_IMPLEMENTED

  recognition.onstart = function () {
    recognising = true;
    console.log('Speak slowly and clearly');
  };

  recognition.onerror = function (e) {
    console.log('There was a recognition error\n', e);
  };

  recognition.onend = function () {
    recognising = false;
    console.log('Done');
  };

  recognition.onresult = function (e) {
    console.log('recognition.onresult called');

    var interimTranscript = '';
    var score = '';

    // Assemble the transcript from the array of results.
    for (var i = e.resultIndex; i < e.results.length; ++i) {
      if (e.results[i].isFinal) {
        console.log('recognition.onresult: isFinal');
        finalTranscript += e.results[i][0].transcript;
      } else {
        console.log('recognition.onresult: not isFinal');
        interimTranscript += e.results[i][0].transcript;
      }

      score = e.results[i][0].confidence;
    }

    console.log('interim: %s', interimTranscript);
    console.log('final: %s', finalTranscript);

    if (finalTranscript === 'ERROR') {
      return start();
    }

    if (finalTranscript || interimTranscript) {
      process(finalTranscript || interimTranscript, score);
    }
  };
}

function stop() {
  recognition.stop();
  console.log('Stopped');
  recognising = false;
}

function start() {
  finalTranscript = '';

  // Request access to the user's mic and start recognising voice input.
  recognition.start();

  console.log('Starting');
  console.log('Allow the browser to use your Microphone');

  recognising = true;
}

function createGrammar() {
  speechrecognitionlist = new SpeechGrammarList();
  console.log('SpeechGrammarList created');
}

function setGrammar(grammar) {
  speechrecognitionlist.addFromString(grammar, 1);
  console.log('Grammar set', grammar);
}

// function associateGrammar() {
//   recognition.grammars = speechrecognitionlist;
// }

function process(transcript, score) {
  console.log('confidence score: %.2f', score);

  if (transcript === 'ERROR') {
    console.error('invalid transcript');
  } else {
    console.log('transcript:', transcript);
    console.log(commands, transcript[commands]);
    if (transcript in commands) {
      startProgram(commands[transcript]);
    }
  }
}

function startProgram(program) {
  if (typeof program === 'number') {
    loadPano(program, true);
  } else if (typeof program === 'object') {
    panosList.then(function (panos) {
      console.log('Loading program:', program.title);

      counter = panos.indexOf(program);

      loadPano(0, true);
    });
  }
}


document.addEventListener('keypress', function (e) {
  if (e.alt || e.ctrlKey || e.metaKey) {
    return;
  }

  if (e.key === ' ') {
    e.preventDefault();
    if (recognising) {
      stop();
    } else {
      playAudio('audio/hologram_on.mp3');
      start();
    }
  }
});

})();
