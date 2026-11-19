/**
 * Local customization feature flags (see CUSTOMIZATIONS.md in repo root).
 * Flip any flag back to `true` and rebuild to restore the default UI prompt.
 */
export const FEATURE_FLAGS = {
  /** Dashboard "Configure a model to start using the Agent" prompt card. */
  showDashboardModelSetupBanner: false,
  /** Editor sidebar "These capabilities are not configured..." warning banner. */
  showChatCapabilityGapBanner: false,
} as const;
