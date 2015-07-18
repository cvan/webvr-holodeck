/* global panoJump, panoNext, panosList, playAudio, SpeechRecognition, SpeechGrammarList */
(function () {

var navCommands = {
  'start': startHolodeck,
  'computer start': startHolodeck,
  'next': panoForward,
  'previous': panoBack,
  'forward': panoForward,
  'back': panoBack,
  'computer next': panoForward,
  'computer previous': panoBack,
  'computer start program': panoForward,
  'computer next program': panoForward,
  'computer previous program': panoBack,
  'computer start next program': panoForward,
  'computer start previous program': panoBack,
  'computer forward': panoForward,
  'computer back': panoBack,
  'computer go forward': panoForward,
  'computer go back': panoBack,
};

var programCommands = {};

var commandsList = Object.keys(navCommands);


panosList.then(function (panos) {



  panos.forEach(function (pano, idx) {
    panos[idx]._idx = idx;
    (pano.commands || []).forEach(function (cmd) {
      programCommands[cmd] = pano;
      commandsList.push(cmd);
    });
  });

  var grammar = commandsList.join(' | ');

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
    if (transcript in navCommands) {
      return navCommands(navCommands[transcript])();
    }
    if (transcript in programCommands) {
      startProgram(programCommands[transcript]);
    }
  }
}

function startProgram(program) {
  console.log('Loading program:', program.title);
  panoJump(program);
}

function startHolodeck() {
  panoNext();
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
