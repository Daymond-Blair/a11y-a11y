/*
 * Decides which defects are active for an audit attempt.
 * Each scenario registers its defect groups (see scenarios/<id>/attempt.js). The audit page
 * and the training app use the same registration, so they always agree on an attempt's set.
 */
(function (global) {
  "use strict";

  const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  const registry = {};

  function hash(str) {
    let h = 1779033703 ^ str.length;
    for (let i = 0; i < str.length; i++) {
      h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
      h = (h << 13) | (h >>> 19);
    }
    return h >>> 0;
  }

  function mulberry32(seed) {
    return function () {
      seed = (seed + 0x6d2b79f5) | 0;
      let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function create({ groups, perGroup = 2, classic = null }) {
    const all = groups.flat().sort();

    // Takes perGroup defects from every group, seeded by the attempt code.
    function pick(code) {
      if (!code || code === "classic") {
        if (classic) return classic.slice();
        code = "default";
      }
      const rand = mulberry32(hash(code));
      const chosen = [];
      for (const group of groups) {
        const pool = group.slice();
        for (let i = pool.length - 1; i > 0; i--) {
          const j = Math.floor(rand() * (i + 1));
          [pool[i], pool[j]] = [pool[j], pool[i]];
        }
        chosen.push(...pool.slice(0, perGroup));
      }
      return chosen.sort();
    }

    // ?attempt=CODE selects a random set; ?defects=none|all|ID,ID overrides it (for comparison and testing).
    function fromUrl(search) {
      const params = new URLSearchParams(search);
      const override = params.get("defects");
      if (override === "none") return [];
      if (override === "all") return all.slice();
      if (override) return override.split(",").filter((id) => all.includes(id));
      return pick(params.get("attempt"));
    }

    return { ALL: all, pick, fromUrl, size: groups.length * perGroup };
  }

  global.A11yAttempt = {
    register(id, config) {
      registry[id] = create(config);
      return registry[id];
    },
    get(id) {
      return registry[id];
    },
    newCode() {
      const bytes = crypto.getRandomValues(new Uint8Array(6));
      return Array.from(bytes, (b) => ALPHABET[b % ALPHABET.length]).join("");
    },
  };
})(window);
