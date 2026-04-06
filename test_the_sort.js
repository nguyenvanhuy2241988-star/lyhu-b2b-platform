const getWeightInGrams = (name) => {
    const match = name.toLowerCase().match(/([\d.]+)\s*(g|kg|ml|l)/);
    if (!match) return 0;
    const value = parseFloat(match[1]) || 0;
    const unit = match[2];
    if (unit === 'kg' || unit === 'l') return value * 1000;
    return value;
};
const getBaseName = (name) => {
    return name.toLowerCase().replace(/([\d.]+)\s*(g|kg|ml|l)/g, '').replace(/(\/|\s+)-|\s+/g, ' ').trim();
};
const naturalSort = (aName, bName) => {
    const baseA = getBaseName(aName);
    const baseB = getBaseName(bName);
    if (baseA === baseB) {
        const weightA = getWeightInGrams(aName);
        const weightB = getWeightInGrams(bName);
        if (weightA !== 0 || weightB !== 0) {
            return weightA - weightB;
        }
    }
    return aName.localeCompare(bName, 'vi', { numeric: true });
};

const items = [
    'Khoai môn sấy tẩm vị cay tứ xuyên 35g',
    'Khoai môn sấy tẩm vị gạch cua 100g',
    'Khoai môn sấy tẩm vị cay tứ xuyên 75g',
    'Khoai môn sấy tẩm vị gạch cua 180g',
    'Khoai môn sấy tẩm vị cay tứ xuyên gói nhỏ 2.5kg/thùng',
    'Khoai môn sấy tẩm vị gạch cua 35g',
    'Khoai môn sấy tẩm vị gạch cua 75g'
];

items.sort(naturalSort);
console.log(items);
