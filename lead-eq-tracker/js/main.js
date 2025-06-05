console.log('main.js script loaded and executing.');
document.addEventListener('DOMContentLoaded', async () => {
    console.log('DOMContentLoaded event fired in main.js');
    const authSection = document.getElementById('auth-section');
    const dashboardSection = document.getElementById('dashboard-section');
    const addEditEquipmentSection = document.getElementById('add-edit-equipment-section');
    const equipmentDetailsSection = document.getElementById('equipment-details-section');
    const logsSection = document.getElementById('logs-section');

    // Auth elements
    const signupForm = document.getElementById('signup-form');
    const loginForm = document.getElementById('login-form');
    const showLoginLink = document.getElementById('show-login');
    const showSignupLink = document.getElementById('show-signup');
    const authMessage = document.getElementById('auth-message');

    // Dashboard elements
    const addEquipmentBtn = document.getElementById('add-equipment-btn');
    const viewLogsBtn = document.getElementById('view-logs-btn');
    const logoutBtn = document.getElementById('logout-btn');
    const checkInAllBtn = document.getElementById('check-in-all-btn');
    const sortByEmployeeSelect = document.getElementById('sort-by-employee');
    const filterByCategorySelect = document.getElementById('filter-by-category');
    const equipmentListDiv = document.getElementById('equipment-list');

    // Add/Edit Equipment elements
    const equipmentForm = document.getElementById('equipment-form');
    const backToDashboardFromAddEditBtn = document.getElementById('back-to-dashboard-from-add-edit');

    // Equipment Details elements
    const backToDashboardFromDetailsBtn = document.getElementById('back-to-dashboard-from-details');
    const editEquipmentDetailBtn = document.getElementById('edit-equipment-detail-btn');
    const checkOutBtn = document.getElementById('check-out-btn');
    const checkInBtn = document.getElementById('check-in-btn');
    const deleteEquipmentBtn = document.getElementById('delete-equipment-btn');

    // Logs elements
    const backToDashboardFromLogsBtn = document.getElementById('back-to-dashboard-from-logs');

    let currentEquipmentId = null; // To store the ID of the equipment being viewed/edited

    // --- Navigation Functions ---
    async function navigateToDashboard(categoryFilter = null) {
        const { success, data: equipments } = await getEquipments(null, categoryFilter); // Pass category filter
        const { success: profilesSuccess, data: profiles } = await getAllProfiles();

        console.log('navigateToDashboard called.');
        console.log('Equipments fetch result:', { success, equipments });
        console.log('Profiles fetch result:', { profilesSuccess, profiles });

        if (success && profilesSuccess) {
            renderDashboard(equipments, profiles);
            if (categoryFilter) {
                filterByCategorySelect.value = categoryFilter; // Set dropdown to current filter
            } else {
                filterByCategorySelect.value = ''; // Reset dropdown
            }
        } else {
            showMessage('dashboard-message', 'Failed to load dashboard data. Check console for errors.', 'error');
        }
    }

    function navigateToAddEquipment() {
        renderAddEditEquipmentForm();
    }

    async function navigateToEditEquipment(equipmentId) {
        const { success, data: equipment } = await getEquipmentById(equipmentId);
        if (success) {
            renderAddEditEquipmentForm(equipment);
        } else {
            showMessage('equipment-message', 'Failed to load equipment for editing.', 'error');
        }
    }

    async function navigateToEquipmentDetails(equipmentId) {
        currentEquipmentId = equipmentId;
        const { success, data: equipment } = await getEquipmentById(equipmentId);
        if (success) {
            renderEquipmentDetails(equipment);
        } else {
            showMessage('details-message', 'Failed to load equipment details.', 'error');
        }
    }

    async function navigateToLogs() {
        const { success, data: logs } = await getLogs();
        if (success) {
            renderLogs(logs);
        } else {
            showMessage('logs-message', 'Failed to load activity logs.', 'error');
        }
    }

    // --- Event Listeners ---

    // Auth Forms
    signupForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('signup-username').value;
        const email = document.getElementById('signup-email').value;
        const password = document.getElementById('signup-password').value;

        const { success, error } = await signUp(email, password, username);
        if (success) {
            showMessage('auth-message', 'Signup successful! Please check your email to confirm your account.', 'success');
            signupForm.reset();
            showLoginLink.click(); // Switch to login form
        } else {
            showMessage('auth-message', error, 'error');
        }
    });

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;

        const { success, error } = await signIn(email, password);
        if (success) {
            // Auth state change listener will handle navigation to dashboard
            showMessage('auth-message', 'Login successful!', 'success');
        } else {
            showMessage('auth-message', error, 'error');
        }
    });

    showLoginLink.addEventListener('click', (e) => {
        e.preventDefault();
        document.getElementById('signup-form').classList.add('hidden');
        document.getElementById('login-form').classList.remove('hidden');
        authMessage.textContent = ''; // Clear messages
    });

    showSignupLink.addEventListener('click', (e) => {
        e.preventDefault();
        document.getElementById('login-form').classList.add('hidden');
        document.getElementById('signup-form').classList.remove('hidden');
        authMessage.textContent = ''; // Clear messages
    });

    // Dashboard Actions (moved to bottom nav)
    // Remove old event listeners from header buttons
    // addEquipmentBtn.removeEventListener('click', navigateToAddEquipment);
    // viewLogsBtn.removeEventListener('click', navigateToLogs);
    // logoutBtn.removeEventListener('click', async () => { /* ... */ });

    // Add event listeners for bottom navigation buttons
    document.getElementById('add-equipment-btn').addEventListener('click', navigateToAddEquipment);
    document.getElementById('view-logs-btn').addEventListener('click', navigateToLogs);
    document.getElementById('check-in-all-btn').addEventListener('click', async () => {
        if (!window.currentUserId || !window.currentUsername) {
            showMessage('dashboard-message', 'Please log in to perform this action.', 'error');
            return;
        }
        if (confirm('Are you sure you want to check in all equipments currently checked out by you?')) {
            const { success, error, message } = await checkInAllEquipmentsForUser(window.currentUserId);
            if (success) {
                showMessage('dashboard-message', message || 'All checked out equipments have been checked in!', 'success');
                navigateToDashboard(); // Refresh dashboard
            } else {
                showMessage('dashboard-message', error || 'Failed to check in all equipments.', 'error');
            }
        }
    });
    document.getElementById('logout-btn').addEventListener('click', async () => {
        const { success, error } = await signOut();
        if (!success) {
            console.error('Logout failed:', error);
        }
        // Auth state change listener will handle navigation to auth page
    });


    sortByEmployeeSelect.addEventListener('change', async (e) => {
        const selectedEmployeeId = e.target.value;
        const currentCategoryFilter = filterByCategorySelect.value; // Get current category filter
        const { success, data: allEquipments } = await getEquipments(null, currentCategoryFilter); // Get all equipments with category filter
        const { success: profilesSuccess, data: profiles } = await getAllProfiles();

        if (success && profilesSuccess) {
            let filteredEquipments = allEquipments;
            if (selectedEmployeeId) {
                filteredEquipments = allEquipments.filter(eq => {
                    // Find the latest check-out transaction for this equipment
                    const latestCheckout = eq.transactions
                        .filter(t => t.type === 'check_out')
                        .sort((a, b) => new Date(b.transaction_date) - new Date(a.transaction_date))[0];

                    // Find the latest check-in transaction for this equipment
                    const latestCheckin = eq.transactions
                        .filter(t => t.type === 'check_in')
                        .sort((a, b) => new Date(b.transaction_date) - new Date(a.transaction_date))[0];

                    // Determine if the equipment is currently checked out by the selected employee
                    if (latestCheckout && (!latestCheckin || new Date(latestCheckout.transaction_date) > new Date(latestCheckin.transaction_date))) {
                        return latestCheckout.user_id === selectedEmployeeId;
                    }
                    return false;
                });
            }
            renderDashboard(filteredEquipments, profiles);
        } else {
            showMessage('dashboard-message', 'Failed to filter equipments.', 'error');
        }
    });

    filterByCategorySelect.addEventListener('change', async (e) => {
        const selectedCategory = e.target.value;
        navigateToDashboard(selectedCategory); // Navigate to dashboard with category filter
    });


    // Dynamic event delegation for equipment cards (view details, check-in/out)
    equipmentListDiv.addEventListener('click', async (e) => {
        const card = e.target.closest('.equipment-card');
        if (!card) return;

        const equipmentId = card.dataset.id;

        if (e.target.classList.contains('view-details-btn')) {
            navigateToEquipmentDetails(equipmentId);
        } else if (e.target.classList.contains('check-out-btn')) {
            if (!window.currentUserId || !window.currentUsername) {
                showMessage('dashboard-message', 'Please log in to perform this action.', 'error');
                return;
            }
            const { success, error } = await createTransaction(equipmentId, window.currentUserId, 'check_out');
            if (success) {
                await updateEquipment(equipmentId, { status: 'unavailable' });
                await addLog('checked out equipment', { equipment_id: equipmentId, equipment_name: card.querySelector('h3').textContent }, window.currentUserId, window.currentUsername);
                showMessage('dashboard-message', 'Equipment checked out successfully!', 'success');
                navigateToDashboard(); // Refresh dashboard
            } else {
                showMessage('dashboard-message', error, 'error');
            }
        } else if (e.target.classList.contains('check-in-btn')) {
            if (!window.currentUserId || !window.currentUsername) {
                showMessage('dashboard-message', 'Please log in to perform this action.', 'error');
                return;
            }
            const { success, error } = await createTransaction(equipmentId, window.currentUserId, 'check_in');
            if (success) {
                await updateEquipment(equipmentId, { status: 'available' });
                await addLog('checked in equipment', { equipment_id: equipmentId, equipment_name: card.querySelector('h3').textContent }, window.currentUserId, window.currentUsername);
                showMessage('dashboard-message', 'Equipment checked in successfully!', 'success');
                navigateToDashboard(); // Refresh dashboard
            } else {
                showMessage('dashboard-message', error, 'error');
            }
        }
    });

    // Add/Edit Equipment Form
    equipmentForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const equipmentId = document.getElementById('equipment-id').value;
        const name = document.getElementById('equipment-name').value;
        const description = document.getElementById('equipment-description').value;
        const serialNumber = document.getElementById('equipment-serial-number').value;
        const category = document.getElementById('equipment-category').value;

        const equipmentData = { name, description, serial_number: serialNumber, category: category };

        let result;
        if (equipmentId) {
            result = await updateEquipment(equipmentId, equipmentData);
            if (result.success) {
                await addLog('updated equipment', { equipment_id: equipmentId, equipment_name: name }, window.currentUserId, window.currentUsername);
                showMessage('equipment-message', 'Equipment updated successfully!', 'success');
            }
        } else {
            result = await addEquipment(equipmentData);
            if (result.success) {
                await addLog('added new equipment', { equipment_id: result.data.id, equipment_name: name }, window.currentUserId, window.currentUsername);
                showMessage('equipment-message', 'Equipment added successfully!', 'success');
            }
        }

        if (result.success) {
            equipmentForm.reset();
            navigateToDashboard();
        } else {
            showMessage('equipment-message', result.error, 'error');
        }
    });

    backToDashboardFromAddEditBtn.addEventListener('click', navigateToDashboard);

    // Equipment Details Actions
    backToDashboardFromDetailsBtn.addEventListener('click', navigateToDashboard);

    editEquipmentDetailBtn.addEventListener('click', () => {
        if (currentEquipmentId) {
            navigateToEditEquipment(currentEquipmentId);
        }
    });

    checkOutBtn.addEventListener('click', async () => {
        if (!currentEquipmentId || !window.currentUserId || !window.currentUsername) {
            showMessage('details-message', 'Error: Missing equipment or user info.', 'error');
            return;
        }
        const { success, error } = await createTransaction(currentEquipmentId, window.currentUserId, 'check_out');
        if (success) {
            await updateEquipment(currentEquipmentId, { status: 'unavailable' });
            const equipmentName = document.getElementById('detail-equipment-name').textContent;
            await addLog('checked out equipment', { equipment_id: currentEquipmentId, equipment_name: equipmentName }, window.currentUserId, window.currentUsername);
            showMessage('details-message', 'Equipment checked out successfully!', 'success');
            navigateToEquipmentDetails(currentEquipmentId); // Refresh details
        } else {
            showMessage('details-message', error, 'error');
        }
    });

    checkInBtn.addEventListener('click', async () => {
        if (!currentEquipmentId || !window.currentUserId || !window.currentUsername) {
            showMessage('details-message', 'Error: Missing equipment or user info.', 'error');
            return;
        }
        const { success, error } = await createTransaction(currentEquipmentId, window.currentUserId, 'check_in');
        if (success) {
            await updateEquipment(currentEquipmentId, { status: 'available' });
            const equipmentName = document.getElementById('detail-equipment-name').textContent;
            await addLog('checked in equipment', { equipment_id: currentEquipmentId, equipment_name: equipmentName }, window.currentUserId, window.currentUsername);
            showMessage('details-message', 'Equipment checked in successfully!', 'success');
            navigateToEquipmentDetails(currentEquipmentId); // Refresh details
        } else {
            showMessage('details-message', error, 'error');
        }
    });

    deleteEquipmentBtn.addEventListener('click', async () => {
        if (!currentEquipmentId) {
            showMessage('details-message', 'No equipment selected for deletion.', 'error');
            return;
        }
        if (confirm('Are you sure you want to delete this equipment? This action cannot be undone.')) {
            const { success, error } = await deleteEquipment(currentEquipmentId);
            if (success) {
                const equipmentName = document.getElementById('detail-equipment-name').textContent;
                await addLog('deleted equipment', { equipment_id: currentEquipmentId, equipment_name: equipmentName }, window.currentUserId, window.currentUsername);
                showMessage('dashboard-message', 'Equipment deleted successfully!', 'success');
                navigateToDashboard(); // Go back to dashboard
            } else {
                showMessage('details-message', error, 'error');
            }
        }
    });

    // Logs Actions
    backToDashboardFromLogsBtn.addEventListener('click', navigateToDashboard);

    // --- Initial App Load & Auth State Handling ---
    // --- Initial App Load & Auth State Handling ---
    // This event listener will now be responsible for fetching profile and navigating
    document.addEventListener('auth:signedIn', async (event) => {
        const user = event.detail.user; // Get user from event detail
        if (user) {
            window.currentUser = user;
            window.currentUserId = user.id;
            const { data: profileData, error: profileError } = await getProfile(user.id);
            if (profileData) {
                window.currentUsername = profileData.username;
            } else {
                console.warn('Profile data not found after sign-in for user:', user.id, profileError);
                window.currentUsername = 'Unknown User'; // Fallback username
            }
            console.log('Global user variables set after sign-in:', { currentUser: window.currentUser, currentUserId: window.currentUserId, currentUsername: window.currentUsername });
            navigateToDashboard();
        } else {
            console.error('auth:signedIn event fired but no user found in event detail.');
            renderAuthPage();
        }
    });

    document.addEventListener('auth:signedOut', renderAuthPage);

    // Check initial auth state on page load
    const user = await getCurrentUser();
    console.log('Initial user check on DOMContentLoaded:', user);
    if (user) {
        // If user is already signed in (e.g., page refresh), trigger the signedIn event manually
        document.dispatchEvent(new CustomEvent('auth:signedIn'));
    } else {
        renderAuthPage();
    }
});