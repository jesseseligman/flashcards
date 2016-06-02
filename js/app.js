(function(){
  'use strict';
  // ==============================================================================
  // Global variables for decks object, language map, and last selected languages
  // ==============================================================================
  var decks = {};

  // Holds language name and language code to be used in AJAX request
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

    var lastLangs = [];

  // Prevent default for translation link in nav-bar
  $('#translation').click(function(event){
    event.preventDefault;
    translateMode();
  })

  // ======================================================================================
  // Translate mode functions: renderDropdowns, renderInput, isNewDeck, addDeck, saveCard
  // ======================================================================================
  var renderDropdowns = function(){
    // Create a jQuery select element
    var $dropDown = $('<select class="browser-default z-depth-1">');

    // Loop through languages array and append options with languages and corresponding language codes assigned to value attribute
    for (var language of languages) {
      var $option = $('<option>');
      $option.text(language[0]);
      $option.val(language[1]);
      $dropDown.append($option);
    }

    // Append a dropdown to each card
    $('.card-action').find('.col').append($dropDown);

    // Adds appropriate pre-selected option to selects
    $('select').eq(0).prepend('<option value="" selected disabled>Translate from...</option>')
    $('select').eq(1).prepend('<option value="" selected disabled>Translate to...</option>')

    //  Pre-selects the last languages used for translation when returning to translation mode
    if (lastLangs.length !== 0){
      $(`option:contains(${lastLangs[0]})`).eq(0).prop('selected', true);
      $(`option:contains(${lastLangs[1]})`).eq(1).prop('selected', true);
    }
  };

  var renderInput = function() {
    // Add input field to top card
    var $inputField = $('<div class="input-field">');
    $inputField.append('<input id="text-input" placeholder="Enter text here..."></input>');
    $('.card-content').eq(0).append($inputField);
  }

  var isNewDeck = function(langFrom, langTo) {
    for (var deck in decks) {
      // Check to see if there is a key with both langTo and langFrom already in global deck object
      if (deck.includes(langFrom) && deck.includes(langTo)) {
        // If a deck has already been created but then all the cards have been removed, it disappears from the sidebar. This ensures that addDeck is called again if a card is added after this scenario.
        if (decks[deck].length !== 0){
          return false;
        }
      }
    }
    return true;
  }

  var addDeck = function(langFrom, langTo) {
    // Create and append new 'deck' li to side-nav
    var $newDeck = $('<li>');
    $newDeck.append(`<a class="deck center" href="#">${langFrom}/${langTo}</a>`);
    $('#nav-mobile').append($newDeck);

    // Add event handler with practiceMode() as the callback
    $newDeck.on('click', function(event){
      practiceMode(event);
    });

    // Add new deck with language names as key and value of empty array to global decks object
    decks[`${langFrom}/${langTo}`] = [];
  };

  var saveCard = function(langFrom, langTo, inputText, translated) {
    var newCard = {};

    newCard[langFrom] = inputText;
    newCard[langTo] = translated;

    for (var deck in decks){
      // Locate correct deck array
      if (deck.includes(langFrom) && deck.includes(langTo)) {
        // Check to see if card already exists
        for (var existingCard of decks[deck]) {
          if (existingCard[langFrom] === newCard[langFrom]) {
            return;
          }
        }
        decks[deck].push(newCard);
      }
    }
  };

  // ==============================================================================
  // Parent translateMode function for looking up words and adding cards to decks
  // ==============================================================================
  var translateMode = function() {
    // Update state for tranlate mode
    $('.current').removeClass('current');
    $('.card-counter').remove();
    $('#remove-card').remove();
    $('#translation').addClass('cyan darken-4');
    $('#action-button').text('translate!');
    $('.card-action').find('.col').text('');
    $('.card-content').text('')

    renderDropdowns();

    renderInput();

    // Remove old event handlers from action-button
    $('#action-button').off();
    // Add event handler to action-button
    $('#action-button').on('click', function(){
      var inputText = $('#text-input').val();

      // Form validation to check that text exists
      if (inputText === ''){
        Materialize.toast('Please enter some text.', 3000)
        return;
      }
      // Form validation to check that both languages have been selected
      if ($(':selected')[0].hasAttribute('disabled') || $(':selected')[1].hasAttribute('disabled')){
        Materialize.toast('Please specify both languages.', 3000)
        return;
      }

      // Retrieve language codes for AJAX request
      var langCode1 = $(':selected').eq(0).val();
      var langCode2 = $(':selected').eq(1).val();

      // Store language names
      var langFrom = $(':selected').eq(0).text();
      var langTo = $(':selected').eq(1).text();

      // Store selected languages to preselect them if the user goes to practiceMode and then returns   to translateMode
      lastLangs = [langFrom, langTo];

      var $xhr =$.getJSON(`https://translate.yandex.net/api/v1.5/tr.json/translate?lang=${langCode1}-${langCode2}&text=${inputText}&key=trnsl.1.1.20160524T025705Z.32fabd01b839c936.4dd4f1ea278c1c46d5ca189f984879619639c5a6`);

      $xhr.done(function(data) {
        if ($xhr.status !== 200){
          return;
        }

        // Store translated text and render translation on bottom card
        var translated = data.text[0];
        $('#response').text(translated);

        // Check to see if this is a new language pair and then addDeck if it is
        if (isNewDeck(langFrom, langTo)){
        addDeck(langFrom, langTo);
        }
        // Save the translation to the appropriate deck
        saveCard(langFrom, langTo, inputText, translated);
      })


      $xhr.fail(function(err) {
        console.log(err);
      })
    });
  };

  // ==============================================================================
  // Practice mode functions: removeCard, showPrompt, showAnswer, sideCollapse
  // ==============================================================================

  var removeCard = function(deck, cardIndex, lang1, lang2) {
    // Remove card at current index
    deck.splice(cardIndex, 1);
    // If the deck is empty, remove deck from side-nav and return to translateMode
    if (deck.length === 0) {
      $(`li:contains(${lang1}/${lang2})`).remove();
      translateMode();
      return;
    }
    // Cycle back to index 0 if index reaches deck length
    else if (cardIndex === deck.length) {
      cardIndex = 0;
    }
    // Show prompt invoked; will show next card in deck
    showPrompt(deck, cardIndex, lang1, lang2);
  }

  var showPrompt = function(deck, cardIndex, lang1, lang2) {
    // Clear settings from previous state
    $('#remove-card').remove();
    $('#action-button').off();
    $('.card-content').eq(1).empty();
    $('#action-area div').eq(0).removeClass('center')
    $('.card-counter').remove();

    // Create remove button and add event handler
    var $remove = $('<a class="waves-effect waves-light btn">Remove Card</a>');
    $remove.on('click', function() {
      removeCard(deck, cardIndex, lang1, lang2);
    })

    // Add remove card button to bottom of screen
    $('#action-area').append(`<div id="remove-card"></div>`);
    $('#remove-card').append($remove);

    // Update action-button text and behavior
    $('#action-button').text('Show Answer');
    $('#action-button').on('click', function(){
      showAnswer(deck, cardIndex, lang1, lang2)
    });

    // Create and prepend card counter to top of first row
    var $cardCounter = $('<div class="col s10 offset-s1 l4 offset-l5 card-counter">');
    $cardCounter.text(`${lang1}/${lang2}: Card ${cardIndex + 1} of ${deck.length}`);
    $('.row').eq(0).prepend($cardCounter);

    // Display prompt text on first card
    $('.card-content').eq(0).text(deck[cardIndex][lang1]);
  }

  var showAnswer = function(deck, cardIndex, lang1, lang2) {
    // Update text and behavior of action button
    $('#action-button').text('Next Card');
    $('#action-button').off();
    $('#action-button').on('click', function() {
      showPrompt(deck, cardIndex, lang1, lang2)
    });

    // Display answer text on second card
    $('.card-content').eq(1).text(deck[cardIndex][lang2]);

    // Increment cardIndex and cycle back to 0 if it reaches deck length
    cardIndex += 1;
    if (cardIndex === deck.length) {
      cardIndex = 0;
    }
  }

  // Materialize function for collapsing side-nav
  var sideCollapse = function() {
    $('.button-collapse').sideNav('hide');
  }

  // ==============================================================================
  // Parent practiceMode function for reviewing cards created in translateMode
  // ==============================================================================
  var practiceMode = function(event){
    // Clear settings from previous state
    $('.current').removeClass('current');
    $('.card-content').empty();
    $('#translation').removeClass('cyan darken-4');
    $('.card-action').find('.col').empty();

    // Add current class to highlight clicked deck in side-nav
    event.target.className += ' current';

    // Delayed side-nav collapse
    window.setTimeout(sideCollapse, 600)

    // Initialize cardIndex at 0
    var cardIndex = 0;

    // Retrieve origin and destination language from deck text
    var lang1 = event.target.textContent.split('/')[0];
    var lang2 = event.target.textContent.split('/')[1];

    // Locate clicked deck array in global decks object and assign it to currentDeck
    for (var deck in decks) {
      if (deck.includes(lang1) && deck.includes(lang2)) {
        var currentDeck = decks[deck];
        break;
      }
    }

    // Display origin and destination languages in respective card-action areas
    $('.card-action').find('.col').eq(0).text(lang1);
    $('.card-action').find('.col').eq(1).text(lang2)

    // Invoke showPrompt
    showPrompt(currentDeck, cardIndex, lang1, lang2);
  }

  // ==============================================================================
  // Invoke translateMode to render initial page
  // ==============================================================================
  translateMode()
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
