const moduleId = "pf2e-bzns";

function registerSettings() {
  game.settings.register(moduleId, "altArchetype", {
    name: "Alternate Archetype",
    hint: "Variant rule with Free Archetypes, but extra class feats receives at 1st level and every odd level.",
    scope: "world",
    config: true,
    requiresReload: true,
    type: Boolean,
    default: false,
  });

  game.settings.register(moduleId, "skillArchetype", {
    name: "Alternate Archetype with Skills",
    hint: "Variant rule with Free Archetypes, but extra class feats receives at 1st level and every odd level. This rule variant allows you to take also skills of dedications.",
    scope: "world",
    config: true,
    requiresReload: true,
    type: Boolean,
    default: false,
  });
}

function dev() {
  return game.modules.get(moduleId).version === "dev";
}

async function variantFeats() {
  const altArchetype = game.settings.get(moduleId, "altArchetype");
  const skillArchetype = game.settings.get(
    moduleId,
    "skillArchetype",
  );


  // Add campaign feat sections (if enabled)
  if (altArchetype || skillArchetype) {
    const campaignFeatSections = game.settings.get(
      "pf2e",
      "campaignFeatSections",
    );
    if (skillArchetype) {
      if (
        !campaignFeatSections.find(
          (section) => section.id === "skillArchetypeClass",
        )
      ) {
        campaignFeatSections.push({
          id: "skillArchetypeClass",
          label: "Alternative Archetype Progression with Skills",
          supported: ["class", "skill"],
          slots: [1, 3, 5, 7, 9, 11, 13, 15, 17, 19],
        });
      }
    }

    if (altArchetype) {
      if (!campaignFeatSections.find((section) => section.id === "altArchetypeClass")) {
        campaignFeatSections.push({
          id: "altArchetypeClass",
          label: "Alternative Archetype Progression",
          supported: ["class"],
          slots: [1, 3, 5, 7, 9, 11, 13, 15, 17, 19],
        });
      }
    }

    await game.settings.set("pf2e", "campaignFeatSections", campaignFeatSections);
  }

  const campaignFeatSections = game.settings.get(
    "pf2e",
    "campaignFeatSections",
  );


  // And remove if disabled.
  if (
    campaignFeatSections &&
    !altArchetype &&
    campaignFeatSections.find((section) => section.id === "altArchetypeClass")
  ) {
    campaignFeatSections.splice(
      campaignFeatSections.findIndex((section) => section.id === "altArchetypeClass"),
      1,
    );
    await game.settings.set("pf2e", "campaignFeatSections", campaignFeatSections);
  }

  if (
    campaignFeatSections &&
    !skillArchetype &&
    campaignFeatSections.find(
      (section) => section.id === "skillArchetypeClass",
    )
  ) {
    campaignFeatSections.splice(
      campaignFeatSections.findIndex(
        (section) => section.id === "skillArchetypeClass",
      ),
      1,
    );
    await game.settings.set("pf2e", "campaignFeatSections", campaignFeatSections);
  }
}

// Compendium Directory
Hooks.on("renderCompendiumDirectory", (app, html, options) => {
  $(html).find('li:contains("BZNS fixes")').addClass(moduleId);
});

Hooks.once("init", () => {
  registerSettings();
});

// Try to set up all the feat actions.
Hooks.on("setup", async () => {
  if (dev()) {
    console.log("BZNS fixes loaded");
  }
});

Hooks.on("ready", () => {
  variantFeats();

  if (!game.modules.get("pf2e-dailies")?.active || !game.user.isGM) return;
  const register = game.modules.get("pf2e-dailies")?.api.registerCustomDailies;

  if (register) {
    const utils = game.modules.get("pf2e-dailies")?.api.utils;
  }
});

Hooks.on("renderCharacterSheetPF2e", async (data, html) => {
  const classSlug = data.actor.class?.slug || "";
  const skillSlug = data.actor.skill?.slug || "";
  const archetypeFeatSlug = data.actor.itemTypes.feat.some((f) => f.traits.has("dedication")) ? "archetype" : "dedication";

  const featGroupTraits = {
    "skillArchetypeClass": [classSlug, archetypeFeatSlug, skillSlug].filter(entry => entry.trim() != ''),
    "altArchetypeClass": [classSlug, archetypeFeatSlug].filter(entry => entry.trim() != '')
  };

  for (const key in featGroupTraits) {
    if (Object.prototype.hasOwnProperty.call(featGroupTraits, key)) {
      const element = featGroupTraits[key];

      if (undefined === data.actor.feats.get(key)) {
        continue;
      }
      
      data.actor.feats.get(key).filter.traits = [];

      element.forEach(trait => {
        if (data.actor.feats.get(key).filter.traits.indexOf(trait) === -1) {
          data.actor.feats.get(key).filter.traits.push(trait);
        };
      });
    }
  };
});