# AI Side Panel Integration Plan

## Goal

Integrate the existing AI Side Panel functionality into the Budget Visualization view.

## Pre-requisites

- Frontend components (`src/BudgetVisualisation.jsx`, `src/AISidePanel.jsx`) exist and handle state/context.
- Backend endpoint (`/api/ai/insight` in `backend/server.js`) exists with rate limiting and Gemini integration.

## Plan Steps

1.  **Modify `src/BudgetVisualisation.jsx`:**
    *   **Add Toggle Button:** Introduce a button (e.g., with an AI/sparkle icon) within the `BudgetVisualisation` component's UI controls area.
    *   **Toggle State:** Connect the button's `onClick` event to toggle the `isAIPanelOpen` state variable.
    *   **Render Panel:** Conditionally render the `<AISidePanel />` component based on the `isAIPanelOpen` state.
    *   **Pass Props:** Ensure the following props are passed to `<AISidePanel />`:
        *   `isOpen={isAIPanelOpen}`
        *   `currentContext={currentAIContext}`
        *   `onClose={() => setIsAIPanelOpen(false)}`
2.  **Review & Refine (Optional):**
    *   Review styling in `AISidePanel.jsx` for desired collapsible behavior.
    *   Confirm backend rate limit error message handling in the frontend.

## Flow Diagram

```mermaid
graph TD
    A[User Clicks Toggle Button in BudgetVisualisation] --> B{Toggle isAIPanelOpen State};
    B -- true --> C[Render AISidePanel];
    B -- false --> D[Hide AISidePanel];
    C -- Pass props --> E(AISidePanel Component);
    E -- Reads context --> F{Display Contextual Prompts};
    F -- User clicks prompt --> G[Call handleInsightRequest];
    G -- Sends request --> H(Backend /api/ai/insight);
    H -- Applies rate limit --> I{Check Rate Limit};
    I -- OK --> J[Fetch Data];
    J --> K[Construct Gemini Prompt];
    K --> L(Call Gemini API);
    L -- Returns response --> H;
    H -- Sends insight/error --> G;
    G -- Updates state --> E;
    E -- Displays result/error --> C;
    E -- User clicks close --> B;