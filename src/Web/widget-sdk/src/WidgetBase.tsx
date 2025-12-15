import React, { Component, ReactNode } from 'react';
import { WidgetContext, WidgetConfig, WidgetAPI, WidgetLifecycle, WidgetMessage } from './types';
import { createWidgetAPI } from './api';

/**
 * Props for widget components
 */
export interface WidgetProps {
  context: WidgetContext;
}

/**
 * Base class for custom widgets
 */
export abstract class WidgetBase<P = {}, S = {}> extends Component<WidgetProps & P, S> implements WidgetLifecycle {
  protected api: WidgetAPI;
  
  constructor(props: WidgetProps & P) {
    super(props);
    this.api = createWidgetAPI();
  }
  
  componentDidMount(): void {
    this.sendMessage({ type: 'widget:ready' });
    
    // Call lifecycle hook
    if (this.onMount) {
      Promise.resolve(this.onMount(this.props.context))
        .catch(error => this.handleError(error));
    }
    
    // Listen for config updates
    window.addEventListener('message', this.handleMessage);
  }
  
  componentDidUpdate(prevProps: WidgetProps & P): void {
    // Detect config changes
    if (JSON.stringify(prevProps.context.config) !== JSON.stringify(this.props.context.config)) {
      if (this.onConfigChange) {
        Promise.resolve(this.onConfigChange(this.props.context.config))
          .catch(error => this.handleError(error));
      }
    }
    
    // Detect size changes
    if (prevProps.context.size.width !== this.props.context.size.width ||
        prevProps.context.size.height !== this.props.context.size.height) {
      if (this.onResize) {
        Promise.resolve(this.onResize(this.props.context.size))
          .catch(error => this.handleError(error));
      }
    }
  }
  
  componentWillUnmount(): void {
    window.removeEventListener('message', this.handleMessage);
    
    if (this.onUnmount) {
      Promise.resolve(this.onUnmount())
        .catch(error => this.handleError(error));
    }
  }
  
  private handleMessage = (event: MessageEvent<WidgetMessage>) => {
    if (event.data.type === 'config:updated') {
      // Force re-render with new config
      this.forceUpdate();
    }
  };
  
  protected sendMessage(message: WidgetMessage): void {
    window.parent.postMessage(message, '*');
  }
  
  protected handleError(error: any): void {
    console.error('Widget error:', error);
    this.sendMessage({
      type: 'widget:error',
      error: error.message || String(error)
    });
  }
  
  /**
   * Get current widget configuration
   */
  protected get config(): WidgetConfig {
    return this.props.context.config;
  }
  
  /**
   * Get current widget size
   */
  protected get size(): { width: number; height: number } {
    return this.props.context.size;
  }
  
  // Lifecycle hooks (override in subclass)
  onMount?(context: WidgetContext): void | Promise<void>;
  onConfigChange?(config: WidgetConfig): void | Promise<void>;
  onResize?(size: { width: number; height: number }): void | Promise<void>;
  onUnmount?(): void | Promise<void>;
  
  // Abstract render method
  abstract render(): ReactNode;
}

/**
 * Error boundary for widgets
 */
interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

export class WidgetErrorBoundary extends Component<{ children: ReactNode }, ErrorBoundaryState> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }
  
  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }
  
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    console.error('Widget error boundary caught:', error, errorInfo);
    window.parent.postMessage({
      type: 'widget:error',
      error: error.message
    }, '*');
  }
  
  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div style={{
          padding: '20px',
          textAlign: 'center',
          color: '#ef4444',
          fontFamily: 'system-ui, sans-serif'
        }}>
          <h3>Widget Error</h3>
          <p>{this.state.error?.message || 'An unknown error occurred'}</p>
        </div>
      );
    }
    
    return this.props.children;
  }
}
