/**
 * Widget Configuration Component Props
 * 
 * Shared type definition for all widget-specific configuration components.
 */

export interface WidgetConfigComponentProps<TConfig = any> {
  /** Current widget configuration */
  config: TConfig;
  /** Callback when configuration changes */
  onChange: (config: TConfig) => void;
}
