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
                    <p class="tli-desc">${ticket.zoneName}${ticket.locationDetail ? ` - ${ticket.locationDetail}` : ''}</p>
                    
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

    // Monitor Ticket Card (Premium Table Style - Visual Hierarchy Optimized)
    monitorCard(ticket) {
        const hasOperation = ticket.operation && ticket.operation !== '-' && ticket.status !== 'completed';

        return `
            <div class="monitor-card-premium" onclick="showTicketDetail(${ticket.id})" style="
                background: white; 
                padding: 1.5rem; 
                border-bottom: 1px solid #f1f5f9; 
                display: flex;
                flex-wrap: wrap;
                align-items: center; 
                gap: 1.5rem;
                cursor: pointer;
                transition: background 0.2s;
            ">
                <!-- 1. รหัส (ID) - Secondary Info (Lighter & Smaller) -->
                <div class="monitor-col-id" style="width: 80px; font-size: 0.95rem; font-weight: 500; color: #64748b; font-family: 'Outfit', sans-serif; flex-shrink: 0;">
                    #${ticket.id}
                </div>

                <!-- 2. ชื่อ และ สถานที่ - Primary Info (Visual Hierarchy: Boldest & Darkest) -->
                <div class="monitor-col-info" style="flex: 1; min-width: 250px;">
                    <h3 style="font-size: 1.1rem; font-weight: 600; color: #0f172a; margin: 0 0 0.35rem 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; line-height: 1.4;">
                        ${ticket.title}
                    </h3>
                    <p style="font-size: 0.95rem; font-weight: 600; color: #334155; margin: 0; display: flex; align-items: center; gap: 0.35rem;">
                        <span class="material-symbols-outlined" style="font-size: 1.1rem; color: #94a3b8;">location_on</span>
                        ${ticket.zoneName}${ticket.locationDetail ? ` · ${ticket.locationDetail}` : ''}
                    </p>
                </div>

                <!-- 3. สถานะ (Status) -->
                <div class="monitor-col-status" style="width: 140px; flex-shrink: 0;">
                    <span class="badge-tag ${getStatusClass(ticket.status)}" style="padding: 0.5rem 1rem; border-radius: 0.75rem; font-weight: 600; font-size: 0.85rem; width: 100%; text-align: center; display: inline-block; box-shadow: 0 1px 2px rgba(0,0,0,0.05);">
                        ${getStatusLabel(ticket.status)}
                    </span>
                </div>

                <!-- 4. วันเวลา (DateTime) -->
                <div class="monitor-col-date" style="width: 140px; text-align: right; flex-shrink: 0;">
                    <div style="font-size: 0.95rem; font-weight: 500; color: #1e293b;">${formatShortDate(ticket.date).split(' • ')[0]}</div>
                    <div style="font-size: 0.85rem; color: #64748b; font-weight: 500;">${ticket.date.split('T')[1]?.substring(0, 5) || '00:00'} น.</div>
                </div>

                <!-- Operation (Optional, Full width below) -->
                ${hasOperation ? `
                <div class="monitor-row-op" style="width: 100%; margin-top: 0.5rem; padding: 1rem 1.25rem; background: #f0fdf4; border-radius: 1rem; border: 1px solid #dcfce7; display: flex; align-items: center; gap: 0.75rem;">
                    <span class="material-symbols-outlined" style="font-size: 1.35rem; color: #16a34a;">construction</span>
                    <span style="font-size: 0.95rem; color: #15803d; font-weight: 600;">${ticket.operation}</span>
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
