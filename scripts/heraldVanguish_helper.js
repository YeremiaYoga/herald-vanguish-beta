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


  export { heraldVanguish_getGameIconDamage };