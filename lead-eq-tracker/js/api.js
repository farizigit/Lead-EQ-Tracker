// Supabase client is initialized in auth.js and available globally
// const supabase = Supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// --- Profiles API ---
async function createProfile(userId, email, username) {
    try {
        const { data, error } = await supabase
            .from('profiles')
            .insert([{ id: userId, email: email, username: username }]);
        if (error) throw error;
        return { success: true, data };
    } catch (error) {
        console.error('Error creating profile:', error.message);
        return { success: false, error: error.message };
    }
}

async function getProfile(userId) {
    try {
        const { data, error } = await supabase
            .from('profiles')
            .select('id, email, username')
            .eq('id', userId)
            .single();
        if (error) throw error;
        return { success: true, data };
    } catch (error) {
        console.error('Error fetching profile:', error.message);
        return { success: false, error: error.message };
    }
}

async function getAllProfiles() {
    try {
        const { data, error } = await supabase
            .from('profiles')
            .select('id, username');
        if (error) throw error;
        return { success: true, data };
    } catch (error) {
        console.error('Error fetching all profiles:', error.message);
        return { success: false, error: error.message };
    }
}

// --- Equipments API ---
async function addEquipment(equipmentData) {
    try {
        const { data, error } = await supabase
            .from('equipments')
            .insert([equipmentData])
            .select(); // Use .select() to return the inserted data
        if (error) throw error;
        return { success: true, data: data[0] }; // Return the first inserted item
    } catch (error) {
        console.error('Error adding equipment:', error.message);
        return { success: false, error: error.message };
    }
}

async function getEquipments(sortByEmployeeId = null, categoryFilter = null) {
    try {
        let query = supabase
            .from('equipments')
            .select(`
                *,
                category,
                transactions (
                    id,
                    user_id,
                    type,
                    transaction_date,
                    profiles (
                        username
                    )
                )
            `);

        if (categoryFilter) {
            query = query.eq('category', categoryFilter);
        }

        if (sortByEmployeeId) {
            // This is a complex query. We want to sort by the username of the *current* holder.
            // This requires filtering transactions to only the latest 'check_out' for each equipment.
            // Supabase RLS might make this tricky to do directly in a single query with sorting.
            // A simpler approach for now: fetch all, then sort in JS.
            // For a true DB-level sort, we'd need a more advanced view or function in Supabase.
            // For now, we'll fetch all and filter/sort in main.js.
            // The `transactions` join will give us the data needed for JS sorting.
        }

        const { data, error } = await query;

        if (error) throw error;

        // Post-process to find the current holder
        const equipmentsWithHolder = data.map(equipment => {
            const latestCheckout = equipment.transactions
                .filter(t => t.type === 'check_out')
                .sort((a, b) => new Date(b.transaction_date) - new Date(a.transaction_date))[0];

            const latestCheckin = equipment.transactions
                .filter(t => t.type === 'check_in')
                .sort((a, b) => new Date(b.transaction_date) - new Date(a.transaction_date))[0];

            let currentHolder = null;
            if (latestCheckout && (!latestCheckin || new Date(latestCheckout.transaction_date) > new Date(latestCheckin.transaction_date))) {
                currentHolder = latestCheckout.profiles.username;
            }
            return { ...equipment, current_holder: currentHolder };
        });

        return { success: true, data: equipmentsWithHolder };
    } catch (error) {
        console.error('Error fetching equipments:', error.message);
        return { success: false, error: error.message };
    }
}

async function getEquipmentById(id) {
    try {
        const { data, error } = await supabase
            .from('equipments')
            .select(`
                *,
                category,
                transactions (
                    id,
                    user_id,
                    type,
                    transaction_date,
                    profiles (
                        username
                    )
                )
            `)
            .eq('id', id)
            .single();
        if (error) throw error;

        // Post-process to find the current holder
        const latestCheckout = data.transactions
            .filter(t => t.type === 'check_out')
            .sort((a, b) => new Date(b.transaction_date) - new Date(a.transaction_date))[0];

        const latestCheckin = data.transactions
            .filter(t => t.type === 'check_in')
            .sort((a, b) => new Date(b.transaction_date) - new Date(a.transaction_date))[0];

        let currentHolder = null;
        if (latestCheckout && (!latestCheckin || new Date(latestCheckout.transaction_date) > new Date(latestCheckin.transaction_date))) {
            currentHolder = latestCheckout.profiles.username;
        }

        return { success: true, data: { ...data, current_holder: currentHolder } };
    } catch (error) {
        console.error('Error fetching equipment by ID:', error.message);
        return { success: false, error: error.message };
    }
}

async function updateEquipment(id, equipmentData) {
    try {
        const { data, error } = await supabase
            .from('equipments')
            .update(equipmentData)
            .eq('id', id)
            .select();
        if (error) throw error;
        return { success: true, data: data[0] };
    } catch (error) {
        console.error('Error updating equipment:', error.message);
        return { success: false, error: error.message };
    }
}

async function deleteEquipment(id) {
    try {
        const { error } = await supabase
            .from('equipments')
            .delete()
            .eq('id', id);
        if (error) throw error;
        return { success: true };
    } catch (error) {
        console.error('Error deleting equipment:', error.message);
        return { success: false, error: error.message };
    }
}

// --- Transactions API ---
async function createTransaction(equipmentId, userId, type) {
    try {
        const { data, error } = await supabase
            .from('transactions')
            .insert([{ equipment_id: equipmentId, user_id: userId, type: type }])
            .select();
        if (error) throw error;
        return { success: true, data: data[0] };
    } catch (error) {
        console.error('Error creating transaction:', error.message);
        return { success: false, error: error.message };
    }
}

async function checkInAllEquipmentsForUser(userId) {
    try {
        // Fetch all equipments currently checked out by the user
        const { data: userEquipments, error: fetchError } = await supabase
            .from('equipments')
            .select(`
                id,
                name,
                transactions (
                    id,
                    user_id,
                    type,
                    transaction_date
                )
            `);

        if (fetchError) throw fetchError;

        const equipmentsToCheckIn = [];
        for (const eq of userEquipments) {
            const latestCheckout = eq.transactions
                .filter(t => t.type === 'check_out' && t.user_id === userId)
                .sort((a, b) => new Date(b.transaction_date) - new Date(a.transaction_date))[0];

            const latestCheckin = eq.transactions
                .filter(t => t.type === 'check_in')
                .sort((a, b) => new Date(b.transaction_date) - new Date(a.transaction_date))[0];

            // If there's a checkout by this user and no subsequent check-in, or checkout is more recent
            if (latestCheckout && (!latestCheckin || new Date(latestCheckout.transaction_date) > new Date(latestCheckin.transaction_date))) {
                equipmentsToCheckIn.push(eq);
            }
        }

        if (equipmentsToCheckIn.length === 0) {
            return { success: true, message: 'No equipments currently checked out by you to check in.' };
        }

        const transactionPromises = [];
        const updatePromises = [];
        const logPromises = [];

        for (const eq of equipmentsToCheckIn) {
            transactionPromises.push(createTransaction(eq.id, userId, 'check_in'));
            updatePromises.push(updateEquipment(eq.id, { status: 'available' }));
            logPromises.push(addLog('checked in all equipment', { equipment_id: eq.id, equipment_name: eq.name }, userId, window.currentUsername));
        }

        const transactionResults = await Promise.all(transactionPromises);
        const updateResults = await Promise.all(updatePromises);
        const logResults = await Promise.all(logPromises);

        const allSuccess = transactionResults.every(r => r.success) && updateResults.every(r => r.success) && logResults.every(r => r.success);

        if (allSuccess) {
            return { success: true, data: equipmentsToCheckIn.map(eq => eq.id) };
        } else {
            // Log individual errors if any
            console.error('Some check-in operations failed:', { transactionResults, updateResults, logResults });
            return { success: false, error: 'Some equipments failed to check in. Check console for details.' };
        }

    } catch (error) {
        console.error('Error checking in all equipments:', error.message);
        return { success: false, error: error.message };
    }
}

async function getTransactions(equipmentId) {
    try {
        const { data, error } = await supabase
            .from('transactions')
            .select(`
                *,
                profiles (
                    username
                )
            `)
            .eq('equipment_id', equipmentId)
            .order('transaction_date', { ascending: false });
        if (error) throw error;
        return { success: true, data };
    } catch (error) {
        console.error('Error fetching transactions:', error.message);
        return { success: false, error: error.message };
    }
}

// --- Logs API ---
async function addLog(action, details, userId, username) {
    try {
        const { data, error } = await supabase
            .from('logs')
            .insert([{ action: action, details: details, user_id: userId, username: username }])
            .select();
        if (error) throw error;
        return { success: true, data: data[0] };
    } catch (error) {
        console.error('Error adding log:', error.message);
        return { success: false, error: error.message };
    }
}

async function getLogs() {
    try {
        const { data, error } = await supabase
            .from('logs')
            .select('*')
            .order('created_at', { ascending: false });
        if (error) throw error;
        return { success: true, data };
    } catch (error) {
        console.error('Error fetching logs:', error.message);
        return { success: false, error: error.message };
    }
}