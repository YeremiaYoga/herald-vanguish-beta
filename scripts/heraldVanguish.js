import * as vHelper from "./heraldVanguish_helper.js";

let heraldVanguish_allNpcScene = [];
let heraldVanguish_listNpcApplyVanguish = [];
let heraldVanguish_tempAddWeaknessList = {};

async function heraldVanguish_renderAccessButton() {
  const existingBar = document.getElementById(
    "heraldVanguish-accessButtonContainer"
  );
  if (existingBar) {
    existingBar.remove();
  }

  fetch(
    "/modules/herald-vanguish-beta/templates/heraldVanguish-accessButton.html"
  )
    .then((response) => response.text())
    .then((html) => {
      const div = document.createElement("div");
      div.innerHTML = html;
      const vanguish = div.firstChild;
      vanguish.id = "heraldVanguish-accessButtonContainer";

      const accessButton = document.createElement("button");
      accessButton.id = "heraldVanguish-accessButton";
      accessButton.classList.add("heraldVanguish-accessButton");
      accessButton.innerHTML =
        '<i class="fa-solid fa-skull" style="margin-left:2px;"></i>';
      accessButton.addEventListener("click", function () {
        heraldVanguish_getDataAllNpcScene();
      });

      vanguish.appendChild(accessButton);
      document.body.appendChild(vanguish);
    })
    .catch((err) => {
      console.error("Gagal memuat template resetButton playerlist.html: ", err);
    });
}

async function heraldVanguish_getDataAllNpcScene() {
  heraldVanguish_allNpcScene = [];

  heraldVanguish_allNpcScene = game.scenes.viewed.tokens
    .filter((t) => t.actor.type === "npc")
    .map((t) => t.actor);

  await heraldVanguish_showDialogVanguish();
}
async function heraldVanguish_showDialogVanguish() {
  let dialogContent = `
    <div id="heraldVanguish-dialogListNpcContainer" class="heraldVanguish-dialogListNpcContainer">
      <div id="heraldVanguish-dialogListNpcTop" class="heraldVanguish-dialogListNpcTop">
      </div>
      <div id="heraldVanguish-dialogListNpcMiddle" class="heraldVanguish-dialogListNpcMiddle">
      </div>
      <div id="heraldVanguish-dialogListNpcBottom" class="heraldVanguish-dialogListNpcBottom"></div>
    </div>`;

  new Dialog({
    title: "Herald Vanguished",
    content: dialogContent,
    buttons: {},
    default: "add",
  }).render(true);
  Hooks.once("renderDialog", async (app) => {
    if (app instanceof Dialog && app.title === "Herald Vanguished") {
      const width = 500;
      const height = 500;

      app.setPosition({
        left: (window.innerWidth - width) / 2,
        top: (window.innerHeight - height) / 2,
        width: width,
        height: height,
        scale: 1.0,
      });
    }
    await heraldVanguish_getDataVanguishMiddle();
    await heraldVanguish_getDataVanguishBottom();
  });
}

async function heraldVanguish_calculatedToughness(id) {
  let tokenDocument = await fromUuid(id);
  let token = tokenDocument.object;
  let actor = token.actor;
  let CR = actor.system.details?.cr || 0;
  let maxHp = actor.system.attributes.hp.max;
  if (isNaN(CR) || CR < 0) {
    return 0;
  }
  let toughnessValue = Math.ceil(CR * 5 + Math.floor(maxHp / 10));

  return toughnessValue;
}

async function heraldVanguish_getDataVanguishMiddle() {
  let dialogListNpcMiddleDiv = document.getElementById(
    "heraldVanguish-dialogListNpcMiddle"
  );
  let searchInputValue = "";
  let searchInput = document.getElementById("heraldVanguish-searchListNpc");
  if (searchInput?.value) {
    searchInputValue = searchInput.value.toLowerCase();
  }
  let listNpc = ``;

  let sortedNpcList = [...heraldVanguish_allNpcScene]
    .sort((a, b) => {
      let crA = a.system.details?.cr || 0;
      let crB = b.system.details?.cr || 0;

      if (crA !== crB) {
        return crB - crA;
      }
      return a.name.localeCompare(b.name);
    })
    .filter((npc) => npc.name.toLowerCase().includes(searchInputValue));
  for (let npc of sortedNpcList) {
    let currentHp = npc.system.attributes.hp.value;
    let maxHp = npc.system.attributes.hp.max;
    let token = npc.getActiveTokens()[0];
    let tokenUuid = token?.document?.uuid;
    let tokenDocument = await fromUuid(tokenUuid);
    let npcCr = npc.system.details?.cr;

    let toughnessValue = await heraldVanguish_calculatedToughness(tokenUuid);
    let npcFlag = await tokenDocument.getFlag("world", "heraldVanguish");
    let maxWeakness = 5;
    heraldVanguish_tempAddWeaknessList;
    if (npcFlag) {
      if (npcFlag.maxWeakness) {
        maxWeakness = npcFlag.maxWeakness;
      }
      if (npcFlag.listWeakness) {
      }
    }
    let listWeakness = ``;
    // if(heraldVanguish_tempAddWeaknessList[tokenUuid]){
    //   for(let type of heraldVanguish_tempAddWeaknessList[tokenUuid]){
    //     listWeakness+=`${vHelper.heraldVanguish_getGameIconDamage(type)}`;
    //   }
    // }

    listNpc += `
        <div id="heraldVanguish-dialogNpcContainer" class="heraldVanguish-dialogNpcContainer">
            <div id="heraldVanguish-dialogNpcLeft" class="heraldVanguish-dialogNpcLeft">
                <div class="heraldVanguish-dialogNpcImageContainer">
                    <img src="${npc.img}" alt="" class="heraldVanguish-dialogNpcImageView" />
                </div>
                <div id="heraldVanguish-maxWeaknessContainer" class="heraldVanguish-maxWeaknessContainer">
                  <input id="heraldVanguish-maxWeaknessValue-${tokenUuid}" class="heraldHud-maxWeaknessValue" type="number" value="${maxWeakness}"/>
                </div>
            </div>
            <div id="heraldVanguish-dialogNpcMiddle" class="heraldVanguish-dialogNpcMiddle">
                <div id="heraldVanguish-dialogNpcMiddleTop" class="heraldVanguish-dialogNpcMiddleTop">
                    <div id="heraldVanguish-dialogNpcName" class="heraldVanguish-dialogNpcName">${npc.name}</div>
                    <div id="heraldVanguish-dialogNpcHp" class="heraldVanguish-dialogNpcHp">HP: ${currentHp}/${maxHp}</div>
                </div>
                <div id="heraldVanguish-dialogNpcMiddleMid" class="heraldVanguish-dialogNpcMiddleMid">
                    <div id="heraldVanguish-dialogNpcUuid" class="heraldVanguish-dialogNpcUuid">${tokenUuid}</div>
                </div>
                <div id="heraldVanguish-dialogNpcMiddleBot" class="heraldVanguish-dialogNpcMiddleBot">
                    <div class="heraldVanguish-dialogNpcCr">CR ${npcCr}</div>
                    <div id="heraldVanguish-dialogNpcToughness" class="heraldVanguish-dialogNpcToughness" value="${toughnessValue}"  data-npc-id="${tokenUuid}">(Toughness: ${toughnessValue})</div>
                </div>
                <div id="heraldVanguish-dialogNpcWeaknessContainer" class="heraldVanguish-dialogNpcWeaknessContainer">
                    <div id="heraldVanguish-dialogListWeakness" class="heraldVanguish-dialogListWeakness">${listWeakness}</div>
                    <div id="heraldVanguish-dialogWeaknessAdd" class="heraldVanguish-dialogWeaknessAdd" data-npc-id="${tokenUuid}">
                      <i class="fa-solid fa-plus"></i>
                    </div>
                </div>
            </div>
            <div id="heraldVanguish-dialogNpcRight" class="heraldVanguish-dialogNpcRight">
              <label>
                <input type="checkbox" class="heraldVanguish-dialogNpcCheckbox" value="${tokenUuid}">
              </label>
            </div>
        </div>
        `;
  }

  if (dialogListNpcMiddleDiv) {
    dialogListNpcMiddleDiv.innerHTML = listNpc;

    document
      .querySelectorAll(".heraldVanguish-dialogWeaknessAdd")
      .forEach((div) => {
        const npcId = div.getAttribute("data-npc-id");
        div.addEventListener("click", async (event) => {
          heraldVanguish_showDialogAddWeaknessNpc(npcId);
        });
      });
  }
}

async function heraldVanguish_getDataVanguishBottom() {
  let dialogVanguishBotDiv = document.getElementById(
    "heraldVanguish-dialogListNpcBottom"
  );

  if (dialogVanguishBotDiv) {
    dialogVanguishBotDiv.innerHTML = `
    <div id="heraldVanguish-dialogListNpcBottomTop" class="heraldVanguish-dialogListNpcBottomTop">
      <div id="heraldVanguish-applyWeaknessToAllContainer" class="heraldVanguish-applyWeaknessToAllContainer">
          <button id="heraldVanguish-applyToAllButton" class="heraldVanguish-applyToAllButton">Apply to All</button>
      </div>
    </div>
    <div id="heraldVanguish-dialogListNpcBottomBot" class="heraldVanguish-dialogListNpcBottomBot">
      <div id="heraldVanguish-searchListNpcContainer" class="heraldVanguish-searchListNpcContainer">
         <input type="text" id="heraldVanguish-searchListNpc" class="heraldVanguish-searchListNpc" placeholder="Search NPC...">
      </div>
      <div id="heraldVanguish-saveListNpcContainer" class="heraldVanguish-saveListNpcContainer">
        <button id="heraldVanguish-saveListNpc" class="heraldVanguish-saveListNpc">Apply</button>
      </div>
    </div>
    `;

    let searchTimeout;

    document
      .getElementById("heraldVanguish-searchListNpc")
      ?.addEventListener("input", (event) => {
        clearTimeout(searchTimeout);

        searchTimeout = setTimeout(() => {
          heraldVanguish_getDataVanguishMiddle();
        }, 100);
      });

    document
      .getElementById("heraldVanguish-applyWeaknessToAllContainer")
      ?.addEventListener("click", async (event) => {
        await heraldVanguish_showDialogAddWeaknessAllNpc();
      });

    document
      .getElementById("heraldVanguish-saveListNpcContainer")
      ?.addEventListener("click", async (event) => {
        await heraldVanguish_applyVanguishNpc();
      });
  }
}

async function heraldVanguish_showDialogAddWeaknessNpc(id) {
  let tokenDocument = await fromUuid(id);
  let token = tokenDocument.object;
  let actor = token.actor;

  let dialogContent = `
  <div id="heraldVanguish-dialogWeaknessNpcContainer" class="heraldVanguish-dialogWeaknessNpcContainer">
    <div id="heraldVanguish-dialogWeaknessNpcTop" class="heraldVanguish-dialogWeaknessNpcTop">
    </div>
    <div id="heraldVanguish-dialogWeaknessNpcMiddle" class="heraldVanguish-dialogWeaknessNpcMiddle">
    </div>
    <div id="heraldVanguish-dialogWeaknessNpcBottom" class="heraldVanguish-dialogWeaknessNpcBottom">
      <div id="heraldVanguish-saveNpcWeaknessContainer" class="heraldVanguish-saveNpcWeaknessContainer">
        <button id="heraldVanguish-saveNpcWeakness" class="heraldVanguish-saveNpcWeakness">Save</button>
      </div>
    </div>
  </div>`;

  new Dialog({
    title: `${actor.name} Weakness List`,
    content: dialogContent,
    buttons: {},
    default: "add",
  }).render(true);
  Hooks.once("renderDialog", async (app) => {
    if (app instanceof Dialog && app.title === `${actor.name} Weakness List`) {
      const width = 400;
      const height = 400;

      app.setPosition({
        left: (window.innerWidth - width) / 2,
        top: (window.innerHeight - height) / 2,
        width: width,
        height: height,
        scale: 1.0,
      });
    }

    document
      .getElementById("heraldVanguish-saveNpcWeaknessContainer")
      ?.addEventListener("click", async (event) => {
        console.log("test");
        await heraldVanguish_addWeaknessNpc(id);
      });
    await heraldVanguish_getDataDialogWeaknessNpc(id);
  });
}

async function heraldVanguish_getDataDialogWeaknessNpc(id) {
  let dialogWeaknessMiddle = document.getElementById(
    "heraldVanguish-dialogWeaknessNpcMiddle"
  );

  let tokenDocument = await fromUuid(id);
  let token = tokenDocument.object;
  let actor = token.actor;
  let npcFlag = await tokenDocument.getFlag("world", "heraldVanguish");
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

  let listWeaknessdamage = "";

  for (let type in validTypes) {
    listWeaknessdamage += `
      <div class="heraldVanguish-npcWeaknessCheckboxContainer">
        <input id="heraldVanguish-npcWeaknessCheckbox" class="heraldVanguish-npcWeaknessCheckbox" type="checkbox" name="weakness" value="${type}">
        ${vHelper.heraldVanguish_getGameIconDamage(type)}
        <div class="heraldVanguish-weaknessDamageName">${validTypes[type]}</div>
      </div>
    `;
  }

  if (dialogWeaknessMiddle) {
    dialogWeaknessMiddle.innerHTML = listWeaknessdamage;
  }
}

async function heraldVanguish_addWeaknessNpc(id) {
  if (!heraldVanguish_tempAddWeaknessList[id]) {
    heraldVanguish_tempAddWeaknessList[id] = [];
  }
  document
    .querySelectorAll(".heraldVanguish-npcWeaknessCheckbox:checked")
    .forEach((checkbox) => {
      let weakness = checkbox.value;
      if (!heraldVanguish_tempAddWeaknessList[id].includes(weakness)) {
        heraldVanguish_tempAddWeaknessList[id].push(weakness);
      }
    });

  console.log(heraldVanguish_tempAddWeaknessList);
}

async function heraldVanguish_showDialogAddWeaknessAllNpc() {
  let dialogContent = `
  <div id="heraldVanguish-dialogWeaknessAllNpcContainer" class="heraldVanguish-dialogWeaknessAllNpcContainer">
    <div id="heraldVanguish-dialogWeaknessAllNpcTop" class="heraldVanguish-dialogWeaknessAllNpcTop">
    </div>
    <div id="heraldVanguish-dialogWeaknessAllNpcMiddle" class="heraldVanguish-dialogWeaknessAllNpcMiddle">
    </div>
    <div id="heraldVanguish-dialogWeaknessAllNpcBottom" class="heraldVanguish-dialogWeaknessAllNpcBottom"></div>
  </div>`;

  new Dialog({
    title: `Weakness All Npc`,
    content: dialogContent,
    buttons: {},
    default: "add",
  }).render(true);
  Hooks.once("renderDialog", async (app) => {
    if (app instanceof Dialog && app.title === `Weakness All Npc`) {
      const width = 400;
      const height = 400;

      app.setPosition({
        left: (window.innerWidth - width) / 2,
        top: (window.innerHeight - height) / 2,
        width: width,
        height: height,
        scale: 1.0,
      });
    }

    await heraldVanguish_getDataDialogWeaknessAllNpc();
  });
}

async function heraldVanguish_getDataDialogWeaknessAllNpc() {
  let dialogWeaknessMiddle = document.getElementById(
    "heraldVanguish-dialogWeaknessAllNpcMiddle"
  );
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

  let listWeaknessdamage = "";

  for (let type in validTypes) {
    listWeaknessdamage += `
      <div class="heraldVanguish-allNpcweaknessCheckboxContainer">
        <input id="heraldVanguish-allNpcWeaknessCheckbox" type="checkbox" name="weakness" value="${type}">
        ${vHelper.heraldVanguish_getGameIconDamage(type)}
        <div class="heraldVanguish-weaknessDamageName">${validTypes[type]}</div>
      </div>
    `;
  }

  if (dialogWeaknessMiddle) {
    dialogWeaknessMiddle.innerHTML = listWeaknessdamage;
  }
}

async function heraldVanguish_applyVanguishNpc() {
  heraldVanguish_listNpcApplyVanguish = [];
  console.log("jalan");
  document
    .querySelectorAll(".heraldVanguish-dialogNpcCheckbox:checked")
    .forEach((checkbox) => {
      let npcId = checkbox.value;
      heraldVanguish_listNpcApplyVanguish.push(npcId);
    });

  for (let id of heraldVanguish_listNpcApplyVanguish) {
    let tokenDocument = await fromUuid(id);
    let token = tokenDocument.object;
    let npc = token.actor;
    let toughness = 0;
    let maxWeakness = 0;
    let listWeakness = [];
    let toughnessElement = document.querySelector(
      `#heraldVanguish-dialogNpcToughness[data-npc-id="${id}"]`
    );
    if (toughnessElement) {
      let toughnessValue = Number(toughnessElement.getAttribute("value"));
      toughness = toughnessValue;
    }

    let maxWeaknessValueDiv = document.getElementById(
      `heraldVanguish-maxWeaknessValue-${id}`
    );

    if (maxWeaknessValueDiv) {
      maxWeakness = Number(maxWeaknessValueDiv.value);
    }
    await tokenDocument.setFlag("world", "heraldVanguish", {
      toughness: toughness,
      // maxWeakness: maxWeakness,
    });

    let savedData = await tokenDocument.getFlag("world", "heraldVanguish");
    console.log(`Flag set untuk ${npc.name}:`, savedData);
  }
}

Hooks.on("preUpdateActor", async (actor, updateData, options, userId) => {
  if (!updateData.system?.attributes?.hp) return;

  let oldHP = actor.system.attributes.hp.value;
  let newHP = updateData.system.attributes.hp.value ?? oldHP;
  let oldTempHP = actor.system.attributes.hp.temp || 0;
  let newTempHP = updateData.system.attributes.hp.temp ?? oldTempHP;

  let damageTaken = 0;
  let damageType = "unknown";

  if (newTempHP < oldTempHP) {
    damageTaken = oldTempHP - newTempHP;
  } else if (newHP < oldHP) {
    damageTaken = oldHP - newHP + (oldTempHP - newTempHP);
  }

  if (damageTaken > 0) {
    console.log(damageTaken);
  }
  let tokenDocument = actor.getActiveTokens().find((t) => t.scene)?.document;

  let heraldVanguish = await tokenDocument.getFlag("world", "heraldVanguish");
  if (heraldVanguish.toughness !== undefined) {
    let newToughness = Math.max(0, heraldVanguish.toughness - damageTaken);
    await tokenDocument.setFlag("world", "heraldVanguish", {
      ...heraldVanguish,
      toughness: newToughness,
    });

    let afterUpdate = await tokenDocument.getFlag("world", "heraldVanguish");
    console.log(afterUpdate);
  }
});

Hooks.on("updateActor", async (actor, data) => {
  setTimeout(async () => {
    let tokenDocument = actor.getActiveTokens().find((t) => t.scene)?.document;
    let npcTokenFlag = await tokenDocument.getFlag("world", "heraldVanguish");

    console.log(tokenDocument.uuid);
    if (npcTokenFlag.toughness <= 0) {
      let toughnessValue = await heraldVanguish_calculatedToughness(
        tokenDocument.uuid
      );
      await tokenDocument.setFlag("world", "heraldVanguish", {
        ...npcTokenFlag,
        toughness: toughnessValue,
      });

      let existingEffect = actor.effects.find(
        (e) => e.name === "Weakness: Broken"
      );
      if (!existingEffect) {
        await actor.createEmbeddedDocuments("ActiveEffect", [
          {
            name: "Weakness: Broken",
            icon: "",
            changes: [],
            origin: `Actor.${actor.id}`,
            disabled: false,
            transfer: false,
            duration: { rounds: 21 },
          },
        ]);
      }
    }

    console.log(npcTokenFlag);
    if (npcTokenFlag?.toughness !== undefined) {
      let chatContent = `${actor.name} Toughness: ${npcTokenFlag.toughness}`;
      ChatMessage.create({
        content: chatContent,
        speaker: null,
      });
    }
  }, 500);
});

export { heraldVanguish_renderAccessButton };
