### Detailed Plan: Lead Equipment Tracker App

**Goal:** Develop a mobile-optimized web application for equipment check-in/out, employee signup, equipment management, and logging, using HTML, CSS, JavaScript, and Supabase.

**Key Features:**
*   User Authentication (Signup/Login) with Username
*   Equipment Management (Add, Edit, View)
*   Equipment Check-in/Check-out
*   Activity Logging
*   Modern UI with icons (no images)
*   Mobile Optimization
*   Sort equipment by current employee holder.

**Supabase Credentials:**
*   `NEXT_PUBLIC_SUPABASE_URL=https://qlpeqokbxhqvnnzdekmw.supabase.co`
*   `NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFscGVxb2tieGhxdm5uemRla213Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkxNDM1MTgsImV4cCI6MjA2NDcxOTUxOH0.9G2JNmBRxssTdV8oteqU5IXKEra-HIge2Jr-JPHwX6A`

---

#### **Phase 1: Supabase Setup and Database Schema**

1.  **Supabase Project Initialization:**
    *   Provide SQL scripts to create necessary tables and set up Row Level Security (RLS) policies.
    *   Tables: `profiles`, `equipments`, `transactions`, `logs`.

2.  **SQL Code for Supabase:**
    *   **`profiles` table:** Stores user information (linked to Supabase `auth.users`), now including a `username` column.
    *   **`equipments` table:** Stores equipment details.
    *   **`transactions` table:** Records check-in/check-out events.
    *   **`logs` table:** Stores all activity logs.
    *   **RLS Policies:** Enable RLS and define policies to allow authenticated users to perform CRUD operations on `equipments`, `transactions`, and `logs`, and manage their own `profile`.

#### **Phase 2: Project Structure and Core Files**

1.  **Create Project Directory:**
    *   `lead-eq-tracker/`
        *   [`index.html`](lead-eq-tracker/index.html)
        *   `css/`
            *   [`style.css`](lead-eq-tracker/css/style.css)
        *   `js/`
            *   [`main.js`](lead-eq-tracker/js/main.js) (Core application logic, routing, UI updates)
            *   [`auth.js`](lead-eq-tracker/js/auth.js) (Supabase authentication functions)
            *   [`api.js`](lead-eq-tracker/js/api.js) (Supabase database interaction functions)
            *   [`ui.js`](lead-eq-tracker/js/ui.js) (UI rendering and manipulation functions)
        *   `components/` (Optional: for reusable UI components if complexity grows)

2.  **`index.html` Structure:**
    *   Basic HTML5 boilerplate.
    *   Link to [`style.css`](lead-eq-tracker/css/style.css) and [`main.js`](lead-eq-tracker/js/main.js).
    *   Include a CDN for a suitable icon library (e.g., Font Awesome, Material Icons).
    *   Main content areas:
        *   Login/Signup form (will include username input).
        *   Dashboard/Equipment list (will include sorting controls).
        *   Add/Edit Equipment form.
        *   Check-in/Check-out interface.
        *   Logs view.
    *   Use a single-page application (SPA) approach with dynamic content loading.

3.  **`css/style.css`:**
    *   Mobile-first responsive design.
    *   Modern UI styling (colors, typography, spacing, shadows).
    *   Styles for forms, buttons, lists, cards, and navigation.
    *   Media queries for larger screens (if necessary, but primarily mobile-optimized).

#### **Phase 3: JavaScript Logic and Supabase Integration**

1.  **`js/auth.js`:**
    *   Initialize Supabase client with provided credentials.
    *   Functions for:
        *   `signUp(email, password, username)`: Modified to accept username.
        *   `signIn(email, password)`
        *   `signOut()`
        *   `getCurrentUser()`
        *   Handle session changes and redirect users.

2.  **`js/api.js`:**
    *   Functions for interacting with Supabase database tables:
        *   **Profiles:** `createProfile(userId, email, username)`, `getProfile(userId)`: Modified to handle username.
        *   **Equipments:** `addEquipment(data)`, `getEquipments(sortByEmployeeId = null)`: Modified to accept a sorting parameter. This function will fetch equipment and, if `sortByEmployeeId` is provided, join with `transactions` and `profiles` to get the current holder's username. `getEquipmentById(id)`, `updateEquipment(id, data)`, `deleteEquipment(id)`
        *   **Transactions:** `createTransaction(equipmentId, userId, type)`, `getTransactions(equipmentId)`
        *   **Logs:** `addLog(action, details, userId, username)`: Modified to include username for display in logs.
    *   Error handling for API calls.

3.  **`js/ui.js`:**
    *   Functions for rendering different views/pages:
        *   `renderAuthPage()`
        *   `renderDashboard(equipments)`: Modified to include a dropdown/button for sorting by employee. When rendering equipment, it will display the current holder's username if checked out.
        *   `renderAddEditEquipmentForm(equipmentData)`
        *   `renderEquipmentDetails(equipment, transactions)`
        *   `renderLogs(logs)`: Will display usernames instead of user IDs where appropriate.
    *   Functions for showing/hiding loading states, success/error messages.
    *   Dynamic creation of HTML elements based on data.

4.  **`js/main.js`:**
    *   Event listeners for navigation, form submissions, button clicks.
    *   New event listener for the "sort by employee" control on the dashboard.
    *   Routing logic (e.g., using `window.location.hash` or simple state management) to switch between views.
    *   Orchestrate calls to [`auth.js`](lead-eq-tracker/js/auth.js), [`api.js`](lead-eq-tracker/js/api.js), and [`ui.js`](lead-eq-tracker/js/ui.js) to manage application flow.
    *   Initial check for authenticated user on page load.

#### **Phase 4: Functionality Implementation**

1.  **Authentication Flow:**
    *   Display login/signup form with username input.
    *   On successful login/signup, redirect to dashboard.
    *   On logout, redirect to login page.

2.  **Dashboard:**
    *   Display a list of all available equipment.
    *   Search/filter functionality (optional, but good for mobile).
    *   Add a sorting option (e.g., a dropdown or button) to sort equipment by the employee who currently has it checked out.
    *   Buttons to "Add Equipment", and for each equipment: "Details", "Check-in", "Check-out".

3.  **Add/Edit Equipment:**
    *   Form to input equipment name, description, serial number, status (available/unavailable).
    *   Pre-fill form for editing existing equipment.
    *   Submit logic to call `api.addEquipment` or `api.updateEquipment`.

4.  **Check-in/Check-out:**
    *   When checking out, update equipment status to 'unavailable' and record a transaction and log entry.
    *   When checking in, update equipment status to 'available' and record a transaction and log entry.
    *   Associate transactions with the current user's ID and display the username in relevant UI elements.

5.  **Logs:**
    *   Display a chronological list of all equipment-related activities (e.g., "Username X checked out Equipment Y", "Username Z added Equipment A").

#### **Phase 5: Refinement and Optimization**

1.  **Error Handling:** Implement robust error handling and user feedback for all operations.
2.  **Loading States:** Show loading indicators during API calls.
3.  **Input Validation:** Client-side validation for forms.
4.  **Mobile Responsiveness:** Ensure all UI elements are well-displayed and usable on small screens.
5.  **Icon Integration:** Use icons from the chosen library consistently.

---

#### **Mermaid Diagram: Application Flow**

```mermaid
graph TD
    A[User Accesses App] --> B{Is User Authenticated?}

    B -- No --> C[Display Login/Signup Page]
    C -- Signup/Login Success --> D[Redirect to Dashboard]

    B -- Yes --> D[Display Dashboard]

    D -- Click "Add Equipment" --> E[Display Add Equipment Form]
    E -- Submit Form --> F[Call API.addEquipment]
    F -- Success --> D
    F -- Failure --> E

    D -- Click "Equipment Details" --> G[Display Equipment Details & Transactions]
    G -- Click "Check-out" --> H[Call API.createTransaction (checkout)]
    H -- Success --> G
    H -- Failure --> G

    G -- Click "Check-in" --> I[Call API.createTransaction (checkin)]
    I -- Success --> G
    I -- Failure --> G

    D -- Click "Edit Equipment" --> J[Display Edit Equipment Form (pre-filled)]
    J -- Submit Form --> K[Call API.updateEquipment]
    K -- Success --> D
    K -- Failure --> J

    D -- Click "View Logs" --> L[Display Activity Logs]
    L -- Back --> D

    D -- Click "Logout" --> M[Call Auth.signOut]
    M -- Success --> C
```

---

#### **Mermaid Diagram: Supabase Schema**

```mermaid
erDiagram
    auth.users ||--o{ profiles : "has"
    profiles ||--o{ transactions : "initiates"
    equipments ||--o{ transactions : "involved_in"
    transactions ||--o{ logs : "generates"

    auth.users {
        uuid id PK
        text email
        timestamp created_at
    }

    profiles {
        uuid id PK,FK "auth.users.id"
        text email
        text username "Unique username for display"
        timestamp created_at
    }

    equipments {
        uuid id PK
        text name
        text description
        text serial_number
        text status "available|unavailable"
        timestamp created_at
        timestamp updated_at
    }

    transactions {
        uuid id PK
        uuid equipment_id FK "equipments.id"
        uuid user_id FK "profiles.id"
        text type "check_in|check_out"
        timestamp transaction_date
    }

    logs {
        uuid id PK
        text action
        jsonb details
        uuid user_id FK "profiles.id"
        text username "For display purposes"
        timestamp created_at
    }