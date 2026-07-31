(function () {
  "use strict";
  function applyVersions() {
    const registry = window.UTRIP_TRZICA_VERSIONS;
    if (!registry || !registry.components) return;
    const body = document.body;
    const pageKey = body && body.dataset ? body.dataset.versionKey : "";
    const page = registry.components[pageKey];

    function getComponent(element) {
      const key = element.dataset.versionKey || pageKey;
      return registry.components[key] || page;
    }
    function renderTemplate(template, component) {
      const values = {
        version: component ? component.version : "",
        title: component ? component.title : "",
        releaseDate: registry.releaseDate,
        releaseLabel: registry.releaseLabel,
        sourcePackage: registry.sourcePackage
      };
      return template.replace(/\{([A-Za-z]+)\}/g, function (_, key) {
        return Object.prototype.hasOwnProperty.call(values, key) ? values[key] : "";
      });
    }

    document.querySelectorAll("[data-version-label]").forEach(function (element) {
      const component = getComponent(element);
      if (component) element.textContent = "v" + component.version;
    });
    document.querySelectorAll("[data-version-template]").forEach(function (element) {
      const component = getComponent(element);
      element.textContent = renderTemplate(element.dataset.versionTemplate, component);
    });
    if (page && body.dataset.versionTitle) {
      document.title = renderTemplate(body.dataset.versionTitle, page);
    }
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", applyVersions, { once: true });
  } else {
    applyVersions();
  }
})();
