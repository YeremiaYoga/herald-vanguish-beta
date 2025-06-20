import * as herald_vanguish from "./heraldVanguish.js";
import * as elementPlayer from "./elementPlayer.js";
import * as personalityPlayer from "./personalityPlayer.js";

Hooks.on("ready", () => {
  setTimeout(async () => {
    if (game.user.isGM) {
      herald_vanguish.heraldVanguish_renderAccessButton();
      // elementPlayer.heraldVanguish_renderElementPlayerButton();
      personalityPlayer.heraldVanguish_renderPersonalityPlayerButton();
    } else {
      const user = game.user;
      const selectedActor = user.character;
      if (selectedActor) {
        // const tokens = selectedActor.getActiveTokens(true);
        // if (tokens.length > 0) {
        //   const tokenDocument = tokens[0].document;
        //   const flag = await selectedActor.getFlag("world", "heraldVanguish");
        //   if (flag?.personalityActive === true) {
        //     // elementPlayer.heraldVanguish_renderElementPlayerButton();
        //     personalityPlayer.heraldVanguish_renderPersonalityPlayerButton();
        //   }
        // }
        const flag = await selectedActor.getFlag("world", "heraldVanguish");
        if (flag?.personalityActive === true) {
          personalityPlayer.heraldVanguish_renderPersonalityPlayerButton();
        }
      }
    }
  }, 1000);
});

Hooks.on("createToken", async (tokenDoc) => {
  const selectedActor = game.user.character;
  if (!selectedActor || !tokenDoc.actor) return;

  // Cek apakah token yang masuk adalah milik player ini
  if (tokenDoc.actor.id === selectedActor.id) {
    const flag = await selectedActor.getFlag("world", "heraldVanguish");
    if (flag?.personalityActive === true) {
      personalityPlayer.heraldVanguish_renderPersonalityPlayerButton();
    }
  }
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
