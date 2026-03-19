document.addEventListener("DOMContentLoaded", function () {
  // -----------------------------------------
  // Environment flags
  // -----------------------------------------
  const isTouch =
    "ontouchstart" in window ||
    navigator.maxTouchPoints > 0 ||
    window.matchMedia("(pointer: coarse)").matches;

  const prefersReduced = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  // -----------------------------------------
  // Lenis integration with GSAP ScrollTrigger
  // Run ONLY on non-touch + no reduced motion
  // -----------------------------------------
  let lenis = null;
  if (!isTouch && !prefersReduced) {
    lenis = new Lenis({ lerp: 0.12 });
    window.__lenis = lenis;
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add((time) => lenis.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);
  } else {
    if (window.__lenis && typeof window.__lenis.destroy === "function") {
      try {
        window.__lenis.destroy();
      } catch (e) {}
      window.__lenis = null;
    }
    ScrollTrigger.update();
  }

  // -----------------------------------------
  // Button click to set localStorage flag
  // -----------------------------------------
  const filterButton = document.querySelector(".opens-filter");
  if (filterButton) {
    filterButton.addEventListener("click", function () {
      localStorage.setItem("triggerClick", "true");
    });
  }

  // -----------------------------------------
  // Webflow Push: Update copyright year
  // -----------------------------------------
  if (window.Webflow && typeof Webflow.push === "function") {
    Webflow.push(function () {
      $(".copyright-year").text(new Date().getFullYear());
    });
  }

  // -----------------------------------------
  // Shared cursor functionality
  // -----------------------------------------
  (function () {
    const cursorElements = [
      {
        className: "button-right",
        imageUrl:
          "https://cdn.prod.website-files.com/66bef0bef6cb13624d51d95b/66cedc79aeb8a340f1671630_slider-next.svg",
      },
      {
        className: "button-left",
        imageUrl:
          "https://cdn.prod.website-files.com/66bef0bef6cb13624d51d95b/66cedc79bc5b2155823ab0df_slider-prev.svg",
      },
    ];

    cursorElements.forEach(function (element) {
      const cursorImage = document.createElement("img");
      cursorImage.src = element.imageUrl;
      cursorImage.classList.add("cursor-image");
      document.body.appendChild(cursorImage);

      let targetX = 0,
        targetY = 0;
      document.addEventListener("mousemove", function (e) {
        targetX = e.clientX;
        targetY = e.clientY;
      });

      function updateCursor() {
        const currentX = parseFloat(cursorImage.style.left) || 0;
        const currentY = parseFloat(cursorImage.style.top) || 0;
        const vx = (targetX - currentX) * 0.3;
        const vy = (targetY - currentY) * 0.3;
        cursorImage.style.position = "absolute";
        cursorImage.style.left = currentX + vx + "px";
        cursorImage.style.top = currentY + vy + "px";
        requestAnimationFrame(updateCursor);
      }
      updateCursor();

      document.querySelectorAll(`.${element.className}`).forEach(function (el) {
        if (
          el.closest(".for-rooms, .for-gallery") &&
          !el.closest(".for-reviews, .for-booking-food, .for-boxed")
        ) {
          el.addEventListener("mouseenter", function () {
            cursorImage.style.transform = "translate(-50%, -50%) scale(1)";
          });
          el.addEventListener("mouseleave", function () {
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
      document.querySelectorAll("video").forEach((video) => {
        if (!video.hasAttribute("muted")) {
          video.muted = true;
          video.setAttribute("muted", "");
        }
      });
    };
    muteVideos();
    const observer = new MutationObserver(() => muteVideos());
    observer.observe(document.body, { childList: true, subtree: true });
  }

  // -----------------------------------------
  // Navigation links: active state & smooth scrolling
  // -----------------------------------------
  (function initNavLinks() {
    document.addEventListener("scroll", function () {
      const navLinks = document.querySelectorAll(".anchor-link");
      navLinks.forEach((navLink) => {
        const label = navLink.querySelector(".label");
        const underline = navLink.querySelector(".underline");
        if (navLink.classList.contains("w--current")) {
          if (label) {
            label.classList.remove("white");
            label.classList.add("active");
          }
          if (underline) underline.style.display = "block";
        } else {
          if (label) {
            label.classList.remove("active");
            label.classList.add("white");
          }
          if (underline) underline.style.display = "none";
        }
      });
    });

    const navLinks = document.querySelectorAll(".anchor-link");
    const isDesktop = window.innerWidth >= 992;
    if (isDesktop) {
      navLinks.forEach((navLink) => {
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
    navLinks.forEach((navLink) => {
      navLink.addEventListener("click", function (e) {
        const href = this.getAttribute("href");
        if (href && href.startsWith("#")) {
          const targetEl = document.getElementById(href.substring(1));
          if (targetEl) {
            e.preventDefault();
            const offset = window.innerWidth <= 991 ? 150 : 200;
            const elementTop =
              targetEl.getBoundingClientRect().top + window.scrollY - offset;
            window.scrollTo({ top: elementTop, behavior: "smooth" });
          }
        }
      });
    });
  })();

  // -----------------------------------------
  // Cookie service (shared by all popups)
  // -----------------------------------------
  (function ensureCookieService() {
    if (window.CookieService) return;
    window.CookieService = {
      setCookie(name, value, days) {
        const date = new Date();
        date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
        document.cookie =
          name + "=" + (value || "") + "; expires=" + date.toUTCString() + "; path=/";
      },
      getCookie(name) {
        const match = document.cookie
          .split("; ")
          .find((row) => row.startsWith(name + "="));
        return match ? match.split("=")[1] : null;
      },
    };
  })();

  // -----------------------------------------
  // Exit Intent Popup
  // -----------------------------------------
  (function () {
    const exitPopup = document.querySelector('[ms-code-popup="exit-intent"]');
    if (!exitPopup || window.CookieService.getCookie("exitIntentShown")) return;

    let shown = false;

    function showPopup() {
      if (shown) return;
      shown = true;
      exitPopup.style.display = "flex";
      window.CookieService.setCookie("exitIntentShown", true, 30);
      document.removeEventListener("mouseout", handleMouseOut);
    }

    function handleMouseOut(e) {
      if (!e.toElement && !e.relatedTarget && e.clientY < 10) showPopup();
    }

    setTimeout(showPopup, 3000);
    document.addEventListener("mouseout", handleMouseOut);
  })();

  // -----------------------------------------
  // Form -> dataLayer push
  // -----------------------------------------
  setTimeout(function () {
    $("form").each(function () {
      const form = $(this);
      form.on("submit", function () {
        const formData = {
          event: "purchase_form",
          form_name: form.attr("name") || "unknown_form",
          form_type: form.data("type") || "unspecified",
          form_id: form.data("id") || form.attr("id") || "unspecified",
        };
        form.find("input, select, textarea").each(function () {
          const field = $(this);
          const name = field.attr("name") || field.attr("id");
          const value = field.val();
          if (name && value) formData[name] = value;
        });
        window.dataLayer = window.dataLayer || [];
        window.dataLayer.push(formData);
      });
    });
  }, 100);

  // -----------------------------------------
  // Corner popup
  // -----------------------------------------
  (function () {
    const COOKIE_NAME = "cornerPopupClosed";
    const popup = document.querySelector("[corner-popup]");
    if (!popup) return;
    popup.style.display = "none";
    if (!window.CookieService.getCookie(COOKIE_NAME)) {
      popup.style.display = "flex";
    }
    document.body.addEventListener("click", (e) => {
      const btn = e.target.closest("[corner-popup-close]");
      if (!btn) return;
      popup.style.display = "none";
      window.CookieService.setCookie(COOKIE_NAME, "true", 30);
    });
  })();

  // =========================================
  // SWIPER — All slider initialisation
  // =========================================
  //
  // Every Swiper type lives here. No per-page
  // scripts needed. Each type uses a specific
  // class + scoped navigation so nothing
  // double-inits or cross-wires buttons.
  // =========================================

  /* ---- Gallery (.swiper.is-gallery inside .full-slider) ---- */
  function initGallery() {
    const el = document.querySelector(".full-slider .swiper.is-gallery");
    if (!el) return;

    // Kill prior instance to avoid double-init
    if (el.swiper && typeof el.swiper.destroy === "function") {
      try {
        el.swiper.destroy(true, true);
      } catch (_) {}
    }

    const wrapper = el.closest(".full-slider");
    const nextBtn = wrapper
      ? wrapper.querySelector(".button-right.for-gallery")
      : null;
    const prevBtn = wrapper
      ? wrapper.querySelector(".button-left.for-gallery")
      : null;

    // Wait for images so sizes are known
    const imgs = [...el.querySelectorAll(".swiper-slide img")];
    const waitForImages = imgs.length
      ? Promise.all(
          imgs.map((img) =>
            img.complete && img.naturalWidth > 0
              ? Promise.resolve()
              : new Promise((res) => {
                  const done = () => res();
                  img.addEventListener("load", done, { once: true });
                  img.addEventListener("error", done, { once: true });
                })
          )
        )
      : Promise.resolve();

    waitForImages.then(() => {
      new Swiper(el, {
        loop: true,
        loopPreventsSliding: true,
        initialSlide: 0,
        centeredSlides: true,
        slidesPerView: 2,
        speed: 800,
        grabCursor: true,
        parallax: true,
        watchSlidesProgress: true,
        navigation: { nextEl: nextBtn, prevEl: prevBtn },
        updateOnWindowResize: false,
        observeParents: false,
        observer: false,
        breakpoints: {
          0: { slidesPerView: 1 },
          768: { slidesPerView: 2 },
        },
        on: {
          init(s) {
            s.slideToLoop(0, 0, false);
            setTimeout(() => s.slideToLoop(0, 0, false), 80);
          },
          imagesReady(s) {
            s.update();
            s.slideToLoop(0, 0, false);
          },
        },
      });
    });
  }

  /* ---- Boxed sliders (.swiper.is-boxed) ---- */
  function initBoxedSliders() {
    document.querySelectorAll(".swiper.is-boxed").forEach((slider) => {
      // Scope navigation to the parent .column
      const column = slider.closest(".column");
      if (!column) return;
      const nextBtn = column.querySelector(".button-right.for-boxed");
      const prevBtn = column.querySelector(".button-left.for-boxed");
      if (!nextBtn || !prevBtn) return;

      new Swiper(slider, {
        loop: true,
        slidesPerView: 1,
        spaceBetween: 0,
        speed: 800,
        watchSlidesProgress: true,
        navigation: { nextEl: nextBtn, prevEl: prevBtn },
      });
    });
  }

  /* ---- Reviews slider (.swiper.is-reviews) ---- */
  function initReviewsSlider() {
    const el = document.querySelector(".swiper.is-reviews");
    if (!el) return;
    new Swiper(el, {
      loop: true,
      slidesPerView: 1,
      speed: 800,
      navigation: {
        nextEl: ".button-right.for-reviews",
        prevEl: ".button-left.for-reviews",
      },
    });
  }

  /* ---- Food booking slider (.swiper.is-booking-food) ---- */
  function initBookingFoodSlider() {
    const el = document.querySelector(".swiper.is-booking-food");
    if (!el) return;
    new Swiper(el, {
      loop: true,
      slidesPerView: 1,
      speed: 800,
      navigation: {
        nextEl: ".button-right.for-booking-food",
        prevEl: ".button-left.for-booking-food",
      },
    });
  }

  /* ---- Rooms slider (.swiper.is-rooms) ---- */
  function initRoomsSlider() {
    const el = document.querySelector(".swiper.is-rooms");
    if (!el) return;
    new Swiper(el, {
      loop: true,
      slidesPerView: 1,
      spaceBetween: 0,
      speed: 800,
      centeredSlides: true,
      navigation: {
        nextEl: ".button-right.for-rooms",
        prevEl: ".button-left.for-rooms",
      },
      breakpoints: {
        991: { slidesPerView: 2, spaceBetween: 50 },
      },
    });
  }

  /* ---- Booking reviews slider (.swiper.is-booking-reviews) ---- */
  function initBookingReviewsSlider() {
    const el = document.querySelector(".swiper.is-booking-reviews");
    if (!el) return;
    setTimeout(function () {
      new Swiper(el, {
        loop: true,
        slidesPerView: 1,
        speed: 800,
        autoplay: { delay: 4000, disableOnInteraction: false },
      });
    }, 400);
  }

  /* ---- Two-slide loop sliders (.swiper-2) ---- */
  function initSwiper2Sliders() {
    document.querySelectorAll(".swiper-2").forEach((sliderEl) => {
      const wrapper = sliderEl.parentElement;
      new Swiper(sliderEl, {
        loop: true,
        slidesPerView: 2,
        centeredSlides: true,
        speed: 800,
        parallax: true,
        grabCursor: true,
        navigation: {
          nextEl: wrapper ? wrapper.querySelector(".button-right") : null,
          prevEl: wrapper ? wrapper.querySelector(".button-left") : null,
        },
        breakpoints: {
          0: { slidesPerView: 1, centeredSlides: true },
          768: { slidesPerView: 2, centeredSlides: true },
        },
      });
    });
  }

  // =========================================
  // END SWIPER
  // =========================================

  /* ---- Supervisor styles (desktop alternates) ---- */
  function handleSupervisorStyles() {
    const isDesktop = window.matchMedia("(min-width: 991px)").matches;
    const supervisors = document.querySelectorAll(
      ".supervisor-list .supervisor"
    );
    if (!supervisors.length) return;

    let needsIXReinit = false;

    supervisors.forEach((supervisor, index) => {
      const isEven = (index + 1) % 2 === 0;
      supervisor.classList.toggle("even", isDesktop && isEven);

      const elements = {
        supervisorTitle: ".supervisor-column.text .supervisor-title",
        h4: ".supervisor-column.text .h4",
        richText: ".supervisor-column.text .rich-text",
        button: ".supervisor-column.text .button-secondary_red",
        label: ".supervisor-column.text .label",
        sideWrapper: ".supervisor-column.video-image .side-wrapper",
      };

      if (isEven) {
        supervisor
          .querySelectorAll(
            `${elements.supervisorTitle}, ${elements.h4}, ${elements.label}`
          )
          .forEach((el) => {
            el.classList.toggle("white", isDesktop);
            el.classList.toggle("default-text-color", !isDesktop);
          });

        const richText = supervisor.querySelector(elements.richText);
        if (richText) {
          richText.classList.toggle("rich-text-white", isDesktop);
          richText.classList.toggle("rich-text", !isDesktop);
        }

        const button = supervisor.querySelector(elements.button);
        if (button) {
          button.classList.toggle("button-secondary_red-white", isDesktop);
          button.classList.toggle("button-secondary_red", !isDesktop);
        }

        const sideWrapper = supervisor.querySelector(elements.sideWrapper);
        if (sideWrapper)
          sideWrapper.classList.toggle("reverse-border", isDesktop);

        needsIXReinit = true;
      }
    });

    if (needsIXReinit && window.Webflow && Webflow.require) {
      try {
        Webflow.require("ix2").init();
      } catch (_) {}
    }
  }

  /* ---- Rooms grid alternating borders/tags ---- */
  (function initRoomsAlternating() {
    const rooms = document.querySelectorAll(".room-grid .room");
    rooms.forEach((room, index) => {
      if ((index + 1) % 2 === 0) {
        const roomImageWrap = room.querySelector(".room-image-wrap");
        const roomTag = room.querySelector(".room-tag");
        if (roomImageWrap) roomImageWrap.classList.add("reverse-border");
        if (roomTag) roomTag.classList.add("reverse");
      }
    });
  })();

  /* ---- Lightbox video controls ---- */
  (function initLightboxVideo() {
    const playButton = document.querySelector(".play-button");
    const lightboxVideo = document.querySelector("#fullscreen-video");
    const closeLightbox = document.querySelector(".close-button");

    if (playButton && lightboxVideo) {
      playButton.addEventListener("click", function () {
        const videoElement = document.querySelector("video");
        if (videoElement) {
          const videoSrc = videoElement.getAttribute("src");
          lightboxVideo.setAttribute("src", videoSrc || "");
          lightboxVideo.muted = false;
          lightboxVideo.play().catch(() => {});
        }
      });
    }

    if (closeLightbox && lightboxVideo) {
      closeLightbox.addEventListener("click", function () {
        lightboxVideo.pause();
        lightboxVideo.muted = true;
        lightboxVideo.currentTime = 0;
      });
    }
  })();

  /* ---- FAQ toggle (jQuery/Webflow) ---- */
  $('[data-click="faq"]').on("click", function () {
    if (!$(this).is(".open")) {
      $('[data-click="faq"].open').each((_, item) => item.click());
      $(this).addClass("open");
    } else {
      $(this).removeClass("open");
    }
  });

  /* ---- CMS grid layout helper ---- */
  function applyGridStyles() {
    const cmsGrid = document.querySelector(".room-grid");
    if (!cmsGrid) return;

    const cmsItems = cmsGrid.querySelectorAll(".w-dyn-item");
    const itemCount = cmsItems.length;

    if (window.innerWidth >= 992) {
      cmsGrid.style.display = "";
      cmsGrid.style.gridTemplateColumns = "";
      cmsGrid.style.gridTemplateRows = "";
      cmsGrid.style.justifyContent = "";

      if (itemCount === 1) {
        cmsGrid.style.display = "flex";
        cmsGrid.style.justifyContent = "center";
      } else if (itemCount === 2 || itemCount === 4) {
        cmsGrid.style.display = "grid";
        cmsGrid.style.gridTemplateColumns = "repeat(2, 1fr)";
      } else if (itemCount === 3 || itemCount === 6) {
        cmsGrid.style.display = "grid";
        cmsGrid.style.gridTemplateColumns = "repeat(3, 1fr)";
      } else if (itemCount === 5) {
        cmsGrid.style.display = "grid";
        cmsGrid.style.gridTemplateRows = "auto auto";
        cmsGrid.style.gridTemplateColumns = "repeat(3, 1fr)";
        if (cmsItems[3]) cmsItems[3].style.gridColumn = "span 2";
      }
    } else {
      cmsGrid.style.display = "";
      cmsGrid.style.gridTemplateColumns = "";
      cmsGrid.style.gridTemplateRows = "";
      cmsGrid.style.justifyContent = "";
      cmsGrid
        .querySelectorAll(".w-dyn-item")
        .forEach((item) => (item.style.gridColumn = ""));
    }
  }

  /* ---- Orchestrate init order ---- */
  // 1) Apply class-based styles first
  handleSupervisorStyles();
  applyGridStyles();

  // Re-apply styles on resize (debounced). No Swiper re-init.
  let resizeTO;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTO);
    resizeTO = setTimeout(() => {
      applyGridStyles();
      handleSupervisorStyles();
    }, 150);
  });

  /* ---- Multi-ref "Show more" ---- */
  (function initShowMore() {
    const items = document.querySelectorAll(
      ".multi-ref-list-wrapper .w-dyn-item"
    );
    const showMoreButton = document.querySelector(".show-more-button");
    const itemsToShow = 5;
    let currentlyVisible = itemsToShow;

    items.forEach((item, index) => {
      if (index >= itemsToShow) item.style.display = "none";
    });

    if (showMoreButton) {
      showMoreButton.addEventListener("click", () => {
        const newLimit = currentlyVisible + itemsToShow;
        items.forEach((item, index) => {
          if (index < newLimit) item.style.display = "block";
        });
        currentlyVisible = newLimit;
        if (currentlyVisible >= items.length)
          showMoreButton.style.display = "none";
      });
      if (items.length <= itemsToShow) showMoreButton.style.display = "none";
    }
  })();

  // -----------------------------------------
  // Window load: Marquee + remaining Swipers
  // -----------------------------------------
  window.addEventListener("load", function () {
    // Marquee animation with scroll direction
    function initMarqueeScrollDirection() {
      document
        .querySelectorAll("[data-marquee-scroll-direction-target]")
        .forEach((marquee) => {
          const marqueeContent = marquee.querySelector(
            "[data-marquee-collection-target]"
          );
          const marqueeScroll = marquee.querySelector(
            "[data-marquee-scroll-target]"
          );
          if (!marqueeContent || !marqueeScroll) return;

          const {
            marqueeSpeed: speed,
            marqueeDirection: direction,
            marqueeDuplicate: duplicate,
            marqueeScrollSpeed: scrollSpeed,
          } = marquee.dataset;

          const marqueeSpeedAttr = parseFloat(speed);
          const marqueeDirectionAttr = direction === "right" ? 1 : -1;
          const duplicateAmount = parseInt(duplicate || 0);
          const scrollSpeedAttr = parseFloat(scrollSpeed);
          const speedMultiplier =
            window.innerWidth < 479
              ? 0.25
              : window.innerWidth < 991
                ? 0.5
                : 1;
          let marqueeSpeed =
            marqueeSpeedAttr *
            (marqueeContent.offsetWidth / window.innerWidth) *
            speedMultiplier;

          marqueeScroll.style.marginLeft = `${scrollSpeedAttr * -1}%`;
          marqueeScroll.style.width = `${scrollSpeedAttr * 2 + 100}%`;

          if (duplicateAmount > 0) {
            const fragment = document.createDocumentFragment();
            for (let i = 0; i < duplicateAmount; i++) {
              fragment.appendChild(marqueeContent.cloneNode(true));
            }
            marqueeScroll.appendChild(fragment);
          }

          const marqueeItems = marquee.querySelectorAll(
            "[data-marquee-collection-target]"
          );
          const animation = gsap
            .to(marqueeItems, {
              xPercent: -100,
              repeat: -1,
              duration: marqueeSpeed,
              ease: "linear",
            })
            .totalProgress(0.5);

          gsap.set(marqueeItems, {
            xPercent: marqueeDirectionAttr === 1 ? 100 : -100,
          });
          animation.timeScale(marqueeDirectionAttr);
          animation.play();
          marquee.setAttribute("data-marquee-status", "normal");

          ScrollTrigger.create({
            trigger: marquee,
            start: "top bottom",
            end: "bottom top",
            onUpdate: (self) => {
              const isInverted = self.direction === 1;
              const currentDirection = isInverted
                ? -marqueeDirectionAttr
                : marqueeDirectionAttr;
              animation.timeScale(currentDirection);
              marquee.setAttribute(
                "data-marquee-status",
                isInverted ? "normal" : "inverted"
              );
            },
          });

          const tl = gsap.timeline({
            scrollTrigger: {
              trigger: marquee,
              start: "0% 100%",
              end: "100% 0%",
              scrub: 0,
            },
          });
          const scrollStart =
            marqueeDirectionAttr === -1 ? scrollSpeedAttr : -scrollSpeedAttr;
          tl.fromTo(
            marqueeScroll,
            { x: `${scrollStart}vw` },
            { x: `${-scrollStart}vw`, ease: "none" }
          );
        });
    }
    initMarqueeScrollDirection();

    // Init all non-gallery Swipers on window load
    initGallery();
    initBoxedSliders();
    initReviewsSlider();
    initBookingFoodSlider();
    initRoomsSlider();
    initBookingReviewsSlider();
    initSwiper2Sliders();
  });
});
