export type Style = "ancient-cn" | "fantasy" | "cyberpunk" | "modern";
export type Category = "npc" | "item" | "place" | "quest" | "monster";

const data: Record<Style, Record<Category, string[]>> = {
  "ancient-cn": {
    npc: ["云霄", "墨渊", "凌霜", "玄机", "碧落", "苍穹", "幽冥", "紫霞", "青冥", "烈焰",
          "寒玉", "风尘", "夜枭", "霜刃", "天煞", "孤鸿", "冷月", "残影", "破军", "贪狼"],
    item: ["玄铁剑", "碧玉簪", "龙鳞甲", "凤羽扇", "九转丹", "天罡符", "幽冥珠", "破魂刃",
           "寒冰弓", "雷霆锤", "紫金冠", "血玉镯", "星辰袍", "风雷靴", "混沌珠"],
    place: ["落霞峰", "幽冥谷", "碧云山", "苍龙岭", "玄武湖", "天剑宗", "血月城", "迷雾林",
            "古战场", "龙脉渊", "星辰台", "破军堡", "寒玉洞", "紫霞宫", "九幽冥府"],
    quest: ["寻找失踪的{npc}", "消灭{place}的{monster}", "护送{npc}前往{place}",
            "夺回被{monster}盗走的{item}", "调查{place}的异象", "为{npc}收集十颗{item}"],
    monster: ["血煞魔君", "幽冥鬼王", "九尾天狐", "混沌魔龙", "噬魂蛊虫", "铁甲玄龟",
              "赤焰火凤", "寒冰雪狼", "毒雾蜈蚣", "暗影刺客"],
  },
  fantasy: {
    npc: ["Aldric", "Seraphine", "Theron", "Lyria", "Gareth", "Isolde", "Brennan", "Elara",
          "Caspian", "Miriel", "Dorian", "Sylvara", "Edric", "Nymeria", "Bastian"],
    item: ["Shadowbane Sword", "Moonstone Amulet", "Dragon Scale Shield", "Staff of Eternity",
           "Elven Longbow", "Runic Tome", "Phoenix Feather", "Void Crystal", "Iron Crown",
           "Blessed Chalice", "Stormcaller Axe", "Wraithcloak"],
    place: ["Ashenvale Forest", "Ironhold Keep", "Sunken Citadel", "Frostpeak Mountains",
            "Shadowmere Swamp", "Goldenhaven City", "Ruined Colosseum", "Whispering Caves",
            "Dragonspire Tower", "Thornwall Fortress"],
    quest: ["Find the missing {npc} in {place}", "Slay the {monster} terrorizing {place}",
            "Retrieve the stolen {item} from {monster}", "Escort {npc} safely to {place}",
            "Uncover the secret of {place}", "Collect 5 {item} for {npc}"],
    monster: ["Shadow Drake", "Bone Golem", "Plague Wraith", "Stone Troll", "Void Stalker",
              "Cursed Lich", "Feral Wyvern", "Blood Harpy", "Iron Colossus", "Swamp Hydra"],
  },
  cyberpunk: {
    npc: ["Nyx-7", "Razor", "Ghost_01", "Cipher", "Vex", "Splice", "Daemon", "Flux",
          "Null", "Overload", "Static", "Glitch", "Proxy", "Vector", "Byte"],
    item: ["Neural Spike", "Plasma Cutter", "Holo-Cloak", "EMP Grenade", "Cyber Eye Mk.III",
           "Data Shard", "Nano-Medkit", "Rail Pistol", "Stealth Module", "Quantum Blade",
           "Signal Jammer", "Exo-Gauntlet"],
    place: ["Neon District", "The Undercity", "Corp Tower 7", "Black Market Hub", "Data Vault",
            "Slum Grid", "Orbital Station", "Glitch Zone", "Firewall Sector", "Ghost Network"],
    quest: ["Hack into {place} and extract data for {npc}", "Eliminate {npc} before they sell the {item}",
            "Smuggle {item} past the {monster} patrols", "Find {npc} in the depths of {place}",
            "Destroy the {monster} guarding {place}", "Recover the stolen {item} from {place}"],
    monster: ["Security Mech", "Rogue AI Drone", "Cyber Hound", "Enforcer Bot", "Nano Swarm",
              "Corrupted Cyborg", "Turret Array", "Stealth Assassin", "Viral Entity", "Tank Mech"],
  },
  modern: {
    npc: ["Alex Chen", "Jordan Park", "Sam Rivera", "Morgan Lee", "Casey Kim",
          "Riley Zhang", "Taylor Wu", "Drew Tanaka", "Quinn Patel", "Blake Nguyen"],
    item: ["Encrypted USB", "Stolen Badge", "Burner Phone", "Forged Documents", "Security Key",
           "Surveillance Footage", "Briefcase", "Antidote Vial", "Sniper Rifle", "Hacking Device"],
    place: ["Downtown Precinct", "Abandoned Warehouse", "City Hall", "Harbor Docks",
            "Underground Bunker", "Research Lab", "Airport Terminal", "Casino Floor", "Rooftop"],
    quest: ["Investigate the disappearance of {npc}", "Retrieve the {item} before {npc} escapes",
            "Infiltrate {place} and plant the {item}", "Protect {npc} from the {monster}",
            "Expose the corruption at {place}", "Track down {npc} hiding in {place}"],
    monster: ["Gang Leader", "Corrupt Detective", "Mercenary Squad", "Hitman", "Hacker Collective",
              "Arms Dealer", "Undercover Agent", "Mob Boss", "Rogue Soldier", "Assassin"],
  },
};

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function fillTemplate(template: string, style: Style): string {
  return template.replace(/\{(\w+)\}/g, (_, cat) => {
    const list = data[style][cat as Category];
    return list ? pick(list) : `[${cat}]`;
  });
}

export function generate(style: Style, category: Category, count: number): string[] {
  const pool = data[style][category];
  const results: string[] = [];
  for (let i = 0; i < count; i++) {
    const raw = pick(pool);
    results.push(fillTemplate(raw, style));
  }
  return results;
}

export const STYLE_LABELS: Record<Style, string> = {
  "ancient-cn": "中文古风",
  fantasy: "西方奇幻",
  cyberpunk: "赛博朋克",
  modern: "现代都市",
};

export const CATEGORY_LABELS: Record<Category, string> = {
  npc: "NPC 名字",
  item: "物品名称",
  place: "地点名称",
  quest: "任务描述",
  monster: "怪物名称",
};

export const STYLES = Object.keys(STYLE_LABELS) as Style[];
export const CATEGORIES = Object.keys(CATEGORY_LABELS) as Category[];
