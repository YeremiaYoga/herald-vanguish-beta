import * as vHelper from "./heraldVanguish_helper.js";
let heraldVanguish_allPlayerScene = [];
let heraldVanguish_listCharacterApplyElement = [];
let heraldVanguish_listUuidActiveCharacter = [];
let heraldVanguish_groupElementApply = {
  acid: 0,
  bludgeoning: 0,
  cold: 0,
  fire: 0,
  force: 0,
  lightning: 0,
  necrotic: 0,
  piercing: 0,
  poison: 0,
  psychic: 0,
  radiant: 0,
  slashing: 0,
  thunder: 0,
};

async function heraldVanguish_renderElementPlayerButton() {
  const existingBar = document.getElementById(
    "heraldVanguish-accessElementContainer"
  );
  if (existingBar) {
    existingBar.remove();
  }

  fetch(
    "/modules/herald-vanguish-beta/templates/heraldVanguish-accessElement.html"
  )
    .then((response) => response.text())
    .then((html) => {
      const div = document.createElement("div");
      div.innerHTML = html;
      const element = div.firstChild;
      element.id = "heraldVanguish-accessElementContainer";

      const elementPlayerButton = document.createElement("button");
      elementPlayerButton.id = "heraldVanguish-elementPlayerButton";
      elementPlayerButton.classList.add("heraldVanguish-elementPlayerButton");
      elementPlayerButton.innerHTML = '<i class="fa-solid fa-fire"></i>';
      elementPlayerButton.addEventListener("click", function () {
        if (game.user.isGM) {
          heraldVanguish_getDataAllPlayerScene();
        } else {
          heraldVanguish_showDialogElementPlayer();
          heraldVanguish_getAllElementInGroup();
        }
      });

      element.appendChild(elementPlayerButton);
      document.body.appendChild(element);
    })
    .catch((err) => {
      console.error("Gagal memuat template resetButton playerlist.html: ", err);
    });
}

async function heraldVanguish_getDataAllPlayerScene() {
  heraldVanguish_allPlayerScene = [];

  heraldVanguish_allPlayerScene = game.scenes.viewed.tokens
    .filter((t) => t.actor.type === "character")
    .map((t) => t.actor);
  await heraldVanguish_showDialogSelectCharacter();
}

async function heraldVanguish_showDialogSelectCharacter() {
  let dialogContent = `
    <div id="heraldVanguish-dialogListCharacterContainer" class="heraldVanguish-dialogListCharacterContainer">
      <div id="heraldVanguish-dialogListCharacterTop" class="heraldVanguish-dialogListCharacterTop">
      </div>
      <div id="heraldVanguish-dialogListCharacterMiddle" class="heraldVanguish-dialogListCharacterMiddle">
      </div>
      <div id="heraldVanguish-dialogListCharacterBottom" class="heraldVanguish-dialogListCharacterBottom"></div>
    </div>`;

  new Dialog({
    title: "Herald Vanguished : Element Character",
    content: dialogContent,
    buttons: {},
    default: "add",
  }).render(true);
  Hooks.once("renderDialog", async (app) => {
    if (
      app instanceof Dialog &&
      app.title === "Herald Vanguished : Element Character"
    ) {
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
    await heraldVanguish_getDataListCharacterMiddle();
    await heraldVanguish_getDataListCharacterBottom();
  });
}

async function heraldVanguish_getDataListCharacterMiddle() {
  let dialogListCharacterMiddleDiv = document.getElementById(
    "heraldVanguish-dialogListCharacterMiddle"
  );
  let listActor = ``;
  for (let actor of heraldVanguish_allPlayerScene) {
    let token = actor.getActiveTokens()[0];
    let tokenUuid = token?.document?.uuid;
    let tokenDocument = await fromUuid(tokenUuid);
    let heraldVanguish = await tokenDocument.getFlag("world", "heraldVanguish");
    const classItem = actor.items.find((item) => item.type === "class");
    const actorClass = classItem ? classItem.name : "Unknown";
    let isChecked = ``;
    if (heraldVanguish) {
      if (heraldVanguish.elementActive == true) {
        isChecked = `checked`;
      }
    }
    listActor += `
     <div id="heraldVanguish-dialogCharacterContainer" class="heraldVanguish-dialogCharacterContainer">
      <div id="heraldVanguish-dialogCharacterLeft" class="heraldVanguish-dialogCharacterLeft">
        <label>
          <input id="heraldVanguish-dialogCharacterCheckbox-${tokenUuid}" type="checkbox" class="heraldVanguish-dialogCharacterCheckbox" value="${tokenUuid}" ${isChecked}>
        </label>
      </div>
      <div id="heraldVanguish-dialogCharacterMiddle" class="heraldVanguish-dialogCharacterMiddle">
        <div id="heraldVanguish-dialogCharacterMiddleTop" class="heraldVanguish-dialogCharacterMiddleTop">
          <div id="heraldVanguish-dialogCharacterName" class="heraldVanguish-dialogCharacterName">${actor.name}</div>
        </div>
        <div id="heraldVanguish-dialogCharacterMiddleMid" class="heraldVanguish-dialogCharacterMiddleMid">
          <div id="heraldVanguish-dialogCharacterLevel" class="heraldVanguish-dialogCharacterLevel">Level ${actor.system.details.level}</div>
          <div>/</div>
          <div id="heraldVanguish-dialogCharacterClass" class="heraldVanguish-dialogCharacterClass">${actorClass}</div>
        </div>
      </div>
       <div id="heraldVanguish-dialogCharacterRight" class="heraldVanguish-dialogCharacterRight">
        
      </div>
     
     </div>
    
    `;
  }

  if (dialogListCharacterMiddleDiv) {
    dialogListCharacterMiddleDiv.innerHTML = listActor;
  }
}

async function heraldVanguish_getDataListCharacterBottom() {
  let dialogVanguishBotDiv = document.getElementById(
    "heraldVanguish-dialogListCharacterBottom"
  );

  if (dialogVanguishBotDiv) {
    dialogVanguishBotDiv.innerHTML = `
    <div id="heraldVanguish-dialogListCharacterBottomBot" class="heraldVanguish-dialogListCharacterBottomBot">
      <div id="heraldVanguish-saveListCharacterContainer" class="heraldVanguish-saveListCharacterContainer">
        <button id="heraldVanguish-saveListCharacter" class="heraldVanguish-saveListCharacter">Apply</button>
      </div>
    </div>
    `;

    document
      .getElementById("heraldVanguish-saveListCharacterContainer")
      ?.addEventListener("click", async (event) => {
        heraldVanguish_applyElementPlayer();
      });
  }
}

async function heraldVanguish_applyElementPlayer() {
  await heraldVanguish_setFlagPlayer();
  heraldVanguish_listCharacterApplyElement = [];
  document
    .querySelectorAll(".heraldVanguish-dialogCharacterCheckbox:checked")
    .forEach((checkbox) => {
      let playerId = checkbox.value;
      heraldVanguish_listCharacterApplyElement.push(playerId);
    });

  for (let id of heraldVanguish_listCharacterApplyElement) {
    let tokenDocument = await fromUuid(id);
    let token = tokenDocument.object;
    let actor = token.actor;

    await tokenDocument.setFlag("world", "heraldVanguish", {
      elementActive: true,
    });

    let heraldVanguish = await tokenDocument.getFlag("world", "heraldVanguish");
  }
  heraldVanguish_createJournalElement();
}
async function heraldVanguish_createJournalElement() {
  let journalEntry = game.journal.find((j) => j.name === "Herald Vanguish");

  if (!journalEntry) {
    journalEntry = await JournalEntry.create({
      name: "Herald Vanguish",
      ownership: { default: 3 },
    });

    if (!journalEntry) {
      ui.notifications.error("Failed to create journal.");
      return;
    } else {
      ui.notifications.info("Herald Vanguish Active");
    }
  } else {
    ui.notifications.info("Herald Vanguish Already Active");
  }
}

async function heraldVanguish_setFlagPlayer() {
  for (let actor of heraldVanguish_allPlayerScene) {
    let token = actor.getActiveTokens()[0];
    let tokenUuid = token?.document?.uuid;
    let tokenDocument = await fromUuid(tokenUuid);

    let heraldVanguish = await tokenDocument.getFlag("world", "heraldVanguish");
    if (heraldVanguish) {
      if (heraldVanguish.elementActive) {
        await tokenDocument.setFlag("world", "heraldVanguish", {
          ...heraldVanguish,
          elementActive: false,
        });
      }
    }
  }
}

async function heraldVanguish_showDialogElementPlayer() {
  let dialogContent = `
  <div id="heraldVanguish-dialogCharacterElementContainer" class="heraldVanguish-dialogCharacterElementContainer">
    <div id="heraldVanguish-dialogCharacterElementTop" class="heraldVanguish-dialogCharacterElementTop">
    </div>
    <div id="heraldVanguish-dialogCharacterElementMiddle" class="heraldVanguish-dialogCharacterElementMiddle">
    </div>
    <div id="heraldVanguish-dialogCharacterElementBottom" class="heraldVanguish-dialogCharacterElementBottom"></div>
  </div>`;

  new Dialog({
    title: "Weakness Type",
    content: dialogContent,
    buttons: {},
    default: "add",
  }).render(true);
  Hooks.once("renderDialog", async (app) => {
    if (app instanceof Dialog && app.title === "Weakness Type") {
      const width = 600;
      const height = 500;

      app.setPosition({
        left: (window.innerWidth - width) / 2,
        top: (window.innerHeight - height) / 2,
        width: width,
        height: height,
        scale: 1.0,
      });
    }
    await heraldVanguish_getDataCharacterElementMiddle();
    await heraldVanguish_getDataCharacterElementBottom();
    await heraldVanguish_updateTrackerElementGroup();
  });
}

async function heraldVanguish_getDataCharacterElementMiddle() {
  const user = game.user;
  const selectedActor = user.character;
  let tokenDocument = "";
  if (selectedActor) {
    const tokens = selectedActor.getActiveTokens(true);
    if (tokens.length > 0) {
      tokenDocument = tokens[0].document;
    }
  }
  let characterElementMiddleDiv = document.getElementById(
    "heraldVanguish-dialogCharacterElementMiddle"
  );

  if (characterElementMiddleDiv) {
    let heraldVanguish = await tokenDocument.getFlag("world", "heraldVanguish");
    let element1Icon = ``;
    let element2Icon = ``;
    if (heraldVanguish) {
      if (heraldVanguish.element1) {
        element1Icon = vHelper.heraldVanguish_getElementSelectedIcon(
          heraldVanguish.element1,
          "element1"
        );
      }
      if (heraldVanguish.element2) {
        element2Icon = vHelper.heraldVanguish_getElementSelectedIcon(
          heraldVanguish.element2,
          "element2"
        );
      }
    }
    characterElementMiddleDiv.innerHTML = `
      <div class="heraldVanguish-elementCharacterContainer">
        <div class="heraldVanguish-selectCharacterElementContainer">
          <div id="heraldVanguish-characterElement1Container" class="heraldVanguish-characterElement1Container">
            ${element1Icon}
          </div>
          <div id="heraldVanguish-characterElement2Container" class="heraldVanguish-characterElement2Container">
            ${element2Icon}
          </div>
        </div>
        <div id="heraldVanguish-listAnotherCharacterContainer" class="heraldVanguish-listAnotherCharacterContainer">

        </div>
      </div>`;

    let element1Div = document.getElementById(
      `heraldVanguish-characterElement1Container`
    );
    let element2Div = document.getElementById(
      `heraldVanguish-characterElement2Container`
    );

    element1Div.addEventListener("click", async (event) => {
      heraldVanguish_selectElementCharacter("element1");
    });
    element2Div.addEventListener("click", async (event) => {
      heraldVanguish_selectElementCharacter("element2");
    });
  }
}

async function heraldVanguish_selectElementCharacter(element) {
  const user = game.user;
  const selectedActor = user.character;
  let uuid = ``;
  if (selectedActor) {
    const tokens = selectedActor.getActiveTokens(true);
    if (tokens.length > 0) {
      const tokenDocument = tokens[0].document;
      uuid = tokenDocument.uuid;
    }
  }
  let dialogContent = `
  <div id="heraldVanguish-dialogListElementCharacter" class="heraldVanguish-dialogListElementCharacter">

  </div>`;
  const dialogElement = new Dialog({
    title: "Select Element",
    content: dialogContent,
    buttons: {},
    default: "add",
  });

  dialogElement.render(true);

  Hooks.once("renderDialog", async (app) => {
    if (app instanceof Dialog && app.title === "Select Element") {
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
    await heraldVanguish_getDataDialogElementCharacter(
      element,
      uuid,
      dialogElement
    );
  });
}
async function heraldVanguish_getDataDialogElementCharacter(
  element,
  id,
  dialogElement
) {
  let dialogWeaknessMiddle = document.getElementById(
    "heraldVanguish-dialogListElementCharacter"
  );

  let tokenDocument = await fromUuid(id);
  let token = tokenDocument.object;
  let actor = token.actor;
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
  };

  let listWeaknessdamage = "";

  for (let type in validTypes) {
    const disabled = heraldVanguish_groupElementApply[type] >= 2;
    const style = disabled
      ? "text-decoration: line-through; opacity: 0.5; cursor: not-allowed;"
      : "";
    listWeaknessdamage += `
      <div class="heraldVanguish-selectedElementContainer" data-name="${type}" style="${style}" ${
      disabled ? 'data-disabled="true"' : ""
    }>
        ${vHelper.heraldVanguish_getGameIconDamage(type)}
        <div class="heraldVanguish-weaknessDamageName">${validTypes[type]}</div>
      </div>
    `;
  }

  if (dialogWeaknessMiddle) {
    dialogWeaknessMiddle.innerHTML = listWeaknessdamage;
    dialogWeaknessMiddle
      .querySelectorAll(".heraldVanguish-selectedElementContainer")
      .forEach((el) => {
        el.addEventListener("click", () => {
          const selectedType = el.getAttribute("data-name");

          heraldVanguish_applyElementCharacter(element, selectedType);
          dialogElement.close();
        });
      });
  }
}

async function heraldVanguish_applyElementCharacter(element, type) {
  let elementDiv = ``;
  if (element == "element1") {
    elementDiv = document.getElementById(
      `heraldVanguish-characterElement1Container`
    );
  }
  if (element == "element2") {
    elementDiv = document.getElementById(
      `heraldVanguish-characterElement2Container`
    );
  }

  if (elementDiv) {
    elementDiv.innerHTML = vHelper.heraldVanguish_getElementSelectedIcon(
      type,
      element
    );
  }
}

async function heraldVanguish_getDataCharacterElementBottom() {
  let characterElementBottomDiv = document.getElementById(
    "heraldVanguish-dialogCharacterElementBottom"
  );

  if (characterElementBottomDiv) {
    characterElementBottomDiv.innerHTML = `
      <div id="heraldVanguish-dialogCharacterElementBotContainer" class="heraldVanguish-dialogCharacterElementBotContainer">
        <div id="heraldVanguish-saveElementCharacterContainer" class="heraldVanguish-saveElementCharacterContainer">
          <button id="heraldVanguish-saveElementCharacter" class="heraldVanguish-saveElementCharacter">Confirm</button>
        </div>
      </div>
    `;

    let saveElement = document.getElementById(
      "heraldVanguish-saveElementCharacter"
    );

    saveElement.addEventListener("click", () => {
      heraldVanguish_addElementToCharacter();
    });
  }
}

async function heraldVanguish_addElementToCharacter() {
  const user = game.user;
  const selectedActor = user.character;
  let uuid = ``;
  let tokenDocument = "";
  if (selectedActor) {
    const tokens = selectedActor.getActiveTokens(true);
    if (tokens.length > 0) {
      tokenDocument = tokens[0].document;
      uuid = tokenDocument.uuid;
    }
  }
  let element1 = "";
  let element2 = "";

  const element1Div = document.getElementById(
    "heraldVanguish-elementIconContainer-element1"
  );
  if (element1Div) {
    element1 = element1Div.getAttribute("data-name") || "";
  }

  const element2Div = document.getElementById(
    "heraldVanguish-elementIconContainer-element2"
  );
  if (element2Div) {
    element2 = element2Div.getAttribute("data-name") || "";
  }
  let heraldVanguish = await tokenDocument.getFlag("world", "heraldVanguish");
  if (heraldVanguish?.elementActive === true) {
    await tokenDocument.setFlag("world", "heraldVanguish", {
      ...heraldVanguish,
      element1: element1,
      element2: element2,
    });
  }
  heraldVanguish = await tokenDocument.getFlag("world", "heraldVanguish");
  await heraldVanguish_updateTrackerElementGroup();
}
async function heraldVanguish_getAllElementInGroup() {
  heraldVanguish_listUuidActiveCharacter = [];
  heraldVanguish_listUuidActiveCharacter =
    await vHelper.heraldVanguish_getCharacterAllUuidActive();
  for (let key in heraldVanguish_groupElementApply) {
    heraldVanguish_groupElementApply[key] = 0;
  }
  for (let actor of heraldVanguish_listUuidActiveCharacter) {
    let tokenDocument = await fromUuid(actor.uuid);
    let heraldVanguish = await tokenDocument.getFlag("world", "heraldVanguish");
    if (heraldVanguish) {
      const { element1, element2 } = heraldVanguish;

      if (
        element1 &&
        heraldVanguish_groupElementApply.hasOwnProperty(element1)
      ) {
        heraldVanguish_groupElementApply[element1]++;
      }

      if (
        element2 &&
        heraldVanguish_groupElementApply.hasOwnProperty(element2)
      ) {
        heraldVanguish_groupElementApply[element2]++;
      }
    }
  }
}

async function heraldVanguish_updateTrackerElementGroup() {
  const user = game.user;
  const selectedActor = user.character;
  let userTokenDocument = "";
  if (selectedActor) {
    const tokens = selectedActor.getActiveTokens(true);
    if (tokens.length > 0) {
      userTokenDocument = tokens[0].document;
    }
  }
  heraldVanguish_listUuidActiveCharacter =
    await vHelper.heraldVanguish_getCharacterAllUuidActive();

  let trackerContainerDiv = document.getElementById(
    "heraldVanguish-listAnotherCharacterContainer"
  );
  let listTrackerElement = ``;
  for (let actor of heraldVanguish_listUuidActiveCharacter) {
    let tokenDocument = await fromUuid(actor.uuid);
    // if (userTokenDocument == tokenDocument) {
    //   continue;
    // }
    let heraldVanguish = await tokenDocument.getFlag("world", "heraldVanguish");
    if (heraldVanguish) {
      const { element1, element2 } = heraldVanguish;

      listTrackerElement += `
      <div class="heraldVanguish-trackerElementCharaterContainer">
        <div class="heraldVanguish-trackerElement1Container" style="border:2px solid ${
          actor.playerColor
        }">
          ${vHelper.heraldVanguish_getGameIconDamage(element1)}
        </div>
        <div class="heraldVanguish-trackerElement2Container" style="border:2px solid ${
          actor.playerColor
        }">
          ${vHelper.heraldVanguish_getGameIconDamage(element2)}
        </div>
      </div>
      `;
    }
  }

  if (trackerContainerDiv) {
    trackerContainerDiv.innerHTML = listTrackerElement;
  }
}

export { heraldVanguish_renderElementPlayerButton };
