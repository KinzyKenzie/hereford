var fs = require('fs');
const readline = require("readline-sync");
const fetch = require("node-fetch");
const colors = require('colors/safe');
var timeConverter = require('./timeConverter');

//Text files
const folderName = "textfiles";
const txtRunner = './' + folderName + '/runner.txt';
const txtGame = './' + folderName + '/game.txt';
const txtCategory = './' + folderName + '/category.txt';
const txtEstimate = './' + folderName + '/estimate.txt';
const txtConsole = './' + folderName + '/console.txt';
const txtArray = [txtRunner, txtGame, txtCategory, txtEstimate, txtConsole];
var runArray = [];

var userinput = "";
var userinputsub = "";
var slug = "";
let schedulejson;
var currentRun = 0;

const getJSON = async url => {
  try {
    const response = await fetch(url);
    if (!response.ok) // check if response worked (no 404 errors etc...)
      throw new Error(response.statusText);
    const data = await response.json(); // get JSON from the response
    return data; // returns a promise, which resolves to this data value
  } catch (error) {
    return error;
  }
}
slug = readline.question('Please post the oengus slug for the marathon: ');
apiCall(slug);
setTimeout(function() {
  initFiles();
  console.log('Start at first run? (' + colors.green('y') + '/' + colors.green('n') + ')')
  userinput = readline.question(' ');
  if (userinput == 'y') {
    writeToFiles(0, 1);
  }
  console.log(colors.green('"n"') + ' for next run\n' +
    colors.green('"p"') + ' for previous run\n' +
    colors.green('"j"') + ' to jump to a run');
  while (true) {
    console.log('Current run number: ' + colors.green(currentRun));
    userinput = readline.question('Next command? (h for help) ');
    switch (userinput) {
      case 'n':
        console.log("Switching to next run");
        writeToFiles(currentRun, 'plus');
        break;
      case 'p':
        console.log("switching to previous run");
        writeToFiles(currentRun, 'min');
        break;
      case 'h':
        console.log(colors.green('"n"') + ' for next run\n' +
          colors.green('"p"') + ' for previous run\n' +
          colors.green('"j"') + ' to jump to a run\n' +
          colors.green('"s"') + 'to go to the start of the marathon');
        break;
      case 's':
        console.log("Restarting the marathon")
        writeToFiles(0, 0);
        break;
      case 'j':
        userinputsub = readline.question('What run do you want to jump to (input a number)\nMax is ' + schedulejson.lines.length + ': ');
        try {
          currentRun = parseInt(userinputsub);
          writeToFiles(currentRun, currentRun);
        } catch (err) {
          console.error(err);
        }
        break;
    }
  }
}, 3000);

function writeToFiles(j, k) {
  if (j > schedulejson.lines.length) {
    console.log('Input is bigger than marathon is long, aborting.')
  } else {
    if (k == 'plus') {
      currentRun++;
    } else if (k == 'min') {
      currentRun--;
    } else if (typeof k == 'number') {
      currentRun = k;
    }
    putData(j);
    for (var i = 0; i < txtArray.length; i++) {
      console.log(colors.yellow(txtArray[i]) + colors.cyan(' -> ') + colors.green(runArray[i]));
      fs.writeFileSync(txtArray[i], runArray[i], (err) => {
        if (err) throw err;
        console.log("bla");
      });
    }
  }
}

function putData(j) {
  if (schedulejson.lines[j].runners.length > 0) {
    runArray[0] = schedulejson.lines[j].runners[0].username;
  } else {
    runArray[0] = '';
  }
  runArray[1] = schedulejson.lines[j].gameName;
  runArray[2] = schedulejson.lines[j].categoryName;
  runArray[3] = timeConverter.parseDuration(schedulejson.lines[j].estimate);
  runArray[4] = schedulejson.lines[j].console;
}

function apiCall(slug) { //Reads the CSV, writes data to lines. Also adds the length of the marathon to tableLength;
  console.log("Fetching schedule data from " + slug);
  getJSON("https://oengus.io/api/marathon/" + slug + "/schedule").then(data => {
    schedulejson = data;
  }).catch(error => {
    console.error(error);
  });
}

function initFiles() {
  if (!fs.existsSync('./' + folderName)) {
    fs.mkdirSync(folderName);
    console.log('Created Folder!')
  }
  try {
    if (fs.existsSync(txtCategory)) {
      console.log("No files are created, files already exist.")
    } else {
      for (var i = 0; i < txtArray.length; i++) {
        fs.writeFile(txtArray[i], ' ', function(err) {
          if (err) throw err;
        });
      }
      console.log('Files are created successfully.');
    }
  } catch (err) {
    console.error(err);
  }
}
