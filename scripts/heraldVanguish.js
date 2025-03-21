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
    await heraldVanguish_getDataDialogVanguish();
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
    let toughnessValue = Math.ceil((CR * CR) + (CR * 20));
    return toughnessValue;
}

async function heraldVanguish_getDataDialogVanguish() {
    let dialogListNpcMiddleDiv = document.getElementById(
        "heraldVanguish-dialogListNpcMiddle"
      );
    let listNpc = ``;
    for (let npc of heraldVanguish_allNpcScene) {

        let currentHp = npc.system.attributes.hp.value;
        let maxHp = npc.system.attributes.hp.max;
        let token = npc.getActiveTokens()[0];
        let tokenUuid = token?.document?.uuid;
        let npcCr = npc.system.details?.cr;
        let toughnessValue = await heraldVanguish_calculatedToughness(tokenUuid);
        listNpc+=`
        <div id="heraldVanguish-dialogNpcContainer" class="heraldVanguish-dialogNpcContainer">
            <div id="heraldVanguish-dialogNpcLeft" class="heraldVanguish-dialogNpcLeft">
                <div class="heraldVanguish-dialogNpcImageContainer">
                    <img src="${npc.img}" alt="" class="heraldVanguish-dialogNpcImageView" />
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
            </div>
            <div id="heraldVanguish-dialogNpcRight" class="heraldVanguish-dialogNpcRight">
            </div>
        </div>
        `;
    }

    if(dialogListNpcMiddleDiv){
        dialogListNpcMiddleDiv.innerHTML = listNpc;
    }
}

export { heraldVanguish_renderAccessButton };
