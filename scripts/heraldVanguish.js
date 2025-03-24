import * as vHelper from "./heraldVanguish_helper.js";

let heraldVanguish_allNpcScene = [];

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
  if (isNaN(CR) || CR < 0) {
    return 0;
  }
  let toughnessValue = Math.ceil(CR * CR + CR * 20);
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
    let npcCr = npc.system.details?.cr;
    let toughnessValue = await heraldVanguish_calculatedToughness(tokenUuid);
    await npc.update({
      "system.details.ideal": toughnessValue,
    });
    listNpc += `
        <div id="heraldVanguish-dialogNpcContainer" class="heraldVanguish-dialogNpcContainer">
            <div id="heraldVanguish-dialogNpcLeft" class="heraldVanguish-dialogNpcLeft">
                <div class="heraldVanguish-dialogNpcImageContainer">
                    <img src="${npc.img}" alt="" class="heraldVanguish-dialogNpcImageView" />
                </div>
                <div id="heraldVanguish-totalWeaknessContainer" class="heraldVanguish-totalWeaknessContainer">
                5
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
                    <div class="heraldVanguish-dialogNpcCr">(Toughness: ${toughnessValue})</div>
                </div>
                <div id="heraldVanguish-dialogNpcWeaknessContainer" class="heraldVanguish-dialogNpcWeaknessContainer">
                    <div id="heraldVanguish-dialogListWeakness" class="heraldVanguish-dialogListWeakness"></div>
                    <div id="heraldVanguish-dialogWeaknessAdd" class="heraldVanguish-dialogWeaknessAdd" data-npc-id="${tokenUuid}">
                      <i class="fa-solid fa-plus"></i>
                    </div>
                </div>
            </div>
            <div id="heraldVanguish-dialogNpcRight" class="heraldVanguish-dialogNpcRight">
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
  }
}

async function heraldVanguish_showDialogAddWeaknessNpc(id) {
  let tokenDocument = await fromUuid(id);
  let token = tokenDocument.object;
  let actor = token.actor;

  console.log(tokenDocument);
  console.log(actor.system);
  console.log(token);

  let dialogContent = `
  <div id="heraldVanguish-dialogWeaknessNpcContainer" class="heraldVanguish-dialogWeaknessNpcContainer">
    <div id="heraldVanguish-dialogWeaknessNpcTop" class="heraldVanguish-dialogWeaknessNpcTop">
    </div>
    <div id="heraldVanguish-dialogWeaknessNpcMiddle" class="heraldVanguish-dialogWeaknessNpcMiddle">
    </div>
    <div id="heraldVanguish-dialogWeaknessNpcBottom" class="heraldVanguish-dialogWeaknessNpcBottom"></div>
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

    await heraldVanguish_getDataDialogWeaknessNpc();
  });
}

async function heraldVanguish_getDataDialogWeaknessNpc() {
  let dialogWeaknessMiddle = document.getElementById(
    "heraldVanguish-dialogWeaknessNpcMiddle"
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
      <div class="heraldVanguish-weaknessCheckbox">
        <input type="checkbox" name="weakness" value="${type}">
        ${vHelper.heraldVanguish_getGameIconDamage(type)}
        <div class="heraldVanguish-weaknessDamageName">${validTypes[type]}</div>
      </div>
    `;
  }

  if (dialogWeaknessMiddle) {
    dialogWeaknessMiddle.innerHTML = listWeaknessdamage;
  }
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
      <div class="heraldVanguish-weaknessCheckbox">
        <input type="checkbox" name="weakness" value="${type}">
        ${vHelper.heraldVanguish_getGameIconDamage(type)}
        <div class="heraldVanguish-weaknessDamageName">${validTypes[type]}</div>
      </div>
    `;
  }

  if (dialogWeaknessMiddle) {
    dialogWeaknessMiddle.innerHTML = listWeaknessdamage;
  }
}

Hooks.on("updateActor", (actor, updateData, options, userId) => {
  console.log(actor);

});

Hooks.on("midi-qol.RollComplete", (workflow) => {
  if (!workflow.damageTotal) return;

  let attacker = workflow.actor;  
  let targets = workflow.targets; 
  let damage = workflow.damageTotal; 

  if (targets.size > 0) {
      targets.forEach(target => {
          console.log(`${attacker.name} menyerang ${target.name} dan memberikan damage sebesar ${damage}`);
          ui.notifications.info(`${attacker.name} menyerang ${target.name} dan memberikan damage sebesar ${damage}`);
      });
  }
});

export { heraldVanguish_renderAccessButton };
