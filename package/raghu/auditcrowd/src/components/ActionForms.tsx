"use client";

import { useCurrentUser } from "@/context/CurrentUserContext";
import CreateApiKeyForm from "@/components/forms/FormCreateApiKey";
import CreateSharedSessionKeyForm from "@/components/forms/FormCreateSharedSecret";

/**
 * Renders the user-menu action modals (Create API Key / Share Session) wherever
 * the user is — the menu sets `action` on the CurrentUser context, this renders
 * the matching form app-wide instead of only on the demo pages.
 */
export function ActionForms() {
  const { action } = useCurrentUser();
  if (action === "createApiKey") return <CreateApiKeyForm />;
  if (action === "createSharedSessionKey") return <CreateSharedSessionKeyForm />;
  return null;
}
