

// -------------------------------------
//   Base Class
// -------------------------------------

window.HD = {};

// ----- Address ----- //

window.HD.address = function() {
  $( '#form_address' ).submit( function( e ) {
    $form = $( this );
    $.ajax({
      type: 'POST',
      url: $form.attr( 'action' ),
      data: $form.serialize(),
      dataType: 'json',
      beforeSend: function () {
        $( '[type=submit]' )
          .removeClass( 'is-updated' )
          .addClass( 'is-sending' );
      },
      error: function( error ) {
        $( '[type=submit]' )
          .removeClass( 'is-sending' )
          .val( 'Oops! Try Again.' );
        setTimeout( function() {
          $( '[type=submit]' )
            .val( 'Update' );
        }, 6000 );
      },
      success: function( responseText ) {
        $( '[type=submit]' )
          .removeClass( 'is-sending' )
          .addClass( 'is-updated' )
          .val( 'Updated!' );
        setTimeout( function() {
          $( '[type=submit]' )
            .removeClass( 'is-updated' )
            .val( 'Update' );
        }, 6000 );
      }
    });
    e.preventDefault();
  });
};

// ----- Expect ----- //

window.HD.expect = function() {
  $( '#form_rsvp [type=radio]' ).on( 'change', function( e ) {
    var $input = $( e.target );
    var guest = $input.attr( 'name' ).match(/\[(.*?)\]/)[1];
    var $form = $input.closest( 'form' );
    var response = $( '#' + $input.attr( 'id' ) + ':checked' ).val();
    if( parseInt( guest ) >= 0 ) {
      var UTF8 = $( '[name=utf8]' ).val();
      var AUTH_TOKEN = $( '[name=authenticity_token]' ).val();
      $.ajax({
        type: 'POST',
        url: $form.attr( 'action' ),
        data: { guest: guest, response: response, UTF8: UTF8, authenticity_token: AUTH_TOKEN },
        dataType: 'json',
        success: function( responseText ) {
          $input.parent().find( '.status' ).addClass( 'is-updated' );
          setTimeout( function() {
            $input.parent().find( '.status' ).removeClass( 'is-updated' );
          }, 6000 );
        }
      });
    }
    e.preventDefault();
  });
  $( '#form_rsvp' ).submit( function( e ) {
    e.preventDefault();
  });
};

// ----- Modal ----- //


window.HD.modal = function() {
  var $modalTriggers = $( '[data-modal]' );

  // 1. Add click binding to modal triggers

  $modalTriggers.each( function( i, el ) {
    $( el ).on( 'click', function( e ) {
      var target = $( el ).attr( 'data-modal' );
      var modal = document.querySelector( target );
      HD.modal.open( modal );
      e.preventDefault();
    });
  });

  // 2. Add a way to close modals with click

  var $closers = $( '.modal, .modal-screen, .modal-close' );
  $closers.each( function( i, el ) {
    $( el ).on( 'click', function( e ) {
      if(
        $( e.target ).hasClass( 'modal' ) ||
        $( e.target ).hasClass( 'modal-screen' )
      ) {
        HD.modal.close();
        e.preventDefault();
      }
    });
  });

  // 2b. Add `Esc` close

  $( document ).on( 'keydown', function( e ) {
    if ( e.which === 27 ) HD.modal.close();
  });
};

  window.HD.modal.close = function() {
    if (window.reload) {
      location.reload();
    }
    $( 'body' ).removeClass( 'is-modal-viewing' );
    var modals = document.querySelectorAll( '.modal' );
    var i = 0;
    for( i; i < modals.length; i++ ) {
      $( modals[i] ).removeClass( 'is-viewing' );
      HD.vimeo.pause( modals[i].querySelector( 'iframe' ) );
    }
  };

  window.HD.modal.open = function( modal ) {
    var modal = modal || false;
    if( modal ) {
      $( 'body' ).addClass( 'is-modal-viewing' );
      $( modal ).addClass( 'is-viewing' );
      HD.vimeo.play( modal.querySelector( 'iframe' ) );
    }
  };

// ----- Payments ----- //

window.HD.payment = function( stripeKey ) {

  // 1. Set up payment amount options

  // Focus

  var customUpdate = function() {
    var amount = $( '.registry-amount [type=radio]:checked' ).val();
    if( amount === 'other' )
      $( '#amount_custom' ).removeClass( 'is-empty' ).focus();
    else
      $( '#amount_custom' ).addClass( 'is-empty' ).val( '' );
  };

  $( '.registry-amount-option' ).on( 'click', function( e ) {
    $( this ).find( '[type=radio]' ).prop( 'checked', true );
    customUpdate();
  });

  // Blur + reset
  $( '.registry-amount [type=radio]' ).on( 'change', customUpdate );

  // 2. Set up 2-part form
  $( '.registry-detail button' ).on( 'click', function( e ) {
    $( this ).hide().css( { 'visibility': 'hidden' } );
    $( this ).closest( '.registry-detail' ).find( '.registry-detail-hidden' ).addClass( 'is-showing' );
    e.preventDefault();
  });

  // 3. Replace modal contents on load

  $( '[data-item]' ).on( 'click', function( e ) {
    // If Registry JSON is present
    if( registryJSON ) {
      var id = $( this ).attr( 'data-item' );
      var item = registryJSON[id];
      $( '.registry-image img' ).attr( 'src', item.image );
      console.log( item );
      if( item.percent_funded !== null ) {
        $( '.registry-detail .registry-progress' ).attr( 'data-percent', item.percent_funded + '%' );
        $( '.registry-detail .registry-progress-bar' ).css( { width: item.percent_funded + '%' } );
      } else {
        $( '.registry-detail .registry-progress' ).attr( 'data-percent', '' );
        $( '.registry-detail .registry-progress-bar' ).css( { width: '0%' } );
      }
      if( item.cost_in_dollars )
        $( '.registry-progress-funded' ).html( "<strong>$" + item.funded + "</strong> / $" + item.cost_in_dollars );
      else
        $( '.registry-progress-funded' ).html( '' );
      $( '.registry-detail button' ).show().css( { 'visibility': 'visible' } );
      $( '.registry-detail-name' ).html( item.name );
      $( '.registry-detail-desc' ).html( item.description );
      $( '.registry-detail-hidden' ).removeClass( 'is-showing' );
      $( '.registry-detail textarea' ).html( '' );
      $( '.registry-amount-label' ).text( 'Your Gift' );
      $( '#registry_payment_stripe_token' ).val( '' );
      $( '#registry_payment_registry_item_id' ).val( item.id );
      $( '.is-erroneous' ).removeClass( 'is-erroneous' );
      $( '[type=radio]:checked' ).prop( 'checked', false );
      $( '#amount_custom' ).val( '' ).addClass( 'is-empty' );
      $( '#ccn' ).val( '' );
      $( '#cvc' ).val( '' );
      $( 'textarea' ).val( '' );
      $( '#expiry' ).val( '' );
    }
  });

  // 4. Set up client-side form validations

  $( '#amount_custom' ).payment( 'restrictNumeric' );
  $( '#ccn' ).payment( 'formatCardNumber' );
  $( '#cvc' ).payment( 'formatCardCVC' )
  $( '#expiry' ).payment( 'formatCardExpiry' );

  // 5. Send payment

  if( Stripe ) {
    Stripe.setPublishableKey( stripeKey );
    $( '#form_registry' ).submit( function( e ) {
      $( this ).find( '[type=submit]' ).parent().addClass( 'is-loading' );
      $( '.registry-amount-title' ).text( 'Amount' );
      $( '.is-erroneous' ).removeClass( 'is-erroneous' );

      var errors = [];
      var amount = $( '[name="registry_payment[amount]"]:checked' ).val();
      if( amount === 'other' )
        amount = parseInt( $( '#amount_custom' ).val() );
      else
        amount = parseInt( amount );
      var ccn = $( '#ccn' ).val();
      var cvc = $( '#cvc' ).val();
      var expiry = $.payment.cardExpiryVal( $( '#expiry' ).val() );

      if( !amount )
        errors.push( '.registry-amount-label' );

      if( ccn === '' || !$.payment.validateCardNumber( ccn ) )
        errors.push( '#ccn' );

      if( cvc === '' )
        errors.push( '#cvc' );

      if( expiry === '' || !$.payment.validateCardExpiry( expiry.month, expiry.year ) )
        errors.push( '#expiry' );

      if( errors.length === 0 ) {
        Stripe.card.createToken({
          number: ccn,
          cvc: cvc,
          exp_month: expiry.month,
          exp_year: expiry.year,
          name: invitationJSON.title
        }, stripeResponseHandler);

      } else {
        errorHandler( errors );
      }

      e.preventDefault();
    });
  }

  // 5. Save Record

  function stripeResponseHandler( status, response ) {
    if( response.error ) {
      alert( response.error.message );
      $( '.is-loading' ).removeClass( 'is-loading' );
    } else {
      $( '#registry_payment_stripe_token' ).val( response.id );
      $( '#stripe_receipt_email' ).html( $( '#receipt_email' ).val() );
      $.post(
        $( '#form_registry' ).attr( 'action' ),
        $( '#form_registry' ).serialize(),
        function( data ) {
          $( '.registry-detail-inner' ).addClass( 'is-hidden' );
          $( '.registry-thanks' ).addClass( 'is-showing' );
          $( '.registry-detail .registry-progress' ).attr( 'data-percent', data.percent_funded + '%' );
          $( '.registry-detail .registry-progress-bar' ).css( { width: data.percent_funded + '%' } );
          $( '.registry-detail .registry-progress-funded' ).html( data.funded );
          $( '.modal, .modal-screen' ).on( 'click', function( e ) {
            if( $( e.target ).hasClass( 'modal' ) || $( e.target ).hasClass( 'modal-screen' ) )
              location.reload();
          });
        }
      );
    }
  }

  // 6. Handle Errors

  function errorHandler( errors ) {
    $.each( errors, function( key, value ) {
      if( value === '.registry-amount-label' )
        $( value ).addClass( 'is-erroneous' ).text( 'Please select an amount' );
      else
        $( value ).parent().addClass( 'is-erroneous' );
    });
    $( '.modal' ).stop( true ).animate( { scrollTop: $( errors[0] ).offset().top } );
    $( '.is-loading' ).removeClass( 'is-loading' );
  }
};

// ----- RSVP ----- //

window.HD.rsvp = function() {
  $( '#form_rsvp' ).submit( function( e ) {
    var errors = [];
    $( '.is-erroneous' ).removeClass( 'is-erroneous' );

    $( 'li' ).each( function( i, el ) {
      var val = $( this ).find( '[type=radio]:checked' ).val();
      if( val !== 'yes' && val !== 'no' )
        errors.push( $( this ) );
    });

    if( errors.length === 0 ) {
      if( confirm( 'You can only RSVP once. Are you sure?' ) )
        return true;
      else
        e.preventDefault();
    } else {
      $.each( errors, function( i, $el ) {
        $el.addClass( 'is-erroneous' );
      });
      $( 'html, body' ).stop( true ).animate( { scrollTop: errors[0].offset().top } );
      e.preventDefault();
    }
  });
};

// ----- Vimeo ----- //

window.HD.vimeo = {};

window.HD.vimeo.play = function( el ) {
  el = el || false;
  if( el )
    el.contentWindow.postMessage( { "method" : "play" }, el.src );
};

window.HD.vimeo.pause = function( el ) {
  el = el || false;
  if( el )
    el.contentWindow.postMessage( { "method" : "pause" }, el.src );
};

// ----- ZIP ----- //

window.HD.ZIP = function( zip, options ) {
  options = options || {};
  var defaults = {
    state: options.state || '',
    city: options.city || ''
  };
  options = defaults;

  var eventHandler = function() {
    if( zip.value.length >= 5 ) {
      var url = "https://api.zippopotam.us/us/" + zip.value;
      $.ajax({
        url: url,
        success: function( responseText ) {
          options.city.value = responseText.places[0]['place name'];
          options.state.value = responseText.places[0]['state abbreviation'];
        }
      });
    }
  };

  $( zip ).on( 'keyup', eventHandler );
};
