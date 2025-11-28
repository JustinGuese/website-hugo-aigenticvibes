// main script
(function () {
  "use strict";

  // Dropdown Menu Toggler For Mobile
  // ----------------------------------------
  const dropdownMenuToggler = document.querySelectorAll(
    ".nav-dropdown > .nav-link",
  );

  dropdownMenuToggler.forEach((toggler) => {
    toggler?.addEventListener("click", (e) => {
      e.target.closest(".nav-item").classList.toggle("active");
    });
  });

  // Testimonial Slider
  // ----------------------------------------
  new Swiper(".testimonial-slider", {
    spaceBetween: 24,
    loop: true,
    pagination: {
      el: ".testimonial-slider-pagination",
      type: "bullets",
      clickable: true,
    },
    breakpoints: {
      768: {
        slidesPerView: 2,
      },
      992: {
        slidesPerView: 3,
      },
    },
  });
})();

document.addEventListener("DOMContentLoaded", () => {
  AOS.init({
    once: true,
  });

  // price Switcher
  const priceCheck = document.querySelector(".pricing-check");
  if (priceCheck){
    priceCheck.addEventListener("change", (e) => {
      const priceCount = document.querySelectorAll(".price-count");
  
      if (e.target.checked) {
        priceCount.forEach((count) => {
          animateValue(count, 0, count.dataset.countYearly, 200, 0);
        });
      } else {
        priceCount.forEach((count) => {
          animateValue(count, 0, count.dataset.countMonthly, 200, 0);
        });
      }
    });
  }
 
});

function animateValue(obj, start, end, duration, decimals) {
  let startTimestamp = null;
  const step = (timestamp) => {
    if (!startTimestamp) startTimestamp = timestamp;
    const progress = Math.min((timestamp - startTimestamp) / duration, 1);
    obj.innerHTML = Number(progress * (end - start) + start).toFixed(decimals);
    if (progress < 1) {
      window.requestAnimationFrame(step);
    }
  };
  window.requestAnimationFrame(step);
}
