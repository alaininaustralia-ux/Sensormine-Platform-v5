/**
 * Home Page Tests
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import HomePage from '@/app/page';

describe('Home Page', () => {
  it('renders welcome message', () => {
    render(<HomePage />);
    expect(screen.getByText(/Welcome to Sensormine Platform/i)).toBeInTheDocument();
  });

  it('renders feature cards', () => {
    render(<HomePage />);
    expect(screen.getByText(/Real-Time Monitoring/i)).toBeInTheDocument();
    expect(screen.getByText(/Visual Analytics/i)).toBeInTheDocument();
    expect(screen.getByText(/Intelligent Alerts/i)).toBeInTheDocument();
  });

  it('renders call-to-action buttons', () => {
    render(<HomePage />);
    expect(screen.getByText(/Get Started/i)).toBeInTheDocument();
    expect(screen.getByText(/Documentation/i)).toBeInTheDocument();
  });
});
