import * as herald_vanguish from "./heraldVanguish.js";

Hooks.on("ready", () => {
  setTimeout(async () => {
    herald_vanguish.heraldVanguish_renderAccessButton();
  }, 1000);
});


