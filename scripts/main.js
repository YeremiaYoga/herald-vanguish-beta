import * as herald_vanguish from "./heraldVanguish.js";

Hooks.on("ready", () => {
  setTimeout(async () => {
    herald_vanguish.heraldVanguish_renderAccessButton();
  }, 1000);
});


Hooks.on("renderTokenHUD", (app, html, data) => {
  Hooks.on("getTokenHUDButtons", (hudButtons, hudData) => {
    hudButtons.push({
      icon: "fas fa-dragon", // Ganti ikon sesuai kebutuhan
      tooltip: "Custom Action",
      callback: () => {
        ui.notifications.info(`Aksi khusus digunakan oleh ${hudData.name}`);
      },
      visible: true, // Selalu tampil
    });
  });
});