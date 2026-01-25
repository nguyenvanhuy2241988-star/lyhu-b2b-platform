/**
 * Level 4: Natural Language Targeting Interpreter (V6 - NLP COMMANDER)
 * Translates User Commands ("Tìm chủ tạp hóa ở Hà Nội") -> Structural Intent.
 */

const LOCATION_MAP = {
    'hà nội': ['hà nội', 'ha noi', 'hn', 'thủ đô'],
    'hcm': ['hồ chí minh', 'ho chi minh', 'hcm', 'sài gòn', 'tphcm'],
    'đà nẵng': ['đà nẵng', 'da nang'],
    'hải phòng': ['hải phòng', 'hai phong'],
    'cần thơ': ['cần thơ', 'can tho']
};

const ACTION_KEYWORDS = {
    'tìm': 'find',
    'kết bạn': 'add',
    'quét': 'scan'
};

/**
 * Interprets a natural language command into structural search params.
 * @param {string} command - e.g. "Tìm chủ tạp hóa ở Hà Nội"
 */
function interpretCommand(command) {
    const lowerCmd = command.toLowerCase();
    let location = null;
    let target = command; // Default target is the whole command minus location

    // 1. Extract Location
    // Look for patterns: "ở [City]", "khu vực [City]", "tại [City]"
    for (const [cityKey, aliases] of Object.entries(LOCATION_MAP)) {
        if (aliases.some(alias => lowerCmd.includes(alias))) {
            location = cityKey; // Canonical location name

            // Remove location text from command to isolate the Target
            // e.g. "Tìm tạp hóa ở Hà Nội" -> "Tìm tạp hóa"
            aliases.forEach(alias => {
                target = target.replace(new RegExp(`ở ${alias}`, 'gi'), '')
                    .replace(new RegExp(`tại ${alias}`, 'gi'), '')
                    .replace(new RegExp(`khu vực ${alias}`, 'gi'), '')
                    .replace(new RegExp(alias, 'gi'), ''); // Fallback
            });
            break;
        }
    }

    // Clean up target string
    target = target.replace(/tìm kiếm|tìm|quét|người|muốn/gi, '').trim();
    // Remove extra commas/spaces
    target = target.replace(/^,|,$/g, '').trim();

    // 2. Generate Smart Strategies
    const strategies = [];

    // Strategy A: Post Scan (Contextual) - The "Smart" Way
    // If Location exists, append it to query
    const locationSuffix = location ? ` ${location}` : '';

    const postQueries = [
        `Khai trương ${target}${locationSuffix}`,
        `Tìm nguồn ${target}${locationSuffix}`,
        `Setup ${target}${locationSuffix}`,
        `Cần nhập ${target}${locationSuffix}`
    ];

    // Strategy B: Group Scan (Community)
    const groupQueries = [
        `Hội ${target}${locationSuffix}`,
        `Chợ ${target}${locationSuffix}`,
        `Cộng đồng ${target}${locationSuffix}`
    ];

    // Strategy C: People Search (Direct)
    const peopleQueries = [
        // For direct name search, we usually don't append location to the string, 
        // but rely on Filter (which we don't have automtated yet in script).
        // So we just use the target name for now.
        target
    ];

    return {
        originalCommand: command,
        parsed: {
            target: target,
            location: location
        },
        strategies: {
            post_scan: postQueries,
            group_scan: groupQueries,
            people_search: peopleQueries
        }
    };
}

// CLI Test
if (require.main === module) {
    const testCmds = [
        "Tìm chủ tạp hóa ở Hà Nội",
        "Quét các spa tại sài gòn",
        "Tìm người bán bất động sản"
    ];

    testCmds.forEach(cmd => {
        console.log(`\nCMD: "${cmd}"`);
        console.log(JSON.stringify(interpretCommand(cmd), null, 2));
    });
}

module.exports = { interpretCommand };
