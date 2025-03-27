function heraldVanguish_getGameIconDamage(type) {
  const basePath = "/systems/dnd5e/icons/svg/damage/";
  const validTypes = {
    acid: "Acid",
    bludgeoning: "Bludgeoning",
    cold: "Cold",
    fire: "Fire",
    force: "Force",
    lightning: "Lightning",
    necrotic: "Necrotic",
    piercing: "Piercing",
    poison: "Poison",
    psychic: "Psychic",
    radiant: "Radiant",
    slashing: "Slashing",
    thunder: "Thunder",
    healing: "Healing",
    temphp: "Temporary HP",
  };

  let iconType = validTypes[type] ? type : "";
  let tooltipText = validTypes[type] || "Unknown";

  return `
      <div class="heraldVanguish-damageIconContainer">
        <img src="${basePath}${iconType}.svg" width="20" height="20" style="border:none;">
      </div>
    `;
}

async function heraldVanguish_effectWeaknessBroken(actor, tokenDocument) {
  let existingEffect = actor.effects.find((e) => e.name === "Weakness Broken");

  if (!existingEffect) {
    await actor.createEmbeddedDocuments("ActiveEffect", [
      {
        name: "Weakness Broken",
        icon: "icons/magic/death/skull-energy-light-white.webp",
        changes: [
          {
            key: "system.attributes.ac.bonus",
            mode: CONST.ACTIVE_EFFECT_MODES.ADD,
            value: -4,
          },
          {
            key: "system.bonuses.All-Damage",
            mode: CONST.ACTIVE_EFFECT_MODES.ADD,
            value: -4,
          },
          {
            key: "system.bonuses.All-Attacks",
            mode: CONST.ACTIVE_EFFECT_MODES.ADD,
            value: -2,
          },
          {
            key: "system.bonuses.abilities.check",
            mode: CONST.ACTIVE_EFFECT_MODES.ADD,
            value: -2,
          },
          {
            key: "system.bonuses.abilities.save",
            mode: CONST.ACTIVE_EFFECT_MODES.ADD,
            value: -2,
          },
          {
            key: "system.bonuses.spell.dc",
            mode: CONST.ACTIVE_EFFECT_MODES.ADD,
            value: -2,
          },
          {
            key: "system.attributes.movement.walk",
            mode: CONST.ACTIVE_EFFECT_MODES.MULTIPLY,
            value: 0.75,
          },
          {
            key: "system.attributes.movement.burrow",
            mode: CONST.ACTIVE_EFFECT_MODES.MULTIPLY,
            value: 0.75,
          },
          {
            key: "system.attributes.movement.climb",
            mode: CONST.ACTIVE_EFFECT_MODES.MULTIPLY,
            value: 0.75,
          },
          {
            key: "system.attributes.movement.fly",
            mode: CONST.ACTIVE_EFFECT_MODES.MULTIPLY,
            value: 0.75,
          },
          {
            key: "system.attributes.movement.swim",
            mode: CONST.ACTIVE_EFFECT_MODES.MULTIPLY,
            value: 0.75,
          },
        ],
        origin: `Actor.${actor.id}`,
        disabled: false,
        transfer: false,
        duration: {
          rounds: 2,
          turns: 1,
          specialDuration: ["turnEnd", "combatEnd", "zeroHP"],
        },
        flags: {
          core: { statusId: "Weakness Broken" },
          dae: { specialDuration: ["turnEnd", "combatEnd", "zeroHP"] },
          "temp-effect": true,
        },
      },
    ]);

    let chatContent = `
            <b>${actor.name}</b> is now <b>Weakness Broken</b>!
            <br>
            "${actor.name} has a <b>-4</b> penalty to <b>Armor Class</b> and <b>Damage Rolls</b>, 
            a <b>-2</b> penalty to all <b>Saving Throws, Ability Checks, Attack Rolls, and Spell Save DC</b>.
            <br>
            Movement speed is reduced by <b>25%</b> until the end of their next turn.
            <br>
            Additionally, <b>${actor.name}</b> gains a stack of <b>Exhaustion</b>, which does not get nullified at the end of Weakness Broken.
        `;

    ChatMessage.create({
      content: chatContent,
      speaker: ChatMessage.getSpeaker({ token: tokenDocument }),
    });

    new Sequence()
      .sound()
      .file(
        "/modules/herald-vanguish-beta/assets/sound/weaknessBroken_apply.ogg"
      )
      .volume(0.1)
      .baseEffect({ type: "reverb", intensity: 4 })
      .audioChannel("music")
      .play();

    let exhaustion = actor.system.attributes.exhaustion || 0;
    let newExhaustionLevel = Math.min(exhaustion + 1, 10);
    await actor.update({ "system.attributes.exhaustion": newExhaustionLevel });
  }
}

async function heraldVanguish_effectOverflowWeaknessBroken(
  actor,
  tokenDocument
) {
  let existingEffect = actor.effects.find(
    (e) => e.name === "Overflow Weakness Broken"
  );

  if (!existingEffect) {
    await actor.createEmbeddedDocuments("ActiveEffect", [
      {
        name: "Overflow Weakness Broken",
        icon: "icons/magic/death/skull-energy-light-white.webp",
        changes: [
          {
            key: "system.attributes.ac.bonus",
            mode: CONST.ACTIVE_EFFECT_MODES.ADD,
            value: -4,
          },
          {
            key: "system.bonuses.All-Damage",
            mode: CONST.ACTIVE_EFFECT_MODES.ADD,
            value: -4,
          },
          {
            key: "system.bonuses.All-Attacks",
            mode: CONST.ACTIVE_EFFECT_MODES.ADD,
            value: -2,
          },
          {
            key: "system.bonuses.abilities.check",
            mode: CONST.ACTIVE_EFFECT_MODES.ADD,
            value: -2,
          },
          {
            key: "system.bonuses.abilities.save",
            mode: CONST.ACTIVE_EFFECT_MODES.ADD,
            value: -2,
          },
          {
            key: "system.bonuses.spell.dc",
            mode: CONST.ACTIVE_EFFECT_MODES.ADD,
            value: -2,
          },
          {
            key: "system.attributes.movement.walk",
            mode: CONST.ACTIVE_EFFECT_MODES.MULTIPLY,
            value: 0.75,
          },
          {
            key: "system.attributes.movement.burrow",
            mode: CONST.ACTIVE_EFFECT_MODES.MULTIPLY,
            value: 0.75,
          },
          {
            key: "system.attributes.movement.climb",
            mode: CONST.ACTIVE_EFFECT_MODES.MULTIPLY,
            value: 0.75,
          },
          {
            key: "system.attributes.movement.fly",
            mode: CONST.ACTIVE_EFFECT_MODES.MULTIPLY,
            value: 0.75,
          },
          {
            key: "system.attributes.movement.swim",
            mode: CONST.ACTIVE_EFFECT_MODES.MULTIPLY,
            value: 0.75,
          },
        ],
        origin: `Actor.${actor.id}`,
        disabled: false,
        transfer: false,
        duration: {
          rounds: 2,
          turns: 1,
          specialDuration: ["turnEnd", "combatEnd", "zeroHP"],
        },
        flags: {
          core: { statusId: "Weakness Broken" },
          dae: { specialDuration: ["turnEnd", "combatEnd", "zeroHP"] },
          "temp-effect": true,
        },
      },
    ]);

    let chatContent = `
            <b>${actor.name}</b> is now <b>Overflow Weakness Break</b>!
            <br>
            ${actor.name} has a <b>-4</b> penalty to <b>Armor Class</b> and <b>Damage Rolls</b>, 
            a <b>-2</b> penalty to all <b>Saving Throws, Ability Checks, Attack Rolls, and Spell Save DC</b>.
            <br>
            Movement speed is reduced by <b>25%</b> until the end of their next turn.
            <br>
            Additionally, <b>${actor.name}</b> gains a stack of <b>Exhaustion</b>, which does not get nullified at the end of Weakness Break.`;

    ChatMessage.create({
      content: chatContent,
      speaker: ChatMessage.getSpeaker({ token: tokenDocument }),
    });

    new Sequence()
      .sound()
      .file(
        "/modules/herald-vanguish-beta/assets/sound/weaknessBroken_apply.ogg"
      )
      .volume(0.1)
      .baseEffect({ type: "reverb", intensity: 4 })
      .audioChannel("music")
      .play();

    let exhaustion = actor.system.attributes.exhaustion || 0;
    let newExhaustionLevel = Math.min(exhaustion - 0, 10);
    newExhaustionLevel = Math.min(exhaustion + 1, 10);
    await actor.update({
      "system.attributes.exhaustion": newExhaustionLevel,
    });
  }
}

export {
  heraldVanguish_getGameIconDamage,
  heraldVanguish_effectWeaknessBroken,
  heraldVanguish_effectOverflowWeaknessBroken,
};
