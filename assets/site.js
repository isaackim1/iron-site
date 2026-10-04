// Iron public site: the phone story and quiet section reveals.
// Progressive enhancement only. Without this script every step stays visible
// and the phone's three screens scroll sideways.
(function () {
  "use strict";
  var story = document.querySelector(".story");
  if (!story || !("IntersectionObserver" in window)) return;

  var motionOK = window.matchMedia("(prefers-reduced-motion: no-preference)");
  var wide = window.matchMedia("(min-width: 1024px)");
  var screens = Array.prototype.slice.call(story.querySelectorAll(".screen"));
  var steps = Array.prototype.slice.call(story.querySelectorAll(".step"));
  var bar = story.querySelector(".story-tabs");
  var tabs = Array.prototype.slice.call(bar.querySelectorAll("button"));
  var scroller = story.querySelector(".screens");
  var current = steps[0].getAttribute("data-step");
  var watcher = null;

  // One screen at a time now, so the sideways scroller is no longer a stop.
  scroller.removeAttribute("tabindex");
  scroller.removeAttribute("aria-label");
  bar.hidden = false;

  function show(step) {
    current = step;
    screens.forEach(function (el) {
      var on = el.id === "screen-" + step;
      el.classList.toggle("is-active", on);
      if (on) el.removeAttribute("aria-hidden");
      else el.setAttribute("aria-hidden", "true");
    });
    steps.forEach(function (el) {
      el.classList.toggle("is-current", el.getAttribute("data-step") === step);
    });
    tabs.forEach(function (b) {
      var on = b.getAttribute("data-step") === step;
      if (wide.matches) {
        b.removeAttribute("aria-selected");
        if (on) b.setAttribute("aria-current", "step");
        else b.removeAttribute("aria-current");
      } else {
        b.removeAttribute("aria-current");
        b.setAttribute("aria-selected", on ? "true" : "false");
        b.tabIndex = on ? 0 : -1;
      }
    });
  }

  // Wide screens: the phone follows the step at the centre of the window.
  // Narrow screens: a tab list chooses the step; nothing is tied to scrolling.
  function setMode() {
    if (watcher) {
      watcher.disconnect();
      watcher = null;
    }
    var scrollMode = wide.matches;
    story.classList.toggle("story--scroll", scrollMode);
    story.classList.toggle("story--tabs", !scrollMode);
    if (scrollMode) {
      bar.removeAttribute("role");
      tabs.forEach(function (b) {
        b.removeAttribute("role");
        b.removeAttribute("aria-controls");
        b.removeAttribute("id");
        b.tabIndex = 0;
      });
      steps.forEach(function (s) {
        s.removeAttribute("role");
        s.removeAttribute("aria-labelledby");
        s.removeAttribute("tabindex");
      });
      // Watch each step's heading, not the tall step, so the phone changes as
      // the words reach the middle band of the window.
      watcher = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) show(e.target.closest(".step").getAttribute("data-step"));
        });
      }, { rootMargin: "-35% 0px -35% 0px" });
      steps.forEach(function (s) { watcher.observe(s.querySelector("h3")); });
    } else {
      bar.setAttribute("role", "tablist");
      tabs.forEach(function (b) {
        var step = b.getAttribute("data-step");
        b.setAttribute("role", "tab");
        b.id = "tab-" + step;
        b.setAttribute("aria-controls", "step-" + step);
      });
      steps.forEach(function (s) {
        s.setAttribute("role", "tabpanel");
        s.setAttribute("aria-labelledby", "tab-" + s.getAttribute("data-step"));
        s.tabIndex = 0;
      });
    }
    show(current);
  }

  tabs.forEach(function (b, i) {
    b.addEventListener("click", function () {
      var step = b.getAttribute("data-step");
      if (wide.matches) {
        // Scroll to the step; the observer moves the phone when it arrives.
        document.getElementById("step-" + step).scrollIntoView({
          behavior: motionOK.matches ? "smooth" : "auto",
          block: "center"
        });
      } else {
        show(step);
      }
    });
    b.addEventListener("keydown", function (e) {
      if (wide.matches) return;
      var j = null;
      if (e.key === "ArrowRight") j = (i + 1) % tabs.length;
      else if (e.key === "ArrowLeft") j = (i - 1 + tabs.length) % tabs.length;
      else if (e.key === "Home") j = 0;
      else if (e.key === "End") j = tabs.length - 1;
      if (j === null) return;
      e.preventDefault();
      show(tabs[j].getAttribute("data-step"));
      tabs[j].focus();
    });
  });

  if (wide.addEventListener) wide.addEventListener("change", setMode);
  setMode();

  // Section reveals: once each, and only when motion is welcome.
  if (motionOK.matches) {
    document.documentElement.classList.add("reveals");
    var revealer = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.classList.add("is-visible");
        revealer.unobserve(e.target);
      });
    }, { rootMargin: "0px 0px -8% 0px" });
    document.querySelectorAll(".reveal").forEach(function (el) { revealer.observe(el); });
  }
})();
