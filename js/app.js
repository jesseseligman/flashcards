(function(){
  'use strict';


  var decks = {};

  var languages = [['Arabic', 'ar'],
                  ['Dutch', 'nl'],
                  ['English', 'en'],
                  ['French', 'fr'],
                  ['German', 'de'],
                  ['Portuguese', 'pt'],
                  ['Punjabi', 'pa'],
                  ['Russian', 'ru'],
                  ['Spanish', 'es'],
                  ['Swahili', 'sw'],
                  ['Tamil', 'ta'],
                  ['Turkish', 'tr'],
                  ['Vietnamese', 'vi']];

  $('#translation').click(function(event){
    event.preventDefault;
    translateMode();
  })

  var renderDropdowns = function(){
    var $dropDown = $('<select>');
    $dropDown.addClass('browser-default z-depth-1');

    $dropDown.append('<option value="" selected disabled>Choose Language</option>');

    for (var lang of languages) {
      var $option = $('<option>');
      $option.text(lang[0]);
      $option.val(lang[1]);
      $dropDown.append($option);
    }

    $('.card-action').find('.col').append($dropDown);
  };

  var renderInput = function() {
    var $inputField = $('<div>');
    $inputField.addClass('input-field');

    $inputField.append('<input id="text-input" placeholder="Enter text here..."></input>');

    $('.card-content').eq(0).append($inputField);
  }

  var isNewDeck = function(langFrom, langTo) {
    for (var deck in decks) {
      if (deck.includes(langFrom) && deck.includes(langTo)) {
        return false;
      }
    }
    return true;
  }

  var addDeck = function(langFrom, langTo) {
    var $newDeck = $('<li>');
      $newDeck.append(`<a class="deck center href="#">${langFrom}/${langTo}</a>`);

      $('#nav-mobile').append($newDeck);

      $newDeck.on('click', function(event){
        practiceMode(event);
      });

      decks[`${langFrom}/${langTo}`] = [];
  };

  var saveCard = function(langFrom, langTo, inputText, translated) {
    var card = {};
    card[langFrom] = inputText;
    card[langTo] = translated;
    for (var deck in decks){
      if (deck.includes(langFrom) && deck.includes(langTo)) {
        // Add another if statement to check if a card already exists
        decks[deck].push(card);
        return;
      }
    }
  };

// Tranlate mode for looking up words and adding to decks
  var translateMode = function() {

  $('#translation').addClass('cyan darken-4');
  $('#action-button').text('translate!');
  $('.card-action').find('.col').text('');
  $('.card-content').text('')

  renderDropdowns();

  renderInput();

// Translation button clicked: updates deck and renders translation
    $('#action-button').off();
    $('#action-button').on('click', function(){
      var inputText = $('#text-input').val();

      if (inputText === ''){
        return;
      }

      var langCode1 = $(':selected').eq(0).val();
      var langCode2 = $(':selected').eq(1).val();

      var langFrom = $(':selected').eq(0).text();
      var langTo = $(':selected').eq(1).text();

      var $xhr = $.getJSON(`https://translate.yandex.net/api/v1.5/tr.json/translate?lang=${langCode1}-${langCode2}&text=${inputText}&key=trnsl.1.1.20160524T025705Z.32fabd01b839c936.4dd4f1ea278c1c46d5ca189f984879619639c5a6`);

      $xhr.done(function(data) {
        if ($xhr.status !== 200){
          return;
        }
        var translated = data.text[0];
        $('#response').text(translated);

        if (isNewDeck(langFrom, langTo)){
        addDeck(langFrom, langTo);
        }

        saveCard(langFrom, langTo, inputText, translated);
      })

      $xhr.fail(function(err) {
        console.log(err);
      })
    });
  };

  // Invoke translateMode to render initial page
  translateMode()


  // practiceMode invoked when a deck is clicked on the sidebar


  var showPrompt = function(deck, cardIndex, lang1, lang2) {
      $('.card-content').eq(0).text(deck[cardIndex][lang1]);
      $('.card-content').eq(1).empty();

      $('#action-button').text('Show Answer');
      $('#action-button').off();
      $('#action-button').on('click', function(){
        showAnswer(deck, cardIndex, lang1, lang2)
      });
  }

  var showAnswer = function(deck, cardIndex, lang1, lang2) {
    $('.card-content').eq(1).text(deck[cardIndex][lang2]);

    cardIndex += 1;
    if (cardIndex === deck.length) {
      cardIndex = 0;
    }

    $('#action-button').text('Next Card');
    $('#action-button').off();
    $('#action-button').on('click', function() {
      showPrompt(deck, cardIndex, lang1, lang2)
    });
  }

  // Maybe refactor showPrompt and showAnswer into one function?
      // var reset = function() {
      //   $('.card-content').empty();
      //   $('#action-button').off();
      // }


  var practiceMode = function(event){

    $('.card-content').empty();

    $('#translation').removeClass('cyan darken-4');

    var lang1 = event.target.textContent.split('/')[0];
    var lang2 = event.target.textContent.split('/')[1];

    //Improve styling of language labels
    $('.card-action').find('.col').empty();
    $('.card-action').find('.col').eq(0).text(lang1);
    $('.card-action').find('.col').eq(1).text(lang2)

    for (var deck in decks) {
      if (deck.includes(lang1) && deck.includes(lang2)) {
        var currentDeck = decks[deck];
        break;
      }
    }
    var cardIndex = 0;

    showPrompt(currentDeck, cardIndex, lang1, lang2);
  }
})();

// Code for materialize

(function($){
  $(function(){

    $('.button-collapse').sideNav();

  });
})(jQuery)

$(document).ready(function() {
  $('select').material_select();
});
