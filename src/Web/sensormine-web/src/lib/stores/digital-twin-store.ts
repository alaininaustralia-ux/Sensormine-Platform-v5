/**
 * Digital Twin Store
 * 
 * Zustand store for managing digital twin asset hierarchy, selections,
 * data point mappings, and UI state.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  Asset,
  AssetTreeNode,
  AssetState,
  DataPointMapping,
  CreateAssetRequest,
  UpdateAssetRequest,
  CreateMappingRequest,
  UpdateMappingRequest,
  AssetSearchParams,
} from '../api/digital-twin';
import * as digitalTwinApi from '../api/digital-twin';

interface DigitalTwinState {
  // Asset state
  assets: Asset[];
  rootAssets: Asset[];
  selectedAsset: Asset | null;
  selectedAssetState: AssetState | null;
  expandedNodes: Set<string>;
  assetTree: AssetTreeNode | null;
  
  // Mapping state
  mappings: DataPointMapping[];
  selectedMapping: DataPointMapping | null;
  mappingsByAsset: Map<string, DataPointMapping[]>;
  
  // UI state
  isLoading: boolean;
  isLoadingState: boolean;
  isLoadingMappings: boolean;
  error: string | null;
  searchQuery: string;
  filterType: string | null;
  filterStatus: string | null;
  
  // Initialization
  initialize: () => Promise<void>;
  
  // Asset operations
  fetchAssets: (params?: AssetSearchParams) => Promise<void>;
  fetchRootAssets: () => Promise<void>;
  fetchAssetById: (id: string) => Promise<Asset | null>;
  fetchAssetTree: (rootId: string) => Promise<void>;
  fetchAssetChildren: (id: string) => Promise<Asset[]>;
  createAsset: (data: CreateAssetRequest) => Promise<Asset | null>;
  updateAsset: (id: string, data: UpdateAssetRequest) => Promise<Asset | null>;
  moveAsset: (id: string, newParentId?: string) => Promise<void>;
  deleteAsset: (id: string) => Promise<void>;
  
  // Asset selection & navigation
  selectAsset: (asset: Asset | null) => void;
  expandNode: (id: string) => void;
  collapseNode: (id: string) => void;
  toggleNode: (id: string) => void;
  expandAll: () => void;
  collapseAll: () => void;
  
  // Asset state operations
  fetchAssetState: (id: string) => Promise<void>;
  refreshAssetState: () => Promise<void>;
  
  // Mapping operations
  fetchMappings: () => Promise<void>;
  fetchMappingsByAsset: (assetId: string) => Promise<void>;
  fetchMappingsBySchema: (schemaId: string) => Promise<void>;
  createMapping: (data: CreateMappingRequest) => Promise<DataPointMapping | null>;
  updateMapping: (id: string, data: UpdateMappingRequest) => Promise<DataPointMapping | null>;
  deleteMapping: (id: string) => Promise<void>;
  selectMapping: (mapping: DataPointMapping | null) => void;
  
  // Search & filters
  setSearchQuery: (query: string) => void;
  setFilterType: (type: string | null) => void;
  setFilterStatus: (status: string | null) => void;
  clearFilters: () => void;
  
  // Utility
  clearError: () => void;
  reset: () => void;
}

const useDigitalTwinStore = create<DigitalTwinState>()(
  persist(
    (set, get) => ({
      // Initial state
      assets: [],
      rootAssets: [],
      selectedAsset: null,
      selectedAssetState: null,
      expandedNodes: new Set<string>(),
      assetTree: null,
      mappings: [],
      selectedMapping: null,
      mappingsByAsset: new Map(),
      isLoading: false,
      isLoadingState: false,
      isLoadingMappings: false,
      error: null,
      searchQuery: '',
      filterType: null,
      filterStatus: null,

      // Initialize store
      initialize: async () => {
        try {
          await get().fetchRootAssets();
          await get().fetchMappings();
        } catch (error) {
          console.error('Failed to initialize digital twin store:', error);
        }
      },

      // Fetch all assets with optional filtering
      fetchAssets: async (params?: AssetSearchParams) => {
        set({ isLoading: true, error: null });
        try {
          const response = await digitalTwinApi.getAssets(params);
          const allAssets = response.data.assets;
          const roots = allAssets.filter(a => !a.parentId);
          set({ 
            assets: allAssets,
            rootAssets: roots, // Also set root assets for tree rendering
            isLoading: false 
          });
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to fetch assets',
            isLoading: false 
          });
        }
      },

      // Fetch root-level assets
      fetchRootAssets: async () => {
        set({ isLoading: true, error: null });
        try {
          const response = await digitalTwinApi.getRootAssets();
          set({ 
            rootAssets: response.data,
            assets: response.data, // Also update assets array for consistency
            isLoading: false 
          });
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to fetch root assets',
            isLoading: false 
          });
        }
      },

      // Fetch single asset by ID
      fetchAssetById: async (id: string) => {
        try {
          const response = await digitalTwinApi.getAssetById(id);
          
          // Update asset in arrays if it exists
          const asset = response.data;
          set(state => ({
            assets: state.assets.map(a => a.id === id ? asset : a),
            rootAssets: state.rootAssets.map(a => a.id === id ? asset : a),
          }));
          
          return asset;
        } catch (error) {
          console.error('Failed to fetch asset:', error);
          return null;
        }
      },

      // Fetch asset tree (with all descendants)
      fetchAssetTree: async (rootId: string) => {
        set({ isLoading: true, error: null });
        try {
          const response = await digitalTwinApi.getAssetTree(rootId);
          set({ 
            assetTree: response.data,
            isLoading: false 
          });
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to fetch asset tree',
            isLoading: false 
          });
        }
      },

      // Fetch immediate children of an asset
      fetchAssetChildren: async (id: string) => {
        try {
          const response = await digitalTwinApi.getAssetChildren(id);
          return response.data;
        } catch (error) {
          console.error('Failed to fetch children:', error);
          return [];
        }
      },

      // Create new asset
      createAsset: async (data: CreateAssetRequest) => {
        set({ isLoading: true, error: null });
        try {
          const response = await digitalTwinApi.createAsset(data);
          const newAsset = response.data;
          
          set(state => ({
            assets: [...state.assets, newAsset],
            rootAssets: !newAsset.parentId 
              ? [...state.rootAssets, newAsset]
              : state.rootAssets,
            isLoading: false
          }));
          
          return newAsset;
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to create asset',
            isLoading: false 
          });
          return null;
        }
      },

      // Update existing asset
      updateAsset: async (id: string, data: UpdateAssetRequest) => {
        set({ isLoading: true, error: null });
        try {
          const response = await digitalTwinApi.updateAsset(id, data);
          const updatedAsset = response.data;
          
          set(state => ({
            assets: state.assets.map(a => a.id === id ? updatedAsset : a),
            rootAssets: state.rootAssets.map(a => a.id === id ? updatedAsset : a),
            selectedAsset: state.selectedAsset?.id === id ? updatedAsset : state.selectedAsset,
            isLoading: false
          }));
          
          return updatedAsset;
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to update asset',
            isLoading: false 
          });
          return null;
        }
      },

      // Move asset to new parent
      moveAsset: async (id: string, newParentId?: string) => {
        set({ isLoading: true, error: null });
        try {
          await digitalTwinApi.moveAsset(id, { newParentId });
          
          // Refresh the affected assets
          await get().fetchAssetById(id);
          if (newParentId) {
            await get().fetchAssetById(newParentId);
          }
          
          set({ isLoading: false });
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to move asset',
            isLoading: false 
          });
        }
      },

      // Delete asset
      deleteAsset: async (id: string) => {
        set({ isLoading: true, error: null });
        try {
          await digitalTwinApi.deleteAsset(id);
          
          set(state => ({
            assets: state.assets.filter(a => a.id !== id),
            rootAssets: state.rootAssets.filter(a => a.id !== id),
            selectedAsset: state.selectedAsset?.id === id ? null : state.selectedAsset,
            isLoading: false
          }));
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to delete asset',
            isLoading: false 
          });
        }
      },

      // Select an asset
      selectAsset: (asset: Asset | null) => {
        set({ selectedAsset: asset, selectedAssetState: null });
        
        // Fetch asset state if asset is selected
        if (asset) {
          get().fetchAssetState(asset.id);
          get().fetchMappingsByAsset(asset.id);
        }
      },

      // Expand tree node
      expandNode: (id: string) => {
        set(state => ({
          expandedNodes: new Set([...state.expandedNodes, id])
        }));
      },

      // Collapse tree node
      collapseNode: (id: string) => {
        set(state => {
          const expanded = new Set(state.expandedNodes);
          expanded.delete(id);
          return { expandedNodes: expanded };
        });
      },

      // Toggle node expansion
      toggleNode: (id: string) => {
        const { expandedNodes } = get();
        if (expandedNodes.has(id)) {
          get().collapseNode(id);
        } else {
          get().expandNode(id);
        }
      },

      // Expand all nodes
      expandAll: () => {
        const { assets } = get();
        set({ expandedNodes: new Set(assets.map(a => a.id)) });
      },

      // Collapse all nodes
      collapseAll: () => {
        set({ expandedNodes: new Set() });
      },

      // Fetch asset state
      fetchAssetState: async (id: string) => {
        set({ isLoadingState: true });
        try {
          const response = await digitalTwinApi.getAssetState(id);
          set({ 
            selectedAssetState: response.data,
            isLoadingState: false 
          });
        } catch (error) {
          console.error('Failed to fetch asset state:', error);
          set({ isLoadingState: false });
        }
      },

      // Refresh current asset state
      refreshAssetState: async () => {
        const { selectedAsset } = get();
        if (selectedAsset) {
          await get().fetchAssetState(selectedAsset.id);
        }
      },

      // Fetch all mappings
      fetchMappings: async () => {
        set({ isLoadingMappings: true, error: null });
        try {
          const response = await digitalTwinApi.getMappings();
          set({ 
            mappings: response.data.mappings,
            isLoadingMappings: false 
          });
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to fetch mappings',
            isLoadingMappings: false 
          });
        }
      },

      // Fetch mappings for specific asset
      fetchMappingsByAsset: async (assetId: string) => {
        try {
          const response = await digitalTwinApi.getMappingsByAsset(assetId);
          set(state => ({
            mappingsByAsset: new Map(state.mappingsByAsset).set(assetId, response.data.mappings)
          }));
        } catch (error) {
          console.error('Failed to fetch mappings for asset:', error);
        }
      },

      // Fetch mappings for specific schema
      fetchMappingsBySchema: async (schemaId: string) => {
        set({ isLoadingMappings: true, error: null });
        try {
          const response = await digitalTwinApi.getMappingsBySchema(schemaId);
          set({ 
            mappings: response.data.mappings,
            isLoadingMappings: false 
          });
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to fetch mappings',
            isLoadingMappings: false 
          });
        }
      },

      // Create new mapping
      createMapping: async (data: CreateMappingRequest) => {
        set({ isLoadingMappings: true, error: null });
        try {
          const response = await digitalTwinApi.createMapping(data);
          const newMapping = response.data;
          
          set(state => ({
            mappings: [...state.mappings, newMapping],
            isLoadingMappings: false
          }));
          
          // Update mappingsByAsset if this asset is cached
          if (get().mappingsByAsset.has(data.assetId)) {
            await get().fetchMappingsByAsset(data.assetId);
          }
          
          return newMapping;
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to create mapping',
            isLoadingMappings: false 
          });
          return null;
        }
      },

      // Update existing mapping
      updateMapping: async (id: string, data: UpdateMappingRequest) => {
        set({ isLoadingMappings: true, error: null });
        try {
          const response = await digitalTwinApi.updateMapping(id, data);
          const updatedMapping = response.data;
          
          set(state => ({
            mappings: state.mappings.map(m => m.id === id ? updatedMapping : m),
            selectedMapping: state.selectedMapping?.id === id ? updatedMapping : state.selectedMapping,
            isLoadingMappings: false
          }));
          
          return updatedMapping;
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to update mapping',
            isLoadingMappings: false 
          });
          return null;
        }
      },

      // Delete mapping
      deleteMapping: async (id: string) => {
        set({ isLoadingMappings: true, error: null });
        try {
          await digitalTwinApi.deleteMapping(id);
          
          set(state => ({
            mappings: state.mappings.filter(m => m.id !== id),
            selectedMapping: state.selectedMapping?.id === id ? null : state.selectedMapping,
            isLoadingMappings: false
          }));
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to delete mapping',
            isLoadingMappings: false 
          });
        }
      },

      // Select a mapping
      selectMapping: (mapping: DataPointMapping | null) => {
        set({ selectedMapping: mapping });
      },

      // Set search query
      setSearchQuery: (query: string) => {
        set({ searchQuery: query });
      },

      // Set filter by type
      setFilterType: (type: string | null) => {
        set({ filterType: type });
      },

      // Set filter by status
      setFilterStatus: (status: string | null) => {
        set({ filterStatus: status });
      },

      // Clear all filters
      clearFilters: () => {
        set({
          searchQuery: '',
          filterType: null,
          filterStatus: null
        });
      },

      // Clear error
      clearError: () => {
        set({ error: null });
      },

      // Reset store to initial state
      reset: () => {
        set({
          assets: [],
          rootAssets: [],
          selectedAsset: null,
          selectedAssetState: null,
          expandedNodes: new Set(),
          assetTree: null,
          mappings: [],
          selectedMapping: null,
          mappingsByAsset: new Map(),
          isLoading: false,
          isLoadingState: false,
          isLoadingMappings: false,
          error: null,
          searchQuery: '',
          filterType: null,
          filterStatus: null,
        });
      },
    }),
    {
      name: 'digital-twin-storage',
      partialize: (state) => ({
        // Only persist expanded nodes and selected asset ID
        expandedNodes: Array.from(state.expandedNodes),
        selectedAssetId: state.selectedAsset?.id,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          // Convert expandedNodes array back to Set
          state.expandedNodes = new Set(state.expandedNodes);
        }
      },
    }
  )
);

export default useDigitalTwinStore;
