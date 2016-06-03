(function() {
  'use strict';

  // ==========================================================================
  // Global variables for decks object, language map, and last selected
  // languages
  // ==========================================================================
  const decks = {};

  // Holds language name and language code to be used in AJAX request
  const languages = [['Arabic', 'ar'],
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

  let lastLangs = [];

  // ==========================================================================
  // Translate mode functions: renderDropdowns, renderInput, isNewDeck,
  // addDeck, saveCard
  // ==========================================================================
  const renderDropdowns = function() {
    // Create a jQuery select element
    const $dropDown = $('<select class="browser-default z-depth-1">');

    // Loop through languages array and append options with languages and
    // corresponding language codes assigned to value attribute
    for (const language of languages) {
      const $option = $('<option>');

      $option.text(language[0]);
      $option.val(language[1]);
      $dropDown.append($option);
    }

    // Append a dropdown to each card
    $('.card-action').find('.col').append($dropDown);

    // Adds appropriate pre-selected option to selects
    $('select').eq(0).prepend('<option value="" selected disabled>\
    Translate from...</option>');
    $('select').eq(1).prepend('<option value="" selected disabled>\
    Translate to...</option>');

    // Pre-selects the last languages used for translation when returning to
    // translation mode
    if (lastLangs.length !== 0) {
      $(`option:contains(${lastLangs[0]})`).eq(0).prop('selected', true);
      $(`option:contains(${lastLangs[1]})`).eq(1).prop('selected', true);
    }
  };

  const renderInput = function() {
    // Add input field to top card
    const $inputField = $('<div class="input-field">');

    $inputField.append('<input id="text-input" \
    placeholder="Enter text here..."></input>');
    $('.card-content').eq(0).append($inputField);
  };

  const isNewDeck = function(langFrom, langTo) {
    for (const deck in decks) {
      // Check to see if there is a key with both langTo and langFrom already
      // in global deck object
      if (deck.includes(langFrom) && deck.includes(langTo)) {
        // If a deck has already been created but then all the cards have been
        // removed, it disappears from the sidebar. This ensures that addDeck
        // is called again if a card is added after this scenario.
        if (decks[deck].length !== 0) {
          return false;
        }
      }
    }

    return true;
  };

  const addDeck = function(langFrom, langTo) {
    // Create and append new 'deck' li to side-nav
    const $newDeck = $('<li>');

    $newDeck.append(`<a class="deck center" \
    href="#">${langFrom}/${langTo}</a>`);
    $('#nav-mobile').append($newDeck);

    // Add event handler with practiceMode() as the callback
    $newDeck.on('click', (event) => {
      practiceMode(event);
    });

    // Add new deck with language names as key and value of empty array to
    // global decks object
    decks[`${langFrom}/${langTo}`] = [];
  };

  const saveCard = function(langFrom, langTo, inputText, translated) {
    const newCard = {};

    newCard[langFrom] = inputText;
    newCard[langTo] = translated;

    for (const deck in decks) {
      // Locate correct deck array
      if (deck.includes(langFrom) && deck.includes(langTo)) {
        // Check to see if card already exists
        for (const existingCard of decks[deck]) {
          if (existingCard[langFrom] === newCard[langFrom]) {
            return;
          }
        }
        decks[deck].push(newCard);
      }
    }
  };

  // ==========================================================================
  // Parent translateMode function for looking up words and adding cards to
  // decks
  // ==========================================================================
  const translateMode = function() {
    // Update state for tranlate mode
    $('.current').removeClass('current');
    $('.card-counter').remove();
    $('#remove-card').remove();
    $('#translation').addClass('cyan darken-4');
    $('#action-button').text('translate!');
    $('.card-action').find('.col').text('');
    $('.card-content').text('');

    renderDropdowns();

    renderInput();

    // Remove old event handlers from action-button
    $('#action-button').off();

    // Add event handler to action-button
    $('#action-button').on('click', () => {
      const inputText = $('#text-input').val();

      // Form validation to check that text exists
      if (inputText.trim() === '') {
        Materialize.toast('Please enter some text.', 3000);

        return;
      }

      // Form validation to check that both languages have been selected
      if ($(':selected')[0].hasAttribute('disabled') ||
      $(':selected')[1].hasAttribute('disabled')) {
        Materialize.toast('Please specify both languages.', 3000);

        return;
      }

      // Retrieve language codes for AJAX request
      const langCode1 = $(':selected').eq(0).val();
      const langCode2 = $(':selected').eq(1).val();

      // Store language names
      const langFrom = $(':selected').eq(0).text();
      const langTo = $(':selected').eq(1).text();

      // Store selected languages to preselect them if the user goes to
      // practiceMode and then returns to translateMode
      lastLangs = [langFrom, langTo];

      const $xhr = $.getJSON(`https://translate.yandex.net/api/v1.5/tr.json/translate?lang=${langCode1}-${langCode2}&text=${inputText}&key=trnsl.1.1.20160524T025705Z.32fabd01b839c936.4dd4f1ea278c1c46d5ca189f984879619639c5a6`);

      $xhr.done((data) => {
        if ($xhr.status !== 200) {
          return;
        }

        // Store translated text and render translation on bottom card
        const translated = data.text[0];

        $('#response').text(translated);

        // Check to see if this is a new language pair and then addDeck if it is
        if (isNewDeck(langFrom, langTo)) {
          addDeck(langFrom, langTo);
        }

        // Save the translation to the appropriate deck
        saveCard(langFrom, langTo, inputText, translated);
      });

      $xhr.fail(() => {
        Materialize.toast('Something went wrong. Try again', 3000);
      });
    });
  };

  // ==========================================================================
  // Practice mode functions: removeCard, showPrompt, showAnswer, sideCollapse
  // ===========================================================================

  const removeCard = function(deck, cardIndex, lang1, lang2) {
    // Remove card at current index
    deck.splice(cardIndex, 1);

    // If the deck is empty, remove deck from side-nav and return to
    // translateMode
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
  };

  const showPrompt = function(deck, cardIndex, lang1, lang2) {
    // Clear settings from previous state
    $('#remove-card').remove();
    $('#action-button').off();
    $('.card-content').eq(1).empty();
    $('#action-area div').eq(0).removeClass('center');
    $('.card-counter').remove();

    // Create remove button and add event handler
    const $remove = $('<a class="waves-effect waves-light btn">Remove\
     Card</a>');

    $remove.on('click', () => {
      removeCard(deck, cardIndex, lang1, lang2);
    });

    // Add remove card button to bottom of screen
    $('#action-area').append('<div id="remove-card"></div>');
    $('#remove-card').append($remove);

    // Update action-button text and behavior
    $('#action-button').text('Show Answer');
    $('#action-button').on('click', () => {
      showAnswer(deck, cardIndex, lang1, lang2);
    });

    // Create and prepend card counter to top of first row
    const $cardCounter = $('<div class="col s10 offset-s1 l4 offset-l5 \
    card-counter">');

    $cardCounter.text(`${lang1}/${lang2}: Card ${cardIndex + 1} of \
    ${deck.length}`);
    $('.row').eq(0).prepend($cardCounter);

    // Display prompt text on first card
    $('.card-content').eq(0).text(deck[cardIndex][lang1]);
  };

  const showAnswer = function(deck, cardIndex, lang1, lang2) {
    // Update text and behavior of action button
    $('#action-button').text('Next Card');
    $('#action-button').off();
    $('#action-button').on('click', () => {
      showPrompt(deck, cardIndex, lang1, lang2);
    });

    // Display answer text on second card
    $('.card-content').eq(1).text(deck[cardIndex][lang2]);

    // Increment cardIndex and cycle back to 0 if it reaches deck length
    cardIndex += 1;
    if (cardIndex === deck.length) {
      cardIndex = 0;
    }
  };

  // Materialize function for collapsing side-nav
  const sideCollapse = function() {
    $('.button-collapse').sideNav('hide');
  };

  // ===========================================================================
  // Parent practiceMode function for reviewing cards created in translateMode
  // ===========================================================================
  const practiceMode = function(event) {
    // Clear settings from previous state
    $('.current').removeClass('current');
    $('.card-content').empty();
    $('#translation').removeClass('cyan darken-4');
    $('.card-action').find('.col').empty();

    // Add current class to highlight clicked deck in side-nav
    event.target.className += ' current';

    // Delayed side-nav collapse
    window.setTimeout(sideCollapse, 600);

    // Initialize cardIndex at 0
    const cardIndex = 0;

    // Retrieve origin and destination language from deck text
    const lang1 = event.target.textContent.split('/')[0];
    const lang2 = event.target.textContent.split('/')[1];

    let currentDeck;

    // Locate clicked deck array in global decks object and assign it to
    // currentDeck
    for (const deck in decks) {
      if (deck.includes(lang1) && deck.includes(lang2)) {
        currentDeck = decks[deck];
        break;
      }
    }

    // Display origin and destination languages in respective card-action areas
    $('.card-action').find('.col').eq(0).text(lang1);
    $('.card-action').find('.col').eq(1).text(lang2);

    // Invoke showPrompt
    showPrompt(currentDeck, cardIndex, lang1, lang2);
  };

  // ==========================================================================
  // Invoke translateMode to render initial page
  // ==========================================================================
  translateMode();

  // Prevent default for translation link in nav-bar
  $('#translation').click((event) => {
    event.preventDefault;
    translateMode();
  });
})();

// Code for materialize
(function($) {
  $(() => {
    $('.button-collapse').sideNav();
  });
})(jQuery);

$(document).ready(() => {
  $('select').material_select();
});
