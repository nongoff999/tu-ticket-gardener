/**
 * TU Ticket Gardener - UI Components
 * Reusable UI component templates
 */

const Components = {
    // Ticket Card Component
    ticketCard(ticket) {
        return `
            <div class="ticket-card" onclick="showTicketDetail(${ticket.id})">
                <div class="ticket-card-image">
                    <img src="${ticket.images[0]}" alt="${ticket.title}">
                </div>
                <div class="ticket-card-content">
                    <div class="ticket-card-header">
                        <span class="ticket-card-id">#${ticket.id}</span>
                        <div class="ticket-card-badges">
                            ${ticket.priority === 'urgent' ? '<span class="badge urgent">เร่งด่วน</span>' : ''}
                            <span class="badge ${getStatusClass(ticket.status)}">${getStatusLabel(ticket.status)}</span>
                        </div>
                    </div>
                    <h3 class="ticket-card-title">${ticket.title}</h3>
                    <p class="ticket-card-desc">${ticket.description}</p>
                    <div class="ticket-card-footer">
                        <span class="ticket-card-category">${getDamageTypeName(ticket.damageType)}</span>
                        <span class="ticket-card-date">${formatDate(ticket.date)}</span>
                    </div>
                </div>
            </div>
        `;
    },

    // Helper: Render Assignees with Avatars
    renderAssignees(assignees, size = 'small') {
        const avatarSize = size === 'large' ? '32px' : '20px';
        const fontSize = size === 'large' ? '0.9rem' : '0.7rem';
        const gap = size === 'large' ? '0.5rem' : '0.35rem';
        const padding = size === 'large' ? '0.25rem 0.75rem 0.25rem 0.25rem' : '0.15rem 0.5rem 0.15rem 0.15rem';

        if (!assignees || assignees.length === 0) {
            return `<span style="font-size: ${size === 'large' ? '0.85rem' : '0.625rem'}; color: var(--text-muted); font-style: italic;">รอการมอบหมาย</span>`;
        }
        return `
            <div style="display: flex; flex-wrap: wrap; gap: 0.5rem; width: 100%;">
                ${assignees.map(name => `
                    <div style="display: flex; align-items: center; gap: ${gap}; background: #f8fafc; border: 1px solid #e2e8f0; padding: ${padding}; border-radius: 9999px;">
                        <img src="https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random&color=fff&size=64" alt="${name}" style="width: ${avatarSize}; height: ${avatarSize}; border-radius: 50%; object-fit: cover;">
                        <span style="font-size: ${fontSize}; font-weight: 500; color: #334155;">${name}</span>
                    </div>
                `).join('')}
            </div>
        `;
    },

    // Monitor Ticket Card (with images row + progress tracking)
    monitorCard(ticket) {
        const hasProgressImages = ticket.progressImages && ticket.progressImages.length > 0;
        const hasOperation = ticket.operation && ticket.operation !== '-';

        return `
            <div class="ticket-card" onclick="showTicketDetail(${ticket.id})" style="flex-direction: column; height: auto;">
                <!-- Header: ID + Title + Badges -->
                <div style="display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 0.25rem; gap: 0.5rem;">
                    <div style="display: flex; align-items: center; gap: 0.5rem; flex: 1; min-width: 0;">
                        <span style="color: var(--text-muted); font-weight: 700; font-size: 0.75rem; flex-shrink: 0;">#${ticket.id}</span>
                        <h3 style="font-size: 0.875rem; font-weight: 600; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${ticket.title}</h3>
                    </div>
                    <div style="display: flex; gap: 0.25rem; flex-shrink: 0;">
                        ${ticket.priority === 'urgent' ? '<span class="badge urgent">เร่งด่วน</span>' : ''}
                        <span class="badge ${getStatusClass(ticket.status)}">${getStatusLabel(ticket.status)}</span>
                    </div>
                </div>

                <!-- Zone + Date + Damage Type -->
                <div style="display: flex; align-items: center; gap: 0.75rem; color: var(--text-muted); margin-bottom: 0.5rem; font-size: 0.625rem; flex-wrap: wrap;">
                    <div style="display: flex; align-items: center; gap: 0.25rem;">
                        <span class="material-symbols-outlined" style="font-size: 0.875rem;">location_on</span>
                        <span>${ticket.zoneName}</span>
                    </div>
                    <div style="display: flex; align-items: center; gap: 0.25rem;">
                        <span class="material-symbols-outlined" style="font-size: 0.875rem;">calendar_today</span>
                        <span>${formatShortDate(ticket.date)}</span>
                    </div>
                    <div style="display: flex; align-items: center; gap: 0.25rem;">
                        <span class="material-symbols-outlined" style="font-size: 0.875rem;">park</span>
                        <span>${getDamageTypeName(ticket.damageType)}</span>
                    </div>
                </div>

                <!-- Operation -->
                ${hasOperation ? `
                <div style="display: flex; align-items: flex-start; gap: 0.35rem; margin-bottom: 0.5rem; padding: 0.4rem 0.6rem; background: #f0fdf4; border-radius: 0.5rem; border: 1px solid #bbf7d0;">
                    <span class="material-symbols-outlined" style="font-size: 0.875rem; color: #16a34a; flex-shrink: 0; margin-top: 1px;">construction</span>
                    <span style="font-size: 0.7rem; color: #15803d; line-height: 1.3;">${ticket.operation}</span>
                </div>
                ` : ''}

                <!-- Before Images -->
                <div style="margin-bottom: 0.25rem;">
                    <span style="font-size: 0.6rem; color: var(--text-muted); font-weight: 500;">📷 ก่อนดำเนินการ</span>
                </div>
                <div style="display: flex; gap: 0.375rem; overflow-x: auto; margin-bottom: ${hasProgressImages ? '0.375rem' : '0.625rem'};">
                    ${ticket.images.slice(0, 3).map(img => `
                        <img src="${img}" alt="" style="width: 7rem; height: 4rem; object-fit: cover; border-radius: 0.5rem; flex-shrink: 0; background: var(--background);">
                    `).join('')}
                </div>

                <!-- Progress Images (if any) -->
                ${hasProgressImages ? `
                <div style="margin-bottom: 0.25rem;">
                    <span style="font-size: 0.6rem; color: #8b5cf6; font-weight: 500;">📸 ระหว่างดำเนินการ</span>
                </div>
                <div style="display: flex; gap: 0.375rem; overflow-x: auto; margin-bottom: 0.625rem;">
                    ${ticket.progressImages.slice(0, 3).map(img => `
                        <img src="${img}" alt="" style="width: 7rem; height: 4rem; object-fit: cover; border-radius: 0.5rem; flex-shrink: 0; background: var(--background); border: 2px solid #c4b5fd;">
                    `).join('')}
                </div>
                ` : ''}

                <!-- Assignees -->
                <div style="display: flex; flex-direction: column; gap: 0.5rem; border-top: 1px solid var(--border); padding-top: 0.5rem;">
                    <span style="font-size: 0.625rem; color: var(--text-secondary); font-weight: 500;">ผู้รับผิดชอบ:</span>
                    ${this.renderAssignees(ticket.assignees)}
                </div>
            </div>
        `;
    },

    // Stats Card
    statCard(label, value, colorClass, icon) {
        return `
            <div class="stat-card ${colorClass}">
                <div style="position: relative; z-index: 10;">
                    <p class="stat-card-label">${label}</p>
                    <p class="stat-card-value">${value}</p>
                </div>
                <span class="material-symbols-outlined stat-card-icon">${icon}</span>
            </div>
        `;
    },

    // Filter Tab
    filterTab(id, name, isActive) {
        return `
            <button class="filter-tab ${isActive ? 'active' : ''}" data-filter="${id}">
                ${name}
            </button>
        `;
    },

    // Stepper for forms
    stepper(currentStep) {
        const steps = [
            { id: 1, label: 'ทิคเก็ตใหม่' },
            { id: 2, label: 'ระหว่างดำเนินการ' },
            { id: 3, label: 'ปิดทิคเก็ต' }
        ];

        return `
            <div class="stepper ${currentStep === 3 ? 'complete' : ''}">
                ${steps.map(step => `
                    <div class="stepper-step">
                        <div class="stepper-circle ${step.id < currentStep ? 'done' : ''} ${step.id === currentStep ? 'active' : ''}">
                            ${step.id < currentStep ? '<span class="material-symbols-outlined" style="font-size: 1rem;">check</span>' :
                step.id === currentStep ? '<div style="width: 0.625rem; height: 0.625rem; background: white; border-radius: 50%;"></div>' : ''}
                        </div>
                        <span class="stepper-label ${step.id <= currentStep ? 'active' : ''}">${step.label}</span>
                    </div>
                `).join('')}
            </div>
        `;
    },

    // Period Calendar Selector (Day/Week/Month)
    periodCalendar(selectedDateStr, period) {
        const selectedDate = new Date(selectedDateStr);

        let html = `
            <div class="weekly-calendar-container" style="display: flex; align-items: center; gap: 0.5rem; background: white; padding: 0.5rem; border-radius: 1rem; margin-bottom: 1.5rem; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
                <button class="calendar-nav-btn" id="prev-period" style="width: 2rem; height: 2rem; border-radius: 50%; border: none; background: transparent; color: var(--text-secondary); cursor: pointer; display: flex; align-items: center; justify-content: center;">
                    <span class="material-symbols-outlined" style="font-size: 1.25rem;">chevron_left</span>
                </button>
                <div class="weekly-calendar" style="display: flex; flex: 1; justify-content: space-between; gap: 0.25rem; padding: 0.5rem; background: transparent; box-shadow: none;">
        `;

        if (period === 'MONTH') {
            const thaiMonths = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
            // Show 5 months centered
            const range = [-2, -1, 0, 1, 2];
            const currentYear = selectedDate.getFullYear();
            const currentMonth = selectedDate.getMonth();

            for (let i of range) {
                // Determine month/year for this slot
                let d = new Date(currentYear, currentMonth + i, 1);
                let mIndex = d.getMonth();
                let y = d.getFullYear(); // AD

                const dateStr = d.toISOString().split('T')[0]; // First day of that month
                const isActive = i === 0;

                // Check if this slot represents the actual current calendar month (Today)
                const today = new Date();
                const isCurrentMonth = (today.getMonth() === mIndex && today.getFullYear() === y);

                html += `
                    <div class="calendar-day ${isActive ? 'active' : ''} ${isCurrentMonth ? 'today' : ''}" data-date="${dateStr}" style="flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 0.25rem; cursor: pointer; border-radius: 0.5rem; padding: 0.5rem 0; transition: all 0.2s; min-height: 3.5rem;">
                        <span class="day-name" style="font-size: 0.7rem; color: var(--text-secondary);">${y + 543}</span>
                        <div style="font-size: 1rem; font-weight: 600; ${isActive ? 'color: var(--primary);' : 'color: var(--text-primary);'}">
                            ${thaiMonths[mIndex]}
                        </div>
                    </div>
                `;
            }

        } else if (period === 'WEEK') {
            const thaiMonths = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
            const range = [-2, -1, 0, 1, 2];

            // Normalize to Sunday start
            const startOfSelectedWeek = new Date(selectedDate);
            startOfSelectedWeek.setDate(selectedDate.getDate() - selectedDate.getDay());
            startOfSelectedWeek.setHours(0, 0, 0, 0);

            for (let i of range) {
                const wStart = new Date(startOfSelectedWeek);
                wStart.setDate(startOfSelectedWeek.getDate() + (i * 7));

                const wEnd = new Date(wStart);
                wEnd.setDate(wStart.getDate() + 6);

                const dateStr = wStart.toISOString().split('T')[0];
                const isActive = i === 0;

                // Check if Today is in this week
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const isCurrentWeek = (today >= wStart && today <= wEnd);

                // Format: "1 - 7"
                const rangeLabel = `${wStart.getDate()} - ${wEnd.getDate()}`;
                // Month label: "ม.ค. 67" (Taken from End date usually better if spanning, or Start?)
                // Let's use End date month for brevity, or mixed format if needed. 
                // Simple: Month of Start Date
                const mStr = thaiMonths[wStart.getMonth()];
                const yStr = (wStart.getFullYear() + 543).toString().slice(-2);

                html += `
                    <div class="calendar-day ${isActive ? 'active' : ''} ${isCurrentWeek ? 'today' : ''}" data-date="${dateStr}" style="flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 0.25rem; cursor: pointer; border-radius: 0.5rem; padding: 0.5rem 0; transition: all 0.2s; min-height: 3.5rem;">
                        <span class="day-name" style="font-size: 0.7rem; color: var(--text-secondary);">${mStr} ${yStr}</span>
                        <div style="font-size: 0.9rem; font-weight: 600; ${isActive ? 'color: var(--primary);' : 'color: var(--text-primary);'}">
                            ${rangeLabel}
                        </div>
                    </div>
                `;
            }

        } else {
            // Week/Day View
            const days = ['อา.', 'จ.', 'อ.', 'พ.', 'พฤ.', 'ศ.', 'ส.'];
            const startOfWeek = new Date(selectedDate);
            startOfWeek.setDate(selectedDate.getDate() - selectedDate.getDay()); // Start from Sunday

            for (let i = 0; i < 7; i++) {
                const date = new Date(startOfWeek);
                date.setDate(startOfWeek.getDate() + i);
                const dateStr = date.toISOString().split('T')[0];
                const isActive = dateStr === selectedDateStr;
                const isToday = dateStr === new Date().toISOString().split('T')[0];

                html += `
                    <div class="calendar-day ${isActive ? 'active' : ''} ${isToday ? 'today' : ''}" data-date="${dateStr}" style="flex: 1; display: flex; flex-direction: column; align-items: center; gap: 0.25rem; cursor: pointer; border-radius: 0.5rem; padding: 0.25rem 0; transition: all 0.2s;">
                        <span class="day-name" style="font-size: 0.7rem; color: var(--text-secondary);">${days[date.getDay()]}</span>
                        <div class="day-number-circle" style="width: 2rem; height: 2rem; display: flex; align-items: center; justify-content: center; border-radius: 50%; font-size: 0.875rem; font-weight: 500; ${isActive ? 'background: var(--primary); color: white;' : isToday ? 'border: 1px solid var(--primary); color: var(--primary);' : 'color: var(--text-primary);'}">
                            ${date.getDate()}
                        </div>
                    </div>
                `;
            }
        }

        html += `
                </div>
                <button class="calendar-nav-btn" id="next-period" style="width: 2rem; height: 2rem; border-radius: 50%; border: none; background: transparent; color: var(--text-secondary); cursor: pointer; display: flex; align-items: center; justify-content: center;">
                    <span class="material-symbols-outlined" style="font-size: 1.25rem;">chevron_right</span>
                </button>
            </div>
        `;

        return html;
    }
};

// Export
window.Components = Components;
