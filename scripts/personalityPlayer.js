import * as vHelper from "./heraldVanguish_helper.js";
let heraldVanguish_allPlayerScene = [];
let heraldVanguish_listCharacterApplyPersonality = [];
let heraldVanguish_listUuidActiveCharacter = [];
let heraldVanguish_groupPersonalityApply = {
  innocent: 0,
  sage: 0,
  explorer: 0,
  outlaw: 0,
  magician: 0,
  hero: 0,
  lover: 0,
  jester: 0,
  everyman: 0,
  caregiver: 0,
  ruler: 0,
  creator: 0,
};
let heraldVanguish_personalitySocket;

Hooks.once("socketlib.ready", () => {
  heraldVanguish_personalitySocket = socketlib.registerModule(
    "herald-vanguish-beta"
  );
  heraldVanguish_personalitySocket.register(
    "updatePersonalityTracker",
    async () => {
      await heraldVanguish_updateTrackerPersonalityGroup();
      await heraldVanguish_getAllPersonalityInGroup();
    }
  );

  heraldVanguish_personalitySocket.register(
    "updateActivePersonalityPlayerSelected",
    async () => {}
  );
});

async function heraldVanguish_renderPersonalityPlayerButton() {
  const existingBar = document.getElementById(
    "heraldVanguish-accessPersonalityContainer"
  );
  if (existingBar) {
    existingBar.remove();
  }

  fetch(
    "/modules/herald-vanguish-beta/templates/heraldVanguish-accessPersonality.html"
  )
    .then((response) => response.text())
    .then((html) => {
      const div = document.createElement("div");
      div.innerHTML = html;
      const personality = div.firstChild;
      personality.id = "heraldVanguish-accessPersonalityContainer";

      const personalityPlayerButton = document.createElement("button");
      personalityPlayerButton.id = "heraldVanguish-personalityPlayerButton";
      personalityPlayerButton.classList.add(
        "heraldVanguish-personalityPlayerButton"
      );
      personalityPlayerButton.innerHTML = '<i class="fa-solid fa-fire"></i>';
      personalityPlayerButton.addEventListener("click", function () {
        if (game.user.isGM) {
          heraldVanguish_getDataAllPlayerScene();
        } else {
          heraldVanguish_showDialogPersonalityPlayer();
          heraldVanguish_getAllPersonalityInGroup();
        }
      });

      personality.appendChild(personalityPlayerButton);
      document.body.appendChild(personality);
      console.log("test123");
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

  for (let actor of heraldVanguish_allPlayerScene) {
    let token = actor.getActiveTokens()[0];
    let tokenUuid = token?.document?.uuid;
    let tokenDocument = await fromUuid(tokenUuid);
    await tokenDocument.unsetFlag("world", "heraldVanguish");
  }
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
    title: "Herald Vanguished : Personality Character",
    content: dialogContent,
    buttons: {},
    default: "add",
  }).render(true);
  Hooks.once("renderDialog", async (app) => {
    if (
      app instanceof Dialog &&
      app.title === "Herald Vanguished : Personality Character"
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
    let heraldVanguish = await actor.getFlag("world", "heraldVanguish");
    const classItem = actor.items.find((item) => item.type === "class");
    const actorClass = classItem ? classItem.name : "Unknown";
    let isChecked = ``;
    let personalityCharaterDiv = ``;
    if (heraldVanguish) {
      if (heraldVanguish.personalityActive == true) {
        isChecked = `checked`;

        const { personality1, personality2 } = heraldVanguish;
        const icon1 = personality1
          ? vHelper.heraldVanguish_getPersonalityIconNoTooltip(personality1)
          : "?";
        const icon2 = personality2
          ? vHelper.heraldVanguish_getPersonalityIconNoTooltip(personality2)
          : "?";

        const tooltip1 = personality1
          ? `${
              personality1.charAt(0).toUpperCase() +
              personality1.slice(1).toLowerCase()
            }`
          : "?";
        const tooltip2 = personality2
          ? `${
              personality2.charAt(0).toUpperCase() +
              personality2.slice(1).toLowerCase()
            }`
          : "?";

        personalityCharaterDiv = `
                <div class="heraldVanguish-selectedPersonalityCharacterContainer">
                  <div class="heraldVanguish-personalityItem">
          ${icon1}
          <div class="heraldVanguish-personalityTooltip">${tooltip1}</div>
        </div>
                  <div class="heraldVanguish-personalityItem">
          ${icon2}
          <div class="heraldVanguish-personalityTooltip">${tooltip2}</div>
        </div>
                </div>`;
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
        ${personalityCharaterDiv}
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
    let isChecked = "";
    if (heraldVanguish_listCharacterApplyPersonality.length > 0) {
      for (let id of heraldVanguish_listCharacterApplyPersonality) {
        let tokenDocument = await fromUuid(id);
        let token = tokenDocument.object;
        let actor = token.actor;
        let heraldVanguish = await actor.getFlag("world", "heraldVanguish");
        if (heraldVanguish) {
          if (heraldVanguish.personalitySelector == false) {
            isChecked = "checked";
            break;
          }
        }
      }
    }

    dialogVanguishBotDiv.innerHTML = `
    <div id="heraldVanguish-dialogListCharacterBottomBot" class="heraldVanguish-dialogListCharacterBottomBot">
      <div class="heraldVanguish-toggleBlockPersonalityContainer">
        <div class="heraldVanguish-toggleBlockPersoanlityLabel">
          Block Personality Selector
        </div>
        <label class="heraldVanguish-toggleBlockPersonalityWrapper">
          <input type="checkbox" id="heraldVanguish-personalityBlockToggle" ${isChecked}/>
          <span class="heraldVanguish-toggleSliderBlockPersonality"></span>
        </label>
      </div>
      <div id="heraldVanguish-saveListCharacterContainer" class="heraldVanguish-saveListCharacterContainer">
        <button id="heraldVanguish-saveListCharacter" class="heraldVanguish-saveListCharacter">Apply</button>
      </div>
    </div>
    `;

    document
      .getElementById("heraldVanguish-saveListCharacterContainer")
      ?.addEventListener("click", async (event) => {
        heraldVanguish_applyPersonalityPlayer();
      });
  }
}

async function heraldVanguish_applyPersonalityPlayer() {
  await heraldVanguish_setFlagPlayer();
  heraldVanguish_listCharacterApplyPersonality = [];
  document
    .querySelectorAll(".heraldVanguish-dialogCharacterCheckbox:checked")
    .forEach((checkbox) => {
      let playerId = checkbox.value;
      heraldVanguish_listCharacterApplyPersonality.push(playerId);
    });
  let personalityBlockToggle = document.getElementById(
    "heraldVanguish-personalityBlockToggle"
  );
  let personalitySelector = true;
  if (personalityBlockToggle.checked) {
    personalitySelector = false;
  } else {
    personalitySelector = true;
  }
  for (let id of heraldVanguish_listCharacterApplyPersonality) {
    let tokenDocument = await fromUuid(id);
    let token = tokenDocument.object;
    let actor = token.actor;

    await actor.setFlag("world", "heraldVanguish", {
      personalityActive: true,
      personalitySelector: personalitySelector,
    });
  }
  heraldVanguish_personalitySocket.executeForEveryone(
    "updateActivePersonalityPlayerSelected"
  );
  await heraldVanguish_getDataListCharacterMiddle();
}

async function heraldVanguish_setFlagPlayer() {
  for (let actor of heraldVanguish_allPlayerScene) {
    let token = actor.getActiveTokens()[0];
    let tokenUuid = token?.document?.uuid;
    let tokenDocument = await fromUuid(tokenUuid);

    let heraldVanguish = await actor.getFlag("world", "heraldVanguish");
    if (heraldVanguish) {
      if (heraldVanguish.personalityActive) {
        await actor.setFlag("world", "heraldVanguish", {
          ...heraldVanguish,
          personalityActive: false,
        });
      }
    }
    heraldVanguish = await actor.getFlag("world", "heraldVanguish");
  }
}

async function heraldVanguish_showDialogPersonalityPlayer() {
  let dialogContent = `
  <div id="heraldVanguish-dialogCharacterPersonalityContainer" class="heraldVanguish-dialogCharacterPersonalityContainer">
    <div id="heraldVanguish-dialogCharacterPersonalityTop" class="heraldVanguish-dialogCharacterPersonalityTop">
    </div>
    <div id="heraldVanguish-dialogCharacterPersonalityMiddle" class="heraldVanguish-dialogCharacterPersonalityMiddle">
    </div>
    <div id="heraldVanguish-dialogCharacterPersonalityBottom" class="heraldVanguish-dialogCharacterPersonalityBottom"></div>
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
      const height = 450;

      app.setPosition({
        left: (window.innerWidth - width) / 2,
        top: (window.innerHeight - height) / 2,
        width: width,
        height: height,
        scale: 1.0,
      });
    }
    const dialogPersonality = app.element[0];
    const contentPersonality =
      dialogPersonality.querySelector(".window-content");

    if (contentPersonality) {
      contentPersonality.style.background = "none";
      contentPersonality.style.backgroundImage =
        "url('/modules/herald-vanguish-beta/assets/images/galaxy_bg.jpg')";
      contentPersonality.style.backgroundSize = "100% 100%";
      contentPersonality.style.backgroundRepeat = "no-repeat";
      contentPersonality.style.backgroundPosition = "center";
    }
    await heraldVanguish_getDataCharacterPersonalityMiddle();
    await heraldVanguish_updateTrackerPersonalityGroup();
    await heraldVanguish_renderViewPersonalityBottom();
  });
}

async function heraldVanguish_getDataCharacterPersonalityMiddle() {
  const user = game.user;
  const selectedActor = user.character;
  let tokenDocument = "";
  if (selectedActor) {
    const tokens = selectedActor.getActiveTokens(true);
    if (tokens.length > 0) {
      tokenDocument = tokens[0].document;
    }
  }
  let characterPersonalityMiddleDiv = document.getElementById(
    "heraldVanguish-dialogCharacterPersonalityMiddle"
  );

  if (characterPersonalityMiddleDiv) {
    let heraldVanguish = await selectedActor.getFlag("world", "heraldVanguish");
    let personality1Icon = `Click to Select`;
    let personality2Icon = `Click to Select`;
    if (heraldVanguish) {
      if (heraldVanguish.personality1) {
        personality1Icon = vHelper.heraldVanguish_getPersonalitySelectedIcon(
          heraldVanguish.personality1,
          "personality1"
        );
      }
      if (heraldVanguish.personality2) {
        personality2Icon = vHelper.heraldVanguish_getPersonalitySelectedIcon(
          heraldVanguish.personality2,
          "personality2"
        );
      }
    }
    characterPersonalityMiddleDiv.innerHTML = `
      <div class="heraldVanguish-personalityCharacterContainer">
        <div class="heraldVanguish-selectCharacterPersonalityContainer">
          <div id="heraldVanguish-characterPersonality1Container" class="heraldVanguish-characterPersonality1Container">
            ${personality1Icon}
          </div>
          <div id="heraldVanguish-characterPersonality2Container" class="heraldVanguish-characterPersonality2Container">
            ${personality2Icon}
          </div>
        </div>
        <div id="heraldVanguish-listAnotherCharacterContainer" class="heraldVanguish-listAnotherCharacterContainer">

        </div>
      </div>`;

    if (heraldVanguish.personalitySelector == true) {
      let personality1Div = document.getElementById(
        `heraldVanguish-characterPersonality1Container`
      );
      let personality2Div = document.getElementById(
        `heraldVanguish-characterPersonality2Container`
      );

      personality1Div.addEventListener("click", async (event) => {
        heraldVanguish_selectPersonalityCharacter("personality1");
      });
      personality2Div.addEventListener("click", async (event) => {
        heraldVanguish_selectPersonalityCharacter("personality2");
      });
    }
  }
}

async function heraldVanguish_renderViewPersonalityBottom() {
  let bottomPersonality = document.getElementById(
    "heraldVanguish-dialogCharacterPersonalityBottom"
  );
  if (bottomPersonality) {
    bottomPersonality.innerHTML = `
      <div id="heraldVanguish-journalVanguishList" style="padding:10px; cursor:pointer;">
          <i class="fa-solid fa-book" style="color:white; font-size:25px;"></i>
      </div>
    `;

    const openList = document.getElementById(
      "heraldVanguish-journalVanguishList"
    );
    if (openList) {
      openList.addEventListener("click", async () => {
        const pack = game.packs.get("herald-vanguish-beta.vanguish-journal");
        if (!pack) {
          ui.notifications.error("Compendium tidak ditemukan.");
          return;
        }

        const entry = await pack.getDocument("g9J4OBDddOzAl3XQ");
        if (!entry) {
          ui.notifications.error("Journal Entry tidak ditemukan.");
          return;
        }

        entry.sheet.render(true);
      });
    }
  }
}

async function heraldVanguish_selectPersonalityCharacter(personality) {
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
  <div id="heraldVanguish-dialogListPersonalityCharacter" class="heraldVanguish-dialogListPersonalityCharacter">

  </div>`;
  const dialogPersonality = new Dialog({
    title: "Select Personality",
    content: dialogContent,
    buttons: {},
    default: "add",
  });

  dialogPersonality.render(true);

  Hooks.once("renderDialog", async (app) => {
    if (app instanceof Dialog && app.title === "Select Personality") {
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
    await heraldVanguish_getDataDialogPersonalityCharacter(
      personality,
      uuid,
      dialogPersonality
    );
  });
}

async function heraldVanguish_getDataDialogPersonalityCharacter(
  personality,
  id,
  dialogPersonality
) {
  let dialogWeaknessMiddle = document.getElementById(
    "heraldVanguish-dialogListPersonalityCharacter"
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
    const disabled = heraldVanguish_groupPersonalityApply[type] >= 2;
    const style = disabled
      ? "text-decoration: line-through; opacity: 0.5; cursor: not-allowed;"
      : "";
    listWeaknessdamage += `
      <div class="heraldVanguish-selectedPersonalityContainer" data-name="${type}" style="${style}" ${
      disabled ? 'data-disabled="true"' : ""
    }>
        ${vHelper.heraldVanguish_getPersonalityIconNoTooltip(type)}
        <div class="heraldVanguish-weaknessDamageName">${validTypes[type]}</div>
      </div>
    `;
  }

  if (dialogWeaknessMiddle) {
    dialogWeaknessMiddle.innerHTML = listWeaknessdamage;
    dialogWeaknessMiddle
      .querySelectorAll(".heraldVanguish-selectedPersonalityContainer")
      .forEach((el) => {
        el.addEventListener("click", () => {
          if (el.getAttribute("data-disabled") === "true") return;
          const selectedType = el.getAttribute("data-name");

          heraldVanguish_applyPersonalityCharacter(personality, selectedType);

          dialogPersonality.close();
        });
      });
  }
}

async function heraldVanguish_applyPersonalityCharacter(personality, type) {
  const user = game.user;
  const actor = user.character;
  let uuid = ``;
  let tokenDocument = "";
  if (actor) {
    const tokens = actor.getActiveTokens(true);
    if (tokens.length > 0) {
      tokenDocument = tokens[0].document;
      uuid = tokenDocument.uuid;
    }
  }
  let personalityDiv = ``;
  if (personality == "personality1") {
    personalityDiv = document.getElementById(
      `heraldVanguish-characterPersonality1Container`
    );
  }
  if (personality == "personality2") {
    personalityDiv = document.getElementById(
      `heraldVanguish-characterPersonality2Container`
    );
  }

  if (personalityDiv) {
    personalityDiv.innerHTML =
      vHelper.heraldVanguish_getPersonalitySelectedIcon(type, personality);
  }

  let heraldVanguish = await actor.getFlag("world", "heraldVanguish");
  if (heraldVanguish?.personalityActive === true) {
    if (personality == "personality1") {
      await actor.setFlag("world", "heraldVanguish", {
        ...heraldVanguish,
        personality1: type,
      });
    }
    if (personality == "personality2") {
      await actor.setFlag("world", "heraldVanguish", {
        ...heraldVanguish,
        personality2: type,
      });
    }
  }
  heraldVanguish_personalitySocket.executeForEveryone(
    "updatePersonalityTracker"
  );
  await heraldVanguish_updateTrackerPersonalityGroup();
}

async function heraldVanguish_getAllPersonalityInGroup() {
  heraldVanguish_listUuidActiveCharacter = [];
  heraldVanguish_listUuidActiveCharacter =
    await vHelper.heraldVanguish_getCharacterAllUuidActive();
  for (let key in heraldVanguish_groupPersonalityApply) {
    heraldVanguish_groupPersonalityApply[key] = 0;
  }
  for (let data of heraldVanguish_listUuidActiveCharacter) {
    let tokenDocument = await fromUuid(data.uuid);
    let token = tokenDocument.object;
    let actor = token.actor;
    let heraldVanguish = await actor.getFlag("world", "heraldVanguish");
    if (heraldVanguish) {
      const { personality1, personality2 } = heraldVanguish;

      if (
        personality1 &&
        heraldVanguish_groupPersonalityApply.hasOwnProperty(personality1)
      ) {
        heraldVanguish_groupPersonalityApply[personality1]++;
      }

      if (
        personality2 &&
        heraldVanguish_groupPersonalityApply.hasOwnProperty(personality2)
      ) {
        heraldVanguish_groupPersonalityApply[personality2]++;
      }
    }
  }
}

async function heraldVanguish_updateTrackerPersonalityGroup() {
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
  let listTrackerPersonality = ``;
  for (let data of heraldVanguish_listUuidActiveCharacter) {
    let tokenDocument = await fromUuid(data.uuid);
    let token = tokenDocument.object;
    let actor = token.actor;
    // if (userTokenDocument == tokenDocument) {
    //   continue;
    // }
    let heraldVanguish = await actor.getFlag("world", "heraldVanguish");
    if (heraldVanguish) {
      const { personality1, personality2 } = heraldVanguish;

      const icon1 = personality1
        ? vHelper.heraldVanguish_getPersonalityIconNoTooltip(personality1)
        : "?";
      const icon2 = personality2
        ? vHelper.heraldVanguish_getPersonalityIconNoTooltip(personality2)
        : "?";

      const tooltip1 = personality1
        ? `${
            personality1.charAt(0).toUpperCase() +
            personality1.slice(1).toLowerCase()
          }`
        : "?";
      const tooltip2 = personality2
        ? `${
            personality2.charAt(0).toUpperCase() +
            personality2.slice(1).toLowerCase()
          }`
        : "?";

      listTrackerPersonality += `
      <div class="heraldVanguish-trackerPersonalityCharaterContainer">
        <div class="heraldVanguish-trackerPersonality1Container">
          <div class="heraldVanguish-trackerPersonality1Item" style="border:2px solid ${data.playerColor}">
            ${icon1}
            <div class="heraldVanguish-trackerPersonalityTooltip"> 
              ${tooltip1}<br/>
              <span style="color: #ccc;">${data.actorName}</span>
            </div>
          </div>
        </div>
        <div class="heraldVanguish-trackerPersonality2Container">
          <div class="heraldVanguish-trackerPersonality2Item" style="border:2px solid ${data.playerColor}">
            ${icon2}
            <div class="heraldVanguish-trackerPersonalityTooltip">
              ${tooltip2}<br/>
              <span style="color: #ccc;">${data.actorName}</span>
            </div>
          </div>
        </div>
      </div>
      `;
    }
  }

  if (trackerContainerDiv) {
    trackerContainerDiv.innerHTML = listTrackerPersonality;
  }
}

export { heraldVanguish_renderPersonalityPlayerButton };
