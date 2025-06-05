// Helper function to show/hide sections
function showSection(sectionId) {
    console.log(`Attempting to show section: ${sectionId}`);
    document.querySelectorAll('.page').forEach(section => {
        section.classList.remove('active');
        section.classList.add('hidden'); // Ensure all other pages are hidden
    });
    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
        targetSection.classList.remove('hidden'); // Remove hidden from the target section
        targetSection.classList.add('active');
        console.log(`Section ${sectionId} is now active.`);
    } else {
        console.error(`Section with ID ${sectionId} not found.`);
    }
}

// Helper function to display messages
function showMessage(elementId, message, type = 'info') {
    const messageElement = document.getElementById(elementId);
    messageElement.textContent = message;
    messageElement.className = `message ${type}`;
    setTimeout(() => {
        messageElement.textContent = '';
        messageElement.className = 'message';
    }, 5000);
}

// --- Auth UI ---
function renderAuthPage() {
    showSection('auth-section');
    document.getElementById('signup-form').reset();
    document.getElementById('login-form').reset();
    document.getElementById('signup-form').classList.add('hidden');
    document.getElementById('login-form').classList.remove('hidden');
}

// --- Dashboard UI ---
async function renderDashboard(equipments, profiles) {
    console.log('renderDashboard called with equipments:', equipments);
    console.log('renderDashboard called with profiles:', profiles);
    showSection('dashboard-section');

    // Update welcome message
    const welcomeMessage = document.getElementById('welcome-message');
    if (window.currentUsername) {
        welcomeMessage.textContent = `Hello, ${window.currentUsername}`;
    } else {
        welcomeMessage.textContent = `Hello, User`;
    }

    const totalEquipmentCount = document.getElementById('total-equipment-count');
    const availableEquipmentCount = document.getElementById('available-equipment-count');
    const equipmentListDiv = document.getElementById('equipment-list');
    equipmentListDiv.innerHTML = ''; // Clear previous list

    // Update hero section stats
    totalEquipmentCount.textContent = equipments.length;
    const availableCount = equipments.filter(eq => eq.status === 'available').length;
    availableEquipmentCount.textContent = availableCount;

    if (equipments.length === 0) {
        equipmentListDiv.innerHTML = '<p style="text-align: center; margin-top: 20px;">No equipment found. Add some!</p>';
        return;
    }

    // Populate sort by employee dropdown
    const sortByEmployeeSelect = document.getElementById('sort-by-employee');
    sortByEmployeeSelect.innerHTML = '<option value="">Sort by Employee</option>';
    if (profiles && profiles.length > 0) {
        profiles.forEach(profile => {
            const option = document.createElement('option');
            option.value = profile.id;
            option.textContent = profile.username;
            sortByEmployeeSelect.appendChild(option);
        });
    }

    equipments.forEach(equipment => {
        const card = document.createElement('div');
        card.className = 'equipment-card';
        card.dataset.id = equipment.id;

        const statusClass = equipment.status === 'available' ? 'available' : 'unavailable';
        const currentHolderText = equipment.current_holder ? ` (${equipment.current_holder})` : '';

        card.innerHTML = `
            <h3>${equipment.name}</h3>
            <p>Category: ${equipment.category || 'N/A'}</p>
            <p>Serial: ${equipment.serial_number || 'N/A'}</p>
            <p>Status: <span class="status ${statusClass}">${equipment.status}</span>${currentHolderText}</p>
            <div class="actions">
                <button class="view-details-btn"><i class="fas fa-info-circle"></i> Details</button>
                <button class="check-out-btn ${equipment.status === 'unavailable' ? 'hidden' : ''}"><i class="fas fa-arrow-alt-circle-right"></i> Check Out</button>
                <button class="check-in-btn ${equipment.status === 'available' ? 'hidden' : ''}"><i class="fas fa-arrow-alt-circle-left"></i> Check In</button>
            </div>
        `;
        equipmentListDiv.appendChild(card);
    });
}

// --- Add/Edit Equipment UI ---
function renderAddEditEquipmentForm(equipment = null) {
    showSection('add-edit-equipment-section');
    const title = document.getElementById('add-edit-title');
    const equipmentIdInput = document.getElementById('equipment-id');
    const nameInput = document.getElementById('equipment-name');
    const descriptionInput = document.getElementById('equipment-description');
    const serialNumberInput = document.getElementById('equipment-serial-number');
    const categorySelect = document.getElementById('equipment-category');
    const saveButton = document.getElementById('save-equipment-btn');

    document.getElementById('equipment-form').reset(); // Clear form

    if (equipment) {
        title.textContent = 'Edit Equipment';
        equipmentIdInput.value = equipment.id;
        nameInput.value = equipment.name;
        descriptionInput.value = equipment.description || '';
        serialNumberInput.value = equipment.serial_number || '';
        categorySelect.value = equipment.category || ''; // Set category
        saveButton.textContent = 'Update Equipment';
    } else {
        title.textContent = 'Add New Equipment';
        equipmentIdInput.value = '';
        saveButton.textContent = 'Save Equipment';
    }
}

// --- Equipment Details UI ---
function renderEquipmentDetails(equipment) {
    showSection('equipment-details-section');
    document.getElementById('detail-equipment-name').textContent = equipment.name;
    document.getElementById('detail-equipment-description').textContent = equipment.description || 'N/A';
    document.getElementById('detail-equipment-serial-number').textContent = equipment.serial_number || 'N/A';
    document.getElementById('detail-equipment-status').textContent = equipment.status;
    document.getElementById('detail-current-holder').textContent = equipment.current_holder || 'N/A';
    document.getElementById('detail-equipment-category').textContent = equipment.category || 'N/A';

    // Update check-in/check-out button visibility
    const checkOutBtn = document.getElementById('check-out-btn');
    const checkInBtn = document.getElementById('check-in-btn');
    if (equipment.status === 'available') {
        checkOutBtn.classList.remove('hidden');
        checkInBtn.classList.add('hidden');
    } else {
        checkOutBtn.classList.add('hidden');
        checkInBtn.classList.remove('hidden');
    }

    const transactionHistoryDiv = document.getElementById('transaction-history');
    transactionHistoryDiv.innerHTML = '<h3>Transaction History</h3>'; // Clear and re-add title

    if (equipment.transactions && equipment.transactions.length > 0) {
        equipment.transactions.forEach(transaction => {
            const transactionItem = document.createElement('div');
            transactionItem.className = 'transaction-item';
            const date = new Date(transaction.transaction_date).toLocaleString();
            const typeText = transaction.type === 'check_out' ? 'checked out by' : 'checked in by';
            transactionItem.innerHTML = `
                <strong>${transaction.profiles.username}</strong> ${typeText} on ${date}.
            `;
            transactionHistoryDiv.appendChild(transactionItem);
        });
    } else {
        transactionHistoryDiv.innerHTML += '<p>No transaction history for this equipment.</p>';
    }
}

// --- Logs UI ---
function renderLogs(logs) {
    showSection('logs-section');
    const activityLogsDiv = document.getElementById('activity-logs');
    activityLogsDiv.innerHTML = ''; // Clear previous logs

    if (logs.length === 0) {
        activityLogsDiv.innerHTML = '<p style="text-align: center; margin-top: 20px;">No activity logs found.</p>';
        return;
    }

    logs.forEach(log => {
        const logItem = document.createElement('div');
        logItem.className = 'log-item';
        const date = new Date(log.created_at).toLocaleString();
        logItem.innerHTML = `
            <strong>${log.username}</strong> ${log.action} on ${date}.
            ${log.details ? `<br><small>${JSON.stringify(log.details)}</small>` : ''}
        `;
        activityLogsDiv.appendChild(logItem);
    });
}