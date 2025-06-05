// Initialize Supabase client
const SUPABASE_URL = 'https://qlpeqokbxhqvnnzdekmw.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFscGVxb2tieGhxdm5uemRla213Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkxNDM1MTgsImV4cCI6MjA2NDcxOTUxOH0.9G2JNmBRxssTdV8oteqU5IXKEra-HIge2Jr-JPHwX6A';

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Function to handle user signup
async function signUp(email, password, username) {
    try {
        const { data, error } = await supabase.auth.signUp({
            email: email,
            password: password,
            options: {
                data: {
                    username: username
                }
            }
        });

        if (error) throw error;

        // Supabase automatically creates a user in auth.users.
        // The handle_new_user trigger will create the profile in public.profiles.
        return { success: true, user: data.user };
    } catch (error) {
        console.error('Signup error:', error.message);
        return { success: false, error: error.message };
    }
}

// Function to handle user signin
async function signIn(email, password) {
    try {
        const { data, error } = await supabase.auth.signInWithPassword({
            email: email,
            password: password,
        });

        if (error) throw error;
        return { success: true, user: data.user };
    } catch (error) {
        console.error('Signin error:', error.message);
        return { success: false, error: error.message };
    }
}

// Function to handle user signout
async function signOut() {
    try {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
        return { success: true };
    } catch (error) {
        console.error('Signout error:', error.message);
        return { success: false, error: error.message };
    }
}

// Function to get current authenticated user
async function getCurrentUser() {
    try {
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error) throw error;
        return user;
    } catch (error) {
        console.error('Get user error:', error.message);
        return null;
    }
}

// Listen for auth state changes
supabase.auth.onAuthStateChange((event, session) => {
    if (event === 'SIGNED_IN') {
        console.log('User signed in:', session.user);
        // Optionally fetch profile data here if needed immediately after sign-in
        // and store it globally or pass to main.js
        window.currentUser = session.user;
        window.currentUserId = session.user.id;
        document.dispatchEvent(new CustomEvent('auth:signedIn', { detail: { user: session.user } }));
    } else if (event === 'SIGNED_OUT') {
        console.log('User signed out');
        window.currentUser = null;
        window.currentUserId = null;
        window.currentUsername = null;
        // Trigger a custom event or call a function in main.js to handle logout
        document.dispatchEvent(new CustomEvent('auth:signedOut'));
    }
});