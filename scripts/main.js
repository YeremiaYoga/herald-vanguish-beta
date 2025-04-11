import * as herald_vanguish from "./heraldVanguish.js";
import * as elementPlayer from "./elementPlayer.js";

Hooks.on("ready", () => {
  setTimeout(async () => {
    if (game.user.isGM) {
      herald_vanguish.heraldVanguish_renderAccessButton();
      elementPlayer.heraldVanguish_renderElementPlayerButton();
    } else {
      const user = game.user;
      const selectedActor = user.character;
      if (selectedActor) {
        const tokens = selectedActor.getActiveTokens(true);
        if (tokens.length > 0) {
          const tokenDocument = tokens[0].document;
          const flag = await tokenDocument.getFlag("world", "heraldVanguish");
          if (flag?.elementActive === true) {
            elementPlayer.heraldVanguish_renderElementPlayerButton();
          }
        }
      }
    }
  }, 1000);
});

Hooks.on("init", () => {
  game.settings.register("herald-vanguish-beta", "calculatedToughness", {
    name: "Kalkulasi Toughness",
    hint: "untuk format CR = CR , Max Hp = maxHp tuliskan tanpa tanda kurung",
    scope: "world",
    config: true,
    type: String,
    default: "CR * 4 + maxHp / 10",
    onChange: (value) => {
      if (game.user.isGM) {
        herald_vanguish.heraldVanguish_renderAccessButton();
      }
    },
  });
});
