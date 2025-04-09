import * as vHelper from "./heraldVanguish_helper.js";
let heraldVanguish_allPlayerScene = [];

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
        heraldVanguish_getDataAllPlayerScene();
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
  console.log(heraldVanguish_allPlayerScene);
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
    await heraldVanguish_getDataElementCharacterMiddle();
    await heraldVanguish_getDataElementCharacterBottom();
  });
}

async function heraldVanguish_getDataElementCharacterMiddle() {
  let dialogListCharacterMiddleDiv = document.getElementById(
    "heraldVanguish-dialogListCharacterMiddle"
  );
  let listActor = ``;
  for (let actor of heraldVanguish_allPlayerScene) {
    let token = actor.getActiveTokens()[0];
    let tokenUuid = token?.document?.uuid;
    let tokenDocument = await fromUuid(tokenUuid);

    const classItem = actor.items.find((item) => item.type === "class");
    const actorClass = classItem ? classItem.name : "Unknown";
    listActor += `
     <div id="heraldVanguish-dialogCharacterContainer" class="heraldVanguish-dialogCharacterContainer">
      <div id="heraldVanguish-dialogCharacterLeft" class="heraldVanguish-dialogCharacterLeft">
        <label>
          <input id="heraldVanguish-dialogCharacterCheckbox-${tokenUuid}" type="checkbox" class="heraldVanguish-dialogCharacterCheckbox" value="${tokenUuid}">
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

async function heraldVanguish_getDataElementCharacterBottom() {
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

    let searchTimeout;

    document
      .getElementById("heraldVanguish-saveListCharacterContainer")
      ?.addEventListener("click", async (event) => {});
  }
}

export { heraldVanguish_renderElementPlayerButton };
