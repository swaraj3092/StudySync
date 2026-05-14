You are refining an existing React + Tailwind CSS codebase for "StudySync". The design tokens are already correct in theme.css. The problem is that the COMPONENTS are not using them effectively, resulting in flat, generic-looking UI. Apply ALL of the following changes precisely. Do not change any logic, routing, or data — only fix the visual styling.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FIX 1 — MetricCard.tsx
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PROBLEM: White card + colored text number looks plain and unmemorable.

FIX: Add a colored left-border accent + very subtle tinted background per color variant.
Also increase metric value to text-4xl for visual impact and add a micro-icon per metric type.

Replace the Card className with this pattern:
- primary:  border-l-4 border-l-[#3D2FC4] bg-[#EEEDFE]/40 dark:bg-[#3D2FC4]/10
- accent:   border-l-4 border-l-[#00C4A1] bg-[#E1FAF5]/40 dark:bg-[#00C4A1]/10
- warning:  border-l-4 border-l-[#F5A623] bg-[#FEF6E4]/40 dark:bg-[#F5A623]/10
- success:  border-l-4 border-l-[#00B87A] bg-[#E6FAF4]/40 dark:bg-[#00B87A]/10

Change value font size: text-3xl → text-4xl font-bold
Change label: add uppercase tracking-wide text-xs text-text-secondary font-medium
Remove shadow-sm from Card base (use the border-l accent as the visual anchor instead)

Add a small icon top-right of each MetricCard:
- sessions:    (primary color)
- study time:     (accent color)
- tasks:      (warning color)
- streak:         (primary color)

Add the icon as a prop: `icon?: React.ElementType` and render it top-right in a flex row.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FIX 2 — SessionCard.tsx
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PROBLEM: Source type icon is a generic grey muted square. Looks like a placeholder.

FIX: Replace the grey fallback icon div with a proper colored source icon:

const sourceConfig = {
  youtube:  { bg: 'bg-red-50 dark:bg-red-950/30',   icon:  },
  article:  { bg: 'bg-blue-50 dark:bg-blue-950/30', icon:  },
  pdf:      { bg: 'bg-orange-50 dark:bg-orange-950/30', icon:  },
  other:    { bg: 'bg-muted', icon:  },
};

Render as: 

             {sourceConfig[sourceType].icon}
           


Also update the card hover state:
- Change: hover:border-primary/50 hover:shadow-md
- To:     hover:border-primary/60 hover:bg-indigo-50/30 dark:hover:bg-indigo-950/20 hover:shadow-sm transition-all

Add a colored left indicator on hover: add group class to Card, and inside add:


Make the Card position: relative

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FIX 3 — Sidebar.tsx
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PROBLEM: Active state `bg-sidebar-accent` is barely visible. Logo is tiny. No visual weight.

FIX 1 — Active nav item:
- Change active state from: bg-sidebar-accent text-sidebar-accent-foreground
- To: bg-[#3D2FC4] text-white shadow-sm
- Add: font-semibold to active item only
- Keep hover for inactive: hover:bg-sidebar-accent/60 text-sidebar-foreground/70 hover:text-sidebar-foreground

FIX 2 — Logo section:
- Increase logo circle to h-9 w-9
- Change text to: text-base font-bold
- Add a subtle bottom border to the logo row: add border-b border-sidebar-border to the logo container div
- Wordmark: "Study" in text-muted-foreground font-normal, "Sync" in text-foreground font-bold text-base

FIX 3 — Nav icon size:
- Change icon size from h-5 w-5 to h-[18px] w-[18px]
- Active item icon: keep white (text-white via parent)
- Inactive item icon: text-sidebar-foreground/60

FIX 4 — User profile row at bottom:
- Wrap in: bg-sidebar-accent/30 rounded-lg mx-1 mb-1 px-2 py-2.5
- Avatar: change from gradient to bg-[#3D2FC4] text-white (solid, more professional)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FIX 4 — TopBar.tsx
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PROBLEM: Completely blank white bar. No visual interest.

FIX 1 — Background:
- Change: bg-card → bg-background (slightly off-white, matches page)
- Add a very subtle inner shadow: style={{ boxShadow: '0 1px 0 0 var(--border)' }} instead of border-b (same visual but cleaner)

FIX 2 — Greeting upgrade:
- Change font: text-xl → text-2xl
- Add font-bold and a tiny emoji or teal accent dot before greeting:
  
  Good evening, Swaraj 👋

FIX 3 — Search input:
- Add: bg-muted border-0 rounded-full px-4 to the Input
- Width: w-72 instead of w-64
- Placeholder: "Search sessions, notes..." (more specific)

FIX 4 — Notification bell:
- Add a red dot indicator: relative with 
- Change button bg on hover: hover:bg-muted

FIX 5 — User avatar:
- Replace gradient with: bg-[#3D2FC4] (solid indigo, matches sidebar)
- Add a thin ring: ring-2 ring-[#3D2FC4]/20

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FIX 5 — Home.tsx layout improvements
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PROBLEM: All cards look identical, no visual hierarchy, sections blur together.

FIX 1 — Section spacing:
- Change: space-y-6 → space-y-8

FIX 2 — "Today's Sessions" and "Pending Tasks" CardHeader:
- Change CardTitle: add text-base font-semibold text-foreground
- Add a small colored dot before each title:
  Sessions: 
  Tasks:    
- Add count badge next to title:
  3

FIX 3 — Agent Suggestion Banner upgrade:
- Replace flat bg-indigo-50 with a proper gradient:
  className="relative overflow-hidden bg-gradient-to-r from-[#EEEDFE] to-[#E1FAF5] dark:from-[#3D2FC4]/10 dark:to-[#00C4A1]/10 border border-[#3D2FC4]/20 rounded-xl p-5"
- Remove border-l-4, instead use the gradient as the visual cue
- Agent avatar: upgrade to h-11 w-11 with from-[#3D2FC4] to-[#00C4A1] gradient
- Text: make "Backpropagation" use text-[#3D2FC4] font-semibold dark:text-[#7B6EE8]
- "View Plan" button: use bg-[#3D2FC4] text-white hover:bg-[#5046E5] (primary style)
- Add a decorative blurred circle in top-right of banner:
  


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FIX 6 — TaskCard.tsx
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PROBLEM: Tasks look like a plain list with no visual priority differentiation.

FIX 1 — Priority indicator:
- Replace any priority text with a colored left dot + subtle row tint:
  high:   
          Row: hover:bg-red-50/50 dark:hover:bg-red-950/20
  medium: 
          Row: hover:bg-amber-50/50
  low:    
          Row: hover:bg-green-50/50

FIX 2 — Checkbox styling:
- Replace default checkbox with a custom one:
  Unchecked: border-2 border-border rounded h-4 w-4 hover:border-primary
  Checked:   bg-[#00C4A1] border-[#00C4A1] with a white checkmark inside

FIX 3 — Completed task:
- Add: line-through text-muted-foreground opacity-60 to the title span when completed

FIX 4 — Due date badge:
- Today:    bg-red-50 text-red-600 dark:bg-red-950/30 text-xs px-2 py-0.5 rounded-md
- Tomorrow: bg-amber-50 text-amber-600 text-xs px-2 py-0.5 rounded-md
- Other:    bg-muted text-muted-foreground text-xs px-2 py-0.5 rounded-md

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FIX 7 — Badge.tsx
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PROBLEM: All badges look the same size and color — no visual identity.

FIX — Subject badges: give each subject a distinct color identity:
const subjectColors = {
  ML:   'bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300',
  AI:   'bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300',
  DBMS: 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300',
  OS:   'bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-300',
  DSA:  'bg-pink-100 text-pink-700 dark:bg-pink-950/40 dark:text-pink-300',
  Math: 'bg-teal-100 text-teal-700 dark:bg-teal-950/40 dark:text-teal-300',
  default: 'bg-muted text-muted-foreground',
};

Source type badges:
  youtube: 'bg-red-100 text-red-600'
  article: 'bg-blue-100 text-blue-600'
  pdf:     'bg-orange-100 text-orange-600'

All badges: font-medium text-xs px-2 py-0.5 rounded-md (not rounded-full — keep them sharp)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FIX 8 — Card.tsx base component
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PROBLEM: shadow-sm makes all cards look slightly floaty — inconsistent with flat design goal.

FIX:
- Remove shadow-sm from Card base
- Change border: border-border → border-[#E5E4E0] dark:border-[#2A2A30]
- Add: transition-shadow duration-150 to base Card

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FIX 9 — DashboardLayout.tsx
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PROBLEM: The main content area likely has no max-width or breathing room.

FIX:
- Wrap the main content in:
  

    

      {children}
    

  

- This adds proper max-width, centered layout, and vertical breathing room
- Ensure the outer layout is: flex h-screen overflow-hidden

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FIX 10 — Global: fonts.css
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PROBLEM: Default system fonts make the app look unpolished.

FIX — In fonts.css, add:
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');

In theme.css @layer base, add:
body {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

code, .font-mono, [class*="mono"] {
  font-family: 'JetBrains Mono', monospace;
}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FINAL CHECKLIST — verify after all fixes
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

□ Each MetricCard has a distinct colored left border + tinted background
□ SessionCard source icons are colored (red/blue/orange) not grey
□ Sidebar active item is solid indigo with white text — clearly visible
□ TopBar greeting is large and has a teal accent dot
□ Agent banner uses gradient background with decorative blur circle
□ Subject tags each have their own color (purple/blue/amber/green/pink)
□ Priority dots are visible colored circles (red/amber/green)
□ Due date badges are color-coded (red=today, amber=tomorrow, grey=future)
□ Inter font loaded and applied globally
□ Main content area has max-w-6xl and proper padding
□ No white shadows on flat cards — removed shadow-sm from Card base
□ Completed tasks have strikethrough + opacity

DO NOT change any TypeScript interfaces, route definitions, mock data,
or business logic. Style only. All changes must be dark-mode compatible.


  
Files touched: 10
Fixes: 10 components
Zero logic changes





