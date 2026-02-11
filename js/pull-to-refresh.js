/**
 * Pull-to-Refresh Implementation
 * เหมือนแอปมือถือ - ดึงลงเพื่อรีเฟรชหน้า
 */

class PullToRefresh {
    constructor() {
        this.startY = 0;
        this.currentY = 0;
        this.isDragging = false;
        this.threshold = 80; // ระยะที่ต้องดึงลงเพื่อรีเฟรช
        this.maxPull = 150; // ระยะสูงสุดที่ดึงได้
        this.isRefreshing = false;

        this.createRefreshIndicator();
        this.attachEvents();
    }

    createRefreshIndicator() {
        // สร้าง refresh indicator
        const indicator = document.createElement('div');
        indicator.id = 'pull-refresh-indicator';
        indicator.innerHTML = `
            <div class="pull-refresh-content">
                <div class="pull-refresh-spinner"></div>
                <span class="pull-refresh-text">ดึงลงเพื่อรีเฟรช</span>
            </div>
        `;
        document.body.appendChild(indicator);
        this.indicator = indicator;

        // เพิ่ม CSS
        this.addStyles();
    }

    addStyles() {
        const style = document.createElement('style');
        style.textContent = `
            #pull-refresh-indicator {
                position: fixed;
                top: -80px;
                left: 0;
                right: 0;
                height: 80px;
                display: flex;
                align-items: center;
                justify-content: center;
                background: linear-gradient(180deg, var(--background) 0%, transparent 100%);
                z-index: 9999;
                transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            }

            .pull-refresh-content {
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 0.5rem;
            }

            .pull-refresh-spinner {
                width: 24px;
                height: 24px;
                border: 3px solid var(--border);
                border-top-color: var(--primary);
                border-radius: 50%;
                animation: spin 0.8s linear infinite;
                opacity: 0;
                transition: opacity 0.2s;
            }

            .pull-refresh-spinner.active {
                opacity: 1;
            }

            .pull-refresh-text {
                font-size: 0.75rem;
                color: var(--text-secondary);
                font-weight: 500;
            }

            @keyframes spin {
                to { transform: rotate(360deg); }
            }

            /* ซ่อน refresh indicator เมื่อไม่ได้ใช้งาน */
            body.refreshing #pull-refresh-indicator {
                top: 0;
            }
        `;
        document.head.appendChild(style);
    }

    attachEvents() {
        // รองรับทั้ง touch และ mouse
        document.addEventListener('touchstart', this.handleStart.bind(this), { passive: true });
        document.addEventListener('touchmove', this.handleMove.bind(this), { passive: false });
        document.addEventListener('touchend', this.handleEnd.bind(this));

        // Mouse events สำหรับทดสอบบน desktop
        document.addEventListener('mousedown', this.handleStart.bind(this));
        document.addEventListener('mousemove', this.handleMove.bind(this));
        document.addEventListener('mouseup', this.handleEnd.bind(this));
    }

    handleStart(e) {
        // เริ่มดึงได้เมื่ออยู่ด้านบนสุดของหน้าเท่านั้น
        if (window.scrollY > 0 || this.isRefreshing) return;

        this.isDragging = true;
        this.startY = e.touches ? e.touches[0].clientY : e.clientY;
    }

    handleMove(e) {
        if (!this.isDragging || this.isRefreshing) return;

        this.currentY = e.touches ? e.touches[0].clientY : e.clientY;
        const deltaY = this.currentY - this.startY;

        // ดึงลงเท่านั้น และต้องอยู่ด้านบนสุด
        if (deltaY > 0 && window.scrollY === 0) {
            e.preventDefault();

            // จำกัดระยะการดึงสูงสุด
            const pullDistance = Math.min(deltaY, this.maxPull);
            const pullRatio = pullDistance / this.threshold;

            // แสดง indicator
            this.indicator.style.transform = `translateY(${pullDistance}px)`;

            // เปลี่ยนข้อความและไอคอน
            const text = this.indicator.querySelector('.pull-refresh-text');
            const spinner = this.indicator.querySelector('.pull-refresh-spinner');

            if (pullDistance >= this.threshold) {
                text.textContent = 'ปล่อยเพื่อรีเฟรช';
                spinner.classList.add('active');
            } else {
                text.textContent = 'ดึงลงเพื่อรีเฟรช';
                spinner.classList.remove('active');
            }
        }
    }

    async handleEnd(e) {
        if (!this.isDragging) return;

        this.isDragging = false;
        const deltaY = this.currentY - this.startY;

        if (deltaY >= this.threshold && window.scrollY === 0) {
            // เริ่มรีเฟรช
            await this.refresh();
        } else {
            // ไม่ถึง threshold ให้กลับไป
            this.resetIndicator();
        }
    }

    async refresh() {
        if (this.isRefreshing) return;

        this.isRefreshing = true;
        document.body.classList.add('refreshing');

        const text = this.indicator.querySelector('.pull-refresh-text');
        const spinner = this.indicator.querySelector('.pull-refresh-spinner');

        text.textContent = 'กำลังรีเฟรช...';
        spinner.classList.add('active');

        // เรียก refresh function
        try {
            await this.onRefresh();
        } catch (error) {
            console.error('Refresh failed:', error);
        }

        // รอหน่อยเพื่อให้ UX ดีขึ้น
        setTimeout(() => {
            this.resetIndicator();
            this.isRefreshing = false;
            document.body.classList.remove('refreshing');
        }, 500);
    }

    async onRefresh() {
        // ฟังก์ชันสำหรับรีเฟรชข้อมูล
        // จะถูก override จากภายนอก
        console.log('🔄 Refreshing...');

        // โหลดข้อมูลใหม่
        if (typeof loadData === 'function') {
            await loadData();
        }

        // รีเฟรชหน้าปัจจุบัน
        if (typeof refreshCurrentPage === 'function') {
            refreshCurrentPage();
        }
    }

    resetIndicator() {
        this.indicator.style.transform = 'translateY(0)';
        const spinner = this.indicator.querySelector('.pull-refresh-spinner');
        spinner.classList.remove('active');
    }
}

// Initialize Pull-to-Refresh
let pullToRefresh;
document.addEventListener('DOMContentLoaded', () => {
    pullToRefresh = new PullToRefresh();
    console.log('✅ Pull-to-Refresh initialized');
});

window.pullToRefresh = pullToRefresh;
