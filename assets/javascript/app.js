//Override Math.random
(function() {
  var rng = window.crypto || window.msCrypto;
  if (rng === undefined)
    return;

  Math.random = function() {
    return rng.getRandomValues(new Uint32Array(1))[0] / 4294967296;
  };
})();

$(document).ready(function() {
  validate();
});

// validate upon page load to handle errors
function validate() {
  $('#entries, #entrant-name').keyup(function() {
    if ($(this).val() == '') {
      $('.enable').prop('disabled', true);
    } else {
      $('.enable').prop('disabled', false);
    }
  });
}

// declare empty raffle array
let raffleArray = [];
let winnerHasBeenDrawn = false;
let currentWinner = null;

// function to randomize array
const randomize = array => {
  for (let i = array.length - 1; i > 0; i--) {
    let j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
};

// function to get random number.
const getRandomInt = (min, max) => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

// function to parse uploaded csv file
const csvStringToArray = strData =>
{
  const objPattern = new RegExp(("(\\,|\\r?\\n|\\r|^)(?:\"([^\"]*(?:\"\"[^\"]*)*)\"|([^\\,\\r\\n]*))"),"gi");
  let arrMatches = null, arrData = [[]];
  while (arrMatches = objPattern.exec(strData)){
    if (arrMatches[1].length && arrMatches[1] !== ",")arrData.push([]);
    arrData[arrData.length - 1].push(arrMatches[2] ?
      arrMatches[2].replace(new RegExp( "\"\"", "g" ), "\"") :
      arrMatches[3]);
  }
  return arrData;
};

// function to convert parsed array into entries
const parseArrayEntries = arr => {
  let entries = [];
  if (!arr[0] || !arr[0][1] || arr[0][1] !== 'ENTRIES') {
    return entries;
  } else {
    for(let i = 1; i < arr.length; i++) {
      const entry = arr[i];
      if(!entry) {
        return entries;
      }

      const name = entry[0];
      const score = entry[1];

      for(let j = 0; j < score; j++) {
        entries.push(name);
      }
    }
    return entries;
  }
};

// function for calculating the odds of winning for each entrant and writing it to the page.
const handleOdds = () => {
  const raffleClone = [...raffleArray];
  // This flattens it into one large array.
  const randomizedArray = randomize(raffleClone);
  const entrantTotal = randomizedArray.reduce((obj, item) => {
    obj[item] = (obj[item] || 0) + 1;
    return obj;
  }, {});
  // This counts every instance of a string in the randomizedArray.
  // Returns an object like this {josh: 2, kenny: 2}
  const totalValues = Object.values(entrantTotal);
  // grabs only the values for each entrant
  totalValues.forEach(value => {
    // loops over values to calculate odds and print them to page.
    const raffleOdds = ((value / raffleClone.length) * 100).toFixed(2);
    if (raffleOdds > 50) {
      $('#chance')
        .append(
          `<hr>
           <div class="percentage m-1 ${className(
            'black'
          )}">${raffleOdds}%</div>`
        )
        .addClass(`border-left border-right border-light`);
    }  else {
      $('#chance')
        .append(
          `<hr>
          <div class="percentage m-1 ${className(
            'black'
          )}">${raffleOdds}%</div>`
        )
        .addClass(`border-left border-right border-light`);
    }
  });
  $('#chance')
    .append(`<hr>`);
  return {
    entrantTotal,
    raffleClone
  };
};

// function to handle the total count for each entrant and write it to page along with the total entries
const handleCount = (entrantTotal, raffleClone) => {
  $('#count').empty();
  const entryCount = JSON.stringify(entrantTotal);
  // returns a stringified object from the handleOdds function.
  // the keys are the names and the values are the count. ex. {"josh":5}
  const formattedEntryCount = entryCount
    .slice(1, -1)
    .replace(/\"/g, ' ')
    .replace(/ :/g, ': ')
    .split(',');
  // returns an array of the entryCounts as strings formatted like this: [" josh: 5", " kenny: 6"]
  formattedEntryCount.forEach(count => {
    count = count.trim();
    // removes whitespace from beginning of each formattedEntryCount
    const id = count.substring(0, count.indexOf(':'));
    // returns the name as a string like "josh" by trimming the colon and anything after it.
    // used to match id of count to delete button and filter the array accordingly.
    if (raffleClone.length > 0) {
      $('#count')
        .append(
          `<hr><span id="${id}" class="delete-entry m-1 ml-3 float-left btn btn-sm btn-outline-danger" value="${id}">X</span><div class="names m-1 ${className(
            'black'
          )}">${count}</div>`
        )
        .addClass(`border-left border-right border-light`);
    }
  });
  $('#count')
    .append(`<hr>`);
  $('#total-entries').html(
    `<div class="${className('black')}">Total Entries: ${
      raffleClone.length
    }</div>`
  );
  $('#pick-winner').prop('disabled', false);
  $('.alert').alert('close');
};

// function to pick a winner and create a ticker "animation" on the page before displaying the winner.
const pickWinner = () => {
  $('#pick-winner').prop('disabled', true);

  const duration = $( "#duration" ).slider( "value" );
  const delay = $( "#delay" ).slider( "value" );

  const raffleClone = [...raffleArray];
  const random = randomize(raffleClone);
  let drawnEntry = random[getRandomInt(0, random.length - 1)];

  const interval = window.setInterval(() => {
    drawnEntry = random[getRandomInt(0, random.length - 1)];
    $('#winner').html(
      `<div class="${className('white')}">${drawnEntry}</div>`
    );
    window.setTimeout(() => {
      clearInterval(interval);
    }, duration*1000);
  }, 100);

  setTimeout(() => {
    const slowInterval = window.setInterval(() => {
      drawnEntry = random[getRandomInt(0, random.length - 1)];
      $('#winner').html(
        `<div class="${className('white')}">${drawnEntry}</div>`
      );
      window.setTimeout(() => {
        clearInterval(slowInterval);
      }, delay*1000);
    }, 500);
  }, duration*1000);

  window.setTimeout(() => {
    $('#winner').html(
      `<div class="${className('green')}">${ drawnEntry }!!</div>`
    );
    winnerHasBeenDrawn = true;
    currentWinner = drawnEntry;
    $('#pick-winner').prop('disabled', true);
    $('#thankyou-next').prop('disabled', false);
    $('#remove-winner').prop('disabled', false);
    confetti.start();
  }, duration*1000 + delay*1000 + 150);

};

// function to reset entries
const resetEntries = () => {
  raffleArray = [];
  winnerHasBeenDrawn = false;
  currentWinner = null;
  $('#total-entries, #count, #chance, #winner').empty();
  $('#pick-winner').prop('disabled', true);
  $('#remove-winner').prop('disabled', true);
  $('#thankyou-next').prop('disabled', true);
};

// function to remove winner
const removeWinner = (event) => {
  $('#count, #chance, #winner').empty();
  const { id } = event.target;
  const array = [...raffleArray];
  raffleArray = array.filter(name => name !== id);
  const { entrantTotal, raffleClone } = handleOdds();
  handleCount(entrantTotal, raffleClone);
  const spanId = `#${id}`;
  $(spanId).hide();
};

// function for quickly writing bootstrap badge color classes
const className = color => {
  let classes = 'badge badge-';
  classes +=
    color === 'green'
      ? 'success'
      : color === 'red'
      ? 'danger'
      : color === 'white'
      ? 'light'
      : color === 'yellow'
      ? 'warning'
      : color === 'blue'
      ? 'primary'
      : 'dark';
  return classes;
};

// function for handling input file
const handleFileSelect = () => {
  if (!window.File || !window.FileReader || !window.FileList || !window.Blob) {
    alert('The File APIs are not fully supported in this browser.');
    return;
  }
  let input = document.getElementById('fileinput');
  if (!input) {
    alert("Um, couldn't find the fileinput element.");
  }
  else if (!input.files) {
    alert("This browser doesn't seem to support the `files` property of file inputs.");
  }
  else if (!input.files[0]) {
    alert("Please select a file before clicking 'Load'");
  }
  else {
    if ( raffleArray.length > 0 ) {
      $('#load-entries').prop('disabled', true);
      $('.load-msg').html(
        `<p id="no-save"><b>Entries are already loaded. Reset or refresh page to load new data.</b></p>`
      );
      $('.load-footer').append(
        `<button class="btn btn-primary refresh">Refresh Page</button>`
      );
    } else {
      let file = input.files[0];
      let fr = new FileReader();
      fr.onload = function () {
        let parsedArray = parseArrayEntries(csvStringToArray(fr.result));
        if ( parsedArray.length > 0) {
          $('#load-entries').prop('disabled', false);
          parsedArray.forEach(name => {
            raffleArray.push(name);
          });
          const { entrantTotal, raffleClone } = handleOdds();
          handleCount(entrantTotal, raffleClone);
          $('.load-msg').html(
            `<p id="no-save"><b>Raffle entries have been loaded successfully.</b></p>`
          );
          window.setTimeout(function() {
            if ($('.load-modal').hasClass('show')) {
              $('.load-modal').modal('toggle');
            }
          }, 1250)
        } else {
          $('.load-msg').html(
            `<p id="no-save"><b>Uploaded entries are malformed. Please check and try again.</b></p>`
          );
        }
      };
      fr.readAsText(file);
    }
  }
};

$( function() {
  $( "#duration" ).slider({
    range: "max",
    min: 5,
    max: 20,
    value: 10,
    slide: function( event, ui ) {
      $( "#slider1value" ).val( ui.value );
    }
  });
  $( "#slider1value" ).val( $( "#duration" ).slider( "value" ) );
} );

$( function() {
  $( "#delay" ).slider({
    range: "max",
    min: 5,
    max: 15,
    value: 5,
    slide: function( event, ui ) {
      $( "#slider2value" ).val( ui.value );
    }
  });
  $( "#slider2value" ).val( $( "#delay" ).slider( "value" ) );
} );

$('#pick-winner').on('click', event => {
  event.preventDefault();
  if (raffleArray.length > 0) {
    pickWinner();
  }
});

$('#remove-winner').on('click', event => {
  event.preventDefault();
  if (winnerHasBeenDrawn && currentWinner != null) {
    winnerHasBeenDrawn = false;
    removeWinner({target: {id: currentWinner}});
    currentWinner = null;
    $('#thankyou-next').click();
  }
});

$('#thankyou-next').on('click', event => {
  event.preventDefault();
  confetti.stop();
  winnerHasBeenDrawn = false;
  currentWinner = null;
  drawnEntry = null;
  $('#pick-winner').prop('disabled', false);
  $('#remove-winner').prop('disabled', true);
  $('#thankyou-next').prop('disabled', true);
});

// resets everything, all current entries and clears local storage.
// button exists on main page.
$('#reset').on('click', () => {
  $('.reset-modal').modal();
  resetEntries();
  localStorage.clear();
});

// load button launches modal, empties message div, and removes refresh button. button exists on main page.
$('.load-btn').on('click', () => {
  $('#no-save').empty();
  $('.refresh').remove();
  $('.load-modal').modal();
});

// displays next to entry counts, matches id with name in array,
// filters out the name, sets the main array to the filtered array, and runs the odds and count functions.
$(document).on('click', '.delete-entry', removeWinner);

// will refresh the page.
$(document).on('click', '.refresh', () => {
  window.location.reload();
});
