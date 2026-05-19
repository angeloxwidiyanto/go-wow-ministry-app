 Next.js to Vite + React + TanStack Query Migration Plan                                                                       │
│                                                                                                                               │
│ 1. Objective                                                                                                                  │
│ Migrate the existing Next.js App Router frontend to a purely client-side React Single Page Application (SPA) bundled with     │
│ Vite. The migration will leverage react-router-dom for routing and TanStack Query (React Query) for data fetching and state   │
│ management, communicating exclusively with the existing Go backend.                                                           │
│                                                                                                                               │
│ 2. Background & Motivation                                                                                                    │
│ The current Next.js application primarily acts as a thin proxy for the Go backend. It uses Server Components and Server       │
│ Actions ("use server") to fetch data and submit forms, but it does not rely heavily on Next.js specific features like         │
│ advanced SEO or heavy server-side rendering logic. Moving to Vite will simplify the deployment model (static file hosting),   │
│ reduce server overhead, and provide a faster, more traditional SPA developer experience.                                      │
│                                                                                                                               │
│ 3. Scope & Impact                                                                                                             │
│  - Affected: All files within src/ (Pages, Layouts, Components, Utils).                                                       │
│  - Not Affected: The Go Backend (backend/), Database Schema, and the apiFetch integration mechanism (though it will run       │
│    entirely in the browser).                                                                                                  │
│  - Impact: The application will transition from Server-Side Rendering (SSR) to Client-Side Rendering (CSR). Deployment will   │
│    change from a Node.js server to static file hosting.                                                                       │
│                                                                                                                               │
│ 4. Proposed Solution                                                                                                          │
│  - Build Tool: Replace next, next build, etc., with vite.                                                                     │
│  - Routing: Replace the file-system based App Router with react-router-dom configuration in a centralized App.tsx or          │
│    routes.tsx.                                                                                                                │
│  - Data Fetching: Replace async Server Components with TanStack Query's useQuery.                                             │
│  - Mutations: Replace Next.js Server Actions with TanStack Query's useMutation.                                               │
│  - Authentication: Replace middleware.ts with a React-based Higher-Order Component (<ProtectedRoute>).                        │
│                                                                                                                               │
│ 5. Phased Implementation Plan                                                                                                 │
│                                                                                                                               │
│ Phase 1: Initial Setup & Configuration                                                                                        │
│  1. Initialize a new Vite configuration (vite.config.ts).                                                                     │
│  2. Update package.json to remove Next.js dependencies and add vite, @vitejs/plugin-react, react-router-dom,                  │
│     @tanstack/react-query, and @tanstack/react-query-devtools.                                                                │
│  3. Move src/app/globals.css to src/index.css and configure Tailwind CSS for Vite.                                            │
│  4. Set up the entry point (index.html at the root and src/main.tsx).                                                         │
│                                                                                                                               │
│ Phase 2: Route Configuration                                                                                                  │
│  1. Create a centralized src/routes.tsx mapping the existing Next.js directory structure to react-router-dom paths:           │
│     - / -> HomePage                                                                                                           │
│     - /:slug/register -> RegisterPage                                                                                         │
│     - /invoice/:orderId -> InvoicePage                                                                                        │
│     - /admin/* -> Nested admin routes.                                                                                        │
│  2. Convert Next.js layout.tsx files into wrapper components using <Outlet />.                                                │
│                                                                                                                               │
│ Phase 3: Auth & Protected Routes                                                                                              │
│  1. Create an AuthProvider context and a <ProtectedRoute> component to replace middleware.ts.                                 │
│  2. Ensure <ProtectedRoute> checks session state (e.g., via Supabase client) before rendering child routes in /admin.         │
│                                                                                                                               │
│ Phase 4: TanStack Query Data Fetching                                                                                         │
│  1. Set up QueryClientProvider in main.tsx.                                                                                   │
│  2. For each Next.js Server Component that fetches data (e.g., EventsPage), create a custom hook (hooks/useEvents.ts)         │
│     utilizing useQuery.                                                                                                       │
│  3. Refactor the corresponding Client components (e.g., EventsClient) to use the new hooks, handling isLoading and isError    │
│     states.                                                                                                                   │
│                                                                                                                               │
│ Phase 5: Migrating Server Actions to Mutations                                                                                │
│  1. Convert the functions inside actions.ts files into custom mutation hooks (e.g., useCreateEvent, useUpdateOrder).          │
│  2. Update forms and event handlers in the UI components to call these mutations instead of invoking Server Actions.          │
│  3. Replace revalidatePath with queryClient.invalidateQueries to refresh data after a successful mutation.                    │
│  4. Replace Next.js redirect() with useNavigate() from react-router-dom.                                                      │
│                                                                                                                               │
│ Phase 6: Component Refactoring                                                                                                │
│  1. Replace all <Link href="..."> from next/link with <Link to="..."> from react-router-dom.                                  │
│  2. Replace <Image> from next/image with standard <img> tags.                                                                 │
│  3. Replace useRouter and useSearchParams from next/navigation with equivalents from react-router-dom.                        │
│                                                                                                                               │
│ 6. Verification                                                                                                               │
│  - Verify all routes load correctly without 404 errors.                                                                       │
│  - Ensure authentication protects /admin routes.                                                                              │
│  - Confirm CRUD operations (create event, update order) successfully mutate data and invalidate the query cache to reflect    │
│    changes instantly.                                                                                                         │
│  - Test the public registration flow to ensure API calls succeed.                                                             │
│                                                                                                                               │
│ 7. Migration & Rollback Strategy                                                                                              │
│  - The work will be done in a separate Git branch (feat/vite-migration).                                                      │
│  - Since the backend remains unchanged, if the Vite migration fails or introduces critical bugs, rolling back is as simple as │
│    switching back to the main branch and running the Next.js server.    