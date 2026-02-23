/**
 * TU Ticket Gardener - UI Components
 * Reusable UI component templates
 */

const Components = {
    // Ticket Card Component (List Style)
    ticketCard(ticket) {
        const displayImages = ticket.images ? ticket.images.slice(0, 1) : [];
        const hasImages = displayImages.length > 0;

        return `
            <div class="ticket-list-item" onclick="showTicketDetail(${ticket.id})">
                <!-- Col 1: Avatar -->
                <div class="tli-thumb">
                    ${hasImages ? `
                        <img src="${displayImages[0]}" alt="Ticket">
                    ` : `
                        <span class="material-symbols-outlined" style="font-size: 1.5rem; color: #94a3b8;">park</span>
                    `}
                </div>

                <!-- Col 2: Basic Info -->
                <div class="tli-info">
                    <span class="tli-id">#${ticket.id}</span>
                    <h3 class="tli-title">${ticket.title}</h3>
                    <p class="tli-desc">${ticket.zoneName} - ${ticket.locationDetail || 'ทั่วไป'}</p>
                    
                    <!-- Only visible in Grid View via CSS -->
                    <div class="grid-badges" style="display: none; margin-top: 0.75rem; gap: 0.5rem;">
                        <span class="badge-tag ${getStatusClass(ticket.status)}" style="font-size: 0.65rem;">${getStatusLabel(ticket.status)}</span>
                        ${ticket.priority === 'urgent' ? '<span class="badge-tag urgent" style="font-size: 0.65rem;">เร่งด่วน</span>' : ''}
                    </div>
                </div>

                <!-- Col 3: Status (top-right on mobile) -->
                <div class="tli-meta">
                    ${ticket.priority === 'urgent' ? '<span class="badge-tag urgent">เร่งด่วน</span>' : ''}
                    <span class="badge-tag ${getStatusClass(ticket.status)}">${getStatusLabel(ticket.status)}</span>
                </div>

                <!-- Col 4: DateTime -->
                <div class="tli-date">
                    <span class="date">${formatShortDate(ticket.date)}</span>
                    <span class="time">${ticket.date.split('T')[1]?.substring(0, 5) || '00:00'} น.</span>
                </div>

                <!-- Col 5: Action Menu -->
                <div class="tli-action">
                    <span class="material-symbols-outlined">more_horiz</span>
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

    // Monitor Ticket Card (Big & Easy to Read version, No Assignees)
    monitorCard(ticket) {
        const hasOperation = ticket.operation && ticket.operation !== '-';

        return `
            <div class="ticket-card monitor-card" onclick="showTicketDetail(${ticket.id})" style="height: auto; padding: 1.5rem;">
                <!-- Header: ID + Title -->
                <div style="display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 1rem; gap: 1rem;">
                    <div style="display: flex; align-items: center; gap: 0.75rem; flex: 1; min-width: 0;">
                        <span style="color: var(--text-muted); font-weight: 800; font-size: 1.25rem; flex-shrink: 0;">#${ticket.id}</span>
                        <h3 style="font-size: 1.5rem; font-weight: 700; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: var(--text-primary); line-height: 1.3;">${ticket.title}</h3>
                    </div>
                </div>

                <!-- Badges Row (Bigger) -->
                <div style="display: flex; gap: 0.75rem; flex-wrap: wrap; margin-bottom: 1.25rem;">
                    ${ticket.priority === 'urgent' ? '<span class="badge urgent" style="font-size: 1rem; padding: 0.5rem 1.25rem;">เร่งด่วน</span>' : ''}
                    <span class="badge ${getStatusClass(ticket.status)}" style="font-size: 1rem; padding: 0.5rem 1.25rem;">${getStatusLabel(ticket.status)}</span>
                </div>

                <!-- Zone + Date + Damage Type (Big Icons & Text) -->
                <div style="display: flex; align-items: center; gap: 1.5rem; color: var(--text-secondary); margin-bottom: 1.25rem; font-size: 1.1rem; flex-wrap: wrap;">
                    <div style="display: flex; align-items: center; gap: 0.5rem;">
                        <span class="material-symbols-outlined" style="font-size: 1.5rem;">location_on</span>
                        <span style="font-weight: 500;">${ticket.zoneName}</span>
                    </div>
                    <div style="display: flex; align-items: center; gap: 0.5rem;">
                        <span class="material-symbols-outlined" style="font-size: 1.5rem;">calendar_today</span>
                        <span>${formatShortDate(ticket.date)}</span>
                    </div>
                    <div style="display: flex; align-items: center; gap: 0.5rem;">
                        <span class="material-symbols-outlined" style="font-size: 1.5rem;">park</span>
                        <span>${getDamageTypeName(ticket.damageType)}</span>
                    </div>
                </div>

                <!-- Operation (Highlighted, Very Big) -->
                ${hasOperation ? `
                <div class="monitor-operation" style="display: flex; align-items: flex-start; gap: 1rem; margin-top: auto; padding: 1rem 1.25rem; background: #ecfdf5; border-radius: 1rem; border: 2px solid #a7f3d0;">
                    <span class="material-symbols-outlined" style="font-size: 2rem; color: #16a34a; flex-shrink: 0;">construction</span>
                    <span style="font-size: 1.25rem; color: #15803d; line-height: 1.4; font-weight: 600;">${ticket.operation}</span>
                </div>
                ` : ''}
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
