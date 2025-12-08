/**
 * Template Gallery Component Tests
 * Unit tests for template gallery UI (Story 4.8)
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { TemplateGallery } from '@/components/dashboard/templates/template-gallery';
import { TemplateCard } from '@/components/dashboard/templates/template-card';
import { TemplatePreviewModal } from '@/components/dashboard/templates/template-preview-modal';
import { DASHBOARD_TEMPLATES } from '@/lib/templates/dashboard-templates';

describe('TemplateGallery', () => {
  it('should render template gallery', () => {
    render(<TemplateGallery onSelectTemplate={vi.fn()} />);
    expect(screen.getByText(/Template Gallery/i)).toBeInTheDocument();
  });

  it('should display all templates', () => {
    render(<TemplateGallery onSelectTemplate={vi.fn()} />);
    
    DASHBOARD_TEMPLATES.forEach(template => {
      expect(screen.getByText(template.name)).toBeInTheDocument();
    });
  });

  it('should filter templates by category', async () => {
    render(<TemplateGallery onSelectTemplate={vi.fn()} />);
    
    const operationsButton = screen.getByRole('button', { name: /operations/i });
    fireEvent.click(operationsButton);
    
    await waitFor(() => {
      const operationsTemplates = DASHBOARD_TEMPLATES.filter(t => t.category === 'operations');
      expect(screen.getAllByTestId('template-card').length).toBe(operationsTemplates.length);
    });
  });

  it('should show all templates when "All" category selected', async () => {
    render(<TemplateGallery onSelectTemplate={vi.fn()} />);
    
    const allButton = screen.getByRole('button', { name: /all/i });
    fireEvent.click(allButton);
    
    await waitFor(() => {
      expect(screen.getAllByTestId('template-card').length).toBe(DASHBOARD_TEMPLATES.length);
    });
  });

  it('should search templates by name', async () => {
    render(<TemplateGallery onSelectTemplate={vi.fn()} />);
    
    const searchInput = screen.getByPlaceholderText(/search templates/i);
    fireEvent.change(searchInput, { target: { value: 'operations' } });
    
    await waitFor(() => {
      const visibleCards = screen.getAllByTestId('template-card');
      expect(visibleCards.length).toBeGreaterThan(0);
      expect(visibleCards.length).toBeLessThan(DASHBOARD_TEMPLATES.length);
    });
  });

  it('should call onSelectTemplate when template is selected', async () => {
    const handleSelect = vi.fn();
    render(<TemplateGallery onSelectTemplate={handleSelect} />);
    
    const firstTemplate = DASHBOARD_TEMPLATES[0];
    const templateCard = screen.getByText(firstTemplate.name).closest('[data-testid="template-card"]');
    
    if (templateCard) {
      const useButton = templateCard.querySelector('button');
      if (useButton) {
        fireEvent.click(useButton);
        expect(handleSelect).toHaveBeenCalledWith(firstTemplate.id);
      }
    }
  });
});

describe('TemplateCard', () => {
  const mockTemplate = DASHBOARD_TEMPLATES[0];

  it('should render template card', () => {
    render(
      <TemplateCard 
        template={mockTemplate} 
        onSelect={vi.fn()} 
        onPreview={vi.fn()} 
      />
    );
    
    expect(screen.getByText(mockTemplate.name)).toBeInTheDocument();
    expect(screen.getByText(mockTemplate.description)).toBeInTheDocument();
  });

  it('should show widget count', () => {
    render(
      <TemplateCard 
        template={mockTemplate} 
        onSelect={vi.fn()} 
        onPreview={vi.fn()} 
      />
    );
    
    expect(screen.getByText(new RegExp(`${mockTemplate.widgets.length}.*widgets?`, 'i'))).toBeInTheDocument();
  });

  it('should call onPreview when preview button clicked', () => {
    const handlePreview = vi.fn();
    render(
      <TemplateCard 
        template={mockTemplate} 
        onSelect={vi.fn()} 
        onPreview={handlePreview} 
      />
    );
    
    const previewButton = screen.getByRole('button', { name: /preview/i });
    fireEvent.click(previewButton);
    expect(handlePreview).toHaveBeenCalledWith(mockTemplate.id);
  });

  it('should call onSelect when use template button clicked', () => {
    const handleSelect = vi.fn();
    render(
      <TemplateCard 
        template={mockTemplate} 
        onSelect={handleSelect} 
        onPreview={vi.fn()} 
      />
    );
    
    const useButton = screen.getByRole('button', { name: /use template/i });
    fireEvent.click(useButton);
    expect(handleSelect).toHaveBeenCalledWith(mockTemplate.id);
  });

  it('should display category badge', () => {
    render(
      <TemplateCard 
        template={mockTemplate} 
        onSelect={vi.fn()} 
        onPreview={vi.fn()} 
      />
    );
    
    expect(screen.getByText(mockTemplate.category)).toBeInTheDocument();
  });

  it('should show preview image if available', () => {
    const templateWithImage = {
      ...mockTemplate,
      previewImage: '/images/template-preview.png',
    };
    
    render(
      <TemplateCard 
        template={templateWithImage} 
        onSelect={vi.fn()} 
        onPreview={vi.fn()} 
      />
    );
    
    const image = screen.getByRole('img', { name: new RegExp(templateWithImage.name, 'i') });
    expect(image).toBeInTheDocument();
  });
});

describe('TemplatePreviewModal', () => {
  const mockTemplate = DASHBOARD_TEMPLATES[0];

  it('should render preview modal when open', () => {
    render(
      <TemplatePreviewModal
        template={mockTemplate}
        open={true}
        onOpenChange={vi.fn()}
        onUseTemplate={vi.fn()}
      />
    );
    
    expect(screen.getByText(mockTemplate.name)).toBeInTheDocument();
    expect(screen.getByText(mockTemplate.description)).toBeInTheDocument();
  });

  it('should not render when closed', () => {
    render(
      <TemplatePreviewModal
        template={mockTemplate}
        open={false}
        onOpenChange={vi.fn()}
        onUseTemplate={vi.fn()}
      />
    );
    
    expect(screen.queryByText(mockTemplate.name)).not.toBeInTheDocument();
  });

  it('should show widget list', () => {
    render(
      <TemplatePreviewModal
        template={mockTemplate}
        open={true}
        onOpenChange={vi.fn()}
        onUseTemplate={vi.fn()}
      />
    );
    
    mockTemplate.widgets.forEach(widget => {
      expect(screen.getByText(widget.title)).toBeInTheDocument();
    });
  });

  it('should show layout preview', () => {
    render(
      <TemplatePreviewModal
        template={mockTemplate}
        open={true}
        onOpenChange={vi.fn()}
        onUseTemplate={vi.fn()}
      />
    );
    
    expect(screen.getByTestId('layout-preview')).toBeInTheDocument();
  });

  it('should call onUseTemplate when use button clicked', () => {
    const handleUse = vi.fn();
    render(
      <TemplatePreviewModal
        template={mockTemplate}
        open={true}
        onOpenChange={vi.fn()}
        onUseTemplate={handleUse}
      />
    );
    
    const useButton = screen.getByRole('button', { name: /use template/i });
    fireEvent.click(useButton);
    expect(handleUse).toHaveBeenCalledWith(mockTemplate.id);
  });

  it('should close modal when cancel button clicked', () => {
    const handleClose = vi.fn();
    render(
      <TemplatePreviewModal
        template={mockTemplate}
        open={true}
        onOpenChange={handleClose}
        onUseTemplate={vi.fn()}
      />
    );
    
    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    fireEvent.click(cancelButton);
    expect(handleClose).toHaveBeenCalledWith(false);
  });
});
