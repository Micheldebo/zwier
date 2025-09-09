document.addEventListener("DOMContentLoaded", function() {
    // -----------------------------------------
    // Lenis integration with GSAP ScrollTrigger
    // Run ONLY on non-touch + no reduced motion
    // -----------------------------------------
    const isTouch =
          ("ontouchstart" in window) ||
          navigator.maxTouchPoints > 0 ||
          window.matchMedia("(pointer: coarse)").matches;

    const prefersReduced =
          window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let lenis = null;

    if (!isTouch && !prefersReduced) {
      // ✅ Non-touch: enable Lenis
      lenis = new Lenis();
      // Expose for debugging / hot reload safety
      window.__lenis = lenis;

      lenis.on("scroll", ScrollTrigger.update);
      gsap.ticker.add((time) => { 
        lenis.raf(time * 1000);
      });
      gsap.ticker.lagSmoothing(0);
    } else {
      // ❌ Touch or reduced motion: ensure native scroll
      if (window.__lenis && typeof window.__lenis.destroy === "function") {
        try { window.__lenis.destroy(); } catch(e) {}
        window.__lenis = null;
      }
      // Make sure ScrollTrigger stays in sync with the viewport
      ScrollTrigger.update();
    }

    // -----------------------------------------
    // Button click to set localStorage flag
    // -----------------------------------------
    var filterButton = document.querySelector(".opens-filter");
    if (filterButton) {
      filterButton.addEventListener("click", function() {
        localStorage.setItem("triggerClick", "true");
      });
    }

    // -----------------------------------------
    // Webflow Push: Update copyright year
    // -----------------------------------------
    if (window.Webflow && typeof Webflow.push === "function") {
      Webflow.push(function() {
        $('.copyright-year').text(new Date().getFullYear());
      });
    }

    // -----------------------------------------
    // Shared cursor functionality
    // -----------------------------------------
    (function() {
      const cursorElements = [
        {
          className: "button-right",
          imageUrl: "https://cdn.prod.website-files.com/66bef0bef6cb13624d51d95b/66cedc79aeb8a340f1671630_slider-next.svg"
        },
        {
          className: "button-left",
          imageUrl: "https://cdn.prod.website-files.com/66bef0bef6cb13624d51d95b/66cedc79bc5b2155823ab0df_slider-prev.svg"
        }
      ];

      cursorElements.forEach(function(element) {
        const cursorImage = document.createElement("img");
        cursorImage.src = element.imageUrl;
        cursorImage.classList.add("cursor-image");
        document.body.appendChild(cursorImage);

        let targetX = 0, targetY = 0;
        document.addEventListener("mousemove", function(e) {
          targetX = e.clientX;
          targetY = e.clientY;
        });

        function updateCursor() {
          const currentX = parseFloat(cursorImage.style.left) || 0;
          const currentY = parseFloat(cursorImage.style.top) || 0;
          const dx = targetX - currentX;
          const dy = targetY - currentY;
          const vx = dx * 0.3;
          const vy = dy * 0.3;
          cursorImage.style.position = "absolute";
          cursorImage.style.left = currentX + vx + "px";
          cursorImage.style.top = currentY + vy + "px";
          requestAnimationFrame(updateCursor);
        }
        updateCursor();

        // Set hover effects for elements (only for .for-rooms, .for-gallery, or .for-boxed and excluding .for-reviews or for-booking-food)
        document.querySelectorAll(`.${element.className}`).forEach(function(el) {
          if (el.closest(".for-rooms, .for-gallery") && !el.closest(".for-reviews, for-booking-food, for-boxed")) {
            el.addEventListener("mouseenter", function() {
              cursorImage.style.transform = "translate(-50%, -50%) scale(1)";
            });
            el.addEventListener("mouseleave", function() {
              cursorImage.style.transform = "translate(-50%, -50%) scale(0)";
            });
          }
        });
      });
    })();

    // -----------------------------------------
    // Only run in Editor: Mute videos
    // -----------------------------------------
    if (window.Webflow && Webflow.env && Webflow.env("editor")) {
      const muteVideos = () => {
        document.querySelectorAll("video").forEach(video => {
          if (!video.hasAttribute("muted")) {
            video.muted = true;
            video.setAttribute("muted", ""); // force native attribute
          }
        });
      };

      // Initial mute call and observe for new videos
      muteVideos();
      const observer = new MutationObserver(() => {
        muteVideos();
      });
      observer.observe(document.body, { childList: true, subtree: true });
    }

    // -----------------------------------------
    // Navigation links: active state & smooth scrolling
    // -----------------------------------------
    (function initNavLinks() {
      // Update active nav link styles on scroll
      document.addEventListener("scroll", function() {
        const navLinks = document.querySelectorAll(".anchor-link");
        navLinks.forEach(navLink => {
          const label = navLink.querySelector(".label");
          const underline = navLink.querySelector(".underline");
          if (navLink.classList.contains("w--current")) {
            if (label) {
              label.classList.remove("white");
              label.classList.add("active");
            }
            if (underline) {
              underline.style.display = "block";
            }
          } else {
            if (label) {
              label.classList.remove("active");
              label.classList.add("white");
            }
            if (underline) {
              underline.style.display = "none";
            }
          }
        });
      });

      // Hover effects and smooth scrolling for navigation links
      const navLinks = document.querySelectorAll(".anchor-link");
      const isDesktop = window.innerWidth >= 992;
      if (isDesktop) {
        navLinks.forEach(navLink => {
          const underline = navLink.querySelector(".underline");
          navLink.addEventListener("mouseenter", () => {
            if (underline) underline.style.display = "block";
          });
          navLink.addEventListener("mouseleave", () => {
            const label = navLink.querySelector(".label");
            if (underline && !label.classList.contains("active")) {
              underline.style.display = "none";
            }
          });
        });
      }
      navLinks.forEach(navLink => {
        navLink.addEventListener("click", function(e) {
          const href = this.getAttribute("href");
          if (href && href.startsWith("#")) {
            const targetId = href.substring(1);
            const targetEl = document.getElementById(targetId);
            if (targetEl) {
              e.preventDefault();
              const offset = window.innerWidth <= 991 ? 150 : 200;
              const elementTop = targetEl.getBoundingClientRect().top + window.scrollY - offset;
              window.scrollTo({
                top: elementTop,
                behavior: "smooth"
              });
            }
          }
        });
      });
    })();

    // -----------------------------------------
    // Exit Intent Popup
    // -----------------------------------------

    (function () {
      const CookieService = {
        setCookie(name, value, days) {
          const date = new Date();
          date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
          const expires = "; expires=" + date.toUTCString();
          document.cookie = name + "=" + (value || "") + expires + "; path=/";
        },
        getCookie(name) {
          const cookieMatch = document.cookie
          .split('; ')
          .find(row => row.startsWith(name + "="));
          return cookieMatch ? cookieMatch.split('=')[1] : null;
        }
      };

      const exitPopup = document.querySelector('[ms-code-popup="exit-intent"]');
      if (!exitPopup || CookieService.getCookie('exitIntentShown')) return;

      let shown = false;

      function showPopup() {
        if (shown) return;
        shown = true;
        exitPopup.style.display = 'flex';
        CookieService.setCookie('exitIntentShown', true, 30);
        document.removeEventListener('mouseout', handleMouseOut);
      }

      function handleMouseOut(e) {
        const isLeavingTop = !e.toElement && !e.relatedTarget && e.clientY < 10;
        if (isLeavingTop) showPopup();
      }

      // Show after 3 seconds if no intent detected yet
      setTimeout(showPopup, 3000);
      document.addEventListener('mouseout', handleMouseOut);
    })();


    // -----------------------------------------
    // Window load: Initialize marquee and Swiper sliders
    // -----------------------------------------
    window.addEventListener("load", function() {
      // Marquee animation with scroll direction
      function initMarqueeScrollDirection() {
        document.querySelectorAll("[data-marquee-scroll-direction-target]").forEach((marquee) => {
          const marqueeContent = marquee.querySelector("[data-marquee-collection-target]");
          const marqueeScroll = marquee.querySelector("[data-marquee-scroll-target]");
          if (!marqueeContent || !marqueeScroll) return;

          const { marqueeSpeed: speed, marqueeDirection: direction, marqueeDuplicate: duplicate, marqueeScrollSpeed: scrollSpeed } = marquee.dataset;
          const marqueeSpeedAttr = parseFloat(speed);
          const marqueeDirectionAttr = direction === "right" ? 1 : -1;
          const duplicateAmount = parseInt(duplicate || 0);
          const scrollSpeedAttr = parseFloat(scrollSpeed);
          const speedMultiplier = window.innerWidth < 479 ? 0.25 : window.innerWidth < 991 ? 0.5 : 1;
          let marqueeSpeed = marqueeSpeedAttr * (marqueeContent.offsetWidth / window.innerWidth) * speedMultiplier;

          marqueeScroll.style.marginLeft = `${scrollSpeedAttr * -1}%`;
          marqueeScroll.style.width = `${(scrollSpeedAttr * 2) + 100}%`;

          if (duplicateAmount > 0) {
            const fragment = document.createDocumentFragment();
            for (let i = 0; i < duplicateAmount; i++) {
              fragment.appendChild(marqueeContent.cloneNode(true));
            }
            marqueeScroll.appendChild(fragment);
          }

          const marqueeItems = marquee.querySelectorAll("[data-marquee-collection-target]");
          const animation = gsap.to(marqueeItems, {
            xPercent: -100,
            repeat: -1,
            duration: marqueeSpeed,
            ease: "linear"
          }).totalProgress(0.5);

          gsap.set(marqueeItems, { xPercent: marqueeDirectionAttr === 1 ? 100 : -100 });
          animation.timeScale(marqueeDirectionAttr);
          animation.play();
          marquee.setAttribute("data-marquee-status", "normal");

          ScrollTrigger.create({
            trigger: marquee,
            start: "top bottom",
            end: "bottom top",
            onUpdate: (self) => {
              const isInverted = self.direction === 1;
              const currentDirection = isInverted ? -marqueeDirectionAttr : marqueeDirectionAttr;
              animation.timeScale(currentDirection);
              marquee.setAttribute("data-marquee-status", isInverted ? "normal" : "inverted");
            }
          });

          const tl = gsap.timeline({
            scrollTrigger: {
              trigger: marquee,
              start: "0% 100%",
              end: "100% 0%",
              scrub: 0
            }
          });
          const scrollStart = marqueeDirectionAttr === -1 ? scrollSpeedAttr : -scrollSpeedAttr;
          const scrollEnd = -scrollStart;
          tl.fromTo(marqueeScroll, { x: `${scrollStart}vw` }, { x: `${scrollEnd}vw`, ease: "none" });
        });
      }
      initMarqueeScrollDirection();

      // Initialize Swiper sliders

      // Gallery slider
      new Swiper(".swiper.is-gallery", {
        loop: true,
        slidesPerView: 2,
        centeredSlides: true,
        speed: 800,
        grabCursor: true,
        parallax: true,
        navigation: {
          nextEl: ".button-right.for-gallery",
          prevEl: ".button-left.for-gallery"
        }
      });

      // Reviews slider
      new Swiper(".swiper.is-reviews", {
        loop: true,
        slidesPerView: 1,
        speed: 800,
        navigation: {
          nextEl: ".button-right.for-reviews",
          prevEl: ".button-left.for-reviews"
        }
      });

      // Food booking slider
      new Swiper(".swiper.is-booking-food", {
        loop: true,
        slidesPerView: 1,
        speed: 800,
        navigation: {
          nextEl: ".button-right.for-booking-food",
          prevEl: ".button-left.for-booking-food"
        }
      });

      window.addEventListener("load", function() {
        setTimeout(function() {
          new Swiper(".swiper.is-booking-reviews", {
            loop: true,
            slidesPerView: 1,
            speed: 800,
            autoplay: {
              delay: 4000,
              disableOnInteraction: false
            }
          });
        }, 400); // adjust as needed for your content speed
      });

      // Boxed sliders: Initialize based on parent column navigation buttons
      document.querySelectorAll(".swiper.is-boxed").forEach((slider) => {
        const column = slider.closest(".column");
        if (!column) return;
        const nextButton = column.querySelector(".button-right");
        const prevButton = column.querySelector(".button-left");
        if (!nextButton || !prevButton) return;
        new Swiper(slider, {
          loop: true,
          slidesPerView: 1,
          spaceBetween: 0,
          speed: 800,
          navigation: {
            nextEl: nextButton,
            prevEl: prevButton
          }
        });
      });

      // Rooms slider with breakpoints
      new Swiper(".swiper.is-rooms", {
        loop: true,
        slidesPerView: 1,
        spaceBetween: 0,
        speed: 800,
        centeredSlides: true,
        navigation: {
          nextEl: ".button-right.for-rooms",
          prevEl: ".button-left.for-rooms"
        },
        breakpoints: {
          991: {
            slidesPerView: 2,
            spaceBetween: 50
          }
        }
      });
    });
  });
</script>


  document.addEventListener('DOMContentLoaded', function () {
    // Small delay to make sure Webflow finished enhancing forms
    setTimeout(function() {

      $('form').each(function () {
        const form = $(this);

        form.on('submit', function (e) {
          const formData = {};

          // Core info
          formData.event = 'purchase_form'; // Static event name
          formData.form_name = form.attr('name') || 'unknown_form';
          formData.form_type = form.data('type') || 'unspecified';
          formData.form_id = form.data('id') || form.attr('id') || 'unspecified';

          // Capture all input, select, and textarea fields
          form.find('input, select, textarea').each(function () {
            const field = $(this);
            const fieldName = field.attr('name') || field.attr('id');
            const fieldValue = field.val();

            if (fieldName && fieldValue) {
              formData[fieldName] = fieldValue;
            }
          });

          // Push to dataLayer
          window.dataLayer = window.dataLayer || [];
          window.dataLayer.push(formData);

          console.log('Form data pushed to dataLayer:', formData);
        });
      });

    }, 100); // wait 100ms after DOMContentLoaded
  });

  (function(){
    // — Re-declare CookieService just like your exit-intent block —
    const CookieService = {
      setCookie(name, value, days) {
        const date = new Date();
        date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
        document.cookie = name + "=" + (value || "") +
          "; expires=" + date.toUTCString() +
          "; path=/";
      },
      getCookie(name) {
        const match = document.cookie
        .split("; ")
        .find(row => row.startsWith(name + "="));
        return match ? match.split("=")[1] : null;
      }
    };

    const COOKIE_NAME = "cornerPopupClosed";
    const TTL_DAYS   = 30;

    const popup = document.querySelector("[corner-popup]");
    if (!popup) return;

    // 1) Always start hidden
    popup.style.display = "none";

    // 2) If the user hasn’t closed it yet, show it
    if (!CookieService.getCookie(COOKIE_NAME)) {
      popup.style.display = "flex";
    }

    // 3) Wire up the close-button (delegated or direct)
    //    We’ll do a delegated listener so timing never trips us up
    document.body.addEventListener("click", e => {
      const btn = e.target.closest("[corner-popup-close]");
      if (!btn) return;

      popup.style.display = "none";
      CookieService.setCookie(COOKIE_NAME, "true", TTL_DAYS);
    });
  })();
