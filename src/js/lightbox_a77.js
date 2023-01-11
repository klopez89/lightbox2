/*!
 * Lightbox v2.11.2
 * by Lokesh Dhakar
 *
 * More info:
 * http://lokeshdhakar.com/projects/lightbox2/
 *
 * Copyright Lokesh Dhakar
 * Released under the MIT license
 * https://github.com/lokesh/lightbox2/blob/master/LICENSE
 *
 * @preserve
 */

// Uses Node, AMD or browser globals to create a module.
(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(['jquery'], factory);
    } else if (typeof exports === 'object') {
        // Node. Does not work with strict CommonJS, but
        // only CommonJS-like environments that support module.exports,
        // like Node.
        module.exports = factory(require('jquery'));
    } else {
        // Browser globals (root is window)
        root.lightbox = factory(root.jQuery);
    }
}(this, function ($) {

  function Lightbox(options) {
    this.album = [];
    this.currentImageIndex = void 0;
    this.init();

    // options
    this.options = $.extend({}, this.constructor.defaults);
    this.option(options);
  }

  // Descriptions of all options available on the demo site:
  // http://lokeshdhakar.com/projects/lightbox2/index.html#options
  Lightbox.defaults = {
    albumLabel: 'Image %1 of %2',
    alwaysShowNavOnTouchDevices: false,
    fadeDuration: 600,
    fitImagesInViewport: true,
    imageFadeDuration: 600,
    // maxWidth: 800,
    maxHeight: 420,
    positionFromTop: 50,
    resizeDuration: 700,
    showImageNumberLabel: true,
    wrapAround: false,
    disableScrolling: true,
    /*
    Sanitize Title
    If the caption data is trusted, for example you are hardcoding it in, then leave this to false.
    This will free you to add html tags, such as links, in the caption.

    If the caption data is user submitted or from some other untrusted source, then set this to true
    to prevent xss and other injection attacks.
     */
    sanitizeTitle: false
  };

  Lightbox.prototype.option = function(options) {
    $.extend(this.options, options);
  };

  Lightbox.prototype.imageCountLabel = function(currentImageNum, totalImages) {
    return this.options.albumLabel.replace(/%1/g, currentImageNum).replace(/%2/g, totalImages);
  };

  Lightbox.prototype.init = function() {
    var self = this;
    // Both enable and build methods require the body tag to be in the DOM.
    $(document).ready(function() {
      self.enable();
      self.build();
    });
  };

  // Loop through anchors and areamaps looking for either data-lightbox attributes or rel attributes
  // that contain 'lightbox'. When these are clicked, start lightbox.
  Lightbox.prototype.enable = function() {
    var self = this;
    $('body').on('click', 'a[rel^=lightbox], area[rel^=lightbox], a[data-lightbox], area[data-lightbox]', function(event) {
      self.start($(event.currentTarget));
      return false;
    });
  };

  // Build html for the lightbox and the overlay.
  // Attach event handlers to the new DOM elements. click click click
  Lightbox.prototype.build = function() {
    if ($('#lightbox').length > 0) {
        return;
    }

    var self = this;

    // The two root notes generated, #lightboxOverlay and #lightbox are given
    // tabindex attrs so they are focusable. We attach our keyboard event
    // listeners to these two elements, and not the document. Clicking anywhere
    // while Lightbox is opened will keep the focus on or inside one of these
    // two elements.
    //
    // We do this so we can prevent propogation of the Esc keypress when
    // Lightbox is open. This prevents it from intefering with other components
    // on the page below.
    //
    // Github issue: https://github.com/lokesh/lightbox2/issues/663
    html_string = `
      <div id="lightboxOverlay" tabindex="-1" class="lightboxOverlay"></div>
      <div id="lightbox" tabindex="-1" class="lightbox">
        <div class="lightbox-container">
          <div class="lb-nav">
            <a class="lb-prev" aria-label="Previous image" href="" ></a>
            <a class="lb-next" aria-label="Next image" href="" ></a>
          </div>
          <div class="lb-close-alt"><button class="lb-dismiss">Dismiss</button></div>
          <div class="lb-dataContainer">
            <div class="hidden-details">
              <div class="lb-data">
                <div class="lb-details">
                    <span class="lb-caption"></span>
                </div>
              </div>
            </div>
            <div class="lb-data-background">
              <div class="lb-data">
                <div class="lb-data-details">
                  <div class="lb-prompt-container">
                    <span class="lb-prompt"></span>
                    <div class="scroll-hint"></div>
                  </div>
                  <button class="toggle-hidden-button" id="toggleHiddenButton">Show Prompt Details</button>
                  <div class="lb-caption in-main-data"></div>
                  <span class="lb-number"></span>
                </div>
                <div class="lb-button-menu">
                  <div class="button-container">
                    <button class="lb-button" id="lbLikeButton"><i class="fa fa-thumbs-up lb-like-button"></i></button>
                    <button class="lb-button" id="lbFavButton"><i class="fa fa-heart lb-favorite-button"></i></button>
                    <button class="lb-button" id="lbFlagButton"><i class="fa fa-flag lb-flag-button"></i></button>
                  </div>
                  <div class="right-button-container">
                    <button class="lb-button" id="lbDownloadButton"><i class="fa fa-download lb-download-button"></i></button>
                    <button class="lb-button" id="lbShareButton"><i class="fa fa-share lb-share-button"></i></button>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div class="lb-outerContainer">
            <div class="lb-container">
              <img class="lb-image" src="data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==" alt=""/>
              <div class="lb-loader">
                <a class="lb-cancel"></a>
              </div>
            </div>
          </div>
      </div>
    `
    let html_element = $($.parseHTML(html_string));
    html_element.appendTo($('body'));

    // Cache jQuery objects
    this.$lightbox       = $('#lightbox');
    this.$overlay        = $('#lightboxOverlay');
    this.$lbContainer    = this.$lightbox.find('.lightbox-container');
    this.$dataContainer  = this.$lightbox.find('.lb-dataContainer');
    this.$outerContainer = this.$lightbox.find('.lb-outerContainer');
    this.$container      = this.$lightbox.find('.lb-container');
    this.$image          = this.$lightbox.find('.lb-image');
    this.$nav            = this.$lightbox.find('.lb-nav');

    // Store css values for future lookup
    this.containerPadding = {
      top: parseInt(this.$container.css('padding-top'), 10),
      right: parseInt(this.$container.css('padding-right'), 10),
      bottom: parseInt(this.$container.css('padding-bottom'), 10),
      left: parseInt(this.$container.css('padding-left'), 10)
    };

    this.imageBorderWidth = {
      top: parseInt(this.$image.css('border-top-width'), 10),
      right: parseInt(this.$image.css('border-right-width'), 10),
      bottom: parseInt(this.$image.css('border-bottom-width'), 10),
      left: parseInt(this.$image.css('border-left-width'), 10)
    };

    // Attach event handlers to the newly minted DOM elements
    this.$overlay.hide().on('click', function() {
      self.end();
      return false;
    });

    this.$lightbox.hide().on('click', function(event) {
      if ($(event.target).attr('id') === 'lightbox') {
        self.end();
      }
    });

    this.$outerContainer.on('click', function(event) {
      if ($(event.target).attr('id') === 'lightbox') {
        self.end();
      }
      return false;
    });

    this.$lightbox.find('.lb-prev').on('click', function() {
      if (self.currentImageIndex === 0) {
        self.changeImage(self.album.length - 1);
      } else {
        self.changeImage(self.currentImageIndex - 1);
      }
      return false;
    });

    this.$lightbox.find('.lb-next').on('click', function() {
      if (self.currentImageIndex === self.album.length - 1) {
        self.changeImage(0);
      } else {
        self.changeImage(self.currentImageIndex + 1);
      }
      return false;
    });

    /*
      Show context menu for image on right-click

      There is a div containing the navigation that spans the entire image and lives above of it. If
      you right-click, you are right clicking this div and not the image. This prevents users from
      saving the image or using other context menu actions with the image.

      To fix this, when we detect the right mouse button is pressed down, but not yet clicked, we
      set pointer-events to none on the nav div. This is so that the upcoming right-click event on
      the next mouseup will bubble down to the image. Once the right-click/contextmenu event occurs
      we set the pointer events back to auto for the nav div so it can capture hover and left-click
      events as usual.
     */
    this.$nav.on('mousedown', function(event) {
      if (event.which === 3) {
        self.$nav.css('pointer-events', 'none');

        self.$lightbox.one('contextmenu', function() {
          setTimeout(function() {
              this.$nav.css('pointer-events', 'auto');
          }.bind(self), 0);
        });
      }
    });


    this.$lightbox.find('.lb-loader, .lb-close-alt').on('click', function() {
      self.end();
      return false;
    });

    const toggleButton = document.getElementById('toggleHiddenButton');
    const child = document.querySelector('.hidden-details');

    toggleButton.addEventListener('click', () => {
      child.classList.toggle('open');

      if (child.classList.contains('open')) {
        const childHeight = child.offsetHeight;
        child.style.top = `-${childHeight}px`;
        toggleButton.innerHTML = 'Hide Prompt Details'
      } else {
        child.style.top = '0px';
        toggleButton.innerHTML = 'Show Prompt Details'
      }
    });

    // Configure alt dismiss button
    const dismissButton = document.querySelector('.lb-dismiss');
    dismissButton.addEventListener('click', () => {
      this.end();
    });
  };

  // Show overlay and lightbox. If the image is part of a set, add siblings to album array.
  Lightbox.prototype.start = function($link) {
    var self    = this;
    var $window = $(window);

    $window.on('resize', $.proxy(this.sizeOverlay, this));
    this.sizeOverlay();

    this.album = [];
    var imageNumber = 0;

// TODO
    function addToAlbum($link) {
      self.album.push({
        alt: $link.attr('data-alt'),
        link: $link.attr('href'),
        title: $link.attr('data-title') || $link.attr('title'),
        hidden_details: $link.attr('data-hidden-details'),
        prompt: $link.attr('data-prompt'),
        prompt_id: $link.attr('data-prompt-id'),
        is_liked: $link.attr('data-is-liked'),
        is_favorited: $link.attr('data-is-favorited'),
        like_btn_func: $link.attr('data-like-func'),
        fav_btn_func: $link.attr('data-fav-func'),
        flag_btn_func: $link.attr('data-flag-func'),
        downl_btn_func: $link.attr('data-download-func'),
        share_btn_func: $link.attr('data-share-func')
      });
    }

    // Support both data-lightbox attribute and rel attribute implementations
    var dataLightboxValue = $link.attr('data-lightbox');
    var $links;

    if (dataLightboxValue) {
      $links = $($link.prop('tagName') + '[data-lightbox="' + dataLightboxValue + '"]');
      for (var i = 0; i < $links.length; i = ++i) {
        addToAlbum($($links[i]));
        if ($links[i] === $link[0]) {
          imageNumber = i;
        }
      }
    } else {
      if ($link.attr('rel') === 'lightbox') {
        // If image is not part of a set
        addToAlbum($link);
      } else {
        // If image is part of a set
        $links = $($link.prop('tagName') + '[rel="' + $link.attr('rel') + '"]');
        for (var j = 0; j < $links.length; j = ++j) {
          addToAlbum($($links[j]));
          if ($links[j] === $link[0]) {
            imageNumber = j;
          }
        }
      }
    }

    // Position Lightbox

    let scroll_offset = $(window).scrollTop();
    this.$lightbox.css({
      top: `calc(50% + ${scroll_offset}px)`,
      left: '50%',
      transform: 'translate(-50%, -50%)'
    }).fadeIn(this.options.fadeDuration);


    // Add an event listener for the keydown event of the document
    document.addEventListener('keydown', (event) => {
      // Check if the key pressed is the Esc key (key code 27)
      if (event.keyCode === 27) {
        // Call the escKeyPressed function
        this.end();
      }
    });


    // Disable scrolling of the page while open
    if (this.options.disableScrolling) {
      $('body').addClass('lb-disable-scrolling');
    }

    this.changeImage(imageNumber);
  };

  // Hide most UI elements in preparation for the animated resizing of the lightbox.
  Lightbox.prototype.changeImage = function(imageNumber) {
    var self = this;
    var filename = this.album[imageNumber].link;
    var filetype = filename.split('.').slice(-1)[0];
    var $image = this.$lightbox.find('.lb-image');

    // Disable keyboard nav during transitions
    this.disableKeyboardNav();

    // Show loading state
    this.$overlay.fadeIn(this.options.fadeDuration);
    $('.lb-loader').fadeIn('slow');
    // this.$lightbox.find('.lb-image, .lb-nav, .lb-prev, .lb-next, .lb-dataContainer, .lb-numbers, .lb-prompt').hide();
    this.$lightbox.find('.lb-caption').animate({opacity: '100%'}, this.options.imageFadeDuration);

    this.$outerContainer.addClass('animating');

    // When image to show is preloaded, we send the width and height to sizeContainer()
    var preloader = new Image();
    preloader.onload = function() {
      var $preloader;
      var imageHeight;
      var imageWidth;
      var maxImageHeight;
      var maxImageWidth;
      var windowHeight;
      var windowWidth;

      $image.attr({
        'alt': self.album[imageNumber].alt,
        'src': filename
      });

      $preloader = $(preloader);

      $image.width(preloader.width);
      $image.height(preloader.height);
      windowWidth = $(window).width();
      windowHeight = $(window).height();

      // Calculate the max image dimensions for the current viewport.
      // Take into account the border around the image and an additional 10px gutter on each side.
      maxImageWidth  = windowWidth - self.containerPadding.left - self.containerPadding.right - self.imageBorderWidth.left - self.imageBorderWidth.right - 20;
      maxImageHeight = windowHeight - self.containerPadding.top - self.containerPadding.bottom - self.imageBorderWidth.top - self.imageBorderWidth.bottom - self.options.positionFromTop - 70;

      /*
      Since many SVGs have small intrinsic dimensions, but they support scaling
      up without quality loss because of their vector format, max out their
      size.
      */
      if (filetype === 'svg') {
        $image.width(maxImageWidth);
        $image.height(maxImageHeight);
      }

      // Fit image inside the viewport.
      if (self.options.fitImagesInViewport) {

        // Check if image size is larger then maxWidth|maxHeight in settings
        if (self.options.maxWidth && self.options.maxWidth < maxImageWidth) {
          maxImageWidth = self.options.maxWidth;
        }
        if (self.options.maxHeight && self.options.maxHeight < maxImageHeight) {
          maxImageHeight = self.options.maxHeight;
        }

      } else {
        maxImageWidth = self.options.maxWidth || preloader.width || maxImageWidth;
        maxImageHeight = self.options.maxHeight || preloader.height || maxImageHeight;
      }

      // Is the current image's width or height is greater than the maxImageWidth or maxImageHeight
      // option than we need to size down while maintaining the aspect ratio.
      if ((preloader.width > maxImageWidth) || (preloader.height > maxImageHeight)) {
        if ((preloader.width / maxImageWidth) > (preloader.height / maxImageHeight)) {
          imageWidth  = maxImageWidth;
          imageHeight = parseInt(preloader.height / (preloader.width / imageWidth), 10);
          $image.width(imageWidth);
          $image.height(imageHeight);
        } else {
          imageHeight = maxImageHeight;
          imageWidth = parseInt(preloader.width / (preloader.height / imageHeight), 10);
          $image.width(imageWidth);
          $image.height(imageHeight);
        }
      }

      size_container_width = $image.width();
      size_container_height = $image.height();
      self.sizeContainer($image.width(), $image.height());
    };

    // Preload image before showing
    preloader.src = this.album[imageNumber].link;
    this.currentImageIndex = imageNumber;
  };

  // Stretch overlay to fit the viewport
  Lightbox.prototype.sizeOverlay = function() {
    var self = this;
    /*
    We use a setTimeout 0 to pause JS execution and let the rendering catch-up.
    Why do this? If the `disableScrolling` option is set to true, a class is added to the body
    tag that disables scrolling and hides the scrollbar. We want to make sure the scrollbar is
    hidden before we measure the document width, as the presence of the scrollbar will affect the
    number.
    */
    setTimeout(function() {
      self.$overlay
        .width($(document).width())
        .height($(document).height());

    }, 0);
  };


  // Animate the size of the lightbox to fit the image we are showing
  // This method also shows the the image.
  Lightbox.prototype.sizeContainer = function(imageWidth, imageHeight) {
    var self = this;

    var oldWidth  = this.$outerContainer.outerWidth();
    var oldHeight = this.$outerContainer.outerHeight();
    var newWidth  = imageWidth + this.containerPadding.left + this.containerPadding.right + this.imageBorderWidth.left + this.imageBorderWidth.right;
    var newHeight = imageHeight + this.containerPadding.top + this.containerPadding.bottom + this.imageBorderWidth.top + this.imageBorderWidth.bottom;

    function postResize() {

      self.$lightbox.find('.lb-dataContainer').width(newWidth);
      self.$lightbox.find('.lb-prev').height(newHeight * 0.8);
      self.$lightbox.find('.lb-next').height(newHeight * 0.8);
      self.$lightbox.find('.lb-nav').height(newHeight * 0.8);
      //adjust nav top positions in order to have bottom edge alignment with image on vertical card and with entire lightbox container on horizontal card
      self.$lightbox.find('.lb-prev').css('top', `${newHeight * 0.2}px`);
      self.$lightbox.find('.lb-next').css('top', `${newHeight * 0.2}px`);
      self.$lightbox.find('.lb-nav').css('top', `${newHeight * 0.2}px`);

      // Set focus on one of the two root nodes so keyboard events are captured.
      // self.$overlay.focus(); // enabling this caused a jump when i was at the bottom of the body on iphone, so removed it

      self.showImage();

      // Configure the scroll hint visibility based on whether prompt height exceeded its max
      var $prompt = self.$lightbox.find('.lb-prompt');
      const maxHeight = parseInt($prompt.css('max-height'), 10);
      var $promptContainer = self.$lightbox.find('.lb-prompt-container');

      const scrollHeight = $prompt.prop('scrollHeight');
      console.log(`the scroll height: ${scrollHeight}, and max height: ${maxHeight}`);

      if (scrollHeight > maxHeight) {
        console.log(`class list for prompt container before adding, ${$promptContainer.attr('class')}`);
        $promptContainer.addClass('showing');
        console.log(`class list for prompt container after adding, ${$promptContainer.attr('class')}`);
      } else {
        console.log(`class list for prompt container before removing, ${$promptContainer.attr('class')}`);
        $promptContainer.removeClass('showing');
        console.log(`class list for prompt container after removing, ${$promptContainer.attr('class')}`);
      }

    }

    if (oldWidth !== newWidth || oldHeight !== newHeight) {
      this.$outerContainer.animate({
        width: newWidth,
        height: newHeight
      }, this.options.resizeDuration, 'swing', function() {
        postResize();
      });
    } else {
      postResize();
    }
  };

  // Display the image and its details and begin preload neighboring images.
  Lightbox.prototype.showImage = function() {
    this.$lightbox.find('.lb-loader').stop(true).hide();
    this.$lightbox.find('.lb-image').fadeIn(this.options.imageFadeDuration);

    this.updateNav();
    this.updateDetails();
    this.preloadNeighboringImages();
    this.enableKeyboardNav();
  };

  // Display previous and next navigation if appropriate.
  Lightbox.prototype.updateNav = function() {
    // Check to see if the browser supports touch events. If so, we take the conservative approach
    // and assume that mouse hover events are not supported and always show prev/next navigation
    // arrows in image sets.
    var alwaysShowNav = false;
    try {
      document.createEvent('TouchEvent');
      alwaysShowNav = (this.options.alwaysShowNavOnTouchDevices) ? true : false;
    } catch (e) {}

    this.$lightbox.find('.lb-nav').show();

    if (this.album.length > 1) {
      if (this.options.wrapAround) {
        if (alwaysShowNav) {
          this.$lightbox.find('.lb-prev, .lb-next').css('opacity', '1');
        }
        this.$lightbox.find('.lb-prev, .lb-next').show();
      } else {
        if (this.currentImageIndex > 0) {
          this.$lightbox.find('.lb-prev').show();
          if (alwaysShowNav) {
            this.$lightbox.find('.lb-prev').css('opacity', '1');
          }
        }
        if (this.currentImageIndex < this.album.length - 1) {
          this.$lightbox.find('.lb-next').show();
          if (alwaysShowNav) {
            this.$lightbox.find('.lb-next').css('opacity', '1');
          }
        }
      }
    }
  };

  // Display caption, image number, and closing button.
  Lightbox.prototype.updateDetails = function() {
    var self = this;

    if (typeof this.album[this.currentImageIndex].prompt !== 'undefined' &&
      this.album[this.currentImageIndex].prompt !== '') {
      var $prompt = this.$lightbox.find('.lb-prompt');
      if (this.options.sanitizeTitle) {
        $prompt.text(this.album[this.currentImageIndex].prompt);
      } else {
        $prompt.html(this.album[this.currentImageIndex].prompt);
      }
      $prompt.fadeIn('fast');
    }

    // Enable anchor clicks in the injected caption html.
    // Thanks Nate Wright for the fix. @https://github.com/NateWr
    if (typeof this.album[this.currentImageIndex].title !== 'undefined' &&
      this.album[this.currentImageIndex].title !== '') {
      var $timestamp = this.$lightbox.find('.lb-timestamp');
      if (this.options.sanitizeTitle) {
        $timestamp.text(this.album[this.currentImageIndex].title);
      } else {
        $timestamp.html(this.album[this.currentImageIndex].title);
      }
      $timestamp.fadeIn('fast');
    }

    if (typeof this.album[this.currentImageIndex].title !== 'undefined' &&
      this.album[this.currentImageIndex].title !== '') {
      var $details = this.$lightbox.find('.lb-caption');
      if (this.options.sanitizeTitle) {
        $details.text(this.album[this.currentImageIndex].hidden_details);
      } else {
        $details.html(this.album[this.currentImageIndex].hidden_details);
      }

      $details.animate({opacity: '100%'}, 'fast', 'linear', function() {
      });
    }

    if (this.album.length > 1 && this.options.showImageNumberLabel) {
      var labelText = this.imageCountLabel(this.currentImageIndex + 1, this.album.length);
      this.$lightbox.find('.lb-number').text(labelText).fadeIn('fast');
    } else {
      this.$lightbox.find('.lb-number').hide();
    }

    this.$outerContainer.removeClass('animating');

    this.$lightbox.find('.lb-dataContainer').fadeIn(this.options.resizeDuration, function() {
      return self.sizeOverlay();
    });

    // Configure social and share buttons
      // Like
    if (typeof this.album[this.currentImageIndex].like_btn_func !== 'undefined' &&
    this.album[this.currentImageIndex].like_btn_func !== '') {
      var $likebutton = this.$lightbox.find('#lbLikeButton');
      $likebutton[0].setAttribute('onclick', this.album[this.currentImageIndex].like_btn_func);
      $likebutton[0].setAttribute('prompt-id', this.album[this.currentImageIndex].prompt_id)


      let like_button_iElement = $($likebutton[0]).children("i")[0];
      let button_classList = like_button_iElement.classList;
      let containsSelected = button_classList.contains('selected');

      if (this.album[this.currentImageIndex].is_liked && containsSelected == false) {
        $(like_button_iElement).addClass('selected');
      }

      if (this.album[this.currentImageIndex].is_liked == false && containsSelected == true) {
        $(like_button_iElement).removeClass('selected');
      }

      $likebutton.fadeIn('fast');
    }

      // Favorite
    if (typeof this.album[this.currentImageIndex].fav_btn_func !== 'undefined' &&
      this.album[this.currentImageIndex].fav_btn_func !== '') {
      var $favbutton = this.$lightbox.find('#lbFavButton');
      $favbutton[0].setAttribute('onclick', this.album[this.currentImageIndex].fav_btn_func);
      $favbutton[0].setAttribute('prompt-id', this.album[this.currentImageIndex].prompt_id)
      $favbutton.fadeIn('fast');
    }
      // Flag
    if (typeof this.album[this.currentImageIndex].flag_btn_func !== 'undefined' &&
      this.album[this.currentImageIndex].flag_btn_func !== '') {
      var $flagbutton = this.$lightbox.find('#lbFlagButton');
      $flagbutton[0].setAttribute('onclick', this.album[this.currentImageIndex].flag_btn_func);
      $flagbutton[0].setAttribute('prompt-id', this.album[this.currentImageIndex].prompt_id)
      $flagbutton.fadeIn('fast');
    }

    // Download
    if (typeof this.album[this.currentImageIndex].downl_btn_func !== 'undefined' &&
      this.album[this.currentImageIndex].downl_btn_func !== '') {
      var $downlbutton = this.$lightbox.find('#lbDownloadButton');
      $downlbutton[0].setAttribute('onclick', this.album[this.currentImageIndex].downl_btn_func);
      $downlbutton[0].setAttribute('prompt-id', this.album[this.currentImageIndex].prompt_id)
      $downlbutton.fadeIn('fast');
    }

    // Share
    if (typeof this.album[this.currentImageIndex].share_btn_func !== 'undefined' &&
      this.album[this.currentImageIndex].share_btn_func !== '') {
      var $sharebutton = this.$lightbox.find('#lbShareButton');
      $sharebutton[0].setAttribute('onclick', this.album[this.currentImageIndex].share_btn_func);
      $sharebutton[0].setAttribute('prompt-id', this.album[this.currentImageIndex].prompt_id)
      $sharebutton.fadeIn('fast');
    }
  };

  // Preload previous and next images in set.
  Lightbox.prototype.preloadNeighboringImages = function() {
    if (this.album.length > this.currentImageIndex + 1) {
      var preloadNext = new Image();
      preloadNext.src = this.album[this.currentImageIndex + 1].link;
    }
    if (this.currentImageIndex > 0) {
      var preloadPrev = new Image();
      preloadPrev.src = this.album[this.currentImageIndex - 1].link;
    }
  };

  Lightbox.prototype.enableKeyboardNav = function() {
    this.$lightbox.on('keyup.keyboard', $.proxy(this.keyboardAction, this));
    this.$overlay.on('keyup.keyboard', $.proxy(this.keyboardAction, this));
  };

  Lightbox.prototype.disableKeyboardNav = function() {
    this.$lightbox.off('.keyboard');
    this.$overlay.off('.keyboard');
  };

  Lightbox.prototype.keyboardAction = function(event) {
    var KEYCODE_ESC        = 27;
    var KEYCODE_LEFTARROW  = 37;
    var KEYCODE_RIGHTARROW = 39;

    var keycode = event.keyCode;
    if (keycode === KEYCODE_ESC) {
      // Prevent bubbling so as to not affect other components on the page.
      event.stopPropagation();
      this.end();
    } else if (keycode === KEYCODE_LEFTARROW) {
      if (this.currentImageIndex !== 0) {
        this.changeImage(this.currentImageIndex - 1);
      } else if (this.options.wrapAround && this.album.length > 1) {
        this.changeImage(this.album.length - 1);
      }
    } else if (keycode === KEYCODE_RIGHTARROW) {
      if (this.currentImageIndex !== this.album.length - 1) {
        this.changeImage(this.currentImageIndex + 1);
      } else if (this.options.wrapAround && this.album.length > 1) {
        this.changeImage(0);
      }
    }
  };

  // Closing time. :-(
  Lightbox.prototype.end = function() {
    this.disableKeyboardNav();
    $(window).off('resize', this.sizeOverlay);
    this.$lightbox.fadeOut(this.options.fadeDuration);
    this.$overlay.fadeOut(this.options.fadeDuration);

    if (this.options.disableScrolling) {
      $('body').removeClass('lb-disable-scrolling');
    }
  };

  return new Lightbox();
}));
