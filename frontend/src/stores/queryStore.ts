
import { Query } from "@feathersjs/feathers";
import { type StateCreator, create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { immer } from 'zustand/middleware/immer';
// Store for search state (synced with URL params)
// const useQueryStore = create(
//   subscribeWithSelector((set) => ({
//     search: {
//       type: "",
//       query: {},
//       total: 0,
//       index: 0,
//       ids: [],
//     },
//     search_index: 0,

//     setSearch: (searchData) => set({ search: searchData }),
//     setSearchIndex: (index) => set({ search_index: index }),
//     resetSearch: () =>
//       set({
//         search: {
//           type: "",
//           query: {},
//           total: 0,
//           index: 0,
//           ids: [],
//         },
//         search_index: 0,
//       }),
//   }))
// );
interface FilterItem {
  field: string | null;
  value: string | number | boolean | undefined | FilterItem[];
}

// Define types for search state
interface SearchFilter {
  search: string;
  hidden: boolean;
  sort: string;
  sort_desc: boolean;
  needs_review: boolean;
  [key: string]: string | number | boolean | undefined | null | FilterItem[];
  filters?: FilterItem[];
}

interface RecordSearchFilter extends SearchFilter {
  non_digitized: boolean;
  collection_id: number | null;
}

interface SearchData {
  type: string;
  filter: SearchFilter;
  total: number;
  offset: number;
  query: Query
}

interface RecordSearchData extends SearchData {
  filter: RecordSearchFilter;
}

type AnySearchData = SearchData | RecordSearchData;

interface SearchState<T extends AnySearchData = AnySearchData> {
  search: T;
  search_index: number;
}

const STORE_VERSION = 1;

type SearchDataByType = {
  records: SearchState<RecordSearchData>;
  collections: SearchState<SearchData>;
  duplicate_records: SearchState<SearchData>;
};

export type SearchType = keyof SearchDataByType;

interface Actions {
  setSearch: (searchData: Partial<AnySearchData>) => void;
  setFilter: (filter: SearchFilter) => void;
  setSearchIndex: (index: number) => void;
  resetSearch: () => void;
}

type QueryStore = SearchState & Actions;

const initialSearchData: SearchData = {
  type: "",
  filter: {
    hidden: false,
    needs_review: false,
    search: "",
    filters: [],
    sort: 'relevance',
    sort_desc: false,
  },
  total: 0,
  offset: 0,
  query: {},
};

export const initialSearch: SearchDataByType = {
  records: {
    search: {
      ...initialSearchData,
      filter: {
        ...initialSearchData.filter,
        non_digitized: false,
        collection_id: null,
      },
    },
    search_index: 0,
  },
  collections: {
    search: {
      ...initialSearchData,
    },
    search_index: 0,
  },
  duplicate_records: {
    search: {
      ...initialSearchData,
    },
    search_index: 0,
  },
}

// const getUrlSearch = () => {
//   return window.location.search.slice(1)
// }

// const persistentStorage: StateStorage = {
//   getItem: (key): string => {
//     // Check URL first
//     if (getUrlSearch()) {
//       const searchParams = new URLSearchParams(getUrlSearch())
//       const storedValue = searchParams.get(key)
//       console.log('GEEETTT', storedValue)
//       return JSON.parse(storedValue as string)
//     } else {
//       // Otherwise, we should load from localstorage or alternative storage
//       return JSON.parse(localStorage.getItem(key) as string)
//     }
//   },
//   setItem: (key, newValue): void => {
//     console.log(key, newValue, getUrlSearch())
//     // Check if query params exist at all, can remove check if always want to set URL
//     if (getUrlSearch()) {
//       const searchParams = new URLSearchParams(getUrlSearch())
//       searchParams.set(key, JSON.stringify(newValue))
//       window.history.replaceState(null, '', `?${searchParams.toString()}`)
//     }

//     localStorage.setItem(key, JSON.stringify(newValue))
//   },
//   removeItem: (key): void => {
//     const searchParams = new URLSearchParams(getUrlSearch())
//     searchParams.delete(key)
//     window.location.search = searchParams.toString()
//   },
// }

const getStateManager = (initialData: AnySearchData): StateCreator<
  QueryStore,
  [["zustand/immer", never]],
  []
> => (set) => ({
    search: initialData,
    search_index: 0,
    setSearch: (searchData) => set((state) => {
      state.search = { ...state.search, ...searchData };
    }),

    setFilter: (filterData) => set((state) => {
      state.search.filter = structuredClone(filterData);
    }),

    setSearchIndex: (index) => set((state) => {
      state.search_index = index;
    }),

    resetSearch: () => set((state) => {
      state.search = initialData;
      state.search_index = 0;
    }),
  })

export const createQueryStore = (type: SearchType, persistStore: boolean = false) => {
  const initialData = initialSearch[type].search
  const baseStore = immer<QueryStore>(getStateManager(initialData))

  if (persistStore) {
    return create<QueryStore>()(persist(baseStore, {
      name: `queryStore-${type}`,
      version: STORE_VERSION,
      migrate: (persistedState: unknown, version: number) => {
        if (version === STORE_VERSION) {
          return persistedState as QueryStore;
        }
        // If we have an older version, we can choose to migrate it here
        // For now, we'll just return the initial state for any version mismatch
        return { search: initialData, search_index: 0 } as QueryStore;
      },
      storage: createJSONStorage(() => localStorage),
    }))
  }

  return create<QueryStore>()(baseStore)
}

const useRecordsQueryStore = createQueryStore('records', true);
const useCollectionsQueryStore = createQueryStore('collections', true);
const useDuplicateRecordsQueryStore = createQueryStore('duplicate_records', true);

export const queryStores = {
  records: useRecordsQueryStore,
  collections: useCollectionsQueryStore,
  duplicate_records: useDuplicateRecordsQueryStore,
}