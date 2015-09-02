/*
 * Gallery
 */
(function($) {

  var settings = {
    gallery: {
      speed: 4,
      fadeIn: true,
      fadeDelay: 250
    },
  };

  $(function() {
    $('.gallery').each(function() {
      // reel is container of gallery items
      var $reel = $(this).children('.reel'),
          $items = $reel.children('.item'); // Array contains every .item element

      // forward, backward is the controller to adjust
      // the position of th  gallery
      var $forward = $('<span class="forward"></span>'),
          $backward = $('<span class="backward"></span>');

      // Position of gallery that will be changed by gallery controller
      var pos = 0,
          leftLimit,
          rightLimit,
          itemWidth,
          reelWidth,
          timerId;

      // Setup position-updated function
      function _updatePos() {
        $reel.css('transform', 'translate(' + pos + 'px, 0)');
      }

      var _initPos = function() {
        pos = 0;
        leftLimit = 0;
        // rightLimit is probably negative
        rightLimit = $(this).width() - reelWidth;
        // The problem is that:The .gallery.width() is incorrect now! It should be same as .container.width()
        _updatePos();
      }.bind(this); // Set this to the .gallet itself!

      function _stopMoving() {
        window.clearInterval(timerId);
      }

      function _moveForward() {
        timerId = window.setInterval(function() {
          pos -= settings.gallery.speed;

          if (pos <= rightLimit) {
            pos = rightLimit;
            _stopMoving();
          }

          _updatePos();
        }, 10);
      }

      function _moveBackward() {
        timerId = window.setInterval(function() {
          pos += settings.gallery.speed;

          if (pos >= leftLimit) {
            pos = leftLimit;
            _stopMoving();
          }

          _updatePos();
        }, 10);
      }

      // function _makeItemSameHeight() {
      //   var $maxIdx = 0;
      //   // Search the max height
      //   $items.each(function(index) {
      //     if ((index != $maxIdx) && ($(this).height() > $($items[$maxIdx]).height())) {
      //       $maxIdx = index;
      //     }
      //   });
      //   // Make every element's height to be the max
      //   $items.each(function(index) {
      //     if ((index == $maxIdx) || ($(this).height() == $($items[$maxIdx]).height())) {
      //       return; //this is equivalent of 'continue' for jQuery loop
      //     }
      //     // Set height
      //     $(this).height($($items[$maxIdx]).height());
      //     // Adjust the button
      //   });
      // }

      // Add gallery-forward controller
      $forward.appendTo($(this)).hide().mouseenter(function(evt) {
        _moveForward();
      }).mouseleave(function(evt) {
        _stopMoving();
      });

      // Add gallery-backward controller
      $backward.appendTo($(this)).hide().mouseenter(function(evt) {
        _moveBackward();
      }).mouseleave(function(evt) {
        _stopMoving();
      });

      // Items: set fade-in animation
      if (settings.gallery.fadeIn) {
        // Add .loading class to every .item element
        $items.addClass('loading');

        // Register callback of onvisible to every .item element
        $(this).onVisible(function onceVisible() {
          $forward.hide();
          $backward.hide();

          // Get the width of .item element with padding and margin
          itemOuterWidth = $items.outerWidth(true);

          // Get how many items that won't be loaded
          var limit = $items.length - Math.ceil($(this).width() / itemOuterWidth);

          // fade-in animation: hide all first, then show one by one each time
          var fadeInTimerId = window.setInterval(function() {
            var loadingItems = $items.filter('.loading');
            var firstLoadingItem = loadingItems.first();

            // Stop the fade-in animation!
            if (loadingItems.length <= limit) {
              window.clearInterval(fadeInTimerId);
              $items.removeClass('loading');
              // Show gallery-forward, galley-backward controller
              // after animation stop
              $forward.show();
              $backward.show();
            }

            // Remove .loading class from .item elements one by one.
            firstLoadingItem.removeClass('loading');
          }, settings.gallery.fadeDelay);
        }.bind(this), 50);
      }

      // Initialize
      $(window).load(function() {
        reelWidth = $reel[0].scrollWidth;
        _initPos();
        // _makeItemSameHeight();
        if (!settings.gallery.fadeIn) {
          $forward.show();
          $backward.show();
        }
      }.bind(this)); // Set this to the .gallet itself!

    });


    // The following code will be triggered after all document content
    // includeing text, images, ... are loaded.
  });

})(jQuery);
