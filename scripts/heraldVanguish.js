import * as vHelper from "./heraldVanguish_helper.js";

let heraldVanguish_allNpcScene = [];
let heraldVanguish_listNpcApplyVanguish = [];
let heraldVanguish_tempAddWeaknessList = {};
let heraldVanguish_kalkulasiToughness = "CR * 4 + maxHp / 10";
let heraldVanguish_attackerUuid = "";

Hooks.once("ready", () => {
  heraldVanguish_kalkulasiToughness = game.settings.get(
    "herald-vanguish-beta",
    "calculatedToughness"
  );
});
async function heraldVanguish_renderAccessButton() {
  const existingBar = document.getElementById(
    "heraldVanguish-accessButtonContainer"
  );
  if (existingBar) {
    existingBar.remove();
  }

  fetch(
    "/modules/herald-vanguish-beta/templates/heraldVanguish-accessVanguish.html"
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
    .filter((t) => t.actor.type === "npc" && t.disposition === -1)
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
    const dialogElement = app.element[0];
    const contentElement = dialogElement.querySelector(".window-content");
    if (contentElement) {
      contentElement.style.backgroundColor = "rgba(0, 0, 0, 0.3)";
      contentElement.style.color = "white";
      contentElement.style.backgroundImage = "none";
      contentElement.style.backgroundSize = "cover";
      contentElement.style.backgroundRepeat = "no-repeat";
      contentElement.style.backgroundPosition = "center";
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
  let toughnessValue = 0;
  try {
    heraldVanguish_kalkulasiToughness = game.settings.get(
      "herald-vanguish-beta",
      "calculatedToughness"
    );
    let formula = heraldVanguish_kalkulasiToughness
      .replace(/CR/g, CR)
      .replace(/maxHp/g, maxHp);

    toughnessValue = Math.ceil(Function(`return ${formula}`)());
  } catch (error) {
    console.error("❌ Error parsing toughness formula:", error);
  }

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
    if (npcFlag) {
      if (npcFlag.maxWeakness) {
        maxWeakness = npcFlag.maxWeakness;
      }
      if (npcFlag.listWeakness) {
        heraldVanguish_tempAddWeaknessList[tokenUuid] = npcFlag.listWeakness;
      }
    }
    let listWeakness = ``;
    if (heraldVanguish_tempAddWeaknessList[tokenUuid]) {
      for (let type of heraldVanguish_tempAddWeaknessList[tokenUuid]) {
        listWeakness += `${vHelper.heraldVanguish_getPersonalityIconNoTooltip(
          type
        )}`;
      }
    }

    listNpc += `
        <div id="heraldVanguish-dialogNpcContainer" class="heraldVanguish-dialogNpcContainer">
            <div id="heraldVanguish-dialogNpcLeft" class="heraldVanguish-dialogNpcLeft">
                <div class="heraldVanguish-dialogNpcImageContainer">
                    <img src="${npc.img}" alt="" class="heraldVanguish-dialogNpcImageView" />
                </div>
                <div id="heraldVanguish-maxWeaknessContainer" class="heraldVanguish-maxWeaknessContainer">
                  <input id="heraldVanguish-maxWeaknessValue-${tokenUuid}" class="heraldHud-maxWeaknessValue" type="number" value="${maxWeakness}" style="color: white !important;"/>
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
                    <div id="heraldVanguish-dialogNpcToughness" class="heraldVanguish-dialogNpcToughness" value=""  data-npc-id="${tokenUuid}">(Toughness: ${toughnessValue})</div>
                      <input id="heraldVanguish-hiddenToughnessValue-${tokenUuid}" class="heraldHud-hiddenToughnessValue" type="text" value="${toughnessValue}" style="display: none;"/>
                    <div id="heraldVanguish-addToughnessContainer" class="heraldVanguish-addToughnessContainer" data-npc-id="${tokenUuid}">
                      <input id="heraldVanguish-addToughnessValue-${tokenUuid}" class="heraldHud-addToughnessValue" data-npc-id="${tokenUuid}"   type="text" value="" style="color: white !important;"/>
                    </div>
                </div>
                <div id="heraldVanguish-dialogNpcWeaknessContainer" class="heraldVanguish-dialogNpcWeaknessContainer">
                    <div id="heraldVanguish-dialogListWeakness-${tokenUuid}" class="heraldVanguish-dialogListWeakness">${listWeakness}</div>
                    <div id="heraldVanguish-dialogWeaknessAdd" class="heraldVanguish-dialogWeaknessAdd" data-npc-id="${tokenUuid}">
                      <i class="fa-solid fa-plus"></i>
                    </div>
                </div>
            </div>
            <div id="heraldVanguish-dialogNpcRight" class="heraldVanguish-dialogNpcRight">
              <label>
                <input id="heraldVanguish-dialogNpcCheckbox-${tokenUuid}" type="checkbox" class="heraldVanguish-dialogNpcCheckbox" value="${tokenUuid}">
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

    for (let npc of sortedNpcList) {
      let token = npc.getActiveTokens()[0];
      let tokenUuid = token?.document?.uuid;
      let inputToughness = document.getElementById(
        `heraldVanguish-addToughnessValue-${tokenUuid}`
      );
      let delayTimer;
      inputToughness.addEventListener("keydown", (event) => {
        if (event.key === "Enter") {
          event.preventDefault();
          clearTimeout(delayTimer);
          delayTimer = setTimeout(() => {
            heraldVanguish_addToughnessManual(tokenUuid, inputToughness.value);
          }, 500);
        }
      });
    }
  }
}

async function heraldVanguish_addToughnessManual(id, value) {
  let inputToughness = document.getElementById(
    `heraldVanguish-addToughnessValue-${id}`
  );
  let toughnessElement = document.querySelector(
    `#heraldVanguish-dialogNpcToughness[data-npc-id="${id}"]`
  );
  let inputHidden = document.getElementById(
    `heraldVanguish-hiddenToughnessValue-${id}`
  );
  if (!toughnessElement) {
    console.error(`Element toughness untuk NPC ${id} tidak ditemukan.`);
    return;
  }
  let currentToughness =
    parseInt(toughnessElement.textContent.match(/-?\d+/)?.[0]) || 0;

  value = value.trim();
  let changeValue = parseInt(value.replace(/[^0-9-+]/g, ""));

  if (isNaN(changeValue)) {
    console.error(`Nilai toughness '${value}' bukan angka yang valid.`);
    return;
  }

  let newToughness =
    value.startsWith("+") || value.startsWith("-")
      ? currentToughness + changeValue
      : changeValue;

  if (inputHidden) {
    inputHidden.setAttribute("value", newToughness);
  }

  toughnessElement.textContent = `(Toughness: ${newToughness})`;
  if (inputToughness) {
    inputToughness.value = "";
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
          <button id="heraldVanguish-applyWeaknessAll" class="heraldVanguish-applyWeaknessAll">Apply to All</button>
      </div>
      <div id="heraldVanguish-applyToughnessToAllContainer" class="heraldVanguish-applyToughnessToAllContainer">
          <button id="heraldVanguish-applyToughnessAll" class="heraldVanguish-applyToughnessAll">Vanguish to All</button>
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
      .getElementById("heraldVanguish-applyToughnessToAllContainer")
      ?.addEventListener("click", async (event) => {
        await heraldVanguish_applyToughnessAllNpc();
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

  const dialog = new Dialog({
    title: `${actor.name} Weakness List`,
    content: dialogContent,
    buttons: {},
    default: "add",
  });

  dialog.render(true);
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
    const dialogElement = app.element[0];
    const contentElement = dialogElement.querySelector(".window-content");
    if (contentElement) {
      contentElement.style.backgroundColor = "rgba(0, 0, 0, 0.3)";
      contentElement.style.color = "white";
      contentElement.style.backgroundImage = "none";
      contentElement.style.backgroundSize = "cover";
      contentElement.style.backgroundRepeat = "no-repeat";
      contentElement.style.backgroundPosition = "center";
    }

    document
      .getElementById("heraldVanguish-saveNpcWeaknessContainer")
      ?.addEventListener("click", async (event) => {
        await heraldVanguish_addWeaknessNpc(id);
        dialog.close();
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
  const validTypes = {
    innocent: "Innocent",
    sage: "Sage",
    explorer: "Explorer",
    outlaw: "Outlaw",
    magician: "Magician",
    hero: "Hero",
    lover: "Lover",
    jester: "Jester",
    everyman: "Everyman",
    caregiver: "Caregiver",
    ruler: "Ruler",
    creator: "Creator",
  };

  let listWeaknessdamage = "";

  for (let type in validTypes) {
    let isChecked = ``;
    if (heraldVanguish_tempAddWeaknessList[id]) {
      isChecked = heraldVanguish_tempAddWeaknessList[id].includes(type)
        ? "checked"
        : "";
    }

    listWeaknessdamage += `
      <div class="heraldVanguish-npcWeaknessCheckboxContainer">
        <input id="heraldVanguish-npcWeaknessCheckbox" class="heraldVanguish-npcWeaknessCheckbox" type="checkbox" name="weakness" value="${type}" ${isChecked}>
        ${vHelper.heraldVanguish_getPersonalityIconNoTooltip(type)}
        <div class="heraldVanguish-weaknessDamageName">${validTypes[type]}</div>
      </div>
    `;
  }

  if (dialogWeaknessMiddle) {
    dialogWeaknessMiddle.innerHTML = listWeaknessdamage;
  }
}

async function heraldVanguish_addWeaknessNpc(id) {
  let tokenDocument = await fromUuid(id);
  let token = tokenDocument.object;
  let actor = token.actor;
  heraldVanguish_tempAddWeaknessList[id] = [];
  let maxWeaknessValueDiv = document.getElementById(
    `heraldVanguish-maxWeaknessValue-${id}`
  );
  let maxWeakness = 5;
  if (maxWeaknessValueDiv) {
    maxWeakness = Number(maxWeaknessValueDiv.value);
  }
  document
    .querySelectorAll(".heraldVanguish-npcWeaknessCheckbox:checked")
    .forEach((checkbox) => {
      let weakness = checkbox.value;
      if (!heraldVanguish_tempAddWeaknessList[id].includes(weakness)) {
        heraldVanguish_tempAddWeaknessList[id].push(weakness);
      }
    });

  const validTypes = [
    "innocent",
    "sage",
    "explorer",
    "outlaw",
    "magician",
    "hero",
    "lover",
    "jester",
    "everyman",
    "caregiver",
    "ruler",
    "creator",
  ];

  while (heraldVanguish_tempAddWeaknessList[id].length < maxWeakness) {
    let random = validTypes[Math.floor(Math.random() * validTypes.length)];
    if (!heraldVanguish_tempAddWeaknessList[id].includes(random)) {
      heraldVanguish_tempAddWeaknessList[id].push(random);
    }
  }

  await heraldVanguish_updateWeaknessNpc();
}

async function heraldVanguish_updateWeaknessNpc() {
  for (let npc of heraldVanguish_allNpcScene) {
    let token = npc.getActiveTokens()[0];
    let tokenUuid = token?.document?.uuid;
    let tokenDocument = await fromUuid(tokenUuid);

    let weaknessNpcList = document.getElementById(
      `heraldVanguish-dialogListWeakness-${tokenUuid}`
    );
    let listWeakness = ``;
    if (heraldVanguish_tempAddWeaknessList[tokenUuid]) {
      for (let type of heraldVanguish_tempAddWeaknessList[tokenUuid]) {
        listWeakness += `${vHelper.heraldVanguish_getPersonalityIconNoTooltip(
          type
        )}`;
      }
    }

    if (weaknessNpcList) {
      weaknessNpcList.innerHTML = listWeakness;
    }
  }
}

async function heraldVanguish_showDialogAddWeaknessAllNpc() {
  let dialogContent = `
  <div id="heraldVanguish-dialogWeaknessAllNpcContainer" class="heraldVanguish-dialogWeaknessAllNpcContainer">
    <div id="heraldVanguish-dialogWeaknessAllNpcTop" class="heraldVanguish-dialogWeaknessAllNpcTop">
    </div>
    <div id="heraldVanguish-dialogWeaknessAllNpcMiddle" class="heraldVanguish-dialogWeaknessAllNpcMiddle">
    </div>
    <div id="heraldVanguish-dialogWeaknessAllNpcBottom" class="heraldVanguish-dialogWeaknessAllNpcBottom">
      <div id="heraldVanguish-saveNpcAllWeaknessContainer" class="heraldVanguish-saveNpcAllWeaknessContainer">
        <button id="heraldVanguish-saveNpcAllWeakness" class="heraldVanguish-saveNpcAllWeakness">Save</button>
      </div>
    </div>
  </div>`;

  const dialog = new Dialog({
    title: `Weakness All Npc`,
    content: dialogContent,
    buttons: {},
    default: "add",
  });

  dialog.render(true);
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
    document
      .getElementById("heraldVanguish-saveNpcAllWeaknessContainer")
      ?.addEventListener("click", async (event) => {
        await heraldVanguish_addWeaknessAllNpcSelected();
        dialog.close();
      });
    await heraldVanguish_getDataTopDialogWeaknessAllNpc();
    await heraldVanguish_getDataMiddleDialogWeaknessAllNpc();
  });
}

async function heraldVanguish_getDataTopDialogWeaknessAllNpc() {
  heraldVanguish_listNpcApplyVanguish = [];
  let dialogWeaknessTop = document.getElementById(
    "heraldVanguish-dialogWeaknessAllNpcTop"
  );
  document
    .querySelectorAll(".heraldVanguish-dialogNpcCheckbox:checked")
    .forEach((checkbox) => {
      let npcId = checkbox.value;
      heraldVanguish_listNpcApplyVanguish.push(npcId);
    });

  if (dialogWeaknessTop) {
    const totalNpc = heraldVanguish_listNpcApplyVanguish.length;
    if (totalNpc > 0) {
      const sliderHtml = `
      <div style="margin-top: 10px;">
        <label for="heraldVanguish-sliderNpcCountWeakness">Select NPC amount to apply effect: 
          <span id="heraldVanguish-sliderNpcWeaknessValue">1</span> / ${totalNpc}
        </label>
        <input 
          type="range" 
          id="heraldVanguish-sliderNpcCountWeakness" 
          min="1" 
          max="${totalNpc}" 
          value="1" 
          step="1" 
          style="width: 100%;">
      </div>
    `;
      dialogWeaknessTop.innerHTML = sliderHtml;
      const slider = document.getElementById(
        "heraldVanguish-sliderNpcCountWeakness"
      );
      const sliderValue = document.getElementById(
        "heraldVanguish-sliderNpcWeaknessValue"
      );
      slider.addEventListener("input", () => {
        sliderValue.textContent = slider.value;
      });
    }
  }
}

async function heraldVanguish_getDataMiddleDialogWeaknessAllNpc() {
  let dialogWeaknessMiddle = document.getElementById(
    "heraldVanguish-dialogWeaknessAllNpcMiddle"
  );
  const validTypes = {
    innocent: "Innocent",
    sage: "Sage",
    explorer: "Explorer",
    outlaw: "Outlaw",
    magician: "Magician",
    hero: "Hero",
    lover: "Lover",
    jester: "Jester",
    everyman: "Everyman",
    caregiver: "Caregiver",
    ruler: "Ruler",
    creator: "Creator",
  };

  let listWeaknessdamage = "";

  for (let type in validTypes) {
    listWeaknessdamage += `
      <div class="heraldVanguish-allNpcweaknessCheckboxContainer">
        <input id="heraldVanguish-allNpcWeaknessCheckbox" class="heraldVanguish-allNpcWeaknessCheckbox" type="checkbox" name="weakness" value="${type}">
        ${vHelper.heraldVanguish_getPersonalityIconNoTooltip(type)}
        <div class="heraldVanguish-weaknessDamageName">${validTypes[type]}</div>
      </div>
    `;
  }

  if (dialogWeaknessMiddle) {
    dialogWeaknessMiddle.innerHTML = listWeaknessdamage;
  }
}
async function heraldVanguish_addWeaknessAllNpcSelected() {
  let sliderDiv = document.getElementById(
    "heraldVanguish-sliderNpcCountWeakness"
  );
  let sliderValue = sliderDiv.value;
  let sliderMax = sliderDiv.max;
  const validTypes = [
    "innocent",
    "sage",
    "explorer",
    "outlaw",
    "magician",
    "hero",
    "lover",
    "jester",
    "everyman",
    "caregiver",
    "ruler",
    "creator",
  ];
  if (sliderValue == sliderMax) {
    for (let id of heraldVanguish_listNpcApplyVanguish) {
      let maxWeaknessValueDiv = document.getElementById(
        `heraldVanguish-maxWeaknessValue-${id}`
      );
      let maxWeakness = 5;
      if (maxWeaknessValueDiv) {
        maxWeakness = Number(maxWeaknessValueDiv.value);
      }
      heraldVanguish_tempAddWeaknessList[id] = [];
      document
        .querySelectorAll(".heraldVanguish-allNpcWeaknessCheckbox:checked")
        .forEach((checkbox) => {
          let weakness = checkbox.value;
          if (!heraldVanguish_tempAddWeaknessList[id].includes(weakness)) {
            heraldVanguish_tempAddWeaknessList[id].push(weakness);
          }
        });
      while (heraldVanguish_tempAddWeaknessList[id].length < maxWeakness) {
        let random = validTypes[Math.floor(Math.random() * validTypes.length)];
        if (!heraldVanguish_tempAddWeaknessList[id].includes(random)) {
          heraldVanguish_tempAddWeaknessList[id].push(random);
        }
      }
    }
  } else {
    let selectedWeaknesses = [];
    document
      .querySelectorAll(".heraldVanguish-allNpcWeaknessCheckbox:checked")
      .forEach((checkbox) => {
        let weakness = checkbox.value;
        console.log(weakness);
        selectedWeaknesses.push(weakness);
      });
    if (selectedWeaknesses.length === 0) {
      selectedWeaknesses = [...validTypes];
    }
    let npcIds = [...heraldVanguish_listNpcApplyVanguish];
    let npcWeaknessMap = {};
    let maxWeaknessMap = {};

    for (let npcId of npcIds) {
      npcWeaknessMap[npcId] = [];

      let maxWeaknessValueDiv = document.getElementById(
        `heraldVanguish-maxWeaknessValue-${npcId}`
      );
      let maxWeakness = 5;
      if (maxWeaknessValueDiv) {
        maxWeakness = Number(maxWeaknessValueDiv.value);
      }
      maxWeaknessMap[npcId] = maxWeakness;
    }

    for (let weakness of selectedWeaknesses) {
      let assigned = 0;
      let attemptNpcs = [...npcIds];

      while (assigned < sliderValue && attemptNpcs.length > 0) {
        let index = Math.floor(Math.random() * attemptNpcs.length);
        let npcId = attemptNpcs.splice(index, 1)[0];
        let npcWeaknesses = npcWeaknessMap[npcId];
        if (
          npcWeaknesses.length < maxWeaknessMap[npcId] &&
          !npcWeaknesses.includes(weakness)
        ) {
          npcWeaknesses.push(weakness);
          assigned++;
        }
      }

      if (assigned < sliderValue) {
        console.warn(
          `Tidak bisa menetapkan weakness '${weakness}' sebanyak ${sliderValue} kali.`
        );
      }
    }

    for (let npcId of npcIds) {
      let npcWeaknesses = npcWeaknessMap[npcId];
      let maxWeakness = maxWeaknessMap[npcId];
      while (npcWeaknesses.length < maxWeakness) {
        let random = validTypes[Math.floor(Math.random() * validTypes.length)];
        if (!npcWeaknesses.includes(random)) {
          npcWeaknesses.push(random);
        }
      }
      heraldVanguish_tempAddWeaknessList[npcId] = npcWeaknesses;
    }
  }
  await heraldVanguish_updateWeaknessNpc();
}

async function heraldVanguish_applyVanguishNpc() {
  heraldVanguish_listNpcApplyVanguish = [];
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
    let heraldVanguish = await tokenDocument.getFlag("world", "heraldVanguish");
    let toughnessElement = document.getElementById(
      `heraldVanguish-hiddenToughnessValue-${id}`
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
      maxToughness: toughness,
      overflowToughness: 0,
      maxWeakness: maxWeakness,
      listWeakness: heraldVanguish_tempAddWeaknessList[id],
    });

    setTimeout(async () => {
      await heraldVanguish_addToughnessBar(tokenDocument);
      for (let type of heraldVanguish_tempAddWeaknessList[id]) {
        vHelper.heraldVanguish_addEffectPersonalityNpc(id, type);
      }
    }, 500);
  }
}

async function heraldVanguish_addToughnessBar(tokenDocument) {
  const existingBars =
    (await tokenDocument.getFlag("barbrawl", "resourceBars")) || {};

  if (existingBars["toughness"]) {
    delete existingBars["toughness"];
    await tokenDocument.setFlag("barbrawl", "resourceBars", existingBars);
  }
  let highestOrder = Math.max(
    0,
    ...Object.values(existingBars).map((b) => b.order ?? 0)
  );

  const heraldVanguishFlag = await tokenDocument.getFlag(
    "world",
    "heraldVanguish"
  );

  const newBarConfig = {
    id: "toughness",
    attribute: "custom",
    value: heraldVanguishFlag.toughness,
    max: heraldVanguishFlag.maxToughness,
    ownerVisibility: CONST.TOKEN_DISPLAY_MODES.ALWAYS,
    otherVisibility: CONST.TOKEN_DISPLAY_MODES.ALWAYS,
    gmVisibility: -1,
    hideCombat: false,
    hideNoCombat: false,
    hideEmpty: false,
    hideFull: false,
    hideHud: false,
    mincolor: "#000080",
    maxcolor: "#80B3FF",
    position: "top-inner",
    indentLeft: null,
    indentRight: null,
    shareHeight: false,
    style: "fraction",
    opacity: null,
    ignoreMin: false,
    ignoreMax: false,
    invert: false,
    invertDirection: false,
    label: "Toughness",
    subdivisions: null,
    subdivisionsOwner: false,
    intentLeft: 0,
    fgImage: "",
    bgImage: "",
    order: existingBars["toughness"]?.order ?? highestOrder + 1,
  };

  const updatedBars = {
    ...existingBars,
    toughness: newBarConfig,
  };

  await tokenDocument.setFlag("barbrawl", "resourceBars", updatedBars);
  console.log("🔄 Toughness bar telah ditambahkan atau diupdate.");
}

async function heraldVanguish_updateToughnessBar(tokenDocument) {
  const existingBars =
    (await tokenDocument.getFlag("barbrawl", "resourceBars")) || {};

  if (!existingBars["toughness"]) {
    console.warn("⚠️ Toughness bar belum ada. Tidak bisa diupdate.");
    return;
  }

  const heraldVanguishFlag = await tokenDocument.getFlag(
    "world",
    "heraldVanguish"
  );

  existingBars["toughness"].value = heraldVanguishFlag.toughness;
  existingBars["toughness"].max = heraldVanguishFlag.maxToughness;

  await tokenDocument.setFlag("barbrawl", "resourceBars", existingBars);
  console.log("🔄 Toughness bar berhasil diupdate.");
}

async function heraldVanguish_applyToughnessAllNpc() {
  for (let npc of heraldVanguish_allNpcScene) {
    let token = npc.getActiveTokens()[0];
    let tokenUuid = token?.document?.uuid;
    let tokenDocument = await fromUuid(tokenUuid);

    let toughnessElement = document.getElementById(
      `heraldVanguish-dialogNpcCheckbox-${tokenUuid}`
    );

    let toughness = 0;
    if (toughnessElement) {
      let toughnessValue = Number(toughnessElement.getAttribute("value"));
      toughness = toughnessValue;
      toughnessElement.checked = true;
    }
  }
}

async function heraldVanguish_calculatedToughnessDamage(
  damage,
  uuid,
  attackerUuid
) {
  let attackerDocument = await fromUuid(attackerUuid);
  let attakerToken = attackerDocument.object;
  let attackerActor = attakerToken.actor;
  let tokenDocument = await fromUuid(uuid);
  let token = tokenDocument.object;
  let actor = token.actor;
  let objFinalDamage = {};
  let weaknessBoost = 100;
  let personalityBoost = 1;
  let effectModifiers = {
    "Weakness Break Efficiency Boost - Blinded": 25,
    "Weakness Break Efficiency Boost - Frightened": 25,
    "Weakness Break Efficiency Boost - Paralyzed": 50,
    "Weakness Break Efficiency Boost - Petrified": 100,
    "Weakness Break Efficiency Boost - Incapacitated": 30,
    "Weakness Break Efficiency Boost - Poisoned": 15,
    "Weakness Break Efficiency Boost - Stunned": 50,

    "Weakness Break Efficiency 5%": 5,
    "Weakness Break Efficiency 10%": 10,
    "Weakness Break Efficiency 20%": 20,
    "Weakness Break Efficiency 25%": 25,
  };
  for (let effect of actor.effects) {
    let effectName = effect.name.toLowerCase();
    for (let [key, bonus] of Object.entries(effectModifiers)) {
      if (effectName.includes(key.toLowerCase())) {
        weaknessBoost += bonus;
      }
    }
  }

  let attackerFlag = await attackerActor.getFlag("world", "heraldVanguish");
  let targetFlag = await tokenDocument.getFlag("world", "heraldVanguish");
  let weaknessSet = new Set(targetFlag?.listWeakness ?? []);
  let weaknessEffects = actor.effects.filter((e) =>
    e.name?.startsWith("Weakness Type Inflict : ")
  );
  for (let effect of weaknessEffects) {
    let match = effect.name.match(/Weakness Type Inflict : \s*(\w+)/i);
    if (match) {
      weaknessSet.add(match[1].toLowerCase());
    }
  }
  let allWeaknesses = Array.from(weaknessSet);
  if (attackerFlag) {
    if (
      attackerFlag.personality1 &&
      allWeaknesses.includes(attackerFlag.personality1.toLowerCase())
    ) {
      personalityBoost += 1;
    }
    if (
      attackerFlag.personality2 &&
      allWeaknesses.includes(attackerFlag.personality2.toLowerCase())
    ) {
      personalityBoost += 1;
    }
  }
  let finalToughnessDamage = Math.floor(
    damage * personalityBoost * (weaknessBoost * 0.01)
  );
  objFinalDamage = {
    baseDamage: damage,
    personalityBoost: personalityBoost,
    weaknessBoost: weaknessBoost,
    finalDamage: finalToughnessDamage,
  };

  return objFinalDamage;
}

Hooks.on("preUpdateActor", async (actor, updateData, options, userId) => {
  if (!updateData.system?.attributes?.hp) return;

  let oldHP = actor.system.attributes.hp.value;
  let newHP = updateData.system.attributes.hp.value ?? oldHP;
  let oldTempHP = actor.system.attributes.hp.temp || 0;
  let newTempHP = updateData.system.attributes.hp.temp ?? oldTempHP;

  let damageTaken = 0;

  if (newTempHP < oldTempHP) {
    damageTaken = oldTempHP - newTempHP;
  } else if (newHP < oldHP) {
    damageTaken = oldHP - newHP + (oldTempHP - newTempHP);
  }
  let tokenDocument = actor.getActiveTokens().find((t) => t.scene)?.document;
  let objDamage = {};
  let toughnessDamage = 0;
  let heraldVanguish = await tokenDocument.getFlag("world", "heraldVanguish");
  let newToughness;
  let remainToughness = 0;
  let overflowToughness = heraldVanguish.overflowToughness || 0;
  console.log(objDamage);
  setTimeout(async () => {
    if (heraldVanguish_attackerUuid) {
      objDamage = await heraldVanguish_calculatedToughnessDamage(
        damageTaken,
        tokenDocument.uuid,
        heraldVanguish_attackerUuid
      );
      console.log(objDamage);
      toughnessDamage = objDamage.finalDamage;
    }
    if (heraldVanguish.toughness !== undefined) {
      remainToughness = heraldVanguish.toughness - toughnessDamage;
      newToughness = Math.max(0, remainToughness);

      if (remainToughness < 0) {
        overflowToughness += Math.abs(remainToughness);
      }
      await tokenDocument.setFlag("world", "heraldVanguish", {
        ...heraldVanguish,
        toughness: newToughness,
        overflowToughness: overflowToughness,
      });
    }
    const existingBars = await tokenDocument.getFlag(
      "barbrawl",
      "resourceBars"
    );
    if (existingBars["toughness"]) {
      heraldVanguish_updateToughnessBar(tokenDocument);
    }
    heraldVanguish = await tokenDocument.getFlag("world", "heraldVanguish");
    setTimeout(async () => {
      if (heraldVanguish?.toughness !== undefined && toughnessDamage > 0) {
        if (heraldVanguish?.toughness > 0) {
          console.log(objDamage);
          let chatContent = `${actor.name}'s toughness was reduce to ${
            heraldVanguish.toughness
          } / ${heraldVanguish.maxToughness} (${Math.abs(toughnessDamage)}) (${
            objDamage.baseDamage
          } x ${objDamage.personalityBoost} x ${objDamage.weaknessBoost}%)`;
          ChatMessage.create({
            content: chatContent,
            speaker: null,
          });
          ui.notifications.info(chatContent);
        }
        if (remainToughness < 0) {
          let chatContent = `${actor.name}'s Weakness Break Overflow is now ${
            heraldVanguish.overflowToughness
          } (${Math.abs(remainToughness)}) (${objDamage.baseDamage} x ${
            objDamage.personalityBoost
          } x ${objDamage.weaknessBoost}%)`;
          ChatMessage.create({
            content: chatContent,
            speaker: null,
          });
        }
      }
    }, 500);
  }, 200);
});

Hooks.on("updateActor", async (actor, data) => {
  console.log("updateActor");
  setTimeout(async () => {
    let tokenDocument = actor.getActiveTokens().find((t) => t.scene)?.document;
    let npcTokenFlag = await tokenDocument.getFlag("world", "heraldVanguish");

    if (npcTokenFlag) {
      if (game.user.isGM) {
        if (npcTokenFlag.toughness <= 0) {
          let existingEffect = actor.effects.find(
            (e) => e.name === "Weakness Broken"
          );

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
                  core: {
                    statusId: "Weakness Broken",
                  },
                  dae: {
                    specialDuration: ["turnEnd", "combatEnd", "zeroHP"],
                  },
                  "temp-effect": true,
                },
              },
            ]);
            let chatContent = `<b>${actor.name} is now Weakness Break!</b>
            <br>
            ${actor.name} has a [[-4]] penalty to their <b>Armor Class</b> and <b>Damage Rolls</b>, and a [[-2]] penalty to all <b>Saving Throws, Ability Checks, Attack Rolls, and Spell Save DC</b>, alongside their movement speed will drop by 25%, lasting until the end of their next turn.
            <br>
            The ${actor.name} gains a stack of <b>Exhaustion</b> which does not get nullified at the end of Weakness Break.`;

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
        let maxOverflowToughness = npcTokenFlag.maxToughness * 5;
        if (npcTokenFlag.overflowToughness >= maxOverflowToughness) {
          let heraldVanguish = await tokenDocument.getFlag(
            "world",
            "heraldVanguish"
          );
          vHelper.heraldVanguish_effectOverflowWeaknessBroken(
            actor,
            tokenDocument
          );
          let newOverflowToughness =
            npcTokenFlag.overflowToughness - maxOverflowToughness;
          await tokenDocument.setFlag("world", "heraldVanguish", {
            ...heraldVanguish,
            overflowToughness: newOverflowToughness,
          });
        }
      }
    }
  }, 500);
});

let lastTurn = null;
Hooks.on("updateCombat", (combat, update, options, userId) => {
  if (!combat || update.turn === undefined) return;

  const previousCombatant =
    lastTurn !== null ? combat.combatants.get(lastTurn) : null;
  if (previousCombatant) {
    setTimeout(async () => {
      let tokenDocument = previousCombatant.token;

      let npcTokenFlag = await tokenDocument.getFlag("world", "heraldVanguish");
      console.log("npcTokenFlag:", npcTokenFlag);

      if (npcTokenFlag) {
        if (npcTokenFlag.toughness <= 0) {
          let toughnessValue =
            npcTokenFlag.maxToughness -
            Math.floor(npcTokenFlag.overflowToughness / 5);
          await tokenDocument.setFlag("world", "heraldVanguish", {
            ...npcTokenFlag,
            toughness: toughnessValue,
            overflowToughness: 0,
          });

          let chatContent = `${tokenDocument.name} has regained their toughness and recovered from their Weakness Broken State`;

          ChatMessage.create({
            content: chatContent,
            speaker: ChatMessage.getSpeaker({ token: tokenDocument }),
          });
          let uiNotifContent = `${tokenDocument.name} has regained their toughness ${toughnessValue}`;
          ui.notifications.info(uiNotifContent);
          const existingBars = await tokenDocument.getFlag(
            "barbrawl",
            "resourceBars"
          );
          if (existingBars["toughness"]) {
            heraldVanguish_updateToughnessBar(tokenDocument);
          }
        }
      }
    }, 500);
  }

  lastTurn = combat.current.combatantId;
});
let heraldVanguish_socket;

Hooks.once("socketlib.ready", () => {
  heraldVanguish_socket = socketlib.registerModule("herald-vanguish-beta");

  heraldVanguish_socket.register("sendAttackerUuid", (uuid) => {
    heraldVanguish_attackerUuid = uuid;
  });
});

Hooks.on("midi-qol.RollComplete", (workflow) => {
  const tokenDocumentUuid = workflow.token?.document?.uuid;

  if (tokenDocumentUuid && !game.user.isGM) {
    heraldVanguish_socket.executeAsGM("sendAttackerUuid", tokenDocumentUuid);
  } else if (tokenDocumentUuid && game.user.isGM) {
    heraldVanguish_attackerUuid = tokenDocumentUuid;
  }
});

export { heraldVanguish_renderAccessButton };
