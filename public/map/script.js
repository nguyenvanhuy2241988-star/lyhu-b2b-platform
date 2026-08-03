document.addEventListener("DOMContentLoaded", () => {
    // Login elements
    const loginOverlay = document.getElementById("login-overlay");
    const dashboard = document.getElementById("dashboard");
    const adminPassword = document.getElementById("admin-password");
    const loginBtn = document.getElementById("login-btn");
    const loginError = document.getElementById("login-error");

    loginBtn.addEventListener("click", () => {
        if (adminPassword.value === "admin123") {
            loginOverlay.style.display = "none";
            dashboard.style.display = "flex";
            loadMap(); // Load map only after login
        } else {
            loginError.textContent = "Mật khẩu không đúng. Vui lòng thử lại!";
        }
    });

    adminPassword.addEventListener("keypress", (e) => {
        if (e.key === "Enter") loginBtn.click();
    });

    // Map logic function
    async function loadMap() {
    const mapContainer = document.getElementById("map-container");
    const tooltip = document.getElementById("tooltip");
    
    // Sidebar elements
    const sideTitle = document.getElementById("side-title");
    const sideInstruction = document.getElementById("side-instruction");
    const sideTargets = document.getElementById("side-targets");
    const nppStatus = document.getElementById("npp-status");
    const targetList = document.getElementById("target-list");
    const totalRevenueValue = document.getElementById("total-revenue-value");
    
    // Stats elements
    const coveredProvincesEl = document.getElementById("covered-provinces");
    const emptyProvincesEl = document.getElementById("empty-provinces");

    // Load SVG
    try {
        const response = await fetch("vietnam.svg");
        if (!response.ok) throw new Error("Could not load map SVG");
        const svgText = await response.text();
        mapContainer.innerHTML = svgText;
        
        initMap();
    } catch (error) {
        console.error("Error loading map:", error);
        mapContainer.innerHTML = "<p>Lỗi tải bản đồ. Vui lòng kiểm tra lại file vietnam.svg</p>";
    }

    function initMap() {
        const paths = mapContainer.querySelectorAll("path.land");
        let coveredCount = 0;
        
        paths.forEach(path => {
            const provinceName = path.getAttribute("title");
            const data = getProvinceData(provinceName);
            
            // Color map based on status
            if (data.hasNPP) {
                path.classList.add("filled");
                coveredCount++;
            } else {
                path.classList.add("empty");
            }
            
            // Tooltip events
            path.addEventListener("mouseenter", (e) => showTooltip(e, provinceName, data));
            path.addEventListener("mousemove", (e) => moveTooltip(e));
            path.addEventListener("mouseleave", hideTooltip);
            
            // Click event for sidebar
            path.addEventListener("click", () => updateSidebar(provinceName, data));
        });
        
        // Update stats
        coveredProvincesEl.textContent = coveredCount;
        emptyProvincesEl.textContent = paths.length - coveredCount;
    }
    } // End loadMap

    function calculateTotal(targets) {
        return Object.values(targets).reduce((sum, val) => sum + val, 0);
    }

    function showTooltip(e, name, data) {
        const total = calculateTotal(data.targets);
        
        tooltip.innerHTML = `
            <div class="tooltip-title">${name}</div>
            <div class="tooltip-stat">
                <span>Trạng thái:</span>
                <span style="color: ${data.hasNPP ? 'var(--status-filled)' : 'var(--status-empty)'}">
                    ${data.hasNPP ? 'Đã có NPP' : 'Còn trống'}
                </span>
            </div>
            <div class="tooltip-stat">
                <span>Doanh số mục tiêu:</span>
                <span style="color: var(--accent)">${formatCurrency(total)}</span>
            </div>
        `;
        tooltip.classList.add("show");
        moveTooltip(e);
    }

    function moveTooltip(e) {
        tooltip.style.left = e.pageX + 'px';
        tooltip.style.top = (e.pageY - 10) + 'px';
    }

    function hideTooltip() {
        tooltip.classList.remove("show");
    }

    function updateSidebar(name, data) {
        sideTitle.textContent = name;
        sideInstruction.style.display = "none";
        sideTargets.style.display = "block";
        
        // Update Status Badge
        nppStatus.textContent = data.hasNPP ? "Đã có Nhà Phân Phối" : "Thị trường còn trống";
        nppStatus.className = "status-badge " + (data.hasNPP ? "has-npp" : "no-npp");
        
        // Update Targets List
        targetList.innerHTML = "";
        let total = 0;
        for (const [brand, amount] of Object.entries(data.targets)) {
            total += amount;
            const li = document.createElement("li");
            li.innerHTML = `
                <span class="target-name">${brand}</span>
                <span class="target-val">${formatCurrency(amount)}</span>
            `;
            targetList.appendChild(li);
        }
        
        // Update Total
        totalRevenueValue.textContent = formatCurrency(total);
    }
});
