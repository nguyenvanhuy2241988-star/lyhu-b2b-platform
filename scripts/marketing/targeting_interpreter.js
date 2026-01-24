/**
 * Level 4: Natural Language Targeting Interpreter
 * Translates User Commands ("Tìm chủ tạp hóa") -> Facebook Graph Search filters.
 * In a real-world scenario, this would potentially call an LLM API.
 * For this implementation, we use a robust Keyword Mapping strategy.
 */

// Mapping Dictionary (Can be expanded)
const KEYWORD_MAP = {
    'tạp hóa': ['tạp hóa', 'bách hóa', 'minimart', 'siêu thị mini', 'hàng tiêu dùng'],
    'chủ': ['chủ', 'owner', 'founder', 'ceo', 'quản lý', 'boss'],
    'spa': ['spa', 'thẩm mỹ viện', 'làm đẹp', 'beauty'],
    'bất động sản': ['bất động sản', 'nhà đất', 'real estate', 'môi giới'],
    'quần áo': ['thời trang', 'quần áo', 'boutique', 'shop'],
    'đồ ăn': ['ăn vặt', 'đồ ăn', 'food', 'quán ăn', 'nhà hàng'],
    'hà nội': ['hà nội', 'ha noi', 'hn'],
    'hcm': ['hồ chí minh', 'ho chi minh', 'hcm', 'sài gòn'],
    'sỉ': ['sỉ', 'buôn', 'kho', 'phân phối']
};

/**
 * Interprets a natural language command into structural search params.
 * @param {string} command - e.g. "Tìm chủ tạp hóa ở Hà Nội"
 */
function interpretCommand(command) {
    const lowerCmd = command.toLowerCase();
    let searchKeywords = [];
    let location = null;
    let role = null;

    // 1. Detect Keywords
    for (const [key, values] of Object.entries(KEYWORD_MAP)) {
        if (lowerCmd.includes(key)) {
            // Special handling for Location
            if (['hà nội', 'hcm'].includes(key)) {
                location = values[0];
            }
            // Special handling for Role
            else if (['chủ'].includes(key)) {
                role = values;
            }
            // General business keywords
            else {
                searchKeywords.push(...values);
            }
        }
    }

    // Default Fallback if no specific keywords found, use the whole command
    if (searchKeywords.length === 0 && !location && !role) {
        searchKeywords.push(command);
    }

    // specific combination logic
    // e.g. "chủ tạp hóa" -> search query should be "chủ tạp hóa" OR "tạp hóa owner"
    let finalQueries = [];

    if (role && searchKeywords.length > 0) {
        // Combinatorial expansion
        role.forEach(r => {
            searchKeywords.forEach(k => {
                finalQueries.push(`${r} ${k}`);
            });
        });
    } else {
        finalQueries = searchKeywords;
    }

    // Deduplicate
    finalQueries = [...new Set(finalQueries)];

    // Limit to top 3 most relevant queries to avoid spamming search
    if (finalQueries.length > 5) {
        finalQueries = finalQueries.slice(0, 5);
    }

    return {
        originalCommand: command,
        hasLocation: !!location,
        locationFilter: location,
        generatedQueries: finalQueries.length > 0 ? finalQueries : [command],
        estimatedReach: 'High' // Mock metric
    };
}

// CLI Test
if (require.main === module) {
    const testCmds = [
        "Tìm chủ tạp hóa ở Hà Nội",
        "Kết bạn với người bán bất động sản",
        "Tìm shop quần áo",
        "Tìm người bán sỉ đồ ăn vặt"
    ];

    testCmds.forEach(cmd => {
        console.log(`\nCMD: "${cmd}"`);
        console.log(JSON.stringify(interpretCommand(cmd), null, 2));
    });
}

module.exports = { interpretCommand };
